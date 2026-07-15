# Phase 3 Spec — Activation Layer & Marketing Operations Interface

Build the operational front-end that turns the Phase 2 intelligence backend into a usable command center. Extend the existing web app (`artifacts/web`). **Do not rebuild architecture. Do not duplicate data models. No new CRM dependency. All intelligence flows through the existing Phase 2 schema/APIs.**

## Ground truth / conventions (match exactly)
- Web app: React 19 + Vite, **wouter** routing (`src/App.tsx`), **@tanstack/react-query**, **recharts** for charts, shadcn UI kit in `src/components/ui/*`, **framer-motion**, **lucide-react**.
- Layout: use `AppLayout` from `src/components/AppLayout.tsx` (+ exported `PageLoading`, `PageError`). New pages follow existing page structure (see `src/pages/Campaigns.tsx`, `CampaignDetail.tsx`, `Dashboard.tsx`).
- Design tokens (`src/index.css`): sidebar navy `--sidebar: 222 45% 6%`, primary electric blue `--primary: 221 83% 53%`. Use existing tokens/utility classes — do NOT introduce new colors. Keep the premium "mission control" enterprise SaaS aesthetic. Money via `fmtMoney`, numbers via `fmtNumber` from `src/lib/format.ts`.
- API access: the generated Orval hooks (`@workspace/api-client-react`) only cover Phase 1 endpoints. **Do NOT regenerate Orval / do NOT edit `lib/api-zod` or `lib/api-client-react`.** Instead create a small typed client for Phase 2 endpoints in the web app: `src/lib/intel-api.ts` using the exported `customFetch` from `@workspace/api-client-react` (it already applies base URL + bearer token). Wrap each call in a React Query hook in `src/hooks/useIntel.ts` (`useQuery`/`useMutation`) with sensible query keys. Define response TS types in `src/lib/intel-types.ts` mirroring the API JSON (do not import server types).
- Mobile responsiveness: every page must work down to ~375px. Use responsive grids (`grid-cols-1 md:grid-cols-…`), the existing `use-mobile` hook where useful, and horizontal scroll for wide tables. Sidebar already handles mobile.
- Everything must pass `pnpm run typecheck` and `pnpm --filter @workspace/web run build`.

## Backend additions (small — same conventions as Phase 2, in api-server)
Add these GET aggregation endpoints so the dashboard has clean data (register in `routes/index.ts`; reuse existing tables — no new tables):
- In a new `routes/intelligence-summary.ts`:
  - `GET /intelligence/overview` → `{ totalLeads, qualifiedLeads, customers, revenue, conversionRate }` (conversionRate = customers/totalLeads). Compute from `leadsTable` + `conversionsTable`.
  - `GET /intelligence/funnel` → ordered stages `[{stage,count}]` for: Leads → Qualified → Sales Accepted → Customers (counts from leads status/flags).
  - `GET /intelligence/lead-trend?weeks=8` → `[{ period, leads, customers }]` bucketed by week from `leadsTable.createdAt` (+ conversions). If timestamps are sparse in seed, bucket what exists; never throw.
- **Module 5 actions** reuse the EXISTING `tasksTable` (do NOT create an actions table). Add `routes/intelligence-summary.ts` (or `actions.ts`) endpoint `POST /actions/from-recommendation` that accepts `{ recommendationId, title, owner?, dueAt? }`, creates a task (id `TSK-…` per existing pattern, `aiGenerated: true`, campaign optional), and PATCHes the recommendation status to `applied`. Reading/'updating actions uses existing task endpoints. Document this reuse in code comments.

## Front-end modules (all under `src/pages/intel/` + nav entries)

### Module 1 — Executive Marketing Intelligence Dashboard  → route `/intelligence`
The first true command center. Sections:
- **Growth Overview**: 5 KPI cards (Total Leads, Qualified, Customers, Revenue, Conversion Rate) with big values + tier styling. Data: `GET /intelligence/overview`.
- **Channel Performance** table: Channel | Leads | Qualified | Customers | Revenue | ROI. Data: `GET /channels/intelligence`. Sort by revenue desc. ROI shown as % or "—" when null.
- **Campaign Performance** table: Campaign | Leads Generated | Conversions | Revenue | Performance Score. Data: `GET /campaign-intelligence` (derive a 0–100 performance score client-side from revenue + conversion rate + roi; document the formula). Link each row to the campaign detail.
- **AI Intelligence Feed**: list of recommendations from `GET /recommendations` grouped/badged by category (opportunity / warning / growth). Each item: title, body, confidence, category badge, and a "Create Action" button (Module 5). Include a "Generate insights" button → `POST /recommendations/generate` then refetch.

