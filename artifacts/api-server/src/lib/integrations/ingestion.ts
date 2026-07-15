import { and, eq, sql } from "drizzle-orm";
import {
  db,
  externalEventsTable,
  syncJobsTable,
  integrationsTable,
  type ExternalEventRow,
  type SyncJobRow,
} from "@workspace/db";
import { insertMarketingEvent } from "../intelligence/events";
import { refreshLeadJourneyAndScore } from "../intelligence/refresh";
import { getConnector } from "../../routes/integrations/providers";

// ---------------------------------------------------------------------------
// Phase 4 — Ingestion service.
//
// The ONE path external provider data takes to become MarketingOS
// intelligence:
//
//   raw provider record --> external_events (raw log, deduped)
//                        --> connector.mapToEvents (pure)
//                        --> marketing_events (via the shared
//                            insertMarketingEvent helper — same path
//                            routes/events.ts uses)
//                        --> refreshLeadJourneyAndScore (when a leadId is
//                            present)
//
// Wrapped end-to-end in a sync_jobs record so status/errors/counts are
// visible in the Integration Management Center.
// ---------------------------------------------------------------------------

async function nextId(table: typeof externalEventsTable | typeof syncJobsTable, prefix: string): Promise<string> {
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(table);
  return `${prefix}-${1000 + Number(countRow[0]?.count ?? 0)}`;
}

function safeErrorMessage(err: unknown): string {
  // Sanitize: never surface raw error objects (which could include request
  // bodies / headers containing credentials) — only a short, generic
  // message plus the error's own `message` string, stripped of anything
  // that looks like a credential reference value.
  const message = err instanceof Error ? err.message : String(err);
  return message.length > 300 ? `${message.slice(0, 300)}…` : message;
}

/** Extract a stable external record id from a raw payload (best-effort). */
function externalIdOf(raw: unknown, fallbackIndex: number, provider: string): string {
  const r = raw as Record<string, unknown> | null;
  const id = r && typeof r === "object" ? r["externalId"] ?? r["id"] : undefined;
  if (typeof id === "string" && id.length > 0) return id;
  if (typeof id === "number") return String(id);
  return `${provider.toUpperCase()}-AUTO-${fallbackIndex}`;
}

function eventTypeOf(raw: unknown): string {
  const r = raw as Record<string, unknown> | null;
  const t = r && typeof r === "object" ? r["type"] ?? r["eventType"] ?? r["eventName"] : undefined;
  return typeof t === "string" ? t : "unknown";
}

export type IngestSummary = {
  jobId: string;
  status: SyncJobRow["status"];
  recordsProcessed: number;
  skippedDuplicates: number;
  marketingEventsCreated: number;
  leadsRefreshed: number;
  errors: string[];
};

export async function ingestExternalRecords(
  provider: string,
  integrationId: string,
  rawRecords: unknown[],
): Promise<IngestSummary> {
  const now = new Date().toISOString();
  const jobId = await nextId(syncJobsTable, "SYNC");

  await db.insert(syncJobsTable).values({
    id: jobId,
    integrationId,
    provider,
    startedAt: now,
    status: "running",
    recordsProcessed: 0,
    errors: [],
    createdAt: now,
  });

  const errors: string[] = [];
  let recordsProcessed = 0;
  let skippedDuplicates = 0;
  let marketingEventsCreated = 0;
  const touchedLeadIds = new Set<string>();

  try {
    const connector = getConnector(provider);
    if (!connector) {
      throw new Error(`unknown connector: ${provider}`);
    }

    for (let i = 0; i < rawRecords.length; i++) {
      const raw = rawRecords[i];
      const externalId = externalIdOf(raw, i, provider);

      try {
        // --- Dedup on (provider, externalId): skip if already processed. ---
        const existing = await db
          .select()
          .from(externalEventsTable)
          .where(and(eq(externalEventsTable.provider, provider), eq(externalEventsTable.externalId, externalId)))
          .limit(1);

        if (existing.length > 0 && existing[0]!.processedAt) {
          skippedDuplicates += 1;
          continue;
        }

        const externalEventId =
          existing.length > 0 ? existing[0]!.id : await nextId(externalEventsTable, "EXT");

        if (existing.length === 0) {
          await db.insert(externalEventsTable).values({
            id: externalEventId,
            provider,
            externalId,
            eventType: eventTypeOf(raw),
            payload: (raw as Record<string, unknown>) ?? {},
            processedAt: null,
            marketingEventId: null,
            createdAt: now,
          });
        }

        // --- Map to MarketingOS event draft(s) (pure, no DB access). ---
        const drafts = connector.mapToEvents([raw]);
        let marketingEventId: string | null = null;

        for (const draft of drafts) {
          const inserted = await insertMarketingEvent(draft);
          marketingEventId = inserted.id;
          marketingEventsCreated += 1;
          if (inserted.leadId) touchedLeadIds.add(inserted.leadId);
        }

        await db
          .update(externalEventsTable)
          .set({ processedAt: new Date().toISOString(), marketingEventId })
          .where(eq(externalEventsTable.id, externalEventId));

        recordsProcessed += 1;
      } catch (recordErr) {
        errors.push(`record ${externalId}: ${safeErrorMessage(recordErr)}`);
      }
    }

    for (const leadId of touchedLeadIds) {
      await refreshLeadJourneyAndScore(leadId);
    }

    const status: SyncJobRow["status"] = errors.length > 0 && recordsProcessed === 0 ? "error" : "success";

    await db
      .update(syncJobsTable)
      .set({
        completedAt: new Date().toISOString(),
        status,
        recordsProcessed,
        errors,
      })
      .where(eq(syncJobsTable.id, jobId));

    await db
      .update(integrationsTable)
      .set({ lastSyncedAt: new Date().toISOString() })
      .where(eq(integrationsTable.id, integrationId));

    return {
      jobId,
      status,
      recordsProcessed,
      skippedDuplicates,
      marketingEventsCreated,
      leadsRefreshed: touchedLeadIds.size,
      errors,
    };
  } catch (jobErr) {
    const message = safeErrorMessage(jobErr);
    errors.push(message);
    await db
      .update(syncJobsTable)
      .set({
        completedAt: new Date().toISOString(),
        status: "error",
        recordsProcessed,
        errors,
      })
      .where(eq(syncJobsTable.id, jobId));

    return {
      jobId,
      status: "error",
      recordsProcessed,
      skippedDuplicates,
      marketingEventsCreated,
      leadsRefreshed: touchedLeadIds.size,
      errors,
    };
  }
}

export async function getExternalEventsCountForProvider(provider: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(externalEventsTable)
    .where(eq(externalEventsTable.provider, provider));
  return Number(rows[0]?.count ?? 0);
}
