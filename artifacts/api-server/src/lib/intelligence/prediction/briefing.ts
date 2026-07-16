import type {
  BriefingAction,
  BriefingOpportunity,
  BriefingRisk,
  BriefingWin,
  LeadRow,
} from "@workspace/db";
import type { ChannelIntelligence } from "../channels";
import type { LeadConversionPrediction } from "./leadConversion";
import type { BudgetShiftRecommendation } from "./budgetIntelligence";
import type { MarketOpportunity } from "./marketOpportunity";
import type { ContentOpportunity } from "./contentIntelligence";

// ---------------------------------------------------------------------------
// Phase 5 — Module 5: Executive Growth Briefing ("Good Morning, Rose").
//
// buildGrowthBriefing(allIntel) assembles wins / risks / opportunities /
// recommendedActions from the outputs of Modules 1-4 (already computed by
// the caller — this module does not fetch anything or run its own model) and
// renders a short natural-language summary via a FIXED TEMPLATE — never an
// LLM call. Every section is bounded (top-N) so the briefing stays a quick
// morning read rather than a data dump.
//
// -----------------------------------------------------------------------
// Sections
// -----------------------------------------------------------------------
// wins: new customers in the period + any high-confidence
//       (band === "high") lead predictions with conversionProbability >=
//       0.6 (framed as "likely to close soon", not a promise).
// risks: channels with roi < 0 (spending more than they return), and leads
//        the leadConversion module flagged as "stale"/cooling in their
//        bestFollowUpReason (going cold without follow-up).
// opportunities: top market opportunity (by signalStrength) + top content
//                opportunity (by confidence.score), if any exist.
// recommendedActions: the single best budget shift (if any), the top 3
//                      leads by conversionProbability that haven't
//                      converted yet, and the top content opportunity.
// -----------------------------------------------------------------------
// The `summary` field is a short templated paragraph — string
// interpolation over the computed sections, NOT a model call.
// ---------------------------------------------------------------------------

export type GrowthBriefingInput = {
  periodLabel: string;
  /** Leads that newly became customers since the last briefing / in-period. */
  newCustomers: LeadRow[];
  /** Latest lead predictions, keyed by leadId, joined with the lead row. */
  leadPredictions: { lead: LeadRow; prediction: LeadConversionPrediction }[];
  channelIntel: ChannelIntelligence[];
  budgetShifts: BudgetShiftRecommendation[];
  marketOpportunities: MarketOpportunity[];
  contentOpportunities: ContentOpportunity[];
};

export type GrowthBriefing = {
  periodLabel: string;
  wins: BriefingWin[];
  risks: BriefingRisk[];
  opportunities: BriefingOpportunity[];
  recommendedActions: BriefingAction[];
  summary: string;
};

const HIGH_PROBABILITY_THRESHOLD = 0.6;
const TOP_LEADS_FOR_ACTION = 3;

