import { Router, type IRouter } from "express";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  aiRecommendationsTable,
  leadsTable,
  conversionsTable,
  channelsTable,
  marketingEventsTable,
  type AiRecommendationRow,
} from "@workspace/db";

const router: IRouter = Router();

const RECOMMENDATION_STATUSES = ["new", "reviewed", "applied", "dismissed"] as const;

const UpdateRecommendationBody = z.object({
  status: z.enum(RECOMMENDATION_STATUSES),
});

function toRecommendation(row: AiRecommendationRow) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    confidence: row.confidence,
    dataBasis: row.dataBasis,
    status: row.status,
    createdAt: row.createdAt,
  };
}

router.get("/recommendations", async (_req, res) => {
  const rows = await db.select().from(aiRecommendationsTable).orderBy(desc(aiRecommendationsTable.createdAt));
  res.json(rows.map(toRecommendation));
});

type GeneratedRecommendation = {
  category: "campaign" | "channel" | "segment" | "market" | "general";
  title: string;
  body: string;
  confidence: number;
  dataBasis: Record<string, unknown>;
};

// -----------------------------------------------------------------------
// Rule-based recommendation generation (foundation). Computes a handful of
// insights directly from real lead/conversion/channel data. This is
// deliberately simple and deterministic so it is demonstrable without an
// LLM call. `generateWithLLM` below is a clearly-marked hook for a future
// upgrade that is NOT required to run.
// -----------------------------------------------------------------------
async function generateRuleBasedRecommendations(): Promise<GeneratedRecommendation[]> {
  const [leads, conversions, channels] = await Promise.all([
    db.select().from(leadsTable),
    db.select().from(conversionsTable),
    db.select().from(channelsTable),
  ]);

  const recommendations: GeneratedRecommendation[] = [];

  // 1. Conversion rate by industry.
  const industryTotals = new Map<string, { leads: number; customers: number }>();
  for (const lead of leads) {
    const industry = lead.industry || "Unspecified";
    const bucket = industryTotals.get(industry) ?? { leads: 0, customers: 0 };
    bucket.leads += 1;
    if (lead.isCustomer) bucket.customers += 1;
    industryTotals.set(industry, bucket);
  }
  let bestIndustry: { industry: string; rate: number; leads: number } | null = null;
  for (const [industry, bucket] of industryTotals) {
    if (bucket.leads < 2) continue;
    const rate = bucket.customers / bucket.leads;
    if (!bestIndustry || rate > bestIndustry.rate) {
      bestIndustry = { industry, rate, leads: bucket.leads };
    }
  }
  if (bestIndustry && bestIndustry.rate > 0) {
    recommendations.push({
      category: "segment",
      title: `${bestIndustry.industry} leads convert best`,
      body: `${bestIndustry.industry} leads convert at ${(bestIndustry.rate * 100).toFixed(0)}% based on ${bestIndustry.leads} leads. Consider prioritizing outreach and budget toward this segment.`,
      confidence: Math.min(0.5 + bestIndustry.leads / 20, 0.95),
      dataBasis: { industry: bestIndustry.industry, conversionRate: bestIndustry.rate, sampleSize: bestIndustry.leads },
    });
  }

  // 2. Channel revenue vs lead volume.
  const channelTotals = new Map<string, { leads: number; revenue: number }>();
  const leadChannel = new Map(leads.map((l) => [l.id, l.firstTouchChannel]));
  for (const lead of leads) {
    if (!lead.firstTouchChannel) continue;
    const bucket = channelTotals.get(lead.firstTouchChannel) ?? { leads: 0, revenue: 0 };
    bucket.leads += 1;
    channelTotals.set(lead.firstTouchChannel, bucket);
  }
  for (const conversion of conversions) {
    const channel = conversion.channel ?? leadChannel.get(conversion.leadId) ?? undefined;
    if (!channel) continue;
    const bucket = channelTotals.get(channel) ?? { leads: 0, revenue: 0 };
    bucket.revenue += conversion.amount;
    channelTotals.set(channel, bucket);
  }
  let bestRevenuePerLead: { channel: string; revenuePerLead: number; leads: number; revenue: number } | null = null;
  for (const [channel, bucket] of channelTotals) {
    if (bucket.leads === 0) continue;
    const revenuePerLead = bucket.revenue / bucket.leads;
    if (!bestRevenuePerLead || revenuePerLead > bestRevenuePerLead.revenuePerLead) {
      bestRevenuePerLead = { channel, revenuePerLead, leads: bucket.leads, revenue: bucket.revenue };
    }
  }
  if (bestRevenuePerLead && bestRevenuePerLead.revenue > 0) {
    recommendations.push({
      category: "channel",
      title: `${bestRevenuePerLead.channel} delivers the most revenue per lead`,
      body: `${bestRevenuePerLead.channel} generated $${bestRevenuePerLead.revenue.toLocaleString()} in revenue from ${bestRevenuePerLead.leads} leads (~$${Math.round(bestRevenuePerLead.revenuePerLead).toLocaleString()}/lead). Consider increasing investment in this channel relative to lower-yield channels.`,
      confidence: Math.min(0.5 + bestRevenuePerLead.leads / 20, 0.9),
      dataBasis: {
        channel: bestRevenuePerLead.channel,
        revenue: bestRevenuePerLead.revenue,
        leads: bestRevenuePerLead.leads,
      },
    });
  }

  // 3. Top-performing location.
  const locationTotals = new Map<string, { leads: number; customers: number }>();
  for (const lead of leads) {
    const location = lead.location || "Unspecified";
    const bucket = locationTotals.get(location) ?? { leads: 0, customers: 0 };
    bucket.leads += 1;
    if (lead.isCustomer) bucket.customers += 1;
    locationTotals.set(location, bucket);
  }
  let bestLocation: { location: string; rate: number; leads: number } | null = null;
  for (const [location, bucket] of locationTotals) {
    if (bucket.leads < 2) continue;
    const rate = bucket.customers / bucket.leads;
    if (!bestLocation || rate > bestLocation.rate) {
      bestLocation = { location, rate, leads: bucket.leads };
    }
  }
  if (bestLocation && bestLocation.rate > 0) {
    recommendations.push({
      category: "market",
      title: `${bestLocation.location} is the top-performing location`,
      body: `Leads from ${bestLocation.location} convert at ${(bestLocation.rate * 100).toFixed(0)}% across ${bestLocation.leads} leads. Consider expanding marketing spend targeting this location.`,
      confidence: Math.min(0.5 + bestLocation.leads / 20, 0.9),
      dataBasis: { location: bestLocation.location, conversionRate: bestLocation.rate, sampleSize: bestLocation.leads },
    });
  }

  // 4. Channels with active status but zero recorded events (coverage gap).
  const allEvents = await db.select().from(marketingEventsTable);
  const eventChannels = new Set(allEvents.map((r) => r.channel).filter((c): c is string => !!c));
  const inactiveChannel = channels.find((c) => c.active && !eventChannels.has(c.name));
  if (inactiveChannel) {
    recommendations.push({
      category: "channel",
      title: `${inactiveChannel.name} has no recorded engagement`,
      body: `${inactiveChannel.name} is marked active but has zero tracked marketing events. Verify tracking is wired up or consider pausing spend until it is.`,
      confidence: 0.6,
      dataBasis: { channel: inactiveChannel.name },
    });
  }

  // -------------------------------------------------------------------------
  // Phase 4 — signals derived from INGESTED external data (marketing_events
  // created by connectors: source/campaign metadata, campaign_interaction
  // spend, phone_call outcomes, etc.). These only fire when ingested data is
  // actually present, so demo installs with no connected integrations still
  // get the four insights above unchanged.
  // -------------------------------------------------------------------------

  // 5. Source conversion multiplier: leads whose first-touch `source` (from
  // ingested events, e.g. GA4/website "google"/"organic") convert at N times
  // the overall average — surfaces the spec's canonical example ("Google
  // search traffic for multi-state licensing produces customers at 2.8x the
  // average conversion rate").
  const eventSourceByLead = new Map<string, string>();
  for (const event of allEvents) {
    if (!event.leadId || !event.source) continue;
    if (!eventSourceByLead.has(event.leadId)) eventSourceByLead.set(event.leadId, event.source);
  }

  const overallConversionRate = leads.length > 0 ? leads.filter((l) => l.isCustomer).length / leads.length : 0;

  if (overallConversionRate > 0) {
    const sourceTotals = new Map<string, { leads: number; customers: number; campaign: string | null }>();
    for (const lead of leads) {
      const source = eventSourceByLead.get(lead.id);
      if (!source) continue;
      const bucket = sourceTotals.get(source) ?? { leads: 0, customers: 0, campaign: lead.firstTouchCampaign };
      bucket.leads += 1;
      if (lead.isCustomer) bucket.customers += 1;
      sourceTotals.set(source, bucket);
    }

    let bestSource: { source: string; rate: number; multiplier: number; leads: number; campaign: string | null } | null = null;
    for (const [source, bucket] of sourceTotals) {
      if (bucket.leads < 2) continue;
      const rate = bucket.customers / bucket.leads;
      const multiplier = overallConversionRate > 0 ? rate / overallConversionRate : 0;
      if (multiplier > 1.2 && (!bestSource || multiplier > bestSource.multiplier)) {
        bestSource = { source, rate, multiplier, leads: bucket.leads, campaign: bucket.campaign };
      }
    }

    if (bestSource) {
      const campaignPhrase = bestSource.campaign ? ` for ${bestSource.campaign}` : "";
      recommendations.push({
        category: "channel",
        title: `${bestSource.source} traffic${campaignPhrase} converts at ${bestSource.multiplier.toFixed(1)}x the average`,
        body: `Leads sourced from "${bestSource.source}"${campaignPhrase} convert at ${(bestSource.rate * 100).toFixed(0)}% versus an overall average of ${(overallConversionRate * 100).toFixed(0)}% (${bestSource.leads} leads analyzed) — a ${bestSource.multiplier.toFixed(1)}x lift. Consider shifting incremental budget toward this source.`,
        confidence: Math.min(0.55 + bestSource.leads / 20, 0.92),
        dataBasis: {
          source: bestSource.source,
          campaign: bestSource.campaign,
          conversionRate: bestSource.rate,
          overallConversionRate,
          multiplier: bestSource.multiplier,
          sampleSize: bestSource.leads,
        },
      });
    }
  }

  // 6. Spend-vs-revenue: campaign_interaction events carry `spend` in
  // metadata (from ad-platform connectors: google_ads/meta_ads/linkedin_ads).
  // Roll spend up by campaign and compare against attributed conversion
  // revenue for that campaign to flag efficiency (revenue < spend) or
  // strong ROI (revenue >> spend).
  const spendByCampaign = new Map<string, number>();
  for (const event of allEvents) {
    if (event.eventType !== "campaign_interaction" || !event.campaign) continue;
    const spend = event.metadata?.["spend"];
    if (typeof spend === "number" && Number.isFinite(spend)) {
      spendByCampaign.set(event.campaign, (spendByCampaign.get(event.campaign) ?? 0) + spend);
    }
  }

  if (spendByCampaign.size > 0) {
    const revenueByCampaign = new Map<string, number>();
    const leadCampaigns = new Map(leads.map((l) => [l.id, l.firstTouchCampaign]));
    for (const conversion of conversions) {
      const campaign = conversion.campaign ?? leadCampaigns.get(conversion.leadId) ?? undefined;
      if (!campaign) continue;
      revenueByCampaign.set(campaign, (revenueByCampaign.get(campaign) ?? 0) + conversion.amount);
    }

    let bestRoiCampaign: { campaign: string; spend: number; revenue: number; roi: number } | null = null;
    let worstRoiCampaign: { campaign: string; spend: number; revenue: number; roi: number } | null = null;
    for (const [campaign, spend] of spendByCampaign) {
      if (spend <= 0) continue;
      const revenue = revenueByCampaign.get(campaign) ?? 0;
      const roi = (revenue - spend) / spend;
      if (!bestRoiCampaign || roi > bestRoiCampaign.roi) bestRoiCampaign = { campaign, spend, revenue, roi };
      if (!worstRoiCampaign || roi < worstRoiCampaign.roi) worstRoiCampaign = { campaign, spend, revenue, roi };
    }

    if (bestRoiCampaign && bestRoiCampaign.revenue > 0) {
      recommendations.push({
        category: "campaign",
        title: `${bestRoiCampaign.campaign} returns $${(bestRoiCampaign.revenue / Math.max(bestRoiCampaign.spend, 1)).toFixed(2)} per ad dollar`,
        body: `${bestRoiCampaign.campaign} generated $${bestRoiCampaign.revenue.toLocaleString()} in attributed revenue against $${bestRoiCampaign.spend.toLocaleString()} in ingested ad spend (${(bestRoiCampaign.roi * 100).toFixed(0)}% ROI). Consider increasing budget while performance holds.`,
        confidence: 0.75,
        dataBasis: { campaign: bestRoiCampaign.campaign, spend: bestRoiCampaign.spend, revenue: bestRoiCampaign.revenue, roi: bestRoiCampaign.roi },
      });
    }

    if (worstRoiCampaign && worstRoiCampaign.roi < 0 && worstRoiCampaign.campaign !== bestRoiCampaign?.campaign) {
      recommendations.push({
        category: "campaign",
        title: `${worstRoiCampaign.campaign} is spending more than it returns`,
        body: `${worstRoiCampaign.campaign} has $${worstRoiCampaign.spend.toLocaleString()} in ingested ad spend but only $${worstRoiCampaign.revenue.toLocaleString()} in attributed revenue (${(worstRoiCampaign.roi * 100).toFixed(0)}% ROI). Review targeting/creative or reduce budget.`,
        confidence: 0.7,
        dataBasis: { campaign: worstRoiCampaign.campaign, spend: worstRoiCampaign.spend, revenue: worstRoiCampaign.revenue, roi: worstRoiCampaign.roi },
      });
    }
  }

  // 7. Phone call outcomes: CallRail/RingCentral calls carry a `callOutcome`
  // in metadata. Surface a strong qualified/converted rate as a channel
  // insight ("phone follow-up converts calls at X%").
  const callEvents = allEvents.filter((e) => e.eventType === "phone_call");
  if (callEvents.length >= 2) {
    const converted = callEvents.filter((e) => e.metadata?.["callOutcome"] === "converted").length;
    const qualified = callEvents.filter((e) => e.metadata?.["callOutcome"] === "qualified").length;
    const rate = (converted + qualified) / callEvents.length;
    if (rate > 0) {
      recommendations.push({
        category: "channel",
        title: `Phone follow-up is converting ${(rate * 100).toFixed(0)}% of tracked calls`,
        body: `Of ${callEvents.length} tracked calls, ${qualified} were marked qualified and ${converted} converted directly (${(rate * 100).toFixed(0)}% combined). Prioritize fast follow-up on inbound calls from paid campaigns.`,
        confidence: Math.min(0.5 + callEvents.length / 10, 0.85),
        dataBasis: { totalCalls: callEvents.length, qualified, converted, rate },
      });
    }
  }

  return recommendations;
}