### Module 2 — Lead Intelligence Workspace  → routes `/leads`, `/leads/:id`
- **Lead List** (`/leads`): table/cards with filters (source, campaign, score tier, status, industry, location) via shadcn `select`/inputs; columns include company, contact, industry, location, score+tier badge, status, revenue. Data: `GET /leads` (client-side filter is fine; use query params where supported). Row → lead detail.
- **Lead Detail** (`/leads/:id`): from `GET /leads/:id` (profile + events + score + attribution). Show: company info, contact, score card (score/tier/reason/recommendedAction), outcome/conversion status, attribution breakdown (from `/attribution/lead/:id` or embedded), and a **marketing journey timeline** (vertical timeline of events with date, type, channel, campaign — e.g. Jun 1 Google Search → Jun 3 Downloaded Guide → Jun 5 Phone Call → Jun 8 Consultation → Jun 20 Customer). Provide actions: mark qualified / sales accepted (PATCH), convert (POST /convert) behind a simple dialog.

### Module 3 — Campaign Operations  → routes `/campaign-ops`, `/campaign-ops/:campaignId`
- **Campaign dashboard**: cards/table of campaign intelligence with performance viz (bar of revenue by campaign). Data: `GET /campaign-intelligence`.
- **Campaign detail**: strategy (objective/audience/service/industry/location), channels, results (leads/qualified/customers/revenue/roi), revenue impact chart. Data: `GET /campaign-intelligence/:campaignId`. Allow editing strategy fields via `PUT` in a dialog.

### Module 4 — Marketing Opportunity Center  → route `/opportunities`
Dedicated AI opportunity area. Pull `GET /recommendations` and present as opportunity cards grouped: Growth Opportunities (high-performing channels, high-value industries, geographic trends), Underperforming campaigns, Content opportunities. Each card actionable ("Create Action"). Include the generate button.

### Module 5 — Marketing Operations Workflow  (actions layer)
AI recommendations → actions. The "Create Action" buttons (Modules 1/4) open a dialog (title prefilled from recommendation, owner, due date) → `POST /actions/from-recommendation`. Actions are tasks; surface them by linking to the existing Task Board (filter aiGenerated) — do NOT build a parallel task system. On the opportunity/feed items, once an action exists, show "Action created" state.

### Module 6 — Data Visualization  (components in `src/pages/intel/charts/`)
Use recharts + the existing `components/ui/chart.tsx` wrapper where helpful. Executive-level, revenue-focused (avoid vanity metrics):
- Lead growth trend (line/area) — `GET /intelligence/lead-trend`.
- Revenue attribution (stacked/grouped bar by model or channel) — `GET /attribution/summary`.
- Channel comparison (bar: revenue + leads) — `GET /channels/intelligence`.
- Campaign performance (bar) — `GET /campaign-intelligence`.
- Conversion funnel — `GET /intelligence/funnel`.
Chart colors: derive from the primary electric-blue token + neutrals; keep on-brand. Animate on load (recharts default is fine). All charts responsive (`ResponsiveContainer`).

### Module 7 — User Roles  (UI gating)
Implement a lightweight client-side role context (`src/lib/roles.tsx`): roles Executive, Marketing Director, Marketing Team, Analyst. Provide a role switcher in the top bar (since there is no real auth yet — clearly a demo/preview control) persisted to localStorage. Gate visibility:
- Executive: view all intelligence (read-all).
- Marketing Director: manage campaigns + insights (can edit campaign strategy, create actions, generate insights).
- Marketing Team: manage assigned work (actions/tasks; limited campaign edit).
- Analyst: reporting/read-only (no edit/create buttons).
Gating is presentational (hide/disable controls) — not security. Add a clear note in code + UI that real enforcement arrives with Phase 4 auth.

## Navigation
Add a new sidebar section "Growth Intelligence" in `AppLayout.tsx` with entries: Intelligence (`/intelligence`), Leads (`/leads`), Campaign Ops (`/campaign-ops`), Opportunities (`/opportunities`). Keep existing nav intact. Register all routes in `App.tsx`. Use lucide icons consistent with existing ones.

## Pre-merge review checklist (must all be true)
- No duplicate data models (Module 5 actions reuse `tasksTable`; no new lead/campaign/event tables).
- No new CRM dependency (no Zoho/anything).
- All intelligence flows through Phase 2 schema/APIs (+ the small read aggregations added here).
- API contracts documented — add `docs/phase-3-api-contracts.md` listing every endpoint the UI consumes with request/response shapes.
- Mobile responsive (≥375px) on every new page.

## Deliverables
- Backend: `routes/intelligence-summary.ts` (overview, funnel, lead-trend, actions/from-recommendation) registered.
- Front-end: `src/lib/intel-api.ts`, `src/lib/intel-types.ts`, `src/hooks/useIntel.ts`, `src/lib/roles.tsx`, pages under `src/pages/intel/`, charts under `src/pages/intel/charts/`, nav wired.
- Docs: `docs/phase-3-api-contracts.md`.
- Do NOT commit/push/PR — parent verifies, builds, documents architecture map, and PRs.
Report a summary of files created/changed and confirm typecheck + web build pass.
