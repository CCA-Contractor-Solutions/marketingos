# Data Governance (Phase 4.5)

This document describes the deterministic, rule-based confidence model and
audit trail introduced in Phase 4.5. There is **no predictive/forecasting
AI, no autonomous actions, no budget automation, and no runtime LLM calls**
anywhere in this layer — every score and every audit row is produced by
plain arithmetic over data already in Postgres.

## 1. Confidence model

Source of truth: `artifacts/api-server/src/lib/intelligence/confidence.ts`.

### `computeConfidence(inputs)`

```ts
computeConfidence({
  sampleSize: number,
  sourceReliability: number,       // 0..1
  historicalConsistency?: number,  // 0..1, defaults to 0.6
}) => {
  score: number,        // 0..1
  band: "high" | "medium" | "low",
  factors: { volume: number; reliability: number; consistency: number },
  rationale: string,
}
```

**Inputs**

| Factor | Meaning | How it's derived |
|---|---|---|
| `volume` | How much data backs the insight | `min(sampleSize / 20, 1)` — saturates at 20 data points |
| `reliability` | How trustworthy the data source is | Passed in directly; see source-reliability table below |
| `consistency` | How stable/repeatable the pattern is | Passed in directly, or defaults to `0.6` when the caller has no historical-consistency signal |

**Weights** (must sum to 1.0):

- Volume: **45%**
- Reliability: **35%**
- Consistency: **20%**

`score = 0.45 * volume + 0.35 * reliability + 0.20 * consistency`

**Bands**

- `score >= 0.75` → **high**
- `score >= 0.5` → **medium**
- else → **low**

