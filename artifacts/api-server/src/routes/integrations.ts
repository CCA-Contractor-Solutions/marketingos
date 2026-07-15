import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  integrationsTable,
  syncJobsTable,
  externalEventsTable,
  type IntegrationRow,
  type SyncJobRow,
  type ExternalEventRow,
} from "@workspace/db";
import { CONNECTOR_REGISTRY, getConnector } from "./integrations/providers";
import { checkRequiredCredentials } from "../lib/integrations/credentials";
import { ingestExternalRecords, getExternalEventsCountForProvider } from "../lib/integrations/ingestion";
import { samplePayloadFor } from "../lib/integrations/sample-payloads";

const router: IRouter = Router();

const INTEGRATION_CATEGORIES = ["advertising", "analytics", "communication", "email", "automation"] as const;
const INTEGRATION_STATUSES = ["available", "connected", "error", "disabled"] as const;

const CreateIntegrationBody = z.object({
  providerKey: z.string().min(1),
  category: z.enum(INTEGRATION_CATEGORIES),
  displayName: z.string().min(1),
  // Only a reference key (e.g. an env var name or vault key) may be stored
  // here — never raw secrets/tokens. Callers are responsible for keeping
  // actual credentials out of this payload.
  config: z.record(z.string(), z.unknown()).optional(),
  credentialsReference: z.string().nullable().optional(),
});

const UpdateIntegrationBody = z.object({
  status: z.enum(INTEGRATION_STATUSES).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  credentialsReference: z.string().nullable().optional(),
});

// `credentialsReference` here is a NAME only (e.g. "GA4_OAUTH_TOKEN") — the
// UI collects a reference name, never a secret value.
const ConnectIntegrationBody = z.object({
  credentialsReference: z.string().nullable().optional(),
});

async function enrichIntegration(row: IntegrationRow) {
  const connector = getConnector(row.providerKey);

  const [dataImported, latestJob] = await Promise.all([
    getExternalEventsCountForProvider(row.providerKey),
    db
      .select()
      .from(syncJobsTable)
      .where(eq(syncJobsTable.integrationId, row.id))
      .orderBy(desc(syncJobsTable.createdAt))
      .limit(1),
  ]);

  const lastJob = latestJob[0];
  const errorCount = lastJob ? lastJob.errors.length : 0;

  return {
    id: row.id,
    providerKey: row.providerKey,
    category: row.category,
    displayName: row.displayName,
    status: row.status,
    config: row.config,
    credentialsReference: row.credentialsReference,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    connectorAvailable: Boolean(connector),
    // --- Phase 4 connector metadata ---
    authMethod: connector?.authMethod ?? "none",
    requiredCredentials: connector?.requiredCredentials ?? [],
    dataAvailable: connector?.dataAvailable ?? [],
    defaultSyncFrequency: connector?.defaultSyncFrequency ?? "manual",
    // --- Phase 4 derived state ---
    lastSync: lastJob
      ? {
          id: lastJob.id,
          status: lastJob.status,
          startedAt: lastJob.startedAt,
          completedAt: lastJob.completedAt,
          recordsProcessed: lastJob.recordsProcessed,
        }
      : null,
    dataImported,
    errorCount,
  };
}

function toSyncJob(row: SyncJobRow) {
  return {
    id: row.id,
    integrationId: row.integrationId,
    provider: row.provider,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    status: row.status,
    recordsProcessed: row.recordsProcessed,
    errors: row.errors,
    createdAt: row.createdAt,
  };
}

function toExternalEvent(row: ExternalEventRow) {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.externalId,
    eventType: row.eventType,
    payload: row.payload,
    processedAt: row.processedAt,
    marketingEventId: row.marketingEventId,
    createdAt: row.createdAt,
  };
}

router.get("/integrations", async (_req, res) => {
  const rows = await db.select().from(integrationsTable).orderBy(asc(integrationsTable.displayName));
  res.json(await Promise.all(rows.map(enrichIntegration)));
});

router.post("/integrations", async (req, res) => {
  const parsed = CreateIntegrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid integration input" });
    return;
  }
  const body = parsed.data;
  const now = new Date().toISOString();

  const countRow = await db.select({ count: sql<number>`count(*)` }).from(integrationsTable);
  const id = `INTG-${100 + Number(countRow[0]?.count ?? 0)}`;

  const inserted = await db
    .insert(integrationsTable)
    .values({
      id,
      providerKey: body.providerKey,
      category: body.category,
      displayName: body.displayName,
      status: "available",
      config: body.config ?? {},
      credentialsReference: body.credentialsReference ?? null,
      createdAt: now,
    })
    .returning();

  res.status(201).json(await enrichIntegration(inserted[0]!));
});

router.patch("/integrations/:id", async (req, res) => {
  const parsed = UpdateIntegrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid integration update" });
    return;
  }
  const body = parsed.data;

  const update: Partial<IntegrationRow> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.config !== undefined) update.config = body.config;
  if (body.credentialsReference !== undefined) update.credentialsReference = body.credentialsReference;

  const updated = await db
    .update(integrationsTable)
    .set(update)
    .where(eq(integrationsTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Integration not found" });
    return;
  }
  res.json(await enrichIntegration(updated[0]!));
});

