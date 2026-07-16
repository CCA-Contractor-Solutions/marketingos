import type { ConversionRow, LeadRow, MarketOpportunityKind, MarketingEventRow } from "@workspace/db";
import { computeConfidence, sourceReliability, type ConfidenceResult } from "../confidence";

// ---------------------------------------------------------------------------
// Phase 5 — Module 3: Market Opportunity Detection.
//
// detectMarketOpportunities(leads, conversions, events) surfaces
// geography/industry/segment/trend signals purely from counting + rate
// comparisons over real data — no black-box model. Every opportunity
// carries a `dataBasis` object with the raw numbers behind it.
//
// -----------------------------------------------------------------------
// Signals produced (each optional — only emitted when the underlying data
// supports it; low-volume cohorts are skipped rather than guessed at)
// -----------------------------------------------------------------------
// 1. "industry" — an industry whose conversion rate is at least
//    MIN_LIFT_MULTIPLIER (1.5x) the overall average, with >= MIN_COHORT
//    leads behind it. signalStrength = min(1, multiplier / 4).
// 2. "geography" — same lift computation, but bucketed by `lead.location`
//    instead of industry.
// 3. "segment" — a (industry, location) PAIR that both individually clear
//    MIN_COHORT and whose combined conversion rate beats the overall
//    average lift threshold — surfaces the spec's canonical example
//    ("Commercial contractors in FL show rising compliance demand").
// 4. "trend" — a lead SOURCE (from ingested marketing_events) whose recent
//    volume (last 30 days) is at least TREND_GROWTH_MULTIPLIER (1.5x) the
//    volume in the preceding 30-day window — a rising-interest signal
//    independent of conversion outcome (early trend detection, since new
//    trends may not have converted yet).
//
// signalStrength (0..1) is a bounded read on "how strong is this signal",
// separate from confidence (0..1), which is "how much should we trust the
// measurement" (sample size + source reliability). A small but very
// concentrated lift can have high signalStrength and low confidence; a
// broad, well-observed but modest lift can be the reverse.
// ---------------------------------------------------------------------------

export type MarketOpportunity = {
  kind: MarketOpportunityKind;
  title: string;
  insight: string;
  signalStrength: number;
  confidence: ConfidenceResult;
  dataBasis: Record<string, unknown>;
};

const MIN_COHORT = 3;
const MIN_LIFT_MULTIPLIER = 1.5;
const TREND_GROWTH_MULTIPLIER = 1.5;
const MIN_TREND_VOLUME = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

type CohortBucket = { leads: number; customers: number };

function conversionRateByKey(leads: LeadRow[], keyFor: (lead: LeadRow) => string | null): Map<string, CohortBucket> {
  const buckets = new Map<string, CohortBucket>();
  for (const lead of leads) {
    const key = keyFor(lead);
    if (!key) continue;
    const bucket = buckets.get(key) ?? { leads: 0, customers: 0 };
    bucket.leads += 1;
    if (lead.isCustomer) bucket.customers += 1;
    buckets.set(key, bucket);
  }
  return buckets;
}

function safeParseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function detectMarketOpportunities(
  leads: LeadRow[],
  _conversions: ConversionRow[],
  events: MarketingEventRow[],
): MarketOpportunity[] {
  const opportunities: MarketOpportunity[] = [];
  const totalLeads = leads.length;
  const totalCustomers = leads.filter((l) => l.isCustomer).length;
  const overallRate = totalLeads > 0 ? totalCustomers / totalLeads : 0;

  if (overallRate > 0) {
    // 1. Industry lift.
    const byIndustry = conversionRateByKey(leads, (l) => l.industry || null);
    for (const [industry, bucket] of byIndustry) {
      if (bucket.leads < MIN_COHORT) continue;
      const rate = bucket.customers / bucket.leads;
      const multiplier = rate / overallRate;
      if (multiplier < MIN_LIFT_MULTIPLIER || rate === 0) continue;

      const reliability = sourceReliability("website");
      const confidence = computeConfidence({ sampleSize: bucket.leads, sourceReliability: reliability });
      opportunities.push({
        kind: "industry",
        title: `${industry} shows rising demand`,
        insight: `${industry} leads convert at ${(rate * 100).toFixed(0)}% versus a ${(overallRate * 100).toFixed(0)}% overall average — a ${multiplier.toFixed(1)}x lift across ${bucket.leads} leads.`,
        signalStrength: clamp01(multiplier / 4),
        confidence,
        dataBasis: { industry, leads: bucket.leads, customers: bucket.customers, rate, overallRate, multiplier },
      });
    }

    // 2. Geography lift.
    const byLocation = conversionRateByKey(leads, (l) => l.location || null);
    for (const [location, bucket] of byLocation) {
      if (bucket.leads < MIN_COHORT) continue;
      const rate = bucket.customers / bucket.leads;
      const multiplier = rate / overallRate;
      if (multiplier < MIN_LIFT_MULTIPLIER || rate === 0) continue;

      const reliability = sourceReliability("website");
      const confidence = computeConfidence({ sampleSize: bucket.leads, sourceReliability: reliability });
      opportunities.push({
        kind: "geography",
        title: `${location} is outperforming`,
        insight: `Leads from ${location} convert at ${(rate * 100).toFixed(0)}% versus a ${(overallRate * 100).toFixed(0)}% overall average — a ${multiplier.toFixed(1)}x lift across ${bucket.leads} leads.`,
        signalStrength: clamp01(multiplier / 4),
        confidence,
        dataBasis: { location, leads: bucket.leads, customers: bucket.customers, rate, overallRate, multiplier },
      });
    }

    // 3. Industry x Location segment.
    const bySegment = conversionRateByKey(leads, (l) =>
      l.industry && l.location ? `${l.industry}::${l.location}` : null,
    );
    for (const [key, bucket] of bySegment) {
      if (bucket.leads < MIN_COHORT) continue;
      const rate = bucket.customers / bucket.leads;
      const multiplier = rate / overallRate;
      if (multiplier < MIN_LIFT_MULTIPLIER || rate === 0) continue;
      const [industry, location] = key.split("::");

      const reliability = sourceReliability("website");
      const confidence = computeConfidence({ sampleSize: bucket.leads, sourceReliability: reliability });
      opportunities.push({
        kind: "segment",
        title: `${industry} in ${location} is a high-value segment`,
        insight: `${industry} leads in ${location} convert at ${(rate * 100).toFixed(0)}% (${multiplier.toFixed(1)}x the overall average) across ${bucket.leads} leads — a concentrated, addressable segment.`,
        signalStrength: clamp01(multiplier / 4),
        confidence,
        dataBasis: { industry, location, leads: bucket.leads, customers: bucket.customers, rate, overallRate, multiplier },
      });
    }
  }

  // 4. Trend — rising source volume over the last 30 days vs. the prior
  // 30-day window, independent of conversion (an early-warning signal).
  const now = Date.now();
  const recentWindowStart = now - 30 * MS_PER_DAY;
  const priorWindowStart = now - 60 * MS_PER_DAY;

  const recentCountBySource = new Map<string, number>();
  const priorCountBySource = new Map<string, number>();
  for (const event of events) {
    if (!event.source) continue;
    const occurred = safeParseDate(event.occurredAt);
    if (!occurred) continue;
    const t = occurred.getTime();
    if (t >= recentWindowStart && t <= now) {
      recentCountBySource.set(event.source, (recentCountBySource.get(event.source) ?? 0) + 1);
    } else if (t >= priorWindowStart && t < recentWindowStart) {
      priorCountBySource.set(event.source, (priorCountBySource.get(event.source) ?? 0) + 1);
    }
  }

  for (const [source, recentCount] of recentCountBySource) {
    if (recentCount < MIN_TREND_VOLUME) continue;
    const priorCount = priorCountBySource.get(source) ?? 0;
    // Avoid division by zero: a brand-new source with no prior activity is
    // treated as an "emerging" trend at a fixed strong multiplier rather
    // than an undefined/infinite one.
    const multiplier = priorCount > 0 ? recentCount / priorCount : TREND_GROWTH_MULTIPLIER * 2;
    if (multiplier < TREND_GROWTH_MULTIPLIER) continue;

    const reliability = sourceReliability(source);
    const confidence = computeConfidence({ sampleSize: recentCount, sourceReliability: reliability });
    opportunities.push({
      kind: "trend",
      title: `Rising interest from ${source}`,
      insight:
        priorCount > 0
          ? `${source} generated ${recentCount} events in the last 30 days versus ${priorCount} in the prior 30 days — a ${multiplier.toFixed(1)}x increase in interest.`
          : `${source} generated ${recentCount} events in the last 30 days with no prior activity — an emerging source worth monitoring.`,
      signalStrength: clamp01(multiplier / 4),
      confidence,
      dataBasis: { source, recentCount, priorCount, multiplier },
    });
  }

  return opportunities.sort((a, b) => b.signalStrength - a.signalStrength);
}
