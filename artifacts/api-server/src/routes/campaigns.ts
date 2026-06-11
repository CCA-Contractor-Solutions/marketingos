import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import { toCampaignSummary, toCampaignDetail } from "../lib/content";

const router: IRouter = Router();

router.get("/campaigns", async (_req, res) => {
  const rows = await db
    .select()
    .from(campaignsTable)
    .orderBy(asc(campaignsTable.sortOrder));
  res.json(rows.map(toCampaignSummary));
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
