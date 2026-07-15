import type { AttributionModel, ConversionRow, MarketingEventRow } from "@workspace/db";

// ---------------------------------------------------------------------------
// Module 3 — Revenue attribution.
//
// Given a conversion and the ordered set of marketing events for that lead,
// compute attribution rows across four models: first_touch, last_touch,
// linear, and assisted.
// ---------------------------------------------------------------------------

export type AttributionRowInput = {
  model: AttributionModel;
  channel: string;
  campaign: string | null;
  weight: number;
  attributedAmount: number;
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

export function computeAttribution(
  conversion: Pick<ConversionRow, "amount">,
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

  // first_touch — 100% to the earliest channel.
  rows.push({
    model: "first_touch",
    channel: first.channel,
    campaign: first.campaign,
    weight: 1,
    attributedAmount: round(amount),
  });

  // last_touch — 100% to the latest channel.
  rows.push({
    model: "last_touch",
    channel: last.channel,
    campaign: last.campaign,
    weight: 1,
    attributedAmount: round(amount),
  });

  // linear — even split across all distinct touch channels.
  const linearWeight = 1 / touches.length;
  for (const touch of touches) {
    rows.push({
      model: "linear",
      channel: touch.channel,
      campaign: touch.campaign,
      weight: linearWeight,
      attributedAmount: round(amount * linearWeight),
    });
  }

  // assisted — all non-last touches share credit equally. If there is only
  // one touch, it is both first and last, so no assisted rows are produced.
  const assistTouches = touches.slice(0, -1);
  if (assistTouches.length > 0) {
    const assistWeight = 1 / assistTouches.length;
    for (const touch of assistTouches) {
      rows.push({
        model: "assisted",
        channel: touch.channel,
        campaign: touch.campaign,
        weight: assistWeight,
        attributedAmount: round(amount * assistWeight),
      });
    }
  }

  return rows;
}