`rationale` is a short human-readable sentence assembled from the three
factors (e.g. "Based on 24 data points (volume: 1.00), a reliability-0.90
source, and 0.60 historical consistency.").

### `sourceReliability(source)`

A lookup table (case-insensitive, ignores `-`/`_`/spacing) used to turn a
channel/source string into a reliability score in `[0, 1]`:

| Source | Reliability |
|---|---|
| website / form / direct (first-party) | 0.95 |
| CallRail / RingCentral / phone_call | 0.90 |
| GA4 | 0.80 |
| Google / Google Ads / Meta / Meta Ads / Facebook / LinkedIn / LinkedIn Ads | 0.75 |
| Search Console / organic / referral / partnerships / events | 0.65–0.75 |
| Email / Zoho Mail | 0.70 |
| unknown / unmapped source | 0.50 (fallback) |

This is the **single source of truth** for recommendation confidence.
`artifacts/api-server/src/routes/recommendations.ts` no longer does ad-hoc
math like `0.5 + leads/20` — every one of its 7 rule-based insights now
calls `computeConfidence(...)` and stores the result's `score` as
`confidence`, folding `factors` + `rationale` + `sampleSize` + `sources`
into the `dataBasis` JSON column.

## 2. Attribution confidence

Source of truth: `artifacts/api-server/src/lib/intelligence/attribution.ts`.

Every row written to `revenue_attribution` now carries:

- `confidence` (real, 0..1)
- `confidence_band` (`high` | `medium` | `low`)
- `confidence_reason` (free text, e.g. *"single-channel, converted within 7
  days"* or *"90-day gap, view-through only"*)

Per-row confidence is computed by calling the same `computeConfidence`
function with attribution-specific inputs:

- **`sampleSize`** = number of touches credited to that channel for this
  conversion (more touches observed for a channel → more confidence in the
  attributed weight).
- **`sourceReliability`** = `sourceReliability(channel)`, further **capped
  at 0.5** when the touch is a view-through/impression-style channel
  (display, impression, view-through) — those are inherently less certain
  than a first-party click/form/call.
- **`historicalConsistency`** = a function of elapsed time between first
  touch and conversion (`elapsedTimeConsistency`): conversions within **7
  days** score `0.9` consistency; conversions with a **60+ day** gap score
  `0.2`; everything between is linearly interpolated. Short, tight
  conversion windows are more likely to reflect a real causal link between
  touch and purchase than a stale 90-day-old view-through impression.

This means, for example:

- A short single-channel conversion (e.g. one first-party form fill,
  converting within a week) scores **high** confidence — few but highly
  reliable, highly consistent signals.
- A long-gap, view-through-only attribution (e.g. a single display
  impression, 90 days before conversion) scores **low** confidence — the
  view-through discount plus poor time-consistency both pull the score
  down.

All four attribution models (`first_touch`, `last_touch`, `linear`,
`assisted`) compute this per credited row before writing to
`revenue_attribution`.

`GET /attribution/lead/:id` and `GET /attribution/summary` both surface
these fields; the summary endpoint additionally returns `avgConfidence` and
`avgConfidenceBand` computed across all attribution rows.

## 3. Audit trail

Source of truth: `lib/db/src/schema/intelligence.ts` (`recommendationAuditTable`)
and `artifacts/api-server/src/routes/recommendations.ts` /
`artifacts/api-server/src/routes/intelligence-summary.ts`.

### Schema

`recommendation_audit`:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `AUD-####`, sequential |
| `recommendation_id` | text | references `ai_recommendations.id` (no FK, per convention) |
| `event` | text | `generated` \| `viewed` \| `action_created` \| `dismissed` \| `outcome_recorded` |
| `detail` | jsonb | event-specific payload (see lifecycle below) |
| `created_at` | text | ISO timestamp |

`ai_recommendations` gained:

| Column | Type | Notes |
|---|---|---|
| `generated_reason` | text | short reason the recommendation fired |
| `data_sources` | jsonb (`string[]`) | which channel/source(s) fed the insight |
| `action_taken` | boolean | flips to `true` once an action is created |
| `action_id` | text (nullable) | the created task's id |
| `outcome` | text (nullable) | free-text outcome, set via `POST /recommendations/:id/outcome` |
| `outcome_recorded_at` | text (nullable) | ISO timestamp of outcome recording |

### Lifecycle

1. **`generated`** — written once per recommendation inside
   `POST /recommendations/generate`, immediately after insert. `detail`:
   `{ reason, dataSources, confidence, factors }`.
2. **`viewed`** — written by `PATCH /recommendations/:id` when the status
   transitions to `reviewed` (a human looked at it).
3. **`action_created`** — written by `POST /actions/from-recommendation`
   (in `intelligence-summary.ts`) right after the recommendation is flipped
   to `actionTaken = true` / `actionId = <task id>` / `status = "applied"`.
   `detail`: `{ actionId, title, owner }`.
4. **`dismissed`** — written by `PATCH /recommendations/:id` when status
   transitions to `dismissed`.
5. **`outcome_recorded`** — written by `POST /recommendations/:id/outcome`
   after `outcome` + `outcomeRecordedAt` are set. `detail`: `{ outcome }`.

`GET /recommendations/:id/audit` returns the full trail for a
recommendation, ordered by `created_at` ascending (oldest first).

## 4. Governance summary

`GET /governance/summary` (registered inside
`artifacts/api-server/src/routes/intelligence-summary.ts`) returns a
deterministic rollup with no new tables — just aggregates over
`ai_recommendations` and `revenue_attribution`:

```jsonc
{
  "totalRecommendations": number,
  "avgRecommendationConfidence": number,
  "avgRecommendationConfidenceBand": "high" | "medium" | "low",
  "recommendationsByBand": [{ "band": "high", "count": number, "pct": number }, ...],
  "pctActioned": number,       // recommendations with actionTaken = true
  "pctWithOutcome": number,    // recommendations with a non-null outcome
  "totalAttributionRows": number,
  "avgAttributionConfidence": number,
  "avgAttributionConfidenceBand": "high" | "medium" | "low"
}
```

This feeds the "Intelligence Governance" card on the Executive Dashboard
(`artifacts/web/src/components/intel/GovernancePanel.tsx`).
