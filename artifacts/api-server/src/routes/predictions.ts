import { Router, type IRouter } from "express";
import { z } from "zod";
import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  leadsTable,
  marketingEventsTable,
  leadPredictionsTable,
  type LeadPredictionRow,
  type LeadRow,
} from "@workspace/db";
import { predictLeadConversion, buildCohortStats } from "../lib/intelligence/prediction/leadConversion";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Phase 5 — Module 1: Predictive Lead Intelligence routes.
//
// RECOMMENDATION-ONLY. These routes only ever READ leads/events and WRITE
// lead_predictions rows — they never mutate a lead's CRM fields (status,
// qualified, etc.) and never trigger any outreach/action on their own. A
// human decides what to do with a prediction (e.g. via the existing
// POST /actions/from-recommendation pattern, unchanged from Phase 4.5).
// ---------------------------------------------------------------------------

function toPredictionResponse(row: LeadPredictionRow) {
  return {
    id: row.id,
    leadId: row.leadId,
    conversionProbability: row.conversionProbability,
    expectedRevenue: row.expectedRevenue,
    bestFollowUpAt: row.bestFollowUpAt,
    bestFollowUpReason: row.bestFollowUpReason,
    confidence: row.confidence,
    confidenceBand: row.confidenceBand,
    factors: row.factors,
    modelVersion: row.modelVersion,
    createdAt: row.createdAt,
  };
}

async function nextPredictionId(): Promise<string> {
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(leadPredictionsTable);
  return `PRED-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

/**
 * recomputeAllPredictions — shared core used by both POST /predictions/recompute
 * and (optionally) other Phase 5 flows (e.g. the briefing route reuses the
 * latest stored predictions rather than recomputing, but this helper is the
 * single place that knows how to run the model end-to-end).
 *
 * Deletes each affected lead's previous prediction row and inserts a fresh
 * one — lead_predictions stores only the LATEST prediction per lead (see
 * schema comment), so there is no history table to append to.
 */
export async function recomputeAllPredictions(leadIds?: string[]): Promise<LeadPredictionRow[]> {
  const allLeads = await db.select().from(leadsTable);
  const cohortStats = buildCohortStats(allLeads);

  const targetLeads = leadIds && leadIds.length > 0 ? allLeads.filter((l) => leadIds.includes(l.id)) : allLeads;
  if (targetLeads.length === 0) return [];

  const allEvents = await db
    .select()
    .from(marketingEventsTable)
    .where(inArray(marketingEventsTable.leadId, targetLeads.map((l) => l.id)));

  const eventsByLead = new Map<string, typeof allEvents>();
  for (const event of allEvents) {
    if (!event.leadId) continue;
    const bucket = eventsByLead.get(event.leadId) ?? [];
    bucket.push(event);
    eventsByLead.set(event.leadId, bucket);
  }

  const now = new Date();
  const rows: (typeof leadPredictionsTable.$inferInsert)[] = [];

  const countRow = await db.select({ count: sql<number>`count(*)` }).from(leadPredictionsTable);
  let offset = Number(countRow[0]?.count ?? 0);

  for (const lead of targetLeads as LeadRow[]) {
    const events = eventsByLead.get(lead.id) ?? [];
    const prediction = predictLeadConversion(lead, events, cohortStats, now);
    rows.push({
      id: `PRED-${1000 + offset++}`,
      leadId: lead.id,
      conversionProbability: prediction.conversionProbability,
      expectedRevenue: prediction.expectedRevenue,
      bestFollowUpAt: prediction.bestFollowUpAt,
      bestFollowUpReason: prediction.bestFollowUpReason,
      confidence: prediction.confidence.score,
      confidenceBand: prediction.confidence.band,
      factors: prediction.factors,
      modelVersion: "v1",
      createdAt: now.toISOString(),
    });
  }

  // Replace any existing prediction rows for these leads (latest-only model).
  await db.delete(leadPredictionsTable).where(inArray(leadPredictionsTable.leadId, targetLeads.map((l) => l.id)));

  if (rows.length === 0) return [];
  const inserted = await db.insert(leadPredictionsTable).values(rows).returning();
  return inserted;
}

// ---------------------------------------------------------------------------
// GET /predictions/leads — latest prediction per lead (optionally filtered).
// Leads without a stored prediction yet are simply omitted; call
// POST /predictions/recompute first to populate them.
// ---------------------------------------------------------------------------
router.get("/predictions/leads", async (req, res) => {
  const { leadId } = req.query;

  const baseQuery = db.select().from(leadPredictionsTable);
  const rows =
    typeof leadId === "string"
      ? await baseQuery.where(eq(leadPredictionsTable.leadId, leadId)).orderBy(desc(leadPredictionsTable.createdAt))
      : await baseQuery.orderBy(desc(leadPredictionsTable.conversionProbability));

  res.json(rows.map(toPredictionResponse));
});

// ---------------------------------------------------------------------------
// GET /predictions/leads/:id — full prediction (factors + follow-up timing)
// for a single lead. `:id` is the LEAD id (not the prediction row id) so the
// UI can request "the current prediction for LEAD-1042" directly.
// ---------------------------------------------------------------------------
router.get("/predictions/leads/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(leadPredictionsTable)
    .where(eq(leadPredictionsTable.leadId, req.params.id))
    .orderBy(desc(leadPredictionsTable.createdAt))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "No prediction found for this lead. Run POST /predictions/recompute first." });
    return;
  }

  res.json(toPredictionResponse(rows[0]!));
});

// ---------------------------------------------------------------------------
// POST /predictions/recompute — recompute + persist lead_predictions.
// Body: { leadIds?: string[] } — omit/empty to recompute for ALL leads.
// Safe to call repeatedly; it only replaces prediction rows, never touches
// lead/CRM fields, and writes no audit row of its own since a prediction is
// not itself a human-facing recommendation (it becomes one only via the
// existing recommendation/action surfaces, which retain their own audit
// trail unchanged from Phase 4.5).
// ---------------------------------------------------------------------------
const RecomputeBody = z.object({
  leadIds: z.array(z.string()).optional(),
});

router.post("/predictions/recompute", async (req, res) => {
  const parsed = RecomputeBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid recompute input" });
    return;
  }

  const rows = await recomputeAllPredictions(parsed.data.leadIds);
  res.status(201).json({ recomputed: rows.length, predictions: rows.map(toPredictionResponse) });
});

export default router;