// ---------------------------------------------------------------------------
// POST /integrations/:id/connect
//
// Stores only a `credentialsReference` NAME from the request body (never a
// secret value). Sets status to "connected" if the connector's required
// credentials are resolvable from env, otherwise "error" with a safe reason.
// ---------------------------------------------------------------------------
router.post("/integrations/:id/connect", async (req, res) => {
  const parsed = ConnectIntegrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid connect input" });
    return;
  }

  const existing = await db
    .select()
    .from(integrationsTable)
    .where(eq(integrationsTable.id, req.params.id))
    .limit(1);
  const integration = existing[0];
  if (!integration) {
    res.status(404).json({ error: "Integration not found" });
    return;
  }

  const connector = getConnector(integration.providerKey);
  const credentialsReference = parsed.data.credentialsReference ?? integration.credentialsReference ?? null;

  let status: IntegrationRow["status"] = "error";
  let reason: string | undefined;

  if (!connector) {
    reason = "connector_not_available";
  } else if (connector.requiredCredentials.length === 0) {
    status = "connected";
  } else {
    const { ok, missing } = checkRequiredCredentials(connector.requiredCredentials);
    if (ok) {
      status = "connected";
    } else {
      reason = `missing credential(s): ${missing.join(", ")}`;
    }
  }

  const updated = await db
    .update(integrationsTable)
    .set({ status, credentialsReference })
    .where(eq(integrationsTable.id, integration.id))
    .returning();

  const result = await enrichIntegration(updated[0]!);
  res.json({ ...result, connectReason: reason });
});

// ---------------------------------------------------------------------------
// POST /integrations/:id/sync?demo=1
//
// Runs ingestion with a small built-in SAMPLE dataset per provider (no real
// SDK/network calls this phase). Guarded to "connected" integrations unless
// ?demo=1 is passed, so the pipeline is demonstrable even before a real
// connect step.
// ---------------------------------------------------------------------------
router.post("/integrations/:id/sync", async (req, res) => {
  const existing = await db
    .select()
    .from(integrationsTable)
    .where(eq(integrationsTable.id, req.params.id))
    .limit(1);
  const integration = existing[0];
  if (!integration) {
    res.status(404).json({ error: "Integration not found" });
    return;
  }

  const allowDemo = req.query.demo === "1";
  if (integration.status !== "connected" && !allowDemo) {
    res.status(409).json({ error: "Integration is not connected. Connect it first, or pass ?demo=1." });
    return;
  }

  const connector = getConnector(integration.providerKey);
  if (!connector) {
    res.status(400).json({ error: "No connector available for this provider" });
    return;
  }

  const sample = samplePayloadFor(integration.providerKey);
  const summary = await ingestExternalRecords(integration.providerKey, integration.id, sample);

  res.status(202).json(summary);
});

router.get("/integrations/:id/sync-jobs", async (req, res) => {
  const limitParam = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : NaN;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

  const rows = await db
    .select()
    .from(syncJobsTable)
    .where(eq(syncJobsTable.integrationId, req.params.id))
    .orderBy(desc(syncJobsTable.createdAt))
    .limit(limit);

  res.json(rows.map(toSyncJob));
});

router.get("/integrations/:id/errors", async (req, res) => {
  const rows = await db
    .select()
    .from(syncJobsTable)
    .where(eq(syncJobsTable.integrationId, req.params.id))
    .orderBy(desc(syncJobsTable.createdAt))
    .limit(20);

  const errors = rows.flatMap((row) =>
    row.errors.map((message) => ({ jobId: row.id, occurredAt: row.completedAt ?? row.startedAt, message })),
  );

  res.json(errors);
});

router.get("/external-events", async (req, res) => {
  const { provider } = req.query;
  const limitParam = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : NaN;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100;

  const conditions = [];
  if (typeof provider === "string") conditions.push(eq(externalEventsTable.provider, provider));

  const baseQuery = db.select().from(externalEventsTable);
  const rows = await (conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery)
    .orderBy(desc(externalEventsTable.createdAt))
    .limit(limit);

  res.json(rows.map(toExternalEvent));
});

// ---------------------------------------------------------------------------
// POST /ingest/website
//
// Module 2's live path: a webhook-style endpoint (still behind the standard
// token guard for now) that accepts a single website event payload and runs
// it through ingestion as provider "website". Auto-provisions the "website"
// integration row on first use so it shows up in the Integration Center.
// ---------------------------------------------------------------------------
const IngestWebsiteBody = z.object({
  page: z.string().optional(),
  url: z.string().optional(),
  eventType: z.string().optional(),
  type: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  leadId: z.string().nullable().optional(),
  email: z.string().optional(),
  formName: z.string().optional(),
  asset: z.string().optional(),
  externalId: z.string().optional(),
  occurredAt: z.string().optional(),
});

router.post("/ingest/website", async (req, res) => {
  const parsed = IngestWebsiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid website event payload" });
    return;
  }

  let integrationRows = await db
    .select()
    .from(integrationsTable)
    .where(eq(integrationsTable.providerKey, "website"))
    .limit(1);

  if (integrationRows.length === 0) {
    const now = new Date().toISOString();
    const countRow = await db.select({ count: sql<number>`count(*)` }).from(integrationsTable);
    const id = `INTG-${100 + Number(countRow[0]?.count ?? 0)}`;
    integrationRows = await db
      .insert(integrationsTable)
      .values({
        id,
        providerKey: "website",
        category: "analytics",
        displayName: "Website",
        status: "connected",
        config: {},
        credentialsReference: null,
        createdAt: now,
      })
      .returning();
  }

  const integration = integrationRows[0]!;
  const body = parsed.data;

  const rawRecord = {
    externalId: body.externalId ?? `WEB-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: body.type ?? body.eventType ?? "page_view",
    page: body.page,
    url: body.url,
    utm_source: body.utm_source,
    utm_medium: body.utm_medium,
    utm_campaign: body.utm_campaign,
    leadId: body.leadId ?? undefined,
    email: body.email,
    formName: body.formName,
    asset: body.asset,
    occurredAt: body.occurredAt,
  };

  const summary = await ingestExternalRecords("website", integration.id, [rawRecord]);
  res.status(201).json(summary);
});

export default router;
