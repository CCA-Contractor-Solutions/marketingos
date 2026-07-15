# Phase 3 — Activation Layer: Implementation Notes

Branch: `feat/phase-3-activation`. All changes left in the working tree —
nothing committed, pushed, or PR'd per instructions.

## Verification

```
export PATH="$HOME/.local/share/fnm:$PATH"; eval "$(fnm env)"; fnm use 22
cd /home/user/workspace/marketingos
pnpm run typecheck        # exit 0, zero "error TS"
pnpm --filter @workspace/web run build   # exit 0
```

Both passed. `pnpm run typecheck` ran `tsc --build` across
`api-server`, `mobile`, `walkthrough`, `web`, and `scripts` — all
"Done" with no errors. `pnpm --filter @workspace/web run build` produced
`dist/public` successfully (the four "Error when using sourcemap for
reporting an error" lines are benign Vite/Rollup sourcemap warnings for
pre-existing shadcn files, not build failures — build exited 0 and
emitted a working bundle).

## Files created

**Backend**
- `artifacts/api-server/src/routes/intelligence-summary.ts` — 4 new endpoints (see below).

**Frontend — lib/hooks**
- `artifacts/web/src/lib/intel-types.ts` — TypeScript types mirroring every Phase 2/3 JSON response shape consumed by the UI (leads, attribution, channels, campaign intelligence, recommendations, intelligence summary).
- `artifacts/web/src/lib/intel-api.ts` — Typed fetch functions using `customFetch` from `@workspace/api-client-react`, one per endpoint.
- `artifacts/web/src/lib/intel-scoring.ts` — Client-side campaign performance score (0–100) formula + tier helper.
- `artifacts/web/src/lib/roles.tsx` — Module 7: `RoleProvider`/`useRole` context, 4 roles, localStorage-persisted, presentational-only capability gates.
- `artifacts/web/src/hooks/useIntel.ts` — React Query hooks (queries + mutations) wrapping `intel-api.ts`, with query keys and cache invalidation.

**Frontend — components**
- `artifacts/web/src/components/RoleSwitcher.tsx` — Top-bar role switcher (shadcn `Select`), rendered globally inside `AppLayout`'s header.
- `artifacts/web/src/components/intel/CreateActionDialog.tsx` — Module 5 shared "Create Action" dialog (shadcn `Dialog`), used by Modules 1 and 4.

**Frontend — pages**
- `artifacts/web/src/pages/intel/IntelligenceDashboard.tsx` — Module 1, route `/intelligence`.
- `artifacts/web/src/pages/intel/Leads.tsx` — Module 2 list, route `/leads`.
- `artifacts/web/src/pages/intel/LeadDetail.tsx` — Module 2 detail, route `/leads/:id`.
- `artifacts/web/src/pages/intel/CampaignOps.tsx` — Module 3 dashboard, route `/campaign-ops`.
- `artifacts/web/src/pages/intel/CampaignOpsDetail.tsx` — Module 3 detail, route `/campaign-ops/:campaignId`.
- `artifacts/web/src/pages/intel/Opportunities.tsx` — Module 4, route `/opportunities`.

**Frontend — charts (Module 6)**
- `artifacts/web/src/pages/intel/charts/LeadGrowthChart.tsx`
- `artifacts/web/src/pages/intel/charts/RevenueAttributionChart.tsx`
- `artifacts/web/src/pages/intel/charts/ChannelComparisonChart.tsx`
- `artifacts/web/src/pages/intel/charts/CampaignPerformanceChart.tsx`
- `artifacts/web/src/pages/intel/charts/ConversionFunnelChart.tsx`

**Docs**
- `docs/phase-3-api-contracts.md` — every endpoint the UI consumes (new + reused Phase 2), request/response shapes.
- `docs/phase-3-implementation-notes.md` — this file.

## Files changed

- `artifacts/api-server/src/routes/index.ts` — imported and registered `intelligenceSummaryRouter`.
- `artifacts/web/src/App.tsx` — imported the 6 new page components, added 6 new `<Route>` entries, wrapped the app in `RoleProvider`.
- `artifacts/web/src/components/AppLayout.tsx` — extended `NavKey` with `intelligence | leads | campaign-ops | opportunities`; added a "Growth Intelligence" sidebar section (4 links, same style as the existing "Workspace" section); rendered `<RoleSwitcher />` in the top bar next to the notifications bell.
- `lib/api-client-react/src/index.ts` — added `customFetch`, `ApiError`, `ResponseParseError`, and their supporting types to the package's public exports (the underlying `custom-fetch.ts` implementation was **not modified**; only the barrel export list was extended so `intel-api.ts` can import `customFetch` as the spec requires). Orval-generated files (`generated/api.ts`, `generated/api.schemas.ts`) were **not touched**, and `lib/api-zod` was **not touched**.

