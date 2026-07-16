import type { CampaignIntelligenceRow, LeadRow, MarketingEventRow } from "@workspace/db";
import { computeConfidence, sourceReliability, type ConfidenceResult } from "../confidence";

// ---------------------------------------------------------------------------
// Phase 5 — Module 4: Content Intelligence.
//
// identifyContentOpportunities(events, campaigns, leads) finds two kinds of
// opportunity from real engagement data, deterministically:
//
// 1. HIGH-PERFORMING TOPICS — content_download events carry a content
//    name/asset in metadata (see journey.ts's contentConsumed derivation:
//    metadata["contentName"] or metadata["asset"]). We count downloads per
//    content name and treat the top performer(s) as evidence of what
//    resonates.
//
// 2. GAPS — industries with real lead demand (>= MIN_DEMAND_LEADS leads)
//    but NO analogous content engagement recorded (no content_download
//    event whose content name mentions that industry, and no campaign
//    tagged with that industry that has content assets). For each gap, we
//    recommend creating content modeled on the single best-performing piece
//    found in step 1 — e.g. "Create an electrical contractor licensing
//    guide — analogous HVAC guide drove 4x engagement", matching the spec's
//    canonical example exactly in spirit.
//
// signalStrength is folded into `confidence` here (the spec only asks for
// confidence + projectedImpact for this module, unlike market_opportunities
// which also has signalStrength) — projectedImpact is a short natural-
// language multiplier string, not a table column, and is intentionally
// qualitative/templated (NOT computed by an LLM).
// ---------------------------------------------------------------------------

export type ContentOpportunity = {
  topic: string;
  rationale: string;
  basedOn: Record<string, unknown>;
  projectedImpact: string;
  confidence: ConfidenceResult;
};

const MIN_DEMAND_LEADS = 3;
const MIN_CONTENT_SAMPLES = 2;

function contentNameFromEvent(event: MarketingEventRow): string | null {
  const name = event.metadata?.["contentName"] ?? event.metadata?.["asset"];
  return typeof name === "string" && name.length > 0 ? name : null;
}

/**
 * identifyContentOpportunities — pure function over already-fetched rows.
 * `campaigns` is the campaign_intelligence rollup (has `industry` +
 * `channels`), used only to help label gap industries with a bit more
 * campaign context when available; not required for the core signal.
 */
export function identifyContentOpportunities(
  events: MarketingEventRow[],
  campaigns: CampaignIntelligenceRow[],
  leads: LeadRow[],
): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  // --- Step 1: engagement per content asset. ---
  const engagementByContent = new Map<string, number>();
  for (const event of events) {
    if (event.eventType !== "content_download") continue;
    const name = contentNameFromEvent(event);
    if (!name) continue;
    engagementByContent.set(name, (engagementByContent.get(name) ?? 0) + 1);
  }

  const rankedContent = [...engagementByContent.entries()].sort((a, b) => b[1] - a[1]);
  const topContent = rankedContent[0];
  const avgEngagement =
    rankedContent.length > 0
      ? rankedContent.reduce((sum, [, count]) => sum + count, 0) / rankedContent.length
      : 0;

  if (topContent && topContent[1] >= MIN_CONTENT_SAMPLES) {
    const [name, count] = topContent;
    const multiplier = avgEngagement > 0 ? count / avgEngagement : 1;
    const confidence = computeConfidence({ sampleSize: count, sourceReliability: sourceReliability("website") });
    opportunities.push({
      topic: `Double down on "${name}"-style content`,
      rationale: `"${name}" drove ${count} downloads (${multiplier.toFixed(1)}x the average content asset). Produce follow-on or adjacent content in the same format/topic.`,
      basedOn: { topContent: name, downloads: count, averageDownloads: avgEngagement, multiplier },
      projectedImpact: `Comparable engagement to "${name}" (~${count} downloads) if distributed through the same channels.`,
      confidence,
    });
  }

  // --- Step 2: demand-without-content gaps by industry. ---
  const leadsByIndustry = new Map<string, number>();
  for (const lead of leads) {
    const industry = lead.industry || "";
    if (!industry) continue;
    leadsByIndustry.set(industry, (leadsByIndustry.get(industry) ?? 0) + 1);
  }

  // An industry "has content" if any content_download's content name
  // mentions it (case-insensitive), or a campaign tagged with that industry
  // has recorded engagement.
  const industriesWithCampaignActivity = new Set(
    campaigns.filter((c) => c.industry && c.leadsGenerated > 0).map((c) => c.industry.toLowerCase()),
  );

  for (const [industry, leadCount] of leadsByIndustry) {
    if (leadCount < MIN_DEMAND_LEADS) continue;

    const industryLower = industry.toLowerCase();
    const hasNamedContent = [...engagementByContent.keys()].some((name) => name.toLowerCase().includes(industryLower));
    const hasCampaignContent = industriesWithCampaignActivity.has(industryLower);
    if (hasNamedContent || hasCampaignContent) continue; // not a gap

    const reliability = sourceReliability("website");
    const confidence = computeConfidence({ sampleSize: leadCount, sourceReliability: reliability });

    if (topContent) {
      const [analogName, analogCount] = topContent;
      const multiplier = avgEngagement > 0 ? analogCount / avgEngagement : 1;
      opportunities.push({
        topic: `Create ${industry.toLowerCase()} content — no analogous asset exists yet`,
        rationale: `${leadCount} leads in ${industry} have no matching content asset or campaign, while "${analogName}" content in a comparable category drove ${analogCount} downloads (${multiplier.toFixed(1)}x average engagement). Model a new ${industry} piece on that format.`,
        basedOn: { industry, leadsWithoutContent: leadCount, analogousContent: analogName, analogousDownloads: analogCount, multiplier },
        projectedImpact: `Potential ${multiplier.toFixed(1)}x engagement lift versus baseline content if the "${analogName}" format is replicated for ${industry}.`,
        confidence,
      });
    } else {
      opportunities.push({
        topic: `Create ${industry.toLowerCase()} content — no analogous asset exists yet`,
        rationale: `${leadCount} leads in ${industry} have no matching content asset or campaign recorded yet. No analogous high-performing content exists yet to model from — treat this as a lower-confidence, exploratory recommendation.`,
        basedOn: { industry, leadsWithoutContent: leadCount },
        projectedImpact: "Impact cannot be projected from historical analogues yet — track engagement after publishing.",
        confidence,
      });
    }
  }

  return opportunities;
}
