import type { LeadRow, MarketingEventRow } from "@workspace/db";
import type { PredictionFactor } from "@workspace/db";
import { computeConfidence, sourceReliability, type ConfidenceResult } from "../confidence";

// ---------------------------------------------------------------------------
// Phase 5 — Module 1: Predictive Lead Intelligence.
//
// predictLeadConversion(lead, events, cohortStats) is a pure, deterministic
// function: same inputs always produce the same output. No runtime LLM
// calls, no black-box ML. Every number it returns is explainable from the
// `factors` list it also returns.
//
// -----------------------------------------------------------------------
// Model — conversionProbability
// -----------------------------------------------------------------------
// A documented logistic-style blend of three signals, each mapped to 0..1
// and then combined with fixed weights (summing to 1) before being nudged
// by a small event-signal bonus/penalty and finally passed through a
// logistic squashing function so the output cannot leave [0, 1] even after
// the additive nudges:
//
//   base =
//       0.55 * tierPrior(lead.scoreTier)              (the rule-based score
//                                                        tier the lead
//                                                        already has —
//                                                        Module 5 scoring)
//     + 0.30 * cohortRate(tier, industry, source)      (calibration: the
//                                                        ACTUAL historical
//                                                        conversion rate of
//                                                        leads sharing this
//                                                        lead's tier +
//                                                        industry + source,
//                                                        computed by the
//                                                        caller from real
//                                                        leads/customers —
//                                                        see cohortStats.ts
//                                                        usage in
//                                                        routes/predictions.ts)
//     + 0.15 * eventIntentScore(events)                (recency + intent of
//                                                        this lead's own
//                                                        marketing_events)
//
//   logit = ln(base / (1 - base))                      (log-odds of the
//                                                        blended base rate)
//     + eventNudge(events)                              (a small, capped
//                                                        +/- adjustment for
//                                                        specific strong
//                                                        signals — phone
//                                                        call, no activity,
//                                                        etc. — kept small
//                                                        so it nudges rather
//                                                        than dominates)
//
//   conversionProbability = sigmoid(logit), clamped to [0.01, 0.99]
//
// Working in log-odds space (rather than just adding percentages) keeps the
// blend well-behaved near 0 and 1 — an additive nudge on a raw probability
// could push it outside [0, 1] or have an outsized effect near the
// boundaries; the same nudge in log-odds space naturally shrinks as the
// base rate approaches the boundary.
//
// -----------------------------------------------------------------------
// Model — expectedRevenue
// -----------------------------------------------------------------------
// expectedRevenue = round(conversionProbability * expectedDealSize)
// where expectedDealSize = cohort average `revenueGenerated` of CONVERTED
// leads in the same industry (fallback: global average across all
// converted leads; fallback: 0 if no converted leads exist anywhere yet).
//
// -----------------------------------------------------------------------
// Model — bestFollowUpAt / bestFollowUpReason
// -----------------------------------------------------------------------
// Simple, documented rules over event recency + intent (NOT a model):
//   - No events at all              -> follow up within 24h ("no engagement
//                                       yet — establish first contact").
//   - High-intent signal present
//     (phone_call / meeting_request / pricing form_submission) AND lead has
//     never been called (callCount === 0)
//                                    -> follow up within 4h ("high intent,
//                                       not yet contacted").
//   - Last touch within 2 days      -> follow up within 24h ("recently
//                                       active — strike while warm").
//   - Last touch 2-7 days ago       -> follow up now ("engagement cooling —
//                                       re-engage now").
//   - Last touch > 7 days ago       -> follow up now, flagged stale ("stale
//                                       — re-engage before the lead goes
//                                       cold").
// All timing rules resolve to an ISO timestamp relative to "now" (the time
// predictLeadConversion is called), computed by the caller-supplied `now`
// (defaults to `new Date()`) so the function stays pure/testable.
// ---------------------------------------------------------------------------

export type CohortKey = { tier: string; industry: string; source: string };

