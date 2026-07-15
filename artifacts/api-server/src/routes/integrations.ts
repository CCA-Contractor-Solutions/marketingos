import { Router, type IRouter } from "express";
import { z } from "zod";
import { asc, eq, sql } from "drizzle-orm";
import { db, integrationsTable, type IntegrationRow } from "@workspace/db";
import { CONNECTOR_REGISTRY } from "./integrations/providers";

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
});

const UpdateIntegrationBody = z.object({
  status: z.enum(INTEGRATION_STATUSES).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

function toIntegration(row: IntegrationRow) {
  return {
    id: row.id,
    providerKey: row.providerKey,
    category: row.category,
    displayName: row.displayName,
    status: row.status,
    config: row.config,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    connectorAvailable: Boolean(CONNECTOR_REGISTRY[row.providerKey]),
  };
}

router.get("/integrations", async (_req, res) => {
  const rows = await db.select().from(integrationsTable).orderBy(asc(integrationsTable.displayName));
  res.json(rows.map(toIntegration));
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
      createdAt: now,
    })
    .returning();

  res.status(201).json(toIntegration(inserted[0]!));
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

  const updated = await db
    .update(integrationsTable)
    .set(update)
    .where(eq(integrationsTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Integration not found" });
    return;
  }
  res.json(toIntegration(updated[0]!));
});

export default router;
