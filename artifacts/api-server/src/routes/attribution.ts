import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, revenueAttributionTable, type RevenueAttributionRow } from "@workspace/db";

const router: IRouter = Router();

function toAttribution(row: RevenueAttributionRow) {
  return {
    id: row.id,
    conversionId: row.conversionId,
    leadId: row.leadId,
    model: row.model,
    channel: row.channel,
    campaign: row.campaign,
    weight: row.weight,
    attributedAmount: row.attributedAmount,
    computedAt: row.computedAt,
  };
}

router.get("/attribution/summary", async (_req, res) => {
  const rows = await db.select().from(revenueAttributionTable);

  type Bucket = { revenue: number; count: number };
  const byModel = new Map<string, Bucket>();
  const byChannel = new Map<string, Bucket>();
  const byCampaign = new Map<string, Bucket>();

  function bump(map: Map<string, Bucket>, key: string, amount: number) {
    const bucket = map.get(key) ?? { revenue: 0, count: 0 };
    bucket.revenue += amount;
    bucket.count += 1;
    map.set(key, bucket);
  }

  for (const row of rows) {
    bump(byModel, row.model, row.attributedAmount);
    bump(byChannel, row.channel, row.attributedAmount);
    if (row.campaign) bump(byCampaign, row.campaign, row.attributedAmount);
  }

  function toArray(map: Map<string, Bucket>, keyName: string) {
    return Array.from(map.entries())
      .map(([key, bucket]) => ({ [keyName]: key, revenue: bucket.revenue, attributions: bucket.count }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  res.json({
    byModel: toArray(byModel, "model"),
    byChannel: toArray(byChannel, "channel"),
    byCampaign: toArray(byCampaign, "campaign"),
  });
});

router.get("/attribution/lead/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(revenueAttributionTable)
    .where(eq(revenueAttributionTable.leadId, req.params.id));

  res.json(rows.map(toAttribution));
});

export default router;
