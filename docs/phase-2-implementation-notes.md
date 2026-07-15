# Phase 2 Implementation Notes — CCA Growth Intelligence Backend

Implements the data-intelligence backend + typed API described in
[`docs/phase-2-spec.md`](./phase-2-spec.md). No frontend/dashboard was created.
No provider SDKs were hardcoded. `lib/api-zod` was not modified.

## Files created

**Schema**
- `lib/db/src/schema/intelligence.ts` — all Phase 2 tables + `$inferSelect` row types.

**Intelligence library (pure functions, no HTTP)**
- `artifacts/api-server/src/lib/intelligence/scoring.ts` — `SCORING_RULES` + `scoreLead()`.
- `artifacts/api-server/src/lib/intelligence/attribution.ts` — `computeAttribution()` (first/last/linear/assisted).
- `artifacts/api-server/src/lib/intelligence/journey.ts` — `computeJourney()`.
- `artifacts/api-server/src/lib/intelligence/channels.ts` — `computeChannelIntelligence()`.
- `artifacts/api-server/src/lib/intelligence/refresh.ts` — shared `refreshLeadJourneyAndScore()` helper used by both the events and leads routes to avoid duplicating the journey/score persistence logic.

**Routes**
- `artifacts/api-server/src/routes/events.ts`
- `artifacts/api-server/src/routes/leads.ts`
- `artifacts/api-server/src/routes/attribution.ts`
- `artifacts/api-server/src/routes/channels.ts`
- `artifacts/api-server/src/routes/campaign-intelligence.ts`
- `artifacts/api-server/src/routes/recommendations.ts`
- `artifacts/api-server/src/routes/integrations.ts`
- `artifacts/api-server/src/routes/integrations/providers.ts` — `IntegrationConnector` interface + `CONNECTOR_REGISTRY` of stubs (google_ads, meta_ads, linkedin_ads, ga4, search_console, callrail, ringcentral, email). Every stub returns `{ ok: false, reason: "not_configured" }` for both `testConnection()` and `sync()`. No provider SDKs are imported.

## Files changed

