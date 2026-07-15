# Phase 4.5 — Data Quality & Intelligence Governance: Implementation Notes

Branch: `feat/phase-4.5-governance`. Spec: [`docs/phase-4.5-spec.md`](./phase-4.5-spec.md).
Full model + lifecycle write-up: [`docs/data-governance.md`](./data-governance.md).
Architecture note: [`docs/architecture-map.md`](./architecture-map.md#governance-layer-phase-45).

All work is left uncommitted in the working tree per instructions (no
commit/push/PR was made).

## Files changed

### New files

| File | Purpose |
|---|---|
| `artifacts/api-server/src/lib/intelligence/confidence.ts` | `computeConfidence()` + `sourceReliability()` — single source of truth for confidence scoring. |
| `artifacts/api-server/src/lib/intelligence/governance.ts` | `bandForAverage()` — shared band-classification helper for aggregate stats (attribution summary, governance summary), using the same thresholds as `computeConfidence`. |
| `artifacts/web/src/components/intel/ConfidenceBandPill.tsx` | Color-coded High/Medium/Low pill + "why" tooltip (`dataBasisWhy` helper). |
| `artifacts/web/src/components/intel/RecommendationAuditDialog.tsx` | Audit trail viewer + "Record outcome" form for a single recommendation. |
| `artifacts/web/src/components/intel/GovernancePanel.tsx` | Compact "Intelligence Governance" card, fed by `GET /governance/summary`. |
| `docs/data-governance.md` | Confidence model, attribution-confidence heuristic, audit-trail schema + lifecycle. |
| `docs/phase-4.5-implementation-notes.md` | This file. |

### Modified files

| File | Change |
|---|---|
| `lib/db/src/schema/intelligence.ts` | Extended `revenueAttributionTable` (+3 cols) and `aiRecommendationsTable` (+6 cols); added `recommendationAuditTable`. See schema section below. |
| `artifacts/api-server/src/lib/intelligence/attribution.ts` | Per-row confidence computation; `computeAttribution` signature now also needs `convertedAt`. |
| `artifacts/api-server/src/routes/attribution.ts` | Surfaces `confidence`/`confidenceBand`/`confidenceReason`; summary adds `avgConfidence`/`avgConfidenceBand`. |
| `artifacts/api-server/src/routes/leads.ts` | `POST /leads/:id/convert` attribution-row insert now carries confidence fields. |
| `artifacts/api-server/src/seed.ts` | Seed's attribution-row insert now carries confidence fields. |
| `artifacts/api-server/src/routes/recommendations.ts` | All 7 rule-based insights refactored onto `computeConfidence`; added `generatedReason`/`dataSources` population, audit writes on generate/dismiss/reviewed, `GET /recommendations/:id/audit`, `POST /recommendations/:id/outcome`. |
| `artifacts/api-server/src/routes/intelligence-summary.ts` | `POST /actions/from-recommendation` now sets `actionTaken`/`actionId` and writes an `action_created` audit row; added `GET /governance/summary`. |
| `artifacts/web/src/lib/intel-types.ts` | New/extended types: `ConfidenceBand`, `RevenueAttribution` (+3 fields), `AttributionSummary` (+2 fields), `Recommendation` (+6 fields), `RecommendationAuditEntry`, `RecordRecommendationOutcomeRequest`, `GovernanceSummary`, `GovernanceBandBreakdown`. |
| `artifacts/web/src/lib/intel-api.ts` | Added `getRecommendationAudit`, `recordRecommendationOutcome`, `getGovernanceSummary`; added a `DEMO_MODE` branch to `updateRecommendation` (previously mutation-only, no demo branch); extended `DemoDataset` with optional `recommendationAudit`/`governanceSummary` keys. |
| `artifacts/web/src/hooks/useIntel.ts` | Added `useRecommendationAudit`, `useRecordRecommendationOutcome`, `useGovernanceSummary` + matching `intelKeys` entries. |
| `artifacts/web/src/pages/intel/Opportunities.tsx` | Confidence band pill + why tooltip per card; "Audit trail" button opening `RecommendationAuditDialog`. |
| `artifacts/web/src/pages/intel/IntelligenceDashboard.tsx` (Executive Dashboard) | Confidence band pill + why tooltip + "Audit" button on AI Intelligence Feed cards; new `GovernancePanel` card appended (additive, existing layout untouched). |
| `artifacts/web/src/pages/intel/LeadDetail.tsx` | Attribution breakdown cards now show confidence band pill + reason text per row. |
| `docs/architecture-map.md` | New "Governance layer (Phase 4.5)" section + "Layer reference" updates. |

## Schema changes

`lib/db/src/schema/intelligence.ts`:

- **`revenue_attribution`** (extended, no new table): `confidence` (real,
  default 0), `confidence_band` (text, `$type<ConfidenceBand>`, default
  `"low"`), `confidence_reason` (text, default `""`).
- **`ai_recommendations`** (extended): `generated_reason` (text, default
  `""`), `data_sources` (jsonb `string[]`, default `[]`), `action_taken`
  (boolean, default `false`), `action_id` (text, nullable), `outcome`
  (text, nullable), `outcome_recorded_at` (text, nullable).
- **`recommendation_audit`** (new table — the only new table, per hard
  constraint): `id` (text PK, `AUD-####`), `recommendation_id` (text, no
  FK), `event` (text, `$type<RecommendationAuditEvent>`), `detail` (jsonb,
  default `{}`), `created_at` (text).
- New exported types: `ConfidenceBand`, `RecommendationAuditEvent`,
  `RecommendationAuditRow`.
- All new columns follow existing conventions: string PKs, text ISO
  timestamps, no foreign keys, `$type<T>()` on jsonb, `export type XRow =
  typeof xTable.$inferSelect`. Re-exported automatically via the existing
  `export *` chain (`schema/index.ts` → `lib/db/src/index.ts`) — no new
  export wiring was needed.
- Drizzle is push-based in this repo (no migration files); schema.ts is
  the source of truth and a `drizzle-kit push` (or equivalent) against the
  live DB is expected to follow this change, per repo convention.

## Routes

All new/changed routes reuse existing router files — no new router file
was created, so `routes/index.ts` needed **no changes** (the three touched
router modules — `attribution.ts`, `recommendations.ts`,
`intelligence-summary.ts` — were already registered).

| Method | Path | Change |
|---|---|---|
| GET | `/attribution/summary` | Adds `avgConfidence`, `avgConfidenceBand` |
| GET | `/attribution/lead/:id` | Each row now includes `confidence`, `confidenceBand`, `confidenceReason` |
| GET | `/recommendations` | Each item now includes `confidenceBand`, `generatedReason`, `dataSources`, `actionTaken`, `actionId`, `outcome`, `outcomeRecordedAt` |
| POST | `/recommendations/generate` | Confidence now computed via `computeConfidence`; writes a `generated` audit row per new recommendation |
| PATCH | `/recommendations/:id` | Writes `viewed` audit row on transition to `reviewed`, `dismissed` audit row on transition to `dismissed` |
| GET | `/recommendations/:id/audit` | **New.** Ordered audit trail for one recommendation (404 if recommendation doesn't exist) |
| POST | `/recommendations/:id/outcome` | **New.** Body `{ outcome: string }`; sets `outcome` + `outcomeRecordedAt`; writes `outcome_recorded` audit row |
| POST | `/actions/from-recommendation` | Now also sets `actionTaken: true`, `actionId: <task.id>` on the recommendation; writes `action_created` audit row; response `recommendation` object includes `actionTaken`/`actionId` |
| GET | `/governance/summary` | **New** (optional per spec, built). Returns avg recommendation confidence (+ band breakdown), avg attribution confidence, `pctActioned`, `pctWithOutcome`. |

## Confidence model summary

- **`computeConfidence({ sampleSize, sourceReliability, historicalConsistency? })`**
  → `{ score, band, factors: { volume, reliability, consistency }, rationale }`.
  - `volume = min(sampleSize / 20, 1)` (saturates at 20 data points).
  - `score = 0.45 * volume + 0.35 * reliability + 0.20 * consistency` (consistency defaults to `0.6` if omitted).
  - Bands: `score >= 0.75` high, `>= 0.5` medium, else low.
- **`sourceReliability(source)`**: lookup table — first-party website/form
  0.95, CallRail/RingCentral/phone_call 0.90, GA4 0.80, Google/Meta/LinkedIn
  ads 0.75, search_console/organic/referral/events ~0.65–0.75, email 0.70,
  unknown fallback 0.50.
- **Recommendations** (`recommendations.ts`): every one of the 7 rule-based
  insight blocks (industry conversion, channel revenue/lead, location
  conversion, dead-channel detection, source-conversion-multiplier,
  spend-vs-ROI, phone-call outcomes) now calls `computeConfidence` with an
  insight-appropriate `sampleSize` + `sourceReliability(...)`, replacing the
  old `0.5 + leads/20` ad-hoc math entirely. `dataBasis` is now always
  `{ sampleSize, sources, factors, rationale, ...insight-specific extras }`.
- **Attribution** (`attribution.ts`): per-row confidence uses touch count as
  `sampleSize`, channel reliability (halved-cap at 0.5 for view-through
  channels) as `sourceReliability`, and an elapsed-time-based consistency
  score (`elapsedTimeConsistency`: 7 days → 0.9, 60+ days → 0.2, linear
  in between) as `historicalConsistency`. This produces the expected
  acceptance-criteria behavior: a short single-channel conversion scores
  **high**; a long-gap, view-through-only touch scores **low**.
- **Governance summary**: aggregate averages are classified into bands via
  the shared `bandForAverage()` helper, which uses the identical thresholds
  as `computeConfidence` so a single row and a rolled-up average are always
  classified consistently.

## Hard constraints — compliance check

- **No duplicate models.** Only new table is `recommendation_audit`; both
  `revenue_attribution` and `ai_recommendations` were extended in place.
- **No predictive/forecasting AI, no autonomous actions, no budget
  automation, no runtime LLM calls.** All governance logic is plain
  arithmetic (`computeConfidence`, `elapsedTimeConsistency`,
  `bandForAverage`) over already-persisted data. `generateWithLLM` remains
  an unimplemented, unused hook (throws if called) — untouched.
- **Conventions matched:** string PKs (`AUD-####`, count-based like
  existing `REC-`/`ATTR-`/`CONV-` ids), text ISO timestamps, no FKs,
  `Router`/`IRouter` + `export default router`, inline `z.object({...})`
  schemas (`RecordOutcomeBody`, `UpdateRecommendationBody`). `api-zod` /
  `api-client-react` generation was not touched.

## Verification results

Run from repo root with:
```
export PATH="$HOME/.local/share/fnm:$PATH"; eval "$(fnm env)"; fnm use 22
cd /home/user/workspace/marketingos
```

| Command | Result |
|---|---|
| `pnpm run typecheck` | **Exit 0**, 0 occurrences of `error TS` (all 5 workspace projects — api-server, mobile, walkthrough, web, scripts — reported "Done") |
| `pnpm --filter @workspace/api-server run build` | **Exit 0** (esbuild bundle, `dist/index.mjs` 2.3mb) |
| `pnpm --filter @workspace/web run build` | **Exit 0** (Vite build, 2915 modules transformed) |
| `VITE_DEMO_MODE=1 BASE_PATH=./ pnpm --filter @workspace/web run build` | **Exit 0** (Vite build, demo mode, 2915 modules transformed) |

Vite emits benign sourcemap warnings for pre-existing shadcn/ui files
(`tooltip.tsx`, `label.tsx`, `select.tsx`, `sheet.tsx`) unrelated to this
change, and a chunk-size advisory (pre-existing, not a regression) — neither
affects the build's exit code or correctness.

Note: `artifacts/web/public/demo-data/demo-data.json` does not exist in the
working tree on this branch (confirmed via git history — it was introduced
in a commit that is not an ancestor of the current `feat/phase-4.5-governance`
HEAD). This does not block any of the 4 verification builds, since
`DEMO_MODE` code paths `fetch()` this file at runtime rather than importing
it at build time; TypeScript does not validate the JSON's existence. If a
live demo run is needed later, that file (or an equivalent object satisfying
`DemoDataset`) will need to be present/regenerated — the new optional keys
`recommendationAudit` and `governanceSummary` are optional in `DemoDataset`
specifically so an older/missing demo-data.json still works, falling back to
the static `DEMO_GOVERNANCE_SUMMARY` and an empty audit-trail array.

## Not done / explicitly out of scope

- No predictive/forecasting AI, autonomous actions, budget automation, or
  runtime LLM calls were added, per hard constraints.
- No `git commit`/`push`/PR was made — all changes are left in the working
  tree on `feat/phase-4.5-governance`, as instructed.
- `api-zod`/`api-client-react` generation was not touched.
- Did not regenerate/create `artifacts/web/public/demo-data/demo-data.json`
  (out of scope — see note above; not required for the 4 verification
  builds to pass).
