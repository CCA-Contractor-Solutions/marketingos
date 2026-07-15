import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, marketingEventsTable, type MarketingEventRow } from "@workspace/db";
import { refreshLeadJourneyAndScore } from "../lib/intelligence/refresh";
import { EVENT_TYPES, CreateEventBody, insertMarketingEvent } from "../lib/intelligence/events";

const router: IRouter = Router();

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

router.post("/events", async (req, res) => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid event input" });
    return;
  }

  const event = await insertMarketingEvent(parsed.data);

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
    inserted.push(await insertMarketingEvent(body));
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
