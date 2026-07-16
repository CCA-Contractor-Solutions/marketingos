import type { ChannelIntelligence } from "../channels";
import { computeConfidence, sourceReliability, type ConfidenceResult } from "../confidence";

// ---------------------------------------------------------------------------
// Phase 5 — Module 2: Budget Intelligence.
//
// recommendBudgetShifts(channelIntel) is a pure, deterministic function over
// the SAME `ChannelIntelligence[]` shape already computed by
// lib/intelligence/channels.ts#computeChannelIntelligence (leads, qualified,
// customers, revenue, spend, roi per channel).
//
// *** RECOMMENDATION ONLY — this function returns a suggestion. It never
// *** calls out to an ad platform, never writes spend anywhere, and the
// *** caller (routes/growth.ts) never applies it automatically. See the
// *** budget_recommendations table's status field: a human "applies" it,
// *** which only records their intent — there is no integration write path.
//
// -----------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------
// 1. Only consider channels with spend > 0 (roi is meaningless/undefined
//    for a channel we've never paid for — matches computeChannelIntelligence,
//    which leaves roi null when spend is 0).
// 2. efficiency(channel) = roi ?? -1 (channels with unknown roi are treated
//    as the worst candidates for "from", never as "to").
// 3. `from` = the lowest-efficiency channel with spend > 0.
//    `to`   = the highest-efficiency channel with spend > 0, excluding
//             `from`. If fewer than 2 channels have spend, no
//             recommendation is produced (nothing to compare).
// 4. shiftPct = min(20%, a proportional slice of the ROI gap) — capped at
//    20% of `from`'s spend per the spec ("propose shifting a modest %,
//    cap e.g. 20%"). The exact proportional formula:
//      gap = to.roi - from.roi  (if either roi is null, gap defaults to a
//                                 flat cap-triggering value so the cap wins)
//      shiftPct = clamp(gap * 10, 5%, 20%)   — a wider efficiency gap
//                 justifies a larger (but still capped) shift; a modest
//                 gap still gets a minimum 5% "worth testing" nudge.
//    shiftAmount = round(from.spend * shiftPct)
// 5. Linear PROJECTION (explicitly labeled as such, not a guarantee):
//    projectedQualifiedDelta = round(shiftAmount * to.qualifiedPerDollar)
//                               - round(shiftAmount * from.qualifiedPerDollar)
//    projectedRevenueDelta   = round(shiftAmount * to.revenuePerDollar)
//                               - round(shiftAmount * from.revenuePerDollar)
//    where xPerDollar = qualifiedLeads/spend or revenue/spend for that
//    channel today. This assumes the CURRENT per-dollar efficiency holds at
//    the margin, which is a simplification — hence "projected", not
//    "guaranteed", everywhere in the rationale/UI copy.
// 6. confidence via computeConfidence: sampleSize = combined lead volume of
//    both channels (more leads behind the ROI numbers = more trustworthy);
//    reliability = average of sourceReliability(from.channelName) and
//    sourceReliability(to.channelName); consistency defaults (no
//    time-series here yet).
// ---------------------------------------------------------------------------

export type BudgetShiftRecommendation = {
  fromChannel: string;
  toChannel: string;
  shiftPct: number;
  shiftAmount: number;
  projectedQualifiedDelta: number;
  projectedRevenueDelta: number;
  rationale: string;
  confidence: ConfidenceResult;
};

const MIN_SHIFT_PCT = 0.05;
const MAX_SHIFT_PCT = 0.2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function perDollar(numerator: number, spend: number): number {
  if (spend <= 0) return 0;
  return numerator / spend;
}

/**
 * recommendBudgetShifts — identifies at most one lower-efficiency ->
 * higher-efficiency channel shift from the given channel intelligence
 * report. Returns an empty array when fewer than 2 spending channels exist,
 * or when the best channel isn't actually better than the worst one.
 */
export function recommendBudgetShifts(channelIntel: ChannelIntelligence[]): BudgetShiftRecommendation[] {
  const spending = channelIntel.filter((c) => c.spend > 0);
  if (spending.length < 2) return [];

  const efficiency = (c: ChannelIntelligence) => c.roi ?? -1;

  const from = [...spending].sort((a, b) => efficiency(a) - efficiency(b))[0]!;
  const toCandidates = spending.filter((c) => c.channelId !== from.channelId);
  const to = [...toCandidates].sort((a, b) => efficiency(b) - efficiency(a))[0];

  if (!to) return [];
  if (efficiency(to) <= efficiency(from)) return []; // nothing better to shift toward

  const fromRoi = from.roi;
  const toRoi = to.roi;
  const gap = fromRoi !== null && toRoi !== null ? toRoi - fromRoi : MAX_SHIFT_PCT * 10;
  const shiftPct = clamp(gap * 10, MIN_SHIFT_PCT, MAX_SHIFT_PCT);
  const shiftAmount = Math.round(from.spend * shiftPct);

  const fromQualifiedPerDollar = perDollar(from.qualifiedLeads, from.spend);
  const toQualifiedPerDollar = perDollar(to.qualifiedLeads, to.spend);
  const fromRevenuePerDollar = perDollar(from.revenue, from.spend);
  const toRevenuePerDollar = perDollar(to.revenue, to.spend);

  const projectedQualifiedDelta = Math.round(
    shiftAmount * toQualifiedPerDollar - shiftAmount * fromQualifiedPerDollar,
  );
  const projectedRevenueDelta = Math.round(
    shiftAmount * toRevenuePerDollar - shiftAmount * fromRevenuePerDollar,
  );

  const fromRoiLabel = fromRoi !== null ? `${(fromRoi * 100).toFixed(0)}% ROI` : "no measurable ROI (spend with no attributed revenue)";
  const toRoiLabel = toRoi !== null ? `${(toRoi * 100).toFixed(0)}% ROI` : "unmeasured ROI";

  const rationale =
    `${from.channelName} is currently the lowest-efficiency spending channel (${fromRoiLabel} on $${from.spend.toLocaleString()} spend), ` +
    `while ${to.channelName} is the highest-efficiency (${toRoiLabel} on $${to.spend.toLocaleString()} spend). ` +
    `PROJECTION (not a guarantee): shifting $${shiftAmount.toLocaleString()} (${(shiftPct * 100).toFixed(0)}% of ${from.channelName}'s spend) at ` +
    `today's per-dollar efficiency would be expected to yield ${projectedQualifiedDelta >= 0 ? "+" : ""}${projectedQualifiedDelta} qualified leads ` +
    `and ${projectedRevenueDelta >= 0 ? "+" : ""}$${projectedRevenueDelta.toLocaleString()} revenue. This is a recommendation only — ` +
    `MarketingOS never changes spend automatically; a human must review and execute any shift on the actual ad platform.`;

  const sampleSize = from.leads + to.leads;
  const reliability = (sourceReliability(from.channelName) + sourceReliability(to.channelName)) / 2;
  const confidence = computeConfidence({ sampleSize, sourceReliability: reliability });

  return [
    {
      fromChannel: from.channelName,
      toChannel: to.channelName,
      shiftPct,
      shiftAmount,
      projectedQualifiedDelta,
      projectedRevenueDelta,
      rationale,
      confidence,
    },
  ];
}