export type CohortStats = {
  /** Historical conversion rate (0..1) for this tier/industry/source cohort. */
  rate: number;
  /** Number of leads behind that rate — feeds confidence sample size. */
  sampleSize: number;
};

export type LeadConversionCohortLookup = {
  /** Cohort base rate by (tier, industry, source) — see buildCohortStats. */
  byTierIndustrySource: (key: CohortKey) => CohortStats;
  /** Average revenue of converted leads in a given industry (fallback: global avg). */
  expectedDealSizeForIndustry: (industry: string) => number;
  /** Reliability of the lead's own first-touch source, 0..1. */
  sourceReliabilityForLead: (lead: LeadRow) => number;
};

export type LeadConversionPrediction = {
  conversionProbability: number;
  expectedRevenue: number;
  bestFollowUpAt: string;
  bestFollowUpReason: string;
  factors: PredictionFactor[];
  confidence: ConfidenceResult;
};

const TIER_PRIOR: Record<string, number> = {
  high: 0.55,
  medium: 0.28,
  low: 0.1,
  unscored: 0.05,
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function logit(p: number): number {
  const clamped = Math.min(0.999, Math.max(0.001, p));
  return Math.log(clamped / (1 - clamped));
}

function tierPrior(tier: string): number {
  return TIER_PRIOR[tier] ?? TIER_PRIOR["unscored"]!;
}

/**
 * eventIntentScore — 0..1 read on how "warm" the lead's own event history
 * looks, independent of the cohort. Simple counting rule, documented here:
 *   +0.5 for any high-intent event (phone_call, meeting_request, or a
 *        form_submission with metadata.intent in {"pricing","consultation"})
 *   +0.2 for >=2 content_download events
 *   +0.15 for >=3 website_visit events
 *   +0.15 for any email_click (an opened AND clicked email, stronger than a
 *        bare open)
 * Capped at 1.
 */
function eventIntentScore(events: MarketingEventRow[]): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];

  const hasHighIntent = events.some(
    (e) =>
      e.eventType === "phone_call" ||
      e.eventType === "meeting_request" ||
      (e.eventType === "form_submission" &&
        (e.metadata?.["intent"] === "pricing" || e.metadata?.["intent"] === "consultation")),
  );
  if (hasHighIntent) {
    score += 0.5;
    notes.push("high-intent event recorded (call/meeting/pricing inquiry)");
  }

  const downloads = events.filter((e) => e.eventType === "content_download").length;
  if (downloads >= 2) {
    score += 0.2;
    notes.push(`${downloads} content downloads`);
  }

  const visits = events.filter((e) => e.eventType === "website_visit").length;
  if (visits >= 3) {
    score += 0.15;
    notes.push(`${visits} website visits`);
  }

  const clicked = events.some((e) => e.eventType === "email_click");
  if (clicked) {
    score += 0.15;
    notes.push("clicked an email");
  }

  return { score: clamp01(score), notes };
}

/**
 * eventNudge — small, capped log-odds adjustment (documented above) for
 * specific strong signals not already captured by the tier/cohort priors.
 * Kept intentionally small (+/-0.6 max) so it nudges rather than dominates.
 */
