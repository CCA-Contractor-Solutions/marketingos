import { Router, type IRouter } from "express";
import { z } from "zod";
import { asc, sql } from "drizzle-orm";
import {
  db,
  channelsTable,
  leadsTable,
  marketingEventsTable,
  conversionsTable,
  campaignsTable,
  type ChannelRow,
} from "@workspace/db";
import { computeChannelIntelligence } from "../lib/intelligence/channels";

const router: IRouter = Router();

const CHANNEL_CATEGORIES = [
  "paid",
  "organic",
  "social",
  "referral",
  "direct",
  "email",
  "events",
  "partnerships",
] as const;

const CreateChannelBody = z.object({
  name: z.string().min(1),
  category: z.enum(CHANNEL_CATEGORIES),
  active: z.boolean().optional(),
});

function toChannel(row: ChannelRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    active: row.active,
  };
}

router.get("/channels", async (_req, res) => {
  const rows = await db.select().from(channelsTable).orderBy(asc(channelsTable.name));
  res.json(rows.map(toChannel));
});

router.post("/channels", async (req, res) => {
  const parsed = CreateChannelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid channel input" });
    return;
  }
  const body = parsed.data;

  const countRow = await db.select({ count: sql<number>`count(*)` }).from(channelsTable);
  const id = `CH-${100 + Number(countRow[0]?.count ?? 0)}`;

  const inserted = await db
    .insert(channelsTable)
    .values({ id, name: body.name, category: body.category, active: body.active ?? true })
    .returning();

  res.status(201).json(toChannel(inserted[0]!));
});

router.get("/channels/intelligence", async (_req, res) => {
  const [channels, leads, events, conversions, campaigns] = await Promise.all([
    db.select().from(channelsTable),
    db.select().from(leadsTable),
    db.select().from(marketingEventsTable),
    db.select().from(conversionsTable),
    db.select().from(campaignsTable),
  ]);

  // Derive a rough spend-by-channel map from campaign budgets when a
  // campaign's channels[] includes the channel name. This is a best-effort
  // signal — spend is 0 (and roi null) when no campaign budget data ties to
  // the channel.
  const spendByChannelName: Record<string, number> = {};
  for (const campaign of campaigns) {
    const channelsForCampaign = campaign.channels ?? [];
    if (channelsForCampaign.length === 0) continue;
    const share = campaign.budgetSpent / channelsForCampaign.length;
    for (const channelName of channelsForCampaign) {
      spendByChannelName[channelName] = (spendByChannelName[channelName] ?? 0) + share;
    }
  }

  const report = computeChannelIntelligence(channels, leads, events, conversions, spendByChannelName);
  res.json(report);
});

export default router;
