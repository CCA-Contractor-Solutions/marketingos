# Phase 5 — Predictive Growth Engine: Implementation Notes

## Front-end

This section documents the web front-end built on top of the already-verified
Phase 5 backend (schema, prediction libs, and routes). Scope was strictly
front-end: new types, API client functions, React Query hooks, UI pages,
component extensions, and navigation/routing. No backend files were modified.

### Guardrails enforced in the UI

Every predictive/recommendation surface in Phase 5 makes the following explicit,
in copy and in behavior:

- **Recommendation only, never autonomous.** Budget Intelligence carries a
  prominent, un-missable banner: *"MarketingOS recommends; you decide and
  execute. Nothing changes ad spend automatically."* "Apply" only issues a
  `PATCH` that updates the recommendation's `status` to `applied` — it never
  writes to any channel, campaign, or spend record, and there is no code path
  from the front-end to an ad platform.
- **Confidence + explainability on every predictive output.** `ConfidenceBandPill`
  (reused, not forked) appears on: the Lead Prediction card, every row in
  Predictions.tsx, every Budget Recommendation card, every Market Opportunity
  card, and every Content Opportunity card. The Lead Prediction card also shows
  a ranked list of explainability factors (`PredictionFactor[]`) with
  positive/negative/neutral treatment.
- **Disclaimers on model output.** The Prediction card footer reads: *"This is
  a model-generated prediction, not a guarantee. It does not change this
  lead's status or trigger any outreach automatically."* The Growth Briefing
  page states the briefing is templated from the user's own MarketingOS data
  and "does not take any action on your behalf," and that recommended actions
  are "suggestions for a human to review and execute."
- **Status-only mutations.** All new PATCH hooks (`useUpdateBudgetRecommendation`,
  `useUpdateMarketOpportunity`, `useUpdateContentOpportunity`) only ever send
  `{ status }`, matching the backend's status-only PATCH contract for the
  `growth_recommendation_status` enum (`new → reviewed → applied/dismissed`).

### Files added

| File | Purpose |
|---|---|
| `artifacts/web/src/pages/intel/Predictions.tsx` | Optional overview page at `/predictions`: fleet-wide KPI cards (avg. conversion probability, total expected revenue, high-confidence count), sortable table of all lead predictions joined with lead company names, links into `LeadDetail`, and a "Recompute predictions" action. |
| `artifacts/web/src/pages/intel/BudgetIntelligence.tsx` | New page at `/budget`. Card grid of `BudgetRecommendation`s (from → to channel, shift %/amount, projected qualified-lead and revenue deltas, confidence band, rationale) with Review / Apply / Dismiss actions (PATCH `status` only) and a "Generate recommendations" action. Carries the required guardrail banner. |
| `artifacts/web/src/pages/intel/GrowthBriefing.tsx` | New page at `/briefing`. Executive "Good Morning, Rose" header with templated summary, followed by Wins / Risks (severity-colored) / Opportunities / Recommended Actions sections, and a "Generate briefing" action. |

### Files modified