function eventNudge(events: MarketingEventRow[], lead: LeadRow): { nudge: number; factors: PredictionFactor[] } {
  const factors: PredictionFactor[] = [];
  let nudge = 0;

  if (events.length === 0) {
    nudge -= 0.5;
    factors.push({ label: "no recorded activity", effect: "-", detail: "No marketing events yet — probability is a cohort-only estimate." });
    return { nudge, factors };
  }

  const hasPhoneCall = events.some((e) => e.eventType === "phone_call");
  if (hasPhoneCall) {
    nudge += 0.3;
    factors.push({ label: "phone_call", effect: "+", detail: "Lead has had at least one phone conversation." });
  }

  const hasMeeting = events.some((e) => e.eventType === "meeting_request");
  if (hasMeeting) {
    nudge += 0.3;
    factors.push({ label: "meeting_request", effect: "+", detail: "Lead requested a meeting/consultation." });
  }

  const hasPricing = events.some(
    (e) => e.eventType === "form_submission" && (e.metadata?.["intent"] === "pricing" || e.metadata?.["intent"] === "consultation"),
  );
  if (hasPricing) {
    nudge += 0.25;
    factors.push({ label: "pricing_inquiry", effect: "+", detail: "Submitted a pricing/consultation form." });
  }

  const lastTouch = lead.lastTouchAt ? new Date(lead.lastTouchAt) : null;
  if (lastTouch) {
    const daysSince = (Date.now() - lastTouch.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) {
      nudge -= 0.35;
      factors.push({ label: "stale engagement", effect: "-", detail: `Last touch was ${Math.round(daysSince)} days ago.` });
    } else if (daysSince <= 2) {
      nudge += 0.1;
      factors.push({ label: "recent engagement", effect: "+", detail: `Last touch was ${Math.max(0, Math.round(daysSince))} day(s) ago.` });
    }
  }

  // Clamp the total nudge so it stays a nudge, not a dominant term.
  nudge = Math.max(-0.6, Math.min(0.6, nudge));
  return { nudge, factors };
}

function bestFollowUp(
  lead: LeadRow,
  events: MarketingEventRow[],
  now: Date,
): { at: string; reason: string } {
  const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

  if (events.length === 0) {
    return { at: hoursFromNow(24), reason: "No engagement yet — establish first contact within 24h." };
  }

  const hasHighIntent = events.some(
    (e) =>
      e.eventType === "phone_call" ||
      e.eventType === "meeting_request" ||
      (e.eventType === "form_submission" && (e.metadata?.["intent"] === "pricing" || e.metadata?.["intent"] === "consultation")),
  );

  if (hasHighIntent && lead.callCount === 0) {
    return { at: hoursFromNow(4), reason: "High intent signal detected and the lead has not yet been called — follow up within 4h." };
  }

  const lastTouch = lead.lastTouchAt ? new Date(lead.lastTouchAt) : null;
  if (!lastTouch) {
    return { at: hoursFromNow(24), reason: "Engagement recorded but no touch timestamp — follow up within 24h to be safe." };
  }

  const daysSince = (now.getTime() - lastTouch.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince <= 2) {
    return { at: hoursFromNow(24), reason: `Last touch ${daysSince.toFixed(1)} day(s) ago — recently active, strike while warm within 24h.` };
  }
  if (daysSince <= 7) {
    return { at: now.toISOString(), reason: `Last touch ${daysSince.toFixed(1)} days ago — engagement is cooling, re-engage now.` };
  }
  return { at: now.toISOString(), reason: `Last touch ${Math.round(daysSince)} days ago — lead is going cold, re-engage now before it stalls further.` };
}

/**
 * predictLeadConversion — Module 1 entrypoint. Pure function: callers fetch
 * `lead`, its `events`, and pass a `cohortStats` lookup built from real
 * leads/customers (see buildCohortStats below), so this file never touches
 * the database directly.
 */
