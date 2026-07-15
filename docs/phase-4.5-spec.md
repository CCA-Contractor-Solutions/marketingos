# Phase 4.5 Spec — Data Quality & Intelligence Governance

A stabilization layer between Phase 4 (ingestion) and Phase 5 (prediction). The AI is only as good as the data — so make every insight **governed**: show how confident it is, how trustworthy the attribution is, and keep an audit trail of what/why/when/result. Built INTO the existing repo on top of Phase 4 architecture. **No duplicate models. No new intelligence sources. No CRM. No autonomous actions.** Extends existing tables/logic.

## Ground truth (match exactly)
- Schema: `lib/db/src/schema/intelligence.ts` conventions (string PKs, text ISO timestamps, jsonb $type, real/integer, no FKs, $inferSelect, re-export via existing `export *`).
- Recommendations already have `confidence` (real) + `dataBasis` (jsonb) columns and a rule-based generator in `routes/recommendations.ts`. Attribution rows are in `revenue_attribution` (model/weight/attributedAmount) computed by `lib/intelligence/attribution.ts`.
- Web client pattern: `intel-api.ts` (with `${API}` prefix + DEMO_MODE branch), `intel-types.ts`, `hooks/useIntel.ts`. Do NOT touch api-zod/api-client-react generation.
- Route conventions: Router/IRouter, inline zod, export default, register in routes/index.ts. Must pass `pnpm run typecheck` + web/api builds (and the demo build must still compile).

## 1) Data Confidence Scoring — formalize (do not leave ad-hoc)
Create `lib/intelligence/confidence.ts` — a single, documented scoring function used everywhere:
```
computeConfidence(inputs: {
  sampleSize: number;          // data volume (leads/events/records behind the signal)
  sourceReliability: number;   // 0..1 — reliability of the data source(s) involved
  historicalConsistency?: number; // 0..1 — how stable the signal is over time (optional; default 0.6)
}): { score: number; band: "high"|"medium"|"low"; factors: {volume:number; reliability:number; consistency:number}; rationale: string }
```
- Volume component: saturating curve on sampleSize (e.g. `min(sampleSize/ N, 1)` with N≈20; document choice). Reliability + consistency as given.
- Weighted blend (document weights, e.g. 45% volume, 35% reliability, 20% consistency) → score 0..1.
- Bands: ≥0.75 high, ≥0.5 medium, else low.
- `sourceReliability` lookup table by provider/source (e.g. first-party website/form = 0.95, CallRail/RingCentral = 0.9, GA4 = 0.8, Google/Meta/LinkedIn ads = 0.75, unknown = 0.5). Put the table in this file, keyed by channel/source string; export `sourceReliability(source)`.
- Refactor `routes/recommendations.ts` to use `computeConfidence` for every recommendation instead of the `0.5 + leads/20` ad-hoc math. Populate `dataBasis` consistently with `{ sampleSize, sources, factors, rationale }`.

## 2) Attribution Confidence
- Add `confidence` (real) + `confidenceBand` (text) + `confidenceReason` (text) columns to `revenue_attribution` (extend table; no new table).
- In `lib/intelligence/attribution.ts`, when computing attribution rows, also compute per-row confidence using a documented heuristic:
  - Short, single-channel, recent journeys → high (e.g. the ABC Construction Google Ad→Website→Call→Customer path).
  - Long gaps between touch and conversion (e.g. impression → 90 days → customer) → low.
  - Factors: number of touches, elapsed time first→convert, whether the credited channel is first-party vs. view-through/impression, source reliability.
  - Return band high/medium/low + a short reason string ("single-channel, converted within 7 days" / "90-day gap, view-through only").
- Surface attribution confidence in `GET /attribution/lead/:id` and `/attribution/summary` (add avg confidence + band).