| File | Changes |
|---|---|
| `artifacts/web/src/lib/intel-types.ts` | Added Phase 5 types matching the backend schema exactly: `GrowthRecommendationStatus`, `MarketOpportunityKind`, `PredictionFactor`, `LeadPrediction`, `RecomputePredictionsRequest/Response`, `BudgetRecommendation`, `UpdateGrowthStatusRequest`, `MarketOpportunity`, `ContentOpportunity`, `BriefingWin/Risk/Opportunity/Action`, `GrowthBriefing`. |
| `artifacts/web/src/lib/intel-api.ts` | Added client functions for every Phase 5 endpoint, each with a `DEMO_MODE` branch: `listLeadPredictions`, `getLeadPrediction`, `recomputePredictions`; `listBudgetRecommendations`, `generateBudgetRecommendations`, `updateBudgetRecommendation`; `listMarketOpportunities`, `generateMarketOpportunities`, `updateMarketOpportunity`; `listContentOpportunities`, `generateContentOpportunities`, `updateContentOpportunity`; `getGrowthBriefing`, `generateGrowthBriefing`. Demo-mode data is derived deterministically from existing lead/campaign data (e.g. `derivePredictionForLead`) or served from realistic static sample arrays, so the demo build is fully interactive with no backend. |
| `artifacts/web/src/hooks/useIntel.ts` | Added `intelKeys` entries and React Query hooks for all of the above: `useLeadPredictions`, `useLeadPrediction`, `useRecomputePredictions`, `useBudgetRecommendations`, `useGenerateBudgetRecommendations`, `useUpdateBudgetRecommendation`, `useMarketOpportunities`, `useGenerateMarketOpportunities`, `useUpdateMarketOpportunity`, `useContentOpportunities`, `useGenerateContentOpportunities`, `useUpdateContentOpportunity`, `useGrowthBriefing`, `useGenerateGrowthBriefing`. All mutations invalidate their corresponding list query keys on success. |
| `artifacts/web/src/pages/intel/LeadDetail.tsx` | Added a "Prediction" card (via `useLeadPrediction`) showing `ConfidenceBandPill`, conversion probability, expected revenue, best follow-up time + reason, and a color-coded explainability factor list, plus the model-output disclaimer described above. |
| `artifacts/web/src/pages/intel/Leads.tsx` | Added a sortable "Conv. probability" column backed by `useLeadPredictions()`, joined per-lead via a `Map`, rendered as a confidence-band-colored percentage badge (or `—` when no prediction exists). |
| `artifacts/web/src/pages/intel/Opportunities.tsx` | Extended the existing Phase 3 category grid with two new sections reusing the same card/`ConfidenceBandPill` pattern: **Market Opportunities** (`useMarketOpportunities`/`useGenerateMarketOpportunities`/`useUpdateMarketOpportunity`) and **Content Opportunities** (`useContentOpportunities`/`useGenerateContentOpportunities`/`useUpdateContentOpportunity`). Each card has Review / Mark actioned / Dismiss actions that PATCH `status` only; a full `CreateActionDialog` flow was not force-fit onto these non-`Recommendation` objects since the dialog's request shape (`CreateActionFromRecommendationRequest`) is specific to Phase 3 recommendations — the simpler status-update flow matches the Budget Intelligence pattern and the backend's status-only PATCH contract. |
| `artifacts/web/src/components/AppLayout.tsx` | Extended `NavKey` with `"predictions" | "budget" | "briefing"`. Added three entries to `GROWTH_INTEL_NAV`: Predictions (`TrendingUp`, aliased `PredictionsIcon`), Budget (`PiggyBank`), Growth Briefing (`Sunrise`) — chosen to avoid collision with icons already in use elsewhere in the file (`Wallet` for Budget Pacing, `Newspaper` for Press Releases). |
| `artifacts/web/src/App.tsx` | Imported `Predictions`, `BudgetIntelligence`, `GrowthBriefing` and registered `<Route path="/predictions" .../>`, `<Route path="/budget" .../>`, `<Route path="/briefing" .../>` in the router `<Switch>`, ahead of the catch-all `NotFound` route. |

### Component/hook reuse

- `ConfidenceBandPill` and `dataBasisWhy` (from `components/intel/ConfidenceBandPill.tsx`) are reused unmodified across every new predictive surface.
- Visual language (`var(--c-surface)`, `var(--c-border)`, `var(--c-brand)`, `cadence-rise` entrance animation, card/grid patterns) matches the existing Phase 3 Opportunities/Intelligence pages — no new design tokens were introduced.
- `useRole()` capabilities gate mutating actions: `canGenerateInsights` gates all "Generate…"/"Recompute" buttons; `canCreateActions` gates Review/Apply/Dismiss and Review/Mark actioned/Dismiss actions.
- `lib/api-zod` and `lib/api-client-react` were not touched, per constraint. `lib/db/src/schema/intelligence.ts` and the API server route files were pre-existing backend work from the prior phase and were not modified in this front-end pass.

### Verification

All three required commands were run from `/home/user/workspace/marketingos` on branch `feat/phase-5-predictive`, with `fnm use 22`:

```
pnpm run typecheck                                                    # exit 0, 0 "error TS"
pnpm --filter @workspace/web run build                                # exit 0
VITE_DEMO_MODE=1 BASE_PATH=./ pnpm --filter @workspace/web run build  # exit 0
```

Results:

- `pnpm run typecheck` — **exit 0**, 0 occurrences of `error TS` (one missing type import, `PredictionFactor`, was caught and fixed in `intel-api.ts` during this pass).
- `pnpm --filter @workspace/web run build` — **exit 0**. Output: `dist/public/assets/index-*.js` ~1.23 MB (345 KB gzip). Pre-existing chunk-size warning only (unrelated to Phase 5 changes).
- `VITE_DEMO_MODE=1 BASE_PATH=./ pnpm --filter @workspace/web run build` — **exit 0**. Confirms every new Phase 5 API function's `DEMO_MODE` branch compiles and the demo bundle builds standalone.

No git commit, push, or PR was made — all changes are left in the working tree on `feat/phase-5-predictive`.