// -----------------------------------------------------------------------
// HOOK (not required to run): a future upgrade path that calls the existing
// OpenAI client (see routes/assistant.ts for the `openai` import pattern) to
// synthesize natural-language recommendations from the same underlying data.
// Exported but never invoked by any route today — left as a clearly-marked
// extension point for a later phase.
// -----------------------------------------------------------------------
export async function generateWithLLM(): Promise<GeneratedRecommendation[]> {
  // Future implementation would: fetch leads/channels/conversions (as above),
  // build a prompt, call `openai.chat.completions.create(...)`, and parse a
  // structured JSON response into GeneratedRecommendation[]. Not required to
  // run for Phase 2 — the rule-based generator above is the active path.
  throw new Error("generateWithLLM is a future-upgrade hook and is not implemented yet.");
}

router.post("/recommendations/generate", async (_req, res) => {
  const generated = await generateRuleBasedRecommendations();

  if (generated.length === 0) {
    res.json([]);
    return;
  }

  const now = new Date().toISOString();
  const countRow = await db.select({ count: sql<number>`count(*)` }).from(aiRecommendationsTable);
  let offset = Number(countRow[0]?.count ?? 0);

  const rows = generated.map((rec) => ({
    id: `REC-${1000 + offset++}`,
    category: rec.category,
    title: rec.title,
    body: rec.body,
    confidence: rec.confidence,
    dataBasis: rec.dataBasis,
    status: "new" as const,
    createdAt: now,
  }));

  const inserted = await db.insert(aiRecommendationsTable).values(rows).returning();
  res.status(201).json(inserted.map(toRecommendation));
});

router.patch("/recommendations/:id", async (req, res) => {
  const parsed = UpdateRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid recommendation update" });
    return;
  }

  const updated = await db
    .update(aiRecommendationsTable)
    .set({ status: parsed.data.status })
    .where(eq(aiRecommendationsTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }
  res.json(toRecommendation(updated[0]!));
});

export default router;
