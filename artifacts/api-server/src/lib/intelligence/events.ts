import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, marketingEventsTable, type MarketingEventRow } from "@workspace/db";

// ---------------------------------------------------------------------------
// Shared event-insert path (Phase 2 events.ts + Phase 4 ingestion.ts both use
// this — there must be exactly ONE way a `marketing_events` row gets
// created). Keep this the single source of truth for the insert shape and ID
// scheme; do not duplicate this logic elsewhere.
// ---------------------------------------------------------------------------

export const EVENT_TYPES = [
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

export const CreateEventBody = z.object({
  leadId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  eventType: z.enum(EVENT_TYPES),
  source: z.string().optional(),
  campaign: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  occurredAt: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EventDraft = z.infer<typeof CreateEventBody>;

export async function nextEventId(): Promise<string> {
  const countRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(marketingEventsTable);
  return `EVT-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

export async function insertMarketingEvent(body: EventDraft): Promise<MarketingEventRow> {
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