## 3) Intelligence Audit Trail (prevents black-box AI)
New table `recommendation_audit` "recommendation_audit":
- id (`AUD-…`), recommendationId, event (text: "generated"|"viewed"|"action_created"|"dismissed"|"outcome_recorded"), detail (jsonb), createdAt.
Also add to `ai_recommendations`: `generatedReason` (text — why it was generated), `dataSources` (jsonb string[] — what data created it), and outcome fields: `actionTaken` (boolean default false), `actionId` (text nullable — the task id if an action was created), `outcome` (text nullable — free/short result), `outcomeRecordedAt` (text nullable).
Behavior:
- On generate: write an audit "generated" row per recommendation with `{ reason, dataSources, confidence, factors }`; set generatedReason/dataSources on the rec.
- On `POST /actions/from-recommendation` (Phase 3, in routes): set rec.actionTaken=true, actionId, write audit "action_created".
- On `PATCH /recommendations/:id` status change: write audit row (viewed/dismissed as appropriate).
- New: `POST /recommendations/:id/outcome` { outcome } → sets outcome + outcomeRecordedAt, writes audit "outcome_recorded".
- New: `GET /recommendations/:id/audit` → the audit trail (ordered).

## Routes (register/extend in routes/index.ts and recommendations.ts)
- `GET /recommendations` — include confidence band, dataBasis, generatedReason, dataSources, actionTaken, outcome.
- `GET /recommendations/:id/audit` — audit trail.
- `POST /recommendations/:id/outcome` — record result.
- Attribution endpoints return confidence fields.
- Optional: `GET /governance/summary` — quick stats: avg recommendation confidence by band, avg attribution confidence, % recommendations with action taken, % with outcome recorded. Powers the UI panel.

## Front-end
- **Confidence display**: everywhere a recommendation shows (`IntelligenceDashboard` AI feed, `Opportunities`), show the confidence **band** (High/Medium/Low pill, color-coded) alongside the % and a small "why" tooltip/expandable from `dataBasis.rationale` + `dataSources`.
- **Attribution confidence**: on `LeadDetail` attribution breakdown, show the confidence band + reason per model/row.
- **Audit trail UI**: on a recommendation (Opportunities card detail or a small drawer), show its audit trail (generated → viewed → action created → outcome) and an "Record outcome" action.
- **Governance panel**: a compact "Data Confidence" / "Intelligence Governance" card on the Executive Dashboard (or a small section) fed by `GET /governance/summary` — avg confidence, % actioned, % with recorded outcome. Additive; don't break layout.
- All new intel-api fns need a DEMO_MODE branch (read demo dataset or sensible static values).

## Docs
- Create `docs/data-governance.md`: the confidence model (inputs, weights, bands, source-reliability table), attribution-confidence heuristic, and the audit-trail schema + lifecycle.
- Update `docs/architecture-map.md`: add a "Governance layer" note — confidence + audit wrap the Recommendations/Attribution stages ("every insight carries confidence and an audit trail").

## Explicitly DO NOT build
Predictive/forecasting AI (that's Phase 5), autonomous actions, budget automation, LLM calls at runtime. Keep it rule-based + deterministic governance.

## Testing / acceptance (verify on live DB)
- `computeConfidence` is the single source for recommendation confidence; bands appear in API + UI.
- Attribution rows carry confidence + band + reason; ABC Construction (short single-channel) scores high; a synthetic long-gap path scores low.
- Generating recommendations writes audit "generated" rows with reason + dataSources; creating an action flips actionTaken + writes audit; recording an outcome writes audit; `GET /recommendations/:id/audit` returns the ordered trail.
- `GET /governance/summary` returns sane stats.
- No duplicate models; Phase 2/3/4 endpoints + pages still work; typecheck + web + api + demo builds pass.

## Deliverables
Schema extensions + `lib/intelligence/confidence.ts` + attribution confidence + audit table/logic + routes + UI (confidence bands, attribution confidence, audit trail, governance panel) + docs. Do NOT commit/push/PR — parent verifies on live DB, builds, and PRs. Write `docs/phase-4.5-implementation-notes.md` and report back.
