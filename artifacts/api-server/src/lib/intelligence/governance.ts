// ---------------------------------------------------------------------------
// Phase 4.5 — small shared governance helpers used by routes/attribution.ts,
// routes/recommendations.ts, and the GET /governance/summary endpoint.
//
// Keeps the "how do we classify an aggregate score into a band" logic in
// one place, using the SAME thresholds as `computeConfidence` in
// confidence.ts (>=0.75 high, >=0.5 medium, else low), so a rolled-up
// average is always classified consistently with a single row's score.
// ---------------------------------------------------------------------------

import type { ConfidenceBand } from "./confidence";

const BAND_HIGH_THRESHOLD = 0.75;
const BAND_MEDIUM_THRESHOLD = 0.5;

/** Classify an average/aggregate confidence score (0..1) into a band. */
export function bandForAverage(avgScore: number): ConfidenceBand {
  if (avgScore >= BAND_HIGH_THRESHOLD) return "high";
  if (avgScore >= BAND_MEDIUM_THRESHOLD) return "medium";
  return "low";
}
