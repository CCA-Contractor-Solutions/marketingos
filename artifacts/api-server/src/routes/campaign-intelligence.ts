import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  db,
  campaignIntelligenceTable,
  leadsTable,
  conversionsTable,
  type CampaignIntelligenceRow,
} from "@workspace/db";

const router: IRouter = Router();

const UpsertCampaignIntelligenceBody = z.object({
  objective: z.string().optional(),
  audience: z.string().optional(),
  service: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().optional(),
  ownerName: z.string().optional(),
  channels: z.array(z.string()).optional(),
});

function toCampaignIntelligence(row: CampaignIntelligenceRow) {
  return {
    campaignId: row.campaignId,
    objective: row.objective,
    audience: row.audience,
    service: row.service,
    industry: row.industry,
    location: row.location,
    budget: row.budget,
    ownerName: row.ownerName,
    leadsGenerated: row.leadsGenerated,
    qualifiedLeads: row.qualifiedLeads,
    customers: row.customers,
    revenue: row.revenue,
    roi: row.roi,
    channels: row.channels,
  };
}

async function computeCampaignRollup(campaignId: string) {
  const [leads, conversions] = await Promise.all([
    db.select().from(leadsTable),
    db.select().from(conversionsTable),
  ]);

  const campaignLeads = leads.filter(
    (lead) =>
      lead.firstTouchCampaign === campaignId ||
      lead.lastTouchCampaign === campaignId ||
      (lead.campaigns ?? []).includes(campaignId),
  );

  const leadsGenerated = campaignLeads.length;
  const qualifiedLeads = campaignLeads.filter((l) => l.qualified).length;
  const customers = campaignLeads.filter((l) => l.isCustomer).length;

  const campaignLeadIds = new Set(campaignLeads.map((l) => l.id));
  const revenue = conversions
    .filter((c) => c.campaign === campaignId || campaignLeadIds.has(c.leadId))
    .reduce((sum, c) => sum + c.amount, 0);

  return { leadsGenerated, qualifiedLeads, customers, revenue };
}

router.get("/campaign-intelligence", async (_req, res) => {
  const rows = await db.select().from(campaignIntelligenceTable);
  res.json(rows.map(toCampaignIntelligence));
});

router.get("/campaign-intelligence/:campaignId", async (req, res) => {
  const rows = await db
    .select()
    .from(campaignIntelligenceTable)
    .where(eq(campaignIntelligenceTable.campaignId, req.params.campaignId))
    .limit(1);

  if (rows.length === 0) {
    res.status(404).json({ error: "Campaign intelligence not found" });
    return;
  }

  res.json(toCampaignIntelligence(rows[0]!));
});

router.put("/campaign-intelligence/:campaignId", async (req, res) => {
  const parsed = UpsertCampaignIntelligenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid campaign intelligence input" });
    return;
  }
  const body = parsed.data;
  const campaignId = req.params.campaignId;

  const rollup = await computeCampaignRollup(campaignId);
  const roi = rollup.revenue > 0 && body.budget && body.budget > 0
    ? (rollup.revenue - body.budget) / body.budget
    : null;

  const existing = await db
    .select()
    .from(campaignIntelligenceTable)
    .where(eq(campaignIntelligenceTable.campaignId, campaignId))
    .limit(1);

  const values = {
    campaignId,
    objective: body.objective ?? existing[0]?.objective ?? "",
    audience: body.audience ?? existing[0]?.audience ?? "",
    service: body.service ?? existing[0]?.service ?? "",
    industry: body.industry ?? existing[0]?.industry ?? "",
    location: body.location ?? existing[0]?.location ?? "",
    budget: body.budget ?? existing[0]?.budget ?? 0,
    ownerName: body.ownerName ?? existing[0]?.ownerName ?? "",
    channels: body.channels ?? existing[0]?.channels ?? [],
    leadsGenerated: rollup.leadsGenerated,
    qualifiedLeads: rollup.qualifiedLeads,
    customers: rollup.customers,
    revenue: rollup.revenue,
    roi,
  };

  const upserted = await db
    .insert(campaignIntelligenceTable)
    .values(values)
    .onConflictDoUpdate({ target: campaignIntelligenceTable.campaignId, set: values })
    .returning();

  res.json(toCampaignIntelligence(upserted[0]!));
});

export default router;
