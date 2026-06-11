import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import { CreateCampaignBody } from "@workspace/api-zod";
import { toCampaignSummary, toCampaignDetail } from "../lib/content";

const router: IRouter = Router();

const OWNER_COLORS = [
  "linear-gradient(135deg,#4f46e5,#7c3aed)",
  "linear-gradient(135deg,#0ea5e9,#2563eb)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
];

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

router.get("/campaigns", async (_req, res) => {
  const rows = await db
    .select()
    .from(campaignsTable)
    .orderBy(asc(campaignsTable.sortOrder));
  res.json(rows.map(toCampaignSummary));
});

router.post("/campaigns", async (req, res) => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid campaign input" });
    return;
  }
  const body = parsed.data;

  const aggRow = await db
    .select({
      max: sql<number>`coalesce(max(${campaignsTable.sortOrder}), -1)`,
      count: sql<number>`count(*)`,
    })
    .from(campaignsTable);
  const nextOrder = (aggRow[0]?.max ?? -1) + 1;
  const id = `CMP-${100 + Number(aggRow[0]?.count ?? 0)}`;
  const ownerColor = OWNER_COLORS[nextOrder % OWNER_COLORS.length]!;

  const inserted = await db
    .insert(campaignsTable)
    .values({
      id,
      name: body.name,
      subtitle: body.subtitle ?? "",
      ownerName: body.owner,
      ownerInitials: initialsFromName(body.owner),
      ownerColor,
      status: "pending",
      statusColor: "var(--c-amber)",
      progress: 0,
      budgetTotal: body.budgetTotal ?? 0,
      budgetSpent: 0,
      sortOrder: nextOrder,
      channels: body.channels ?? [],
    })
    .returning();

  res.status(201).json(toCampaignSummary(inserted[0]!));
});

router.get("/campaigns/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, req.params.id))
    .limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(toCampaignDetail(rows[0]!));
});

router.post("/campaigns/:id/approve", async (req, res) => {
  const updated = await db
    .update(campaignsTable)
    .set({ status: "approved", statusColor: "var(--c-emerald)" })
    .where(eq(campaignsTable.id, req.params.id))
    .returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(toCampaignDetail(updated[0]!));
});

export default router;
