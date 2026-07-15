import type { AttributionModel, ConversionRow, MarketingEventRow } from "@workspace/db";
import { computeConfidence, sourceReliability, type ConfidenceBand } from "./confidence";

// ---------------------------------------------------------------------------
// Module 3 — Revenue attribution.
//
// Given a conversion and the ordered set of marketing events for that lead,
// compute attribution rows across four models: first_touch, last_touch,
// linear, and assisted.
//
// Phase 4.5 — every row also carries a governance confidence score: how
// much to trust that a given attribution row correctly reflects reality.
// See docs/data-governance.md for the full heuristic writeup.
// ---------------------------------------------------------------------------

export type AttributionRowInput = {
  model: AttributionModel;
  channel: string;
  campaign: string | null;
  weight: number;
  attributedAmount: number;
  confidence: number;
  confidenceBand: ConfidenceBand;
  confidenceReason: string;
};

type Touch = { channel: string; campaign: string | null; occurredAt: string };

function distinctTouches(events: MarketingEventRow[]): Touch[] {
  const ordered = [...events]
    .filter((e) => !!e.channel)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  const seen = new Set<string>();
  const touches: Touch[] = [];
  for (const event of ordered) {
    const channel = event.channel!;
    const key = `${channel}::${event.campaign ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    touches.push({ channel, campaign: event.campaign ?? null, occurredAt: event.occurredAt });
  }
  return touches;
}

function round(amount: number): number {
  return Math.round(amount);
}

// ---------------------------------------------------------------------------
// Attribution confidence heuristic (Phase 4.5).
//
// Inputs:
//   - touchCount        — number of distinct touches in the full journey.
//                          Fewer, cleaner touches -> easier to trust the
//                          credited channel actually caused the conversion.
//   - elapsedDays        — days between the FIRST touch and conversion. A
//                          short gap (days) is a tight, observable causal
//                          chain; a long gap (weeks/months) means many
//                          untracked things could have influenced the
//                          outcome in between.
//   - isViewThroughOnly  — true when the credited touch for THIS model/row
//                          is an impression/view-through touch rather than a
//                          first-party click/visit/call/form. View-through
//                          credit is inherently softer evidence.
//   - channel            — feeds `sourceReliability` for the credited
//                          channel.
//
// These feed `computeConfidence` as:
//   sampleSize            = touchCount (more touches observed = more
//                            evidence the journey was captured completely)
//   sourceReliability      = sourceReliability(channel), penalized further
//                            if the touch is view-through-only
//   historicalConsistency  = a recency/elapsed-time-based score: short gaps
//                            score high consistency (the signal held up
//                            over a short, observable window), long gaps
//                            score low.
// ---------------------------------------------------------------------------

const VIEW_THROUGH_CHANNEL_HINTS = ["impression", "display", "view_through", "view-through"];

function isViewThroughChannel(channel: string): boolean {
  const normalized = channel.toLowerCase();
  return VIEW_THROUGH_CHANNEL_HINTS.some((hint) => normalized.includes(hint));
}

function elapsedDaysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return (end - start) / (1000 * 60 * 60 * 24);
}

// Consistency score derived from elapsed time: converts within 7 days ->
// treated as highly consistent (0.9); beyond 60 days -> low (0.2); linear
// interpolation in between. Documented in docs/data-governance.md.
const CONSISTENCY_FAST_DAYS = 7;
const CONSISTENCY_SLOW_DAYS = 60;
const CONSISTENCY_FAST_SCORE = 0.9;
const CONSISTENCY_SLOW_SCORE = 0.2;

function elapsedTimeConsistency(elapsedDays: number): number {
  if (elapsedDays <= CONSISTENCY_FAST_DAYS) return CONSISTENCY_FAST_SCORE;
  if (elapsedDays >= CONSISTENCY_SLOW_DAYS) return CONSISTENCY_SLOW_SCORE;
  const span = CONSISTENCY_SLOW_DAYS - CONSISTENCY_FAST_DAYS;
  const progress = (elapsedDays - CONSISTENCY_FAST_DAYS) / span;
  return CONSISTENCY_FAST_SCORE - progress * (CONSISTENCY_FAST_SCORE - CONSISTENCY_SLOW_SCORE);
}

function computeAttributionConfidence(params: {
  channel: string;
  touchCount: number;
  elapsedDays: number;
}): { score: number; band: ConfidenceBand; reason: string } {
  const { channel, touchCount, elapsedDays } = params;
  const viewThrough = isViewThroughChannel(channel);

  let reliability = sourceReliability(channel);
  if (viewThrough) reliability = Math.min(reliability, 0.5);

  const consistency = elapsedTimeConsistency(elapsedDays);

  const result = computeConfidence({
    sampleSize: touchCount,
    sourceReliability: reliability,
    historicalConsistency: consistency,
  });

  const touchPhrase = touchCount <= 1 ? "single-channel" : `${touchCount}-touch`;
  const gapPhrase =
    elapsedDays <= CONSISTENCY_FAST_DAYS
      ? `converted within ${Math.max(1, Math.round(elapsedDays))} day${elapsedDays === 1 ? "" : "s"}`
      : `${Math.round(elapsedDays)}-day gap between first touch and conversion`;
  const creditPhrase = viewThrough ? "view-through only" : "first-party touch";

  const reason = `${touchPhrase}, ${gapPhrase}, ${creditPhrase} (${channel || "unknown channel"}).`;

  return { score: result.score, band: result.band, reason };
}

export function computeAttribution(
  conversion: Pick<ConversionRow, "amount" | "convertedAt">,
  events: MarketingEventRow[],
): AttributionRowInput[] {
  const touches = distinctTouches(events);
  const amount = conversion.amount;
  const rows: AttributionRowInput[] = [];

  if (touches.length === 0) {
    return rows;
  }

  const first = touches[0]!;
  const last = touches[touches.length - 1]!;
  const touchCount = touches.length;
  const elapsedDaysFromFirst = elapsedDaysBetween(first.occurredAt, conversion.convertedAt);
  const elapsedDaysFromLast = elapsedDaysBetween(last.occurredAt, conversion.convertedAt);

  function confidenceFor(channel: string, elapsedDays: number) {
    return computeAttributionConfidence({ channel, touchCount, elapsedDays });
  }

  // first_touch — 100% to the earliest channel. Elapsed time is measured
  // from that same first touch (the full journey length).
  {
    const c = confidenceFor(first.channel, elapsedDaysFromFirst);
    rows.push({
      model: "first_touch",
      channel: first.channel,
      campaign: first.campaign,
      weight: 1,
      attributedAmount: round(amount),
      confidence: c.score,
      confidenceBand: c.band,
      confidenceReason: c.reason,
    });
  }

  // last_touch — 100% to the latest channel. Elapsed time measured from the
  // credited (last) touch — typically short, since it's closest to
  // conversion.
  {
    const c = confidenceFor(last.channel, elapsedDaysFromLast);
    rows.push({
      model: "last_touch",
      channel: last.channel,
      campaign: last.campaign,
      weight: 1,
      attributedAmount: round(amount),
      confidence: c.score,
      confidenceBand: c.band,
      confidenceReason: c.reason,
    });
  }

  // linear — even split across all distinct touch channels. Each row's
  // elapsed time is measured from ITS OWN touch to conversion (a touch
  // closer to conversion is more consistent even within a linear split).
  const linearWeight = 1 / touches.length;
  for (const touch of touches) {
    const elapsed = elapsedDaysBetween(touch.occurredAt, conversion.convertedAt);
    const c = confidenceFor(touch.channel, elapsed);
    rows.push({
      model: "linear",
      channel: touch.channel,
      campaign: touch.campaign,
      weight: linearWeight,
      attributedAmount: round(amount * linearWeight),
      confidence: c.score,
      confidenceBand: c.band,
      confidenceReason: c.reason,
    });
  }

  // assisted — all non-last touches share credit equally. If there is only
  // one touch, it is both first and last, so no assisted rows are produced.
  const assistTouches = touches.slice(0, -1);
  if (assistTouches.length > 0) {
    const assistWeight = 1 / assistTouches.length;
    for (const touch of assistTouches) {
      const elapsed = elapsedDaysBetween(touch.occurredAt, conversion.convertedAt);
      const c = confidenceFor(touch.channel, elapsed);
      rows.push({
        model: "assisted",
        channel: touch.channel,
        campaign: touch.campaign,
        weight: assistWeight,
        attributedAmount: round(amount * assistWeight),
        confidence: c.score,
        confidenceBand: c.band,
        confidenceReason: c.reason,
      });
    }
  }

  return rows;
}