- `lib/db/src/schema/index.ts` — added `export * from "./intelligence";`.
- `artifacts/api-server/src/routes/index.ts` — registered the 7 new routers (`router.use(...)`) alongside the existing ones.
- `artifacts/api-server/src/seed.ts` — added a new, fully idempotent `seedIntelligenceData()` section (channels, integrations registry, leads + events, customers, conversions, revenue attribution, campaign intelligence) called from `seedDatabase()`. The existing seed content (campaigns/tasks/threads/messages/assistant/app content) is untouched; its early-return guard was restructured so the Phase 2 section always runs — and stays idempotent — regardless of whether the core marketing data was already seeded.
- `artifacts/api-server/package.json` — added `"zod": "catalog:"` to `dependencies` (api-server had no direct zod dependency; it's now installed directly rather than relying on hoisting, matching how `lib/db` and `lib/api-zod` already declare it against the same `pnpm-workspace.yaml` catalog entry `^3.25.76`). Ran `pnpm install` to link it.

## Tables added (`lib/db/src/schema/intelligence.ts`)

| Table | Purpose |
|---|---|
| `roles` | `rolesTable` — id, name, description, permissions[] |
| `users` | `usersTable` — id, name, email, roleId, createdAt |
| `leads` | `leadsTable` — company/contact fields, denormalized journey cache, scoring fields, outcome flags |
| `customers` | `customersTable` — converted lead record |
| `marketing_events` | `marketingEventsTable` — Module 1 core event stream |
| `campaign_intelligence` | `campaignIntelligenceTable` — keyed by existing `campaignId`, does not alter `campaignsTable` |
| `channels` | `channelsTable` — channel registry |
| `channel_stats` | `channelStatsTable` — optional computed-cache table (primary path computes live) |
| `conversions` | `conversionsTable` |
| `revenue_attribution` | `revenueAttributionTable` |
| `ai_recommendations` | `aiRecommendationsTable` |
| `integrations` | `integrationsTable` — config column never stores secrets, reference keys only |
| `marketing_assets` | `marketingAssetsTable` |

All tables use string PKs with app-generated ID prefixes (`LEAD-`, `CUST-`, `EVT-`, `CH-`, `CONV-`, `ATTR-`, `REC-`, `INTG-`, `ASST-`, `USR-`, `ROLE-`), `text()` snake_case columns, `jsonb().$type<T>()`, text ISO timestamps, and no FK constraints — matching `schema/marketing.ts` exactly. Every table exports `type XRow = typeof xTable.$inferSelect`.

## Routes added

| Method | Path | File |
|---|---|---|
| POST | `/events` | `routes/events.ts` |
| POST | `/events/batch` | `routes/events.ts` |
| GET | `/events` | `routes/events.ts` |
| GET | `/leads` | `routes/leads.ts` |
| POST | `/leads` | `routes/leads.ts` |
| GET | `/leads/:id` | `routes/leads.ts` |
| PATCH | `/leads/:id` | `routes/leads.ts` |
| POST | `/leads/:id/score` | `routes/leads.ts` |
| POST | `/leads/:id/convert` | `routes/leads.ts` |
| GET | `/attribution/summary` | `routes/attribution.ts` |
| GET | `/attribution/lead/:id` | `routes/attribution.ts` |
| GET | `/channels` | `routes/channels.ts` |
| POST | `/channels` | `routes/channels.ts` |
| GET | `/channels/intelligence` | `routes/channels.ts` |
| GET | `/campaign-intelligence` | `routes/campaign-intelligence.ts` |
| GET | `/campaign-intelligence/:campaignId` | `routes/campaign-intelligence.ts` |
| PUT | `/campaign-intelligence/:campaignId` | `routes/campaign-intelligence.ts` (upsert + rollup compute) |
| GET | `/recommendations` | `routes/recommendations.ts` |
| POST | `/recommendations/generate` | `routes/recommendations.ts` (rule-based; `generateWithLLM()` hook exported but unused) |
| PATCH | `/recommendations/:id` | `routes/recommendations.ts` |
| GET | `/integrations` | `routes/integrations.ts` |
| POST | `/integrations` | `routes/integrations.ts` |
| PATCH | `/integrations/:id` | `routes/integrations.ts` |

All routes are mounted under `/api` (via the existing `app.ts`/`routes/index.ts` wiring), inherit the existing `requireApiToken` guard automatically for all non-GET methods, and validate request bodies inline with `zod` `.safeParse()`, returning `400` on failure — mirroring `campaigns.ts`.

## Seed data (CCA sample intelligence)

Added to `artifacts/api-server/src/seed.ts`, guarded by independent emptiness checks per section (channels / integrations / leads+events+customers+conversions+attribution / campaign_intelligence), so re-running `seedDatabase()` never duplicates rows:

- 4 channels: Google Ads, Google Organic, LinkedIn, Referral.
- 6 leads across industries/locations (commercial + residential contractors; FL, TX, CO, SC, multi-state), each with a realistic ordered `marketing_events` sequence (visit → download → call → meeting, etc.).
- 2 converted customers + conversions, including the spec's exact **ABC Construction** example: Google Search first touch → Multi-State Expansion campaign → compliance guide download → website visit → phone call → consultation → Customer, **$15,000**. The second conversion is Coastal Roofing Co. via LinkedIn, $8,500.
- Revenue attribution rows computed via `computeAttribution()` for both conversions (first_touch/last_touch/linear/assisted).
- `campaign_intelligence` rows for all 4 pre-existing campaigns (`summit`, `nexus`, `partner`, `aurora`) plus the 3 CCA-specific campaigns referenced by the seeded leads (`Multi-State Expansion`, `Residential Contractor Growth`, `Commercial Contractor Awareness`, `Referral Program`), with `leadsGenerated`/`qualifiedLeads`/`customers`/`revenue`/`roi` rolled up from the seeded leads/conversions.
- 8 integrations registry rows (google_ads, meta_ads, linkedin_ads, ga4, search_console, callrail, ringcentral, email), all status `"available"`.
- Journey (`computeJourney`) and scoring (`scoreLead`) are run against each seeded lead's events at seed time, so `score`, `scoreTier`, `scoreReason`, `recommendedAction`, and the denormalized journey cache fields are populated immediately — matching what the live `/events` and `/leads` routes would produce at runtime.

## Verification

- `pnpm run typecheck` — **PASS** (exit 0, zero `error TS` occurrences across all workspace packages, including `typecheck:libs`).
- `pnpm --filter @workspace/api-server run build` — **PASS** (exit 0, esbuild output written to `dist/`).
- DB push was intentionally skipped per instructions (no database available in this environment).
- No git commit/push/PR was performed; all changes are left in the working tree for the parent agent to review and land.