export function predictLeadConversion(
  lead: LeadRow,
  events: MarketingEventRow[],
  cohortStats: LeadConversionCohortLookup,
  now: Date = new Date(),
): LeadConversionPrediction {
  const factors: PredictionFactor[] = [];

  const tier = lead.scoreTier || "unscored";
  const industry = lead.industry || "Unspecified";
  const source = lead.firstTouchChannel || "unknown";

  const cohort = cohortStats.byTierIndustrySource({ tier, industry, source });
  const tierBase = tierPrior(tier);
  const intent = eventIntentScore(events);

  const base = clamp01(0.55 * tierBase + 0.3 * cohort.rate + 0.15 * intent.score);

  const { nudge, factors: nudgeFactors } = eventNudge(events, lead);
  const probability = clamp01(sigmoid(logit(base) + nudge));

  factors.push({
    label: `${tier} tier`,
    effect: tierBase >= 0.28 ? "+" : "-",
    detail: `Rule-based lead score tier "${tier}" carries a ${(tierBase * 100).toFixed(0)}% base conversion prior.`,
  });
  factors.push({
    label: `${industry} / ${source} cohort`,
    effect: cohort.rate >= 0.2 ? "+" : cohort.rate <= 0.05 ? "-" : "neutral",
    detail:
      cohort.sampleSize > 0
        ? `${(cohort.rate * 100).toFixed(0)}% historical conversion rate across ${cohort.sampleSize} comparable leads (${tier}/${industry}/${source}).`
        : `No comparable cohort data yet for ${tier}/${industry}/${source} — falling back to tier prior only.`,
  });
  if (intent.notes.length > 0) {
    factors.push({
      label: "event engagement",
      effect: intent.score >= 0.3 ? "+" : "neutral",
      detail: intent.notes.join("; "),
    });
  }
  factors.push(...nudgeFactors);

  const expectedDealSize = cohortStats.expectedDealSizeForIndustry(industry);
  const expectedRevenue = Math.round(probability * expectedDealSize);

  const followUp = bestFollowUp(lead, events, now);

  const confidence = computeConfidence({
    sampleSize: cohort.sampleSize,
    sourceReliability: cohortStats.sourceReliabilityForLead(lead),
    // Consistency: more events observed for this specific lead = more
    // consistent signal about ITS behavior (distinct from cohort sample
    // size, which is about how much we trust the base rate).
    historicalConsistency: clamp01(0.4 + Math.min(events.length, 10) / 20),
  });

  return {
    conversionProbability: probability,
    expectedRevenue,
    bestFollowUpAt: followUp.at,
    bestFollowUpReason: followUp.reason,
    factors,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// buildCohortStats — helper for callers (routes/predictions.ts) to turn raw
// leads into the LeadConversionCohortLookup this module needs, WITHOUT this
// file importing the db layer directly (keeps the prediction lib pure/
// testable). Exported so the route can reuse it without duplicating the
// aggregation logic.
// ---------------------------------------------------------------------------

export function buildCohortStats(allLeads: LeadRow[]): LeadConversionCohortLookup {
  const byKey = new Map<string, { leads: number; customers: number }>();
  const byIndustryRevenue = new Map<string, { total: number; count: number }>();
  let globalRevenueTotal = 0;
  let globalRevenueCount = 0;

  const keyFor = (tier: string, industry: string, source: string) => `${tier}::${industry}::${source}`;

  for (const lead of allLeads) {
    const tier = lead.scoreTier || "unscored";
    const industry = lead.industry || "Unspecified";
    const source = lead.firstTouchChannel || "unknown";
    const key = keyFor(tier, industry, source);
    const bucket = byKey.get(key) ?? { leads: 0, customers: 0 };
    bucket.leads += 1;
    if (lead.isCustomer) bucket.customers += 1;
    byKey.set(key, bucket);

    if (lead.isCustomer && lead.revenueGenerated > 0) {
      const revBucket = byIndustryRevenue.get(industry) ?? { total: 0, count: 0 };
      revBucket.total += lead.revenueGenerated;
      revBucket.count += 1;
      byIndustryRevenue.set(industry, revBucket);
      globalRevenueTotal += lead.revenueGenerated;
      globalRevenueCount += 1;
    }
  }

  const globalAvgRevenue = globalRevenueCount > 0 ? globalRevenueTotal / globalRevenueCount : 0;

  return {
    byTierIndustrySource({ tier, industry, source }) {
      const bucket = byKey.get(keyFor(tier, industry, source));
      if (!bucket || bucket.leads === 0) return { rate: tierPrior(tier), sampleSize: 0 };
      return { rate: bucket.customers / bucket.leads, sampleSize: bucket.leads };
    },
    expectedDealSizeForIndustry(industry) {
      const bucket = byIndustryRevenue.get(industry);
      if (bucket && bucket.count > 0) return bucket.total / bucket.count;
      return globalAvgRevenue;
    },
    sourceReliabilityForLead(lead) {
      return sourceReliability(lead.firstTouchChannel);
    },
  };
}
