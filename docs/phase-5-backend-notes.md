# Phase 5 — Predictive Growth Engine: Backend Implementation Notes

Scope of this note: **backend only** (schema, prediction libs, routes), built per
[`docs/phase-5-spec.md`](./phase-5-spec.md). Front-end (`intel-api.ts`, `intel-types.ts`,
`hooks/useIntel.ts`, `src/pages/intel/*`, `AppLayout` nav) is intentionally untouched —
that is a separate task. This file is the contract that task should build against.

## Guardrails (enforced in code, not just docs)

- **Recommendation-only.** Nothing in Phase 5 changes spend, posts content, schedules
  anything, or writes to an external platform. `budget_recommendations.status`,
  `market_opportunities.status`, and `content_opportunities.status` only ever record a
  **human decision** (`new → reviewed → applied/dismissed`). "applied" means "a human
  decided to act on this and we recorded that" — there is no ad-platform/CMS/CRM write
  path wired to any Phase 5 mutation. See the guardrail comments at the top of
  `routes/growth.ts` and inside `budgetIntelligence.ts`.
- **Confidence + explainability on every predictive output.** Every row/response from
  every module carries `confidence` + `confidenceBand` (from the existing
  `computeConfidence` in `lib/intelligence/confidence.ts`) plus an explainability
  payload (`factors` for lead predictions, `dataBasis` for market opportunities,
  `basedOn` for content opportunities, `rationale` everywhere). Low sample size ⇒
  honestly low confidence — no overrides.
- **No black-box ML, no runtime LLM calls.** Every model is a pure, deterministic,
  documented function. `generateWithLLM` in `routes/recommendations.ts` remains an
  unused, clearly-marked future hook — Phase 5 does not add a new one.