export function buildGrowthBriefing(allIntel: GrowthBriefingInput): GrowthBriefing {
  const wins: BriefingWin[] = [];
  const risks: BriefingRisk[] = [];
  const opportunities: BriefingOpportunity[] = [];
  const recommendedActions: BriefingAction[] = [];

  // --- Wins ---
  if (allIntel.newCustomers.length > 0) {
    const revenue = allIntel.newCustomers.reduce((sum, l) => sum + l.revenueGenerated, 0);
    wins.push({
      label: `${allIntel.newCustomers.length} new customer${allIntel.newCustomers.length === 1 ? "" : "s"}`,
      detail: `$${revenue.toLocaleString()} in new revenue from ${allIntel.newCustomers.map((l) => l.companyName).filter(Boolean).slice(0, 5).join(", ") || "recent conversions"}.`,
    });
  }

  const highConfidenceLikely = allIntel.leadPredictions
    .filter(
      (p) =>
        !p.lead.isCustomer &&
        p.prediction.confidence.band === "high" &&
        p.prediction.conversionProbability >= HIGH_PROBABILITY_THRESHOLD,
    )
    .sort((a, b) => b.prediction.conversionProbability - a.prediction.conversionProbability);

  if (highConfidenceLikely.length > 0) {
    const top = highConfidenceLikely[0]!;
    wins.push({
      label: `${highConfidenceLikely.length} lead${highConfidenceLikely.length === 1 ? "" : "s"} likely to close soon`,
      detail: `${top.lead.companyName || top.lead.id} is ${(top.prediction.conversionProbability * 100).toFixed(0)}% likely to convert (high confidence). This is a prediction, not a guarantee.`,
    });
  }

  // --- Risks ---
  const losingChannels = allIntel.channelIntel.filter((c) => c.spend > 0 && c.roi !== null && c.roi < 0);
  for (const channel of losingChannels.slice(0, 3)) {
    risks.push({
      label: `${channel.channelName} is spending more than it returns`,
      detail: `${channel.channelName} has $${channel.spend.toLocaleString()} in spend against $${channel.revenue.toLocaleString()} in attributed revenue (${((channel.roi ?? 0) * 100).toFixed(0)}% ROI).`,
      severity: (channel.roi ?? 0) < -0.5 ? "high" : "medium",
    });
  }

  const staleLeads = allIntel.leadPredictions.filter(
    (p) => !p.lead.isCustomer && /stale|cold|cooling/i.test(p.prediction.bestFollowUpReason),
  );
  if (staleLeads.length > 0) {
    risks.push({
      label: `${staleLeads.length} high-value lead${staleLeads.length === 1 ? "" : "s"} going cold`,
      detail: `${staleLeads
        .slice(0, 3)
        .map((p) => p.lead.companyName || p.lead.id)
        .join(", ")} have not been followed up recently — see Predictive Lead Intelligence for follow-up timing.`,
      severity: staleLeads.length >= 5 ? "high" : "medium",
    });
  }

  // --- Opportunities ---
  const topMarket = [...allIntel.marketOpportunities].sort((a, b) => b.signalStrength - a.signalStrength)[0];
  if (topMarket) {
    opportunities.push({
      label: topMarket.title,
      detail: topMarket.insight,
      sourceId: null,
    });
  }

  const topContent = [...allIntel.contentOpportunities].sort((a, b) => b.confidence.score - a.confidence.score)[0];
  if (topContent) {
    opportunities.push({
      label: topContent.topic,
      detail: topContent.rationale,
      sourceId: null,
    });
  }

  // --- Recommended actions ---
  const topBudgetShift = allIntel.budgetShifts[0];
  if (topBudgetShift) {
    recommendedActions.push({
      label: `Review shifting budget from ${topBudgetShift.fromChannel} to ${topBudgetShift.toChannel}`,
      detail: topBudgetShift.rationale,
      sourceId: null,
    });
  }

  const topLeadsToFollowUp = allIntel.leadPredictions
    .filter((p) => !p.lead.isCustomer)
    .sort((a, b) => b.prediction.conversionProbability - a.prediction.conversionProbability)
    .slice(0, TOP_LEADS_FOR_ACTION);
  for (const p of topLeadsToFollowUp) {
    recommendedActions.push({
      label: `Follow up with ${p.lead.companyName || p.lead.id}`,
      detail: `${(p.prediction.conversionProbability * 100).toFixed(0)}% conversion probability — ${p.prediction.bestFollowUpReason}`,
      sourceId: p.lead.id,
    });
  }

  if (topContent) {
    recommendedActions.push({
      label: `Content: ${topContent.topic}`,
      detail: topContent.projectedImpact,
      sourceId: null,
    });
  }

  // --- Summary (templated, not LLM-generated) ---
  const summaryParts: string[] = [];
  summaryParts.push(`Good morning — here's your ${allIntel.periodLabel} growth briefing.`);
  if (wins.length > 0) {
    summaryParts.push(`${wins.length} win${wins.length === 1 ? "" : "s"} to celebrate, including ${wins[0]!.label.toLowerCase()}.`);
  } else {
    summaryParts.push("No major wins recorded in this period yet.");
  }
  if (risks.length > 0) {
    summaryParts.push(`${risks.length} risk${risks.length === 1 ? "" : "s"} need attention, starting with ${risks[0]!.label.toLowerCase()}.`);
  }
  if (opportunities.length > 0) {
    summaryParts.push(`Top opportunity: ${opportunities[0]!.label}.`);
  }
  if (recommendedActions.length > 0) {
    summaryParts.push(`${recommendedActions.length} recommended action${recommendedActions.length === 1 ? "" : "s"} below — MarketingOS recommends, you decide.`);
  }

  return {
    periodLabel: allIntel.periodLabel,
    wins,
    risks,
    opportunities,
    recommendedActions,
    summary: summaryParts.join(" "),
  };
}
