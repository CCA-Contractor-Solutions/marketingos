import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  leadsTable,
  marketingEventsTable,
  customersTable,
  conversionsTable,
  revenueAttributionTable,
  type LeadRow,
  type MarketingEventRow,
} from "@workspace/db";
import { refreshLeadJourneyAndScore } from "../lib/intelligence/refresh";
import { computeAttribution } from "../lib/intelligence/attribution";

const router: IRouter = Router();

const LEAD_STATUSES = ["new", "working", "qualified", "sales_accepted", "customer", "lost"] as const;
const SCORE_TIERS = ["high", "medium", "low", "unscored"] as const;

const CreateLeadBody = z.object({
  companyName: z.string().min(1),
  industry: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  companySize: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  contactRole: z.string().optional(),
  source: z.string().optional(),
  channel: z.string().optional(),
  campaign: z.string().optional(),
});

const UpdateLeadBody = z.object({
  qualified: z.boolean().optional(),
  salesAccepted: z.boolean().optional(),
  isCustomer: z.boolean().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const ConvertLeadBody = z.object({
  amount: z.number().nonnegative(),
  convertedAt: z.string().optional(),
  campaign: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
});

function toLeadSummary(row: LeadRow) {
  return {
    id: row.id,
    companyName: row.companyName,
    industry: row.industry,
    location: row.location,
    contactName: row.contactName,
    email: row.email,
    score: row.score,
    scoreTier: row.scoreTier,
    status: row.status,
    firstTouchChannel: row.firstTouchChannel,
    lastTouchChannel: row.lastTouchChannel,
    isCustomer: row.isCustomer,
    revenueGenerated: row.revenueGenerated,
    createdAt: row.createdAt,
  };
}

function toLeadDetail(row: LeadRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    companyName: row.companyName,
    industry: row.industry,
    location: row.location,
    website: row.website,
    companySize: row.companySize,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    contactRole: row.contactRole,
    firstTouchChannel: row.firstTouchChannel,
    firstTouchCampaign: row.firstTouchCampaign,
    firstTouchAt: row.firstTouchAt,
    lastTouchChannel: row.lastTouchChannel,
    lastTouchCampaign: row.lastTouchCampaign,
    lastTouchAt: row.lastTouchAt,
    campaigns: row.campaigns,
    pagesVisited: row.pagesVisited,
    contentConsumed: row.contentConsumed,
    callCount: row.callCount,
    emailCount: row.emailCount,
    score: row.score,
    scoreTier: row.scoreTier,
    scoreReason: row.scoreReason,
    recommendedAction: row.recommendedAction,
    qualified: row.qualified,
    salesAccepted: row.salesAccepted,
    isCustomer: row.isCustomer,
    customerId: row.customerId,
    revenueGenerated: row.revenueGenerated,
    status: row.status,
  };
}

async function nextLeadId(): Promise<string> {
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(leadsTable);
  return `LEAD-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

async function nextCustomerId(): Promise<string> {
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(customersTable);
  return `CUST-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

async function nextConversionId(): Promise<string> {
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(conversionsTable);
  return `CONV-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

router.get("/leads", async (req, res) => {
  const { tier, status, channel } = req.query;

  const conditions = [];
  if (typeof tier === "string") {
    conditions.push(eq(leadsTable.scoreTier, tier as (typeof SCORE_TIERS)[number]));
  }
  if (typeof status === "string") {
    conditions.push(eq(leadsTable.status, status as (typeof LEAD_STATUSES)[number]));
  }
  if (typeof channel === "string") {
    conditions.push(eq(leadsTable.firstTouchChannel, channel));
  }

  const baseQuery = db.select().from(leadsTable);
  const rows = await (conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery).orderBy(
    desc(leadsTable.createdAt),
  );

  res.json(rows.map(toLeadSummary));
});

router.post("/leads", async (req, res) => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lead input" });
    return;
  }
  const body = parsed.data;
  const now = new Date().toISOString();

  const id = await nextLeadId();

  const inserted = await db
    .insert(leadsTable)
    .values({
      id,
      createdAt: now,
      updatedAt: now,
      companyName: body.companyName,
      industry: body.industry ?? "",
      location: body.location ?? "",
      website: body.website ?? "",
      companySize: body.companySize ?? "",
      contactName: body.contactName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      contactRole: body.contactRole ?? "",
      status: "new",
    })
    .returning();

  const lead = inserted[0]!;

  // A lead created via the website form is itself a touch — log a
  // landing_page_view / form_submission style event so scoring has a signal.
  const eventCountRow = await db.select({ count: sql<number>`count(*)` }).from(marketingEventsTable);
  const eventId = `EVT-${1000 + Number(eventCountRow[0]?.count ?? 0)}`;
  await db.insert(marketingEventsTable).values({
    id: eventId,
    leadId: lead.id,
    eventType: "form_submission",
    source: body.source ?? "website_form",
    campaign: body.campaign ?? null,
    channel: body.channel ?? "direct",
    occurredAt: now,
    metadata: {},
    createdAt: now,
  });

  const refreshed = await refreshLeadJourneyAndScore(lead.id);
  res.status(201).json(toLeadDetail(refreshed ?? lead));
});

router.get("/leads/:id", async (req, res) => {
  const rows = await db.select().from(leadsTable).where(eq(leadsTable.id, req.params.id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const lead = rows[0]!;

  const events = await db
    .select()
    .from(marketingEventsTable)
    .where(eq(marketingEventsTable.leadId, lead.id))
    .orderBy(asc(marketingEventsTable.occurredAt));

  let attribution: unknown[] = [];
  if (lead.isCustomer) {
    const attributionRows = await db
      .select()
      .from(revenueAttributionTable)
      .where(eq(revenueAttributionTable.leadId, lead.id));
    attribution = attributionRows;
  }

  res.json({
    ...toLeadDetail(lead),
    events: events.map((e: MarketingEventRow) => ({
      id: e.id,
      eventType: e.eventType,
      source: e.source,
      campaign: e.campaign,
      channel: e.channel,
      occurredAt: e.occurredAt,
      metadata: e.metadata,
    })),
    attribution,
  });
});

router.patch("/leads/:id", async (req, res) => {
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lead update" });
    return;
  }
  const body = parsed.data;

  const update: Partial<LeadRow> = { updatedAt: new Date().toISOString() };
  if (body.qualified !== undefined) update.qualified = body.qualified;
  if (body.salesAccepted !== undefined) update.salesAccepted = body.salesAccepted;
  if (body.isCustomer !== undefined) update.isCustomer = body.isCustomer;
  if (body.status !== undefined) update.status = body.status;
  if (body.companyName !== undefined) update.companyName = body.companyName;
  if (body.contactName !== undefined) update.contactName = body.contactName;
  if (body.email !== undefined) update.email = body.email;
  if (body.phone !== undefined) update.phone = body.phone;

  const updated = await db.update(leadsTable).set(update).where(eq(leadsTable.id, req.params.id)).returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(toLeadDetail(updated[0]!));
});

router.post("/leads/:id/score", async (req, res) => {
  const refreshed = await refreshLeadJourneyAndScore(req.params.id);
  if (!refreshed) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(toLeadDetail(refreshed));
});

router.post("/leads/:id/convert", async (req, res) => {
  const parsed = ConvertLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid conversion input" });
    return;
  }
  const body = parsed.data;

  const leadRows = await db.select().from(leadsTable).where(eq(leadsTable.id, req.params.id)).limit(1);
  if (leadRows.length === 0) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const lead = leadRows[0]!;
  const now = new Date().toISOString();
  const convertedAt = body.convertedAt ?? now;

  const customerId = await nextCustomerId();
  await db.insert(customersTable).values({
    id: customerId,
    leadId: lead.id,
    companyName: lead.companyName,
    contactName: lead.contactName,
    email: lead.email,
    convertedAt,
    totalRevenue: body.amount,
    createdAt: now,
  });

  const conversionId = await nextConversionId();
  const conversion = (
    await db
      .insert(conversionsTable)
      .values({
        id: conversionId,
        leadId: lead.id,
        customerId,
        campaign: body.campaign ?? lead.lastTouchCampaign ?? null,
        channel: body.channel ?? lead.lastTouchChannel ?? null,
        amount: body.amount,
        convertedAt,
        createdAt: now,
      })
      .returning()
  )[0]!;

  const events = await db
    .select()
    .from(marketingEventsTable)
    .where(eq(marketingEventsTable.leadId, lead.id))
    .orderBy(asc(marketingEventsTable.occurredAt));

  const attributionInputs = computeAttribution(conversion, events);
  if (attributionInputs.length > 0) {
    const countRow = await db.select({ count: sql<number>`count(*)` }).from(revenueAttributionTable);
    let offset = Number(countRow[0]?.count ?? 0);
    const attributionRows = attributionInputs.map((input) => ({
      id: `ATTR-${1000 + offset++}`,
      conversionId: conversion.id,
      leadId: lead.id,
      model: input.model,
      channel: input.channel,
      campaign: input.campaign,
      weight: input.weight,
      attributedAmount: input.attributedAmount,
      computedAt: now,
    }));
    await db.insert(revenueAttributionTable).values(attributionRows);
  }

  const updatedLeads = await db
    .update(leadsTable)
    .set({
      isCustomer: true,
      customerId,
      revenueGenerated: lead.revenueGenerated + body.amount,
      status: "customer",
      updatedAt: now,
    })
    .where(eq(leadsTable.id, lead.id))
    .returning();

  res.status(201).json({
    lead: toLeadDetail(updatedLeads[0]!),
    customerId,
    conversionId: conversion.id,
  });
});

export default router;
