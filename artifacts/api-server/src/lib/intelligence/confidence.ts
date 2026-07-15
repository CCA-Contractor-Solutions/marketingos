// ---------------------------------------------------------------------------
// Phase 4.5 — Data Confidence Scoring (Module 7 governance extension).
//
// A single, documented, deterministic scoring function used everywhere a
// recommendation or attribution row needs a confidence score. No LLM calls,
// no predictive modeling — just a transparent, rule-based blend of three
// factors so every insight can show its work.
//
// -----------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------
// score = 0.45 * volume + 0.35 * reliability + 0.20 * consistency
//
// - volume        — saturating curve on `sampleSize`: min(sampleSize / N, 1)
//                    with N = 20. Chosen because the existing rule-based
//                    recommendation generator already treats ~20 leads/events
//                    as "fully sampled" (see the old `0.5 + leads/20` math in
//                    routes/recommendations.ts) — this generalizes that same
//                    intuition into a bounded, documented curve instead of an
//                    ad-hoc additive fudge factor.
// - reliability    — caller-supplied 0..1, typically from `sourceReliability`
//                    below. Reflects how trustworthy the underlying data
//                    source(s) are (first-party form vs. third-party ad
//                    platform vs. unknown).
// - consistency    — caller-supplied 0..1 "historicalConsistency" (how
//                    stable the signal has been over time). Optional;
//                    defaults to 0.6 (a neutral, slightly-below-"confident"
//                    prior) when the caller has no time-series to compare
//                    against yet.
//
// Weights (45/35/20) are deliberately volume-first: a recommendation is only
// as good as how much data backs it, but a large sample from an unreliable
// source should still be discounted, and short-term consistency matters
// least of the three because it is the hardest signal to observe early.
//
// -----------------------------------------------------------------------
// Bands
// -----------------------------------------------------------------------
// score >= 0.75  -> "high"
// score >= 0.50  -> "medium"
// otherwise      -> "low"
// ---------------------------------------------------------------------------

export type ConfidenceBand = "high" | "medium" | "low";

export type ConfidenceInputs = {
  /** Data volume behind the signal (leads/events/records). */
  sampleSize: number;
  /** 0..1 — reliability of the data source(s) involved. */
  sourceReliability: number;
  /** 0..1 — how stable the signal is over time. Defaults to 0.6. */
  historicalConsistency?: number;
};

export type ConfidenceFactors = {
  volume: number;
  reliability: number;
  consistency: number;
};

export type ConfidenceResult = {
  score: number;
  band: ConfidenceBand;
  factors: ConfidenceFactors;
  rationale: string;
};

// Volume saturation constant — sample sizes at/above this are treated as
// "fully sampled" for the volume factor. Documented above.
const VOLUME_SATURATION_N = 20;

// Blend weights — documented above. Must sum to 1.
const WEIGHT_VOLUME = 0.45;
const WEIGHT_RELIABILITY = 0.35;
const WEIGHT_CONSISTENCY = 0.2;

const BAND_HIGH_THRESHOLD = 0.75;
const BAND_MEDIUM_THRESHOLD = 0.5;

const DEFAULT_HISTORICAL_CONSISTENCY = 0.6;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function bandFor(score: number): ConfidenceBand {
  if (score >= BAND_HIGH_THRESHOLD) return "high";
  if (score >= BAND_MEDIUM_THRESHOLD) return "medium";
  return "low";
}

/**
 * computeConfidence — the single source of truth for scoring how much to
 * trust a piece of derived intelligence (a recommendation, an attribution
 * row, etc). Deterministic, rule-based, no runtime LLM calls.
 */
export function computeConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  const sampleSize = Math.max(0, inputs.sampleSize);
  const reliability = clamp01(inputs.sourceReliability);
  const consistency = clamp01(inputs.historicalConsistency ?? DEFAULT_HISTORICAL_CONSISTENCY);

  const volume = clamp01(sampleSize / VOLUME_SATURATION_N);

  const score = clamp01(
    WEIGHT_VOLUME * volume + WEIGHT_RELIABILITY * reliability + WEIGHT_CONSISTENCY * consistency,
  );
  const band = bandFor(score);

  const rationale =
    `Based on ${sampleSize} record${sampleSize === 1 ? "" : "s"} ` +
    `(${Math.round(volume * 100)}% of the ${VOLUME_SATURATION_N}-sample saturation point), ` +
    `source reliability ${Math.round(reliability * 100)}%, ` +
    `and historical consistency ${Math.round(consistency * 100)}% ` +
    `→ ${Math.round(score * 100)}% confidence (${band}).`;

  return {
    score,
    band,
    factors: { volume, reliability, consistency },
    rationale,
  };
}

// ---------------------------------------------------------------------------
// sourceReliability — lookup table by provider/source/channel string.
//
// Reflects how directly observable / first-party a signal is:
//   - First-party forms/website tracking is the most reliable (the lead
//     told us directly, or we captured the event ourselves).
//   - Call tracking (CallRail/RingCentral) is high-confidence but one step
//     removed (relies on call-outcome tagging).
//   - GA4 is solid but samples/models some traffic.
//   - Paid ad platforms (Google/Meta/LinkedIn Ads) self-report clicks/spend
//     and are subject to platform-side attribution windows.
//   - Anything unrecognized defaults to a conservative 0.5.
// ---------------------------------------------------------------------------
const SOURCE_RELIABILITY_TABLE: Record<string, number> = {
  // First-party — highest reliability.
  website: 0.95,
  form: 0.95,
  form_submission: 0.95,
  direct: 0.9,

  // Call tracking.
  callrail: 0.9,
  ringcentral: 0.9,
  phone_call: 0.9,

  // Analytics.
  ga4: 0.8,
  google_analytics: 0.8,
  search_console: 0.75,
  organic: 0.75,

  // Paid ad platforms.
  google: 0.75,
  google_ads: 0.75,
  meta: 0.75,
  meta_ads: 0.75,
  facebook: 0.75,
  linkedin: 0.75,
  linkedin_ads: 0.75,

  // Email.
  email: 0.7,
  zoho_mail: 0.7,

  // Referral / partnerships — word of mouth, harder to verify.
  referral: 0.65,
  partnerships: 0.65,
  events: 0.65,
};

const UNKNOWN_SOURCE_RELIABILITY = 0.5;

/**
 * sourceReliability — look up the 0..1 reliability score for a given
 * provider/channel/source string. Case-insensitive; unknown sources return
 * the conservative default (0.5) rather than throwing, since this is called
 * from data-driven code paths with arbitrary ingested strings.
 */
export function sourceReliability(source: string | null | undefined): number {
  if (!source) return UNKNOWN_SOURCE_RELIABILITY;
  const key = source.trim().toLowerCase().replace(/\s+/g, "_");
  return SOURCE_RELIABILITY_TABLE[key] ?? UNKNOWN_SOURCE_RELIABILITY;
}
