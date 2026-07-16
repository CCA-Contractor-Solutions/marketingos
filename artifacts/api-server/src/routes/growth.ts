import { Router, type IRouter } from "express";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  channelsTable,
  leadsTable,
  marketingEventsTable,
  conversionsTable,
  campaignsTable,
  campaignIntelligenceTable,
  budgetRecommendationsTable,
  marketOpportunitiesTable,
  contentOpportunitiesTable,
  growthBriefingsTable,
  leadPredictionsTable,
  recommendationAuditTable,
  type BudgetRecommendationRow,
  type MarketOpportunityRow,
  type ContentOpportunityRow,
  type GrowthBriefingRow,
} from "@workspace/db";
import { computeChannelIntelligence } from "../lib/intelligence/channels";
import { recommendBudgetShifts } from "../lib/intelligence/prediction/budgetIntelligence";
import { detectMarketOpportunities } from "../lib/intelligence/prediction/marketOpportunity";
import { identifyContentOpportunities } from "../lib/intelligence/prediction/contentIntelligence";
import { buildGrowthBriefing } from "../lib/intelligence/prediction/briefing";
import { predictLeadConversion, buildCohortStats } from "../lib/intelligence/prediction/leadConversion";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Phase 5 — Modules 2-5 routes: Budget Intelligence, Market Opportunities,
// Content Opportunities, and the Executive Growth Briefing.
//
// *** GUARDRAIL (repeated at every mutation below): every PATCH here only
// *** records a human decision (status: new -> reviewed -> applied/
// *** dismissed). None of these routes changes spend, posts content,
// *** schedules anything, or writes to any external platform. "applied"
// *** means "a human decided to act on this and is tracking that decision
// *** here" — nothing more. There is deliberately no ad-platform/CMS write
// *** path wired to any of these tables.
// ---------------------------------------------------------------------------

const STATUS_VALUES = ["new", "reviewed", "applied", "dismissed"] as const;
const UpdateStatusBody = z.object({ status: z.enum(STATUS_VALUES) });