- **Governance reuse, no parallel systems.** Phase 5 reuses the Phase 4.5
  `recommendation_audit` table (keyed by each new row's own id) and the existing
  `POST /actions/from-recommendation` → `tasksTable` pattern for turning any Phase 5
  recommendation into a human-tracked action. No new audit table, no new action/task
  system.

## Data model (added to `lib/db/src/schema/intelligence.ts`)

All five tables follow existing conventions exactly: string PKs with a per-model
prefix, text ISO timestamps, `jsonb().$type<...>()` for structured payloads, no FKs,
and an exported `$inferSelect` type. Re-exported automatically via the existing
`export * from "./intelligence"` in `lib/db/src/schema/index.ts` — no new export line
needed.

| Table | PK prefix | Purpose | Key columns |
|---|---|---|---|
| `lead_predictions` | `PRED-` | Latest prediction per lead | `leadId`, `conversionProbability` (real 0..1), `expectedRevenue` (int), `bestFollowUpAt`/`bestFollowUpReason`, `confidence`/`confidenceBand`, `factors` (jsonb `PredictionFactor[]`), `modelVersion` |
| `budget_recommendations` | `BUD-` | Channel shift recommendations | `fromChannel`, `toChannel`, `shiftPct`, `shiftAmount`, `projectedQualifiedDelta`, `projectedRevenueDelta`, `rationale`, `confidence`/`confidenceBand`, `status` |
| `market_opportunities` | `MOP-` | Geography/industry/trend/segment signals | `kind`, `title`, `insight`, `signalStrength`, `confidence`/`confidenceBand`, `dataBasis` (jsonb), `status` |
| `content_opportunities` | `COP-` | Content gaps + high-performing topics | `topic`, `rationale`, `basedOn` (jsonb), `projectedImpact`, `confidence`/`confidenceBand`, `status` |
| `growth_briefings` | `BRIEF-` | "Good Morning, Rose" executive digest | `periodLabel`, `wins`/`risks`/`opportunities`/`recommendedActions` (jsonb arrays), `summary` |

`lead_predictions` stores only the **latest** prediction per lead — recompute
delete-then-inserts rather than appending history (there's no per-lead decision to
audit on a prediction itself; the audit trail lives on whatever recommendation/action
is later derived from it).

`status` on the other three tables reuses the same 4-value enum as
`ai_recommendations.status` (`GrowthRecommendationStatus = "new" | "reviewed" |
"applied" | "dismissed"`).

## Prediction libs (`artifacts/api-server/src/lib/intelligence/prediction/`)

All pure functions — no DB access inside the lib files themselves (routes fetch rows
and pass them in). Deterministic: same input always produces the same output.

### `leadConversion.ts` — `predictLeadConversion(lead, events, cohortStats, now?)`

- **conversionProbability**: log-odds blend —
  `base = 0.55·tierPrior(scoreTier) + 0.30·cohortRate(tier,industry,source) + 0.15·eventIntentScore(events)`,
  then `probability = sigmoid(logit(base) + eventNudge(events, lead))`, clamped to
  `[0.01, 0.99]`. Working in log-odds space keeps additive nudges (phone call +0.3,
  meeting +0.3, pricing inquiry +0.25, stale >30d −0.35, recent ≤2d +0.1, capped at
  ±0.6 total) from pushing the result outside `[0,1]`.
  `cohortRate` is the **calibration** step: the real historical conversion rate for
  leads sharing this lead's `(scoreTier, industry, firstTouchChannel)`, computed by
  `buildCohortStats(allLeads)` (also exported from this file) directly from
  `leads`/`isCustomer` — no synthetic data.
- **expectedRevenue** = `round(conversionProbability × expectedDealSize)`, where
  `expectedDealSize` = average `revenueGenerated` of converted leads in the same
  industry, falling back to the global average of all converted leads.
- **bestFollowUpAt/Reason**: documented rule table — no events → 24h ("establish first
  contact"); high-intent signal + never called → 4h; last touch ≤2 days → 24h ("strike
  while warm"); ≤7 days → now ("re-engage"); >7 days → now, flagged stale/going cold.
- **factors**: ordered `{label, effect, detail}[]` — tier prior, cohort rate + sample
  size, event-intent notes, and every nudge that fired (phone call, meeting, pricing
  inquiry, staleness, recency).
- **confidence**: `computeConfidence({ sampleSize: cohort.sampleSize, sourceReliability:
  sourceReliability(firstTouchChannel), historicalConsistency: based on this lead's own
  event count })`.

### `budgetIntelligence.ts` — `recommendBudgetShifts(channelIntel)`

- Input is the exact `ChannelIntelligence[]` shape from
  `lib/intelligence/channels.ts#computeChannelIntelligence` (leads/qualified/customers/
  revenue/spend/roi per channel) — no new channel aggregation logic.
- Picks the lowest-ROI spending channel (`from`) and highest-ROI spending channel
  (`to`, excluding `from`); returns `[]` if fewer than 2 channels have spend or `to`
  isn't actually better than `from`.
- `shiftPct = clamp(roiGap × 10, 5%, 20%)` (spec cap: 20%); `shiftAmount = round(from.spend
  × shiftPct)`.
- **Linear PROJECTION**, explicitly labeled as such in the rationale string: assumes
  today's qualified-per-dollar and revenue-per-dollar efficiency holds at the margin for
  both channels. `projectedQualifiedDelta`/`projectedRevenueDelta` = the shifted-dollar
  delta between `to`'s and `from`'s current per-dollar rates.
- `confidence`: sample size = combined lead volume of both channels; reliability =
  average of `sourceReliability(fromChannel)`/`sourceReliability(toChannel)`.
- **Never applies anything** — pure recommendation object; the route only persists it.

### `marketOpportunity.ts` — `detectMarketOpportunities(leads, conversions, events)`

Four signal types, each skipped when the underlying cohort is too small
(`MIN_COHORT = 3` leads) or the lift/growth doesn't clear its threshold:

1. **industry** — an industry's conversion rate ≥ 1.5× the overall average.
2. **geography** — same lift math, bucketed by `lead.location`.
3. **segment** — an `(industry, location)` pair that individually clears `MIN_COHORT`
   and beats the lift threshold (e.g. "Commercial contractors in FL").
4. **trend** — a lead `source` (from ingested `marketing_events`) whose last-30-day
   event volume is ≥1.5× its prior-30-day volume (new sources with no prior activity
   count as an emerging trend at a fixed multiplier).

`signalStrength = clamp01(multiplier / 4)` for all four (0..1, separate from
`confidence`, which reflects trust in the measurement, not the size of the effect).
`dataBasis` carries the raw counts/rates for every opportunity.

### `contentIntelligence.ts` — `identifyContentOpportunities(events, campaigns, leads)`

- **High-performing topics**: counts `content_download` events per content name
  (from `metadata.contentName`/`metadata.asset`, matching `journey.ts`'s derivation);
  the top performer (≥2 downloads) becomes a "double down" opportunity with its
  multiplier vs. the average asset.
- **Gaps**: industries with ≥3 leads and no matching content-download name and no
  `campaign_intelligence` row tagged with that industry get a "create content" opportunity,
  modeled on the single best-performing analogous asset found above (mirrors the spec's
  "electrical guide, analogous to a 4x-engagement HVAC guide" example). If no analogous
  content exists yet, the opportunity is still produced but flagged lower-confidence and
  without a numeric projection.
- `projectedImpact` is a short templated string (the multiplier vs. baseline), never an
  LLM output.

### `briefing.ts` — `buildGrowthBriefing(allIntel)`

Assembles, from already-computed Module 1-4 outputs (never fetches anything itself):

- **wins**: new customers in the last 7 days (revenue + company names) + leads with a
  **high-confidence** prediction and `conversionProbability ≥ 0.6` ("likely to close
  soon" — explicitly not a promise).
- **risks**: channels with `roi < 0` (spending more than they return, severity scales
  with how negative) + leads whose `bestFollowUpReason` matches `/stale|cold|cooling/i`
  (going cold without follow-up).
- **opportunities**: top market opportunity by `signalStrength` + top content
  opportunity by `confidence.score`.
- **recommendedActions**: the single best budget shift (if any) + top 3 non-customer
  leads by `conversionProbability` + the top content opportunity.
- **summary**: a short templated paragraph (string interpolation over the sections
  above) — explicitly NOT an LLM call, per spec.

## Routes

Both files follow the repo's route conventions exactly: `Router`/`IRouter`, inline
`zod` schemas, `export default router`, registered in `routes/index.ts`. Mutating
(non-GET) requests are automatically gated by the existing shared
`requireApiToken` middleware in `app.ts` — no per-route auth code needed.

### `routes/predictions.ts`

| Method | Path | Notes |
|---|---|---|
| GET | `/predictions/leads` | All (or `?leadId=`-filtered) latest predictions, sorted by probability desc. |
| GET | `/predictions/leads/:id` | Full prediction (factors + follow-up timing + confidence) for lead `:id`. 404 if not yet computed. |
| POST | `/predictions/recompute` | Body `{ leadIds?: string[] }` (omit/empty = all leads). Recomputes via `buildCohortStats` + `predictLeadConversion`, replaces each affected lead's `lead_predictions` row. Exports `recomputeAllPredictions` for reuse. |

### `routes/growth.ts`

| Method | Path | Notes |
|---|---|---|
| GET | `/budget/recommendations` | List, newest first. |
| POST | `/budget/recommendations/generate` | Computes current channel intelligence (same inputs as `GET /channels/intelligence`) → `recommendBudgetShifts` → persists + audits `generated`. |
| PATCH | `/budget/recommendations/:id` | Body `{ status }`. Only updates `status`; audits `viewed`/`dismissed`/`action_created` (for "applied") — **never touches spend**. |
| GET | `/market/opportunities` | List, newest first. |
| POST | `/market/opportunities/generate` | `detectMarketOpportunities` → persists + audits `generated`. |
| PATCH | `/market/opportunities/:id` | Body `{ status }`, same audit pattern. |
| GET | `/content/opportunities` | List, newest first. |
| POST | `/content/opportunities/generate` | `identifyContentOpportunities` → persists + audits `generated`. |
| PATCH | `/content/opportunities/:id` | Body `{ status }`, same audit pattern. |
| GET | `/growth/briefing` | Latest briefing (404 if none generated yet). |
| POST | `/growth/briefing/generate` | Recomputes channel intel, budget shifts, market/content opportunities, and lead predictions (reuses stored `lead_predictions` if present, else computes read-only on the fly) → `buildGrowthBriefing` → persists. |

All `POST .../generate` and `PATCH .../:id` mutations write to the existing
`recommendation_audit` table (Phase 4.5), keyed by the new row's own id, using the same
`generated`/`viewed`/`dismissed`/`action_created` event vocabulary already used by
`ai_recommendations`. Turning any Phase 5 row into a tracked task still goes through the
existing, unchanged `POST /actions/from-recommendation` (it takes any
`recommendationId` string, so a `BUD-`/`MOP-`/`COP-`/`PRED-` id works exactly like a
`REC-` id — no new endpoint was needed for this).

## New route paths (for the front-end task)

```
GET    /predictions/leads
GET    /predictions/leads/:id
POST   /predictions/recompute

GET    /budget/recommendations
POST   /budget/recommendations/generate
PATCH  /budget/recommendations/:id

GET    /market/opportunities
POST   /market/opportunities/generate
PATCH  /market/opportunities/:id

GET    /content/opportunities
POST   /content/opportunities/generate
PATCH  /content/opportunities/:id

GET    /growth/briefing
POST   /growth/briefing/generate
```

(All are mounted under the existing `/api` prefix by `app.ts`, same as every other
route in the repo — e.g. `/api/predictions/leads`.)

## New table names

```
lead_predictions
budget_recommendations
market_opportunities
content_opportunities
growth_briefings
```

Exported row types: `LeadPredictionRow`, `BudgetRecommendationRow`,
`MarketOpportunityRow`, `ContentOpportunityRow`, `GrowthBriefingRow` (all
`$inferSelect`, all importable from `@workspace/db`). Also exported:
`PredictionFactor`, `GrowthRecommendationStatus`, `MarketOpportunityKind`,
`BriefingWin`, `BriefingRisk`, `BriefingOpportunity`, `BriefingAction`.

## Verification performed

- `pnpm run typecheck` — exit 0, 0 occurrences of `error TS`.
- `pnpm --filter @workspace/api-server run build` — exit 0.
- No edits made to `lib/api-zod`, `lib/api-client-react`, `intel-api.ts`,
  `intel-types.ts`, `hooks/useIntel.ts`, any `src/pages/intel/*`, or `AppLayout`.
- No git commit/push/PR performed — changes are left in the working tree on
  `feat/phase-5-predictive`.

## Not done in this task (left for the front-end task / a later pass)

- `docs/predictive-intelligence.md` and the `docs/architecture-map.md` "Predictive
  Layer" update mentioned in the spec's Docs section were not created — the spec's
  Deliverables line assigns docs to the parent alongside UI; this backend task's
  instructions scoped deliverables to schema + libs + routes + this notes file. If the
  front-end/parent task expects `predictive-intelligence.md`, it should be added
  alongside the UI work using the formulas summarized above.
- Front-end pages, `intel-api.ts`/`intel-types.ts` functions, hooks, and nav entries —
  explicitly out of scope per this task's instructions.
