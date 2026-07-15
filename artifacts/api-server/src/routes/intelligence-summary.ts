import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import {
  db,
  leadsTable,
  conversionsTable,
  aiRecommendationsTable,
  tasksTable,
  type LeadRow,
  type ConversionRow,
} from "@workspace/db";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /intelligence/overview
//
// Small read-aggregation endpoint. Computes headline KPIs directly from
// `leadsTable` + `conversionsTable` — no new tables, no stored cache.
// ---------------------------------------------------------------------------
router.get("/intelligence/overview", async (_req, res) => {
  const leads = await db.select().from(leadsTable);

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.qualified).length;
  const customers = leads.filter((l) => l.isCustomer).length;
  const revenue = leads.reduce((sum, l) => sum + l.revenueGenerated, 0);
  const conversionRate = totalLeads > 0 ? customers / totalLeads : 0;

  res.json({
    totalLeads,
    qualifiedLeads,
    customers,
    revenue,
    conversionRate,
  });
});

// ---------------------------------------------------------------------------
// GET /intelligence/funnel
//
// Ordered funnel stages derived from lead status/flags. Every lead falls
// into exactly one of these buckets based on their furthest-progressed
// flag, so stages are cumulative (each stage count includes leads that have
// progressed further), matching a classic top-of-funnel → bottom-of-funnel
// read.
// ---------------------------------------------------------------------------
router.get("/intelligence/funnel", async (_req, res) => {
  const leads = await db.select().from(leadsTable);

  const totalLeads = leads.length;
  const qualified = leads.filter((l) => l.qualified).length;
  const salesAccepted = leads.filter((l) => l.salesAccepted).length;
  const customers = leads.filter((l) => l.isCustomer).length;

  res.json([
    { stage: "Leads", count: totalLeads },
    { stage: "Qualified", count: qualified },
    { stage: "Sales Accepted", count: salesAccepted },
    { stage: "Customers", count: customers },
  ]);
});

// ---------------------------------------------------------------------------
// GET /intelligence/lead-trend?weeks=8
//
// Buckets leads (by createdAt) and conversions (by convertedAt) into
// week-long periods for a trend chart. Never throws on sparse/malformed
// timestamps — rows with unparsable dates are simply skipped from the
// bucketing (they are still counted in /intelligence/overview totals).
// ---------------------------------------------------------------------------
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  // Normalize to Monday as the start of the week.
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function safeParseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

router.get("/intelligence/lead-trend", async (req, res) => {
  const parsedWeeks = Number.parseInt(String(req.query.weeks ?? "8"), 10);
  const weeks = Number.isFinite(parsedWeeks) && parsedWeeks > 0 ? Math.min(parsedWeeks, 52) : 8;

  const [leads, conversions] = await Promise.all([
    db.select().from(leadsTable),
    db.select().from(conversionsTable),
  ]);

  const now = new Date();
  const currentWeekStart = startOfWeek(now);

  // Build `weeks` buckets ending at (and including) the current week.
  const buckets: { periodStart: Date; leads: number; customers: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({
      periodStart: new Date(currentWeekStart.getTime() - i * MS_PER_WEEK),
      leads: 0,
      customers: 0,
    });
  }

  const bucketIndexForDate = (date: Date): number | null => {
    const weekStart = startOfWeek(date).getTime();
    const idx = buckets.findIndex((b) => b.periodStart.getTime() === weekStart);
    return idx === -1 ? null : idx;
  };

  for (const lead of leads as LeadRow[]) {
    const created = safeParseDate(lead.createdAt);
    if (!created) continue;
    const idx = bucketIndexForDate(created);
    if (idx !== null) buckets[idx]!.leads += 1;
  }

  for (const conversion of conversions as ConversionRow[]) {
    const convertedAt = safeParseDate(conversion.convertedAt);
    if (!convertedAt) continue;
    const idx = bucketIndexForDate(convertedAt);
    if (idx !== null) buckets[idx]!.customers += 1;
  }

  res.json(
    buckets.map((b) => ({
      period: b.periodStart.toISOString().slice(0, 10),
      leads: b.leads,
      customers: b.customers,
    })),
  );
});

// ---------------------------------------------------------------------------
// Module 5 actions — POST /actions/from-recommendation
//
// IMPORTANT: there is no separate "actions" table. An "action" IS a task.
// This endpoint reuses the EXISTING `tasksTable` (see routes/tasks.ts) to
// create a new task from an AI recommendation, then marks the source
// recommendation as `applied` via the existing recommendations update path.
// Reading/updating actions afterwards uses the existing task endpoints
// (`GET /tasks`, `PATCH /tasks/:id`) — the UI's Task Board can filter on
// `aiGenerated: true` to surface them. No new data model is introduced.
// ---------------------------------------------------------------------------
const CreateActionFromRecommendationBody = z.object({
  recommendationId: z.string().min(1),
  title: z.string().min(1),
  owner: z.string().optional(),
  dueAt: z.string().optional(),
});

router.post("/actions/from-recommendation", async (req, res) => {
  const parsed = CreateActionFromRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid action input" });
    return;
  }
  const body = parsed.data;

  const recommendationRows = await db
    .select()
    .from(aiRecommendationsTable)
    .where(eq(aiRecommendationsTable.id, body.recommendationId))
    .limit(1);

  if (recommendationRows.length === 0) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  // --- Create the task (reusing tasksTable / the same ID + sortOrder
  // conventions as routes/tasks.ts POST /tasks). ---
  const maxRow = await db
    .select({ max: sql<number>`coalesce(max(${tasksTable.sortOrder}), -1)` })
    .from(tasksTable);
  const nextOrder = (maxRow[0]?.max ?? -1) + 1;

  const countRow = await db.select({ count: sql<number>`count(*)` }).from(tasksTable);
  const id = `TSK-${200 + Number(countRow[0]?.count ?? 0)}`;

  const assignees = body.owner
    ? [{ init: body.owner.slice(0, 2).toUpperCase(), color: "#0d9488" }]
    : [];

  const inserted = await db
    .insert(tasksTable)
    .values({
      id,
      title: body.title,
      status: "backlog",
      priority: "medium",
      assignees,
      dueDate: body.dueAt ?? null,
      dueAt: body.dueAt ?? null,
      campaign: null,
      aiGenerated: true,
      sortOrder: nextOrder,
    })
    .returning();

  const task = inserted[0]!;

  // --- Mark the source recommendation as applied. ---
  const updatedRecommendation = await db
    .update(aiRecommendationsTable)
    .set({ status: "applied" })
    .where(eq(aiRecommendationsTable.id, body.recommendationId))
    .returning();

  res.status(201).json({
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignees: task.assignees,
      dueDate: task.dueDate,
      dueAt: task.dueAt,
      campaign: task.campaign,
      aiGenerated: task.aiGenerated,
      blocked: task.blocked,
    },
    recommendation: {
      id: updatedRecommendation[0]!.id,
      status: updatedRecommendation[0]!.status,
    },
  });
});

export default router;