async function nextAuditId(): Promise<string> {
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(recommendationAuditTable);
  return `AUD-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

// Phase 4.5 governance: reuse the SAME recommendation_audit table for any
// Phase 5 recommendation-style row (budget/market/content), keyed by that
// row's own id, so the "generated / viewed / dismissed" lifecycle is
// visible in one place across recommendation types. No new audit table.
async function writeAudit(
  recommendationId: string,
  event: "generated" | "viewed" | "action_created" | "dismissed" | "outcome_recorded",
  detail: Record<string, unknown>,
): Promise<void> {
  await db.insert(recommendationAuditTable).values({
    id: await nextAuditId(),
    recommendationId,
    event,
    detail,
    createdAt: new Date().toISOString(),
  });
}

// ===========================================================================
// Budget recommendations (Module 2)
// ===========================================================================

function toBudgetRecommendation(row: BudgetRecommendationRow) {
  return {
    id: row.id,
    fromChannel: row.fromChannel,
    toChannel: row.toChannel,
    shiftPct: row.shiftPct,
    shiftAmount: row.shiftAmount,
    projectedQualifiedDelta: row.projectedQualifiedDelta,
    projectedRevenueDelta: row.projectedRevenueDelta,
    rationale: row.rationale,
    confidence: row.confidence,
    confidenceBand: row.confidenceBand,
    status: row.status,
    createdAt: row.createdAt,
  };
}

router.get("/budget/recommendations", async (_req, res) => {
  const rows = await db.select().from(budgetRecommendationsTable).orderBy(desc(budgetRecommendationsTable.createdAt));
  res.json(rows.map(toBudgetRecommendation));
});

// Shared channel-intelligence assembly, mirroring routes/channels.ts's
// GET /channels/intelligence so budget recs use the exact same
// leads/events/conversions/spend inputs as the existing channel report.
async function computeCurrentChannelIntelligence() {
  const [channels, leads, events, conversions, campaigns] = await Promise.all([
    db.select().from(channelsTable),
    db.select().from(leadsTable),
    db.select().from(marketingEventsTable),
    db.select().from(conversionsTable),
    db.select().from(campaignsTable),
  ]);

  const spendByChannelName: Record<string, number> = {};
  for (const campaign of campaigns) {
    const channelsForCampaign = campaign.channels ?? [];
    if (channelsForCampaign.length === 0) continue;
    const share = campaign.budgetSpent / channelsForCampaign.length;
    for (const channelName of channelsForCampaign) {
      spendByChannelName[channelName] = (spendByChannelName[channelName] ?? 0) + share;
    }
  }

  return { channelIntel: computeChannelIntelligence(channels, leads, events, conversions, spendByChannelName), leads, events, conversions };
}

router.post("/budget/recommendations/generate", async (_req, res) => {
  const { channelIntel } = await computeCurrentChannelIntelligence();
  const recommendations = recommendBudgetShifts(channelIntel);

  if (recommendations.length === 0) {
    res.status(201).json([]);
    return;
  }

  const now = new Date().toISOString();
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(budgetRecommendationsTable);
  let offset = Number(countRow[0]?.count ?? 0);

  const rows = recommendations.map((rec) => ({
    id: `BUD-${1000 + offset++}`,
    fromChannel: rec.fromChannel,
    toChannel: rec.toChannel,
    shiftPct: rec.shiftPct,
    shiftAmount: rec.shiftAmount,
    projectedQualifiedDelta: rec.projectedQualifiedDelta,
    projectedRevenueDelta: rec.projectedRevenueDelta,
    rationale: rec.rationale,
    confidence: rec.confidence.score,
    confidenceBand: rec.confidence.band,
    status: "new" as const,
    createdAt: now,
  }));

  const inserted = await db.insert(budgetRecommendationsTable).values(rows).returning();
  await Promise.all(
    inserted.map((row) =>
      writeAudit(row.id, "generated", { fromChannel: row.fromChannel, toChannel: row.toChannel, confidence: row.confidence }),
    ),
  );

  res.status(201).json(inserted.map(toBudgetRecommendation));
});

router.patch("/budget/recommendations/:id", async (req, res) => {
  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status update" });
    return;
  }

  // GUARDRAIL: this update touches ONLY the `status` column on this row.
  // It never writes to channelsTable, campaignsTable, or any spend field,
  // and calls no external ad-platform integration. See module comment.
  const updated = await db
    .update(budgetRecommendationsTable)
    .set({ status: parsed.data.status })
    .where(eq(budgetRecommendationsTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Budget recommendation not found" });
    return;
  }

  if (parsed.data.status === "dismissed") {
    await writeAudit(req.params.id, "dismissed", {});
  } else if (parsed.data.status === "reviewed") {
    await writeAudit(req.params.id, "viewed", {});
  } else if (parsed.data.status === "applied") {
    // "applied" = a human recorded their intent to act. NEVER touches spend.
    await writeAudit(req.params.id, "action_created", { note: "Recorded as a human decision only — no spend was changed." });
  }

  res.json(toBudgetRecommendation(updated[0]!));
});

// ===========================================================================
// Market opportunities (Module 3)
// ===========================================================================

function toMarketOpportunity(row: MarketOpportunityRow) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    insight: row.insight,
    signalStrength: row.signalStrength,
    confidence: row.confidence,
    confidenceBand: row.confidenceBand,
    dataBasis: row.dataBasis,
    status: row.status,
    createdAt: row.createdAt,
  };
}

router.get("/market/opportunities", async (_req, res) => {
  const rows = await db.select().from(marketOpportunitiesTable).orderBy(desc(marketOpportunitiesTable.createdAt));
  res.json(rows.map(toMarketOpportunity));
});

router.post("/market/opportunities/generate", async (_req, res) => {
  const [leads, conversions, events] = await Promise.all([
    db.select().from(leadsTable),
    db.select().from(conversionsTable),
    db.select().from(marketingEventsTable),
  ]);

  const detected = detectMarketOpportunities(leads, conversions, events);
  if (detected.length === 0) {
    res.status(201).json([]);
    return;
  }

  const now = new Date().toISOString();
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(marketOpportunitiesTable);
  let offset = Number(countRow[0]?.count ?? 0);

  const rows = detected.map((opp) => ({
    id: `MOP-${1000 + offset++}`,
    kind: opp.kind,
    title: opp.title,
    insight: opp.insight,
    signalStrength: opp.signalStrength,
    confidence: opp.confidence.score,
    confidenceBand: opp.confidence.band,
    dataBasis: opp.dataBasis,
    status: "new" as const,
    createdAt: now,
  }));

  const inserted = await db.insert(marketOpportunitiesTable).values(rows).returning();
  await Promise.all(inserted.map((row) => writeAudit(row.id, "generated", { kind: row.kind, confidence: row.confidence })));

  res.status(201).json(inserted.map(toMarketOpportunity));
});

router.patch("/market/opportunities/:id", async (req, res) => {
  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status update" });
    return;
  }

  const updated = await db
    .update(marketOpportunitiesTable)
    .set({ status: parsed.data.status })
    .where(eq(marketOpportunitiesTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Market opportunity not found" });
    return;
  }

  if (parsed.data.status === "dismissed") await writeAudit(req.params.id, "dismissed", {});
  else if (parsed.data.status === "reviewed") await writeAudit(req.params.id, "viewed", {});
  else if (parsed.data.status === "applied") await writeAudit(req.params.id, "action_created", { note: "Human decision recorded only." });

  res.json(toMarketOpportunity(updated[0]!));
});

// ===========================================================================
// Content opportunities (Module 4)
// ===========================================================================

function toContentOpportunity(row: ContentOpportunityRow) {
  return {
    id: row.id,
    topic: row.topic,
    rationale: row.rationale,
    basedOn: row.basedOn,
    projectedImpact: row.projectedImpact,
    confidence: row.confidence,
    confidenceBand: row.confidenceBand,
    status: row.status,
    createdAt: row.createdAt,
  };
}

router.get("/content/opportunities", async (_req, res) => {
  const rows = await db.select().from(contentOpportunitiesTable).orderBy(desc(contentOpportunitiesTable.createdAt));
  res.json(rows.map(toContentOpportunity));
});

router.post("/content/opportunities/generate", async (_req, res) => {
  const [events, campaigns, leads] = await Promise.all([
    db.select().from(marketingEventsTable),
    db.select().from(campaignIntelligenceTable),
    db.select().from(leadsTable),
  ]);

  const detected = identifyContentOpportunities(events, campaigns, leads);
  if (detected.length === 0) {
    res.status(201).json([]);
    return;
  }

  const now = new Date().toISOString();
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(contentOpportunitiesTable);
  let offset = Number(countRow[0]?.count ?? 0);

  const rows = detected.map((opp) => ({
    id: `COP-${1000 + offset++}`,
    topic: opp.topic,
    rationale: opp.rationale,
    basedOn: opp.basedOn,
    projectedImpact: opp.projectedImpact,
    confidence: opp.confidence.score,
    confidenceBand: opp.confidence.band,
    status: "new" as const,
    createdAt: now,
  }));

  const inserted = await db.insert(contentOpportunitiesTable).values(rows).returning();
  await Promise.all(inserted.map((row) => writeAudit(row.id, "generated", { topic: row.topic, confidence: row.confidence })));

  res.status(201).json(inserted.map(toContentOpportunity));
});

router.patch("/content/opportunities/:id", async (req, res) => {
  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status update" });
    return;
  }

  const updated = await db
    .update(contentOpportunitiesTable)
    .set({ status: parsed.data.status })
    .where(eq(contentOpportunitiesTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Content opportunity not found" });
    return;
  }

  if (parsed.data.status === "dismissed") await writeAudit(req.params.id, "dismissed", {});
  else if (parsed.data.status === "reviewed") await writeAudit(req.params.id, "viewed", {});
  else if (parsed.data.status === "applied") await writeAudit(req.params.id, "action_created", { note: "Human decision recorded only." });

  res.json(toContentOpportunity(updated[0]!));
});

// ===========================================================================
// Executive Growth Briefing (Module 5, "Good Morning, Rose")
// ===========================================================================

function toGrowthBriefing(row: GrowthBriefingRow) {
  return {
    id: row.id,
    periodLabel: row.periodLabel,
    wins: row.wins,
    risks: row.risks,
    opportunities: row.opportunities,
    recommendedActions: row.recommendedActions,
    summary: row.summary,
    createdAt: row.createdAt,
  };
}

router.get("/growth/briefing", async (_req, res) => {
  const rows = await db.select().from(growthBriefingsTable).orderBy(desc(growthBriefingsTable.createdAt)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "No briefing generated yet. Call POST /growth/briefing/generate." });
    return;
  }
  res.json(toGrowthBriefing(rows[0]!));
});

function periodLabelForNow(now: Date): string {
  const label = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Daily · ${label}`;
}