## Routes added (backend)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/intelligence/overview` | `{ totalLeads, qualifiedLeads, customers, revenue, conversionRate }` |
| GET | `/intelligence/funnel` | `[{ stage, count }]` — Leads → Qualified → Sales Accepted → Customers |
| GET | `/intelligence/lead-trend?weeks=8` | `[{ period, leads, customers }]` weekly buckets |
| POST | `/actions/from-recommendation` | Creates a task via `tasksTable` (reused, no new table) + PATCHes the source recommendation to `applied` |

Full request/response shapes and every reused Phase 2 endpoint the UI calls
are documented in `docs/phase-3-api-contracts.md`.

## Pages added (frontend)

| Module | Page | Route |
| --- | --- | --- |
| 1 — Executive Dashboard | `IntelligenceDashboard.tsx` | `/intelligence` |
| 2 — Lead Workspace | `Leads.tsx` | `/leads` |
| 2 — Lead Workspace | `LeadDetail.tsx` | `/leads/:id` |
| 3 — Campaign Ops | `CampaignOps.tsx` | `/campaign-ops` |
| 3 — Campaign Ops | `CampaignOpsDetail.tsx` | `/campaign-ops/:campaignId` |
| 4 — Opportunity Center | `Opportunities.tsx` | `/opportunities` |

Module 5 (action dialogs) is the shared `CreateActionDialog` component, not
a route — it's opened from both Module 1 (AI Intelligence Feed cards) and
Module 4 (opportunity cards). Module 6 (charts) and Module 7 (roles) are
library/component-level, not routed pages.

## Design & constraint compliance

- **No duplicate data models.** All new backend logic reads from
  `leadsTable` / `conversionsTable` / `aiRecommendationsTable` (existing
  Phase 2 tables) and writes only via the existing `tasksTable`. No new
  tables or CRM dependency were introduced.
- **Module 5 reuses `tasksTable`.** Documented in code comments at the top
  of `intelligence-summary.ts`'s `/actions/from-recommendation` handler and
  in `CreateActionDialog.tsx`.
- **Design tokens.** All new markup uses the existing `--c-*` custom
  properties (`var(--c-surface)`, `var(--c-border)`, `var(--c-brand)`,
  etc.) exactly as Campaigns/Dashboard/CampaignDetail/Analytics do — no new
  colors were introduced. Chart series colors use the existing
  `--chart-1`..`--chart-5` tokens plus `--c-emerald`/`--c-amber`/`--c-rose`
  for tier/status indicators. The sidebar background
  (`linear-gradient(180deg, #0a1410 0%, #05090a 100%)`) was already navy
  and required no change.
- **shadcn components only.** All dialogs, selects, inputs, tables, and
  badges use the existing components under `src/components/ui/*`
  (`Dialog`, `Select`, `Input`, `Label`, `Table`, `Badge`, `Button`) —
  no new UI primitives were added.
- **Responsive to 375px.** Filter bars and KPI grids collapse to a single
  column below `sm`/`lg` breakpoints; all data tables are wrapped in
  `overflow-x-auto` containers so wide tables scroll horizontally on
  narrow viewports instead of squeezing/breaking layout.
- **Reused shared primitives.** Every new page uses `AppLayout`,
  `PageLoading`, and `PageError` from the existing
  `components/AppLayout.tsx`; money values use `fmtMoney` and counts use
  `fmtNumber` from `lib/format.ts` throughout.
- **Campaign performance score** is computed entirely client-side from
  `GET /campaign-intelligence` fields (revenue, leads, customers, ROI) —
  formula and rationale documented in `src/lib/intel-scoring.ts` and
  restated in the Campaign Performance table's subtitle and the campaign
  detail page's score card.
- **Role gating (Module 7)** is explicitly presentational-only; the header
  comment in `roles.tsx` and the "Verify before finishing" checklist both
  note that Phase 4 is expected to add real server-side auth/authorization.

## Known follow-ups (not blockers)

- The web build reports one chunk over 500kB post-minification (the usual
  Vite warning for a SPA bundling Recharts + Framer Motion + all pages
  into one chunk). Not a build failure; code-splitting could be added in
  a later phase if bundle size becomes a concern.
- `GET /leads` does not support `industry`/`location`/free-text search
  server-side, so those filters are applied client-side in `Leads.tsx`
  after fetching the (currently unpaginated) full list — matches the
  spec's explicit "GET /leads, client-filter ok" allowance.
