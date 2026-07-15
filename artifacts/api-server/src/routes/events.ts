import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, marketingEventsTable, type MarketingEventRow } from "@workspace/db";
import { refreshLeadJourneyAndScore } from "../lib/intelligence/refresh";

const router: IRouter = Router();

const EVENT_TYPES = [
  "website_visit",
  "landing_page_view",
  "form_submission",
  "content_download",
  "email_open",
  "email_click",
  "phone_call",
  "meeting_request",
  "campaign_interaction",
  "sales_conversion",
  "customer_purchase",
] as const;

const CreateEventBody = z.object({
  leadId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  eventType: z.enum(EVENT_TYPES),
  source: z.string().optional(),
  campaign: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  occurredAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const CreateEventsBatchBody = z.object({
  events: z.array(CreateEventBody).min(1),
});

function toEvent(row: MarketingEventRow) {
  return {
    id: row.id,
    leadId: row.leadId,
    customerId: row.customerId,
    eventType: row.eventType,
    source: row.source,
    campaign: row.campaign,
    channel: row.channel,
    occurredAt: row.occurredAt,
    metadata: row.metadata,
  };
}

async function nextEventId(): Promise<string> {
  const countRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(marketingEventsTable);
  return `EVT-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

async function insertEvent(body: z.infer<typeof CreateEventBody>): Promise<MarketingEventRow> {
  const now = new Date().toISOString();
  const id = await nextEventId();

  const inserted = await db
    .insert(marketingEventsTable)
    .values({
      id,
      leadId: body.leadId ?? null,
      customerId: body.customerId ?? null,
      eventType: body.eventType,
      source: body.source ?? "",
      campaign: body.campaign ?? null,
      channel: body.channel ?? null,
      occurredAt: body.occurredAt ?? now,
      metadata: body.metadata ?? {},
      createdAt: now,
    })
    .returning();

  return inserted[0]!;
}

router.post("/events", async (req, res) => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid event input" });
    return;
  }

  const event = await insertEvent(parsed.data);

  if (event.leadId) {
    await refreshLeadJourneyAndScore(event.leadId);
  }

  res.status(201).json(toEvent(event));
});

router.post("/events/batch", async (req, res) => {
  const parsed = CreateEventsBatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid batch event input" });
    return;
  }

  const inserted: MarketingEventRow[] = [];
  for (const body of parsed.data.events) {
    inserted.push(await insertEvent(body));
  }

  const leadIds = new Set(inserted.map((e) => e.leadId).filter((id): id is string => !!id));
  for (const leadId of leadIds) {
    await refreshLeadJourneyAndScore(leadId);
  }

  res.status(201).json(inserted.map(toEvent));
});

router.get("/events", async (req, res) => {
  const { leadId, channel, type, limit } = req.query;

  const conditions = [];
  if (typeof leadId === "string") conditions.push(eq(marketingEventsTable.leadId, leadId));
  if (typeof channel === "string") conditions.push(eq(marketingEventsTable.channel, channel));
  if (typeof type === "string") {
    conditions.push(eq(marketingEventsTable.eventType, type as (typeof EVENT_TYPES)[number]));
  }

  const parsedLimit = typeof limit === "string" ? Number.parseInt(limit, 10) : NaN;
  const effectiveLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 100;

  const baseQuery = db.select().from(marketingEventsTable);
  const rows = await (conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery)
    .orderBy(desc(marketingEventsTable.occurredAt))
    .limit(effectiveLimit);

  res.json(rows.map(toEvent));
});

export default router;