router.post("/growth/briefing/generate", async (_req, res) => {
  const now = new Date();

  const [leads, conversions, events, predictionRows, channels, campaigns] = await Promise.all([
    db.select().from(leadsTable),
    db.select().from(conversionsTable),
    db.select().from(marketingEventsTable),
    db.select().from(leadPredictionsTable),
    db.select().from(channelsTable),
    db.select().from(campaignsTable),
  ]);

  const spendByChannelName: Record<string, number> = {};
  for (const campaign of campaigns) {
    const channelsForCampaign = campaign.channels ?? [];
    if (channelsForCampaign.length === 0) continue;
    const share = campaign.budgetSpent / channelsForCampaign.length;
    for (const channelName of channelsForCampaign) {
      spendByChannelName[channelName] = (spendByChannelName[channelName] ?? 0) + share;
    }
  }
  const channelIntel = computeChannelIntelligence(channels, leads, events, conversions, spendByChannelName);
  const budgetShifts = recommendBudgetShifts(channelIntel);
  const marketOpps = detectMarketOpportunities(leads, conversions, events);

  const campaignIntel = await db.select().from(campaignIntelligenceTable);
  const contentOpps = identifyContentOpportunities(events, campaignIntel, leads);

  // Use the latest stored lead_predictions if present; otherwise compute
  // on the fly (read-only — does not persist) so the briefing still works
  // even if /predictions/recompute has never been run.
  const leadById = new Map(leads.map((l) => [l.id, l]));
  let leadPredictions: { lead: (typeof leads)[number]; prediction: ReturnType<typeof predictLeadConversion> }[] = [];

  if (predictionRows.length > 0) {
    leadPredictions = predictionRows
      .map((p) => {
        const lead = leadById.get(p.leadId);
        if (!lead) return null;
        return {
          lead,
          prediction: {
            conversionProbability: p.conversionProbability,
            expectedRevenue: p.expectedRevenue,
            bestFollowUpAt: p.bestFollowUpAt ?? "",
            bestFollowUpReason: p.bestFollowUpReason,
            factors: p.factors,
            confidence: { score: p.confidence, band: p.confidenceBand, factors: { volume: 0, reliability: 0, consistency: 0 }, rationale: "" },
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  } else {
    const cohortStats = buildCohortStats(leads);
    const eventsByLead = new Map<string, typeof events>();
    for (const event of events) {
      if (!event.leadId) continue;
      const bucket = eventsByLead.get(event.leadId) ?? [];
      bucket.push(event);
      eventsByLead.set(event.leadId, bucket);
    }
    leadPredictions = leads.map((lead) => ({
      lead,
      prediction: predictLeadConversion(lead, eventsByLead.get(lead.id) ?? [], cohortStats, now),
    }));
  }

  // "New customers" for the win section: leads marked isCustomer whose
  // conversion happened within the last 7 days (best-effort — uses the
  // conversion record's convertedAt, falling back to lead.updatedAt).
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const conversionDateByLead = new Map(conversions.map((c) => [c.leadId, c.convertedAt]));
  const newCustomers = leads.filter((l) => {
    if (!l.isCustomer) return false;
    const dateStr = conversionDateByLead.get(l.id) ?? l.updatedAt;
    const t = new Date(dateStr).getTime();
    return !Number.isNaN(t) && t >= sevenDaysAgo;
  });

  const briefing = buildGrowthBriefing({
    periodLabel: periodLabelForNow(now),
    newCustomers,
    leadPredictions,
    channelIntel,
    budgetShifts,
    marketOpportunities: marketOpps,
    contentOpportunities: contentOpps,
  });

  const countRow = await db.select({ count: sql<number>`count(*)` }).from(growthBriefingsTable);
  const id = `BRIEF-${1000 + Number(countRow[0]?.count ?? 0)}`;

  const inserted = (
    await db
      .insert(growthBriefingsTable)
      .values({
        id,
        periodLabel: briefing.periodLabel,
        wins: briefing.wins,
        risks: briefing.risks,
        opportunities: briefing.opportunities,
        recommendedActions: briefing.recommendedActions,
        summary: briefing.summary,
        createdAt: now.toISOString(),
      })
      .returning()
  )[0]!;

  res.status(201).json(toGrowthBriefing(inserted));
});

export default router;
