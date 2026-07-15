# Phase 4 Implementation Notes — External Data Integrations

Branch: `feat/phase-4-integrations` (working tree only, no commits made).
Spec: [`docs/phase-4-spec.md`](./phase-4-spec.md).

## Summary

Phase 4 adds an External Data Layer to MarketingOS: a v2 connector
framework, an ingestion service, integration-management API routes,
signal-driven AI recommendations, and a full front-end Integration
Management Center — all writing into the *existing* `marketing_events`
table via one shared insert path. No parallel events/leads/campaign model
was introduced, no real provider network calls were made, and no secrets
are stored anywhere (only reference names, resolved from `process.env`
server-side).

## Files created

| File | Purpose |
|---|---|
| `artifacts/api-server/src/lib/intelligence/events.ts` | Shared `insertMarketingEvent` helper (`EVENT_TYPES`, `CreateEventBody` zod schema, `EventDraft` type, `nextEventId`) — single write path into `marketing_events`, used by both `routes/events.ts` and the new ingestion service. |
| `artifacts/api-server/src/lib/integrations/credentials.ts` | `resolveCredential(ref)` reads a named credential from `process.env` only, never logs values; `checkRequiredCredentials(refs[])` returns `{ ok, missing }` without exposing values. |
| `artifacts/api-server/src/lib/integrations/sample-payloads.ts` | `samplePayloadFor(providerKey)` + realistic CCA/contractor-themed sample datasets for all 7 live connectors (website, ga4, google_ads, callrail, ringcentral, meta_ads, linkedin_ads), each with stable `externalId`s for dedup testing. |
| `artifacts/api-server/src/lib/integrations/ingestion.ts` | `ingestExternalRecords(provider, integrationId, rawRecords)` — the ingestion service: dedups on `(provider, externalId)` against `external_events`, calls the connector's pure `mapToEvents`, inserts via `insertMarketingEvent`, marks `external_events.processedAt` + `marketingEventId`, calls `refreshLeadJourneyAndScore` per touched lead, and wraps the whole run in a `sync_jobs` record (`running` → `success`/`error`) with sanitized error strings only. Also exports `getExternalEventsCountForProvider`. |
| `artifacts/web/src/pages/intel/Integrations.tsx` | Integration Management Center page: KPI strip, per-integration cards (status/last sync/data imported/error count), a details dialog (auth method, required credentials, data available, sync frequency, recent sync jobs/errors), a Connect dialog (collects credential **reference names** only, with an explicit "we store references, never secrets" notice), Sync-now button, and an enable/disable switch. Presentational gating via existing `useRole()` capabilities. |
| `artifacts/web/src/components/intel/DataSourcesStrip.tsx` | Additive dashboard component: connected-integration pills + link to `/integrations`. |
| `artifacts/web/src/components/intel/CustomerJourneyVisual.tsx` | Additive dashboard component: static impression → visit → engagement → form → call → customer journey map, annotated with which providers feed each stage. |
| `docs/integrations.md` | New doc: supported integrations table, data-mapping table, security model, sync lifecycle, API route table, front-end summary, explicit "does not do" list. |
| `docs/phase-4-implementation-notes.md` | This file. |

## Files modified

| File | Change |
|---|---|
| `lib/db/src/schema/intelligence.ts` | Added `credentialsReference` (text, nullable) to `integrationsTable`; added `syncJobsTable` (+ `SyncJobRow`, `SyncJobStatus` types) and `externalEventsTable` (+ `ExternalEventRow` type). `schema/index.ts` needed no change — it already does `export * from "./intelligence"`. |
| `artifacts/api-server/src/routes/events.ts` | Refactored to import `EVENT_TYPES`, `CreateEventBody`, `insertMarketingEvent` from the new shared `lib/intelligence/events.ts` instead of local duplicates — removes duplication between the events route and the new ingestion service. |
| `artifacts/api-server/src/routes/integrations/providers.ts` | Fully rewritten for connector framework v2. New `IntegrationConnector` interface adds `authMethod`, `requiredCredentials`, `dataAvailable`, `defaultSyncFrequency`, `validateAuth()`, `mapToEvents()` alongside the existing `testConnection()`/`sync()`. Implemented real connectors: `website` (NEW, webhook), `ga4`, `googleAds`, `callrail`, `ringcentral`, `metaAds`, `linkedinAds`. `search_console` and `email` remain stubs via a generalized `stubConnector()` helper carrying full v2 metadata. Exports `CONNECTOR_REGISTRY`, `getConnector()`. |
| `artifacts/api-server/src/routes/integrations.ts` | Extended: `enrichIntegration()` now returns connector metadata (`authMethod`, `requiredCredentials`, `dataAvailable`, `defaultSyncFrequency`), plus derived `lastSync`, `dataImported` (from `external_events` count), `errorCount` (from latest `sync_jobs`). Added `POST /:id/connect`, `POST /:id/sync`, `GET /:id/sync-jobs`, `GET /:id/errors`, `GET /external-events`, `POST /ingest/website`. Existing `GET/POST /integrations` and `PATCH /integrations/:id` preserved. |
| `artifacts/api-server/src/routes/recommendations.ts` | `generateRuleBasedRecommendations()` extended with 3 new ingested-signal insights (see below), on top of the 4 pre-existing insights and the untouched `generateWithLLM()` hook. |
| `artifacts/web/src/lib/intel-types.ts` | Added Phase 4 types: `IntegrationCategory`, `IntegrationStatus`, `IntegrationAuthMethod`, `IntegrationSyncFrequency`, `SyncJobStatus`, `SyncJobSummary`, `Integration`, `ConnectIntegrationRequest`/`Response`, `SyncIntegrationResponse`, `SyncJob`, `IntegrationError`, `ExternalEvent`, `IngestWebsiteRequest`. |
| `artifacts/web/src/lib/intel-api.ts` | Added `listIntegrations`, `connectIntegration`, `syncIntegration`, `getIntegrationSyncJobs`, `getIntegrationErrors`, `updateIntegrationStatus`, `listExternalEvents`, `ingestWebsiteEvent` — every function has a `DEMO_MODE` branch returning static/deterministic data (no `demo-data.json` schema change required; static arrays defined inline per spec's "return a sensible static/empty value" allowance). |
| `artifacts/web/src/hooks/useIntel.ts` | Added query keys + hooks: `useIntegrations`, `useConnectIntegration`, `useSyncIntegration`, `useIntegrationSyncJobs`, `useIntegrationErrors`, `useUpdateIntegrationStatus`, `useExternalEvents`, with standard React Query invalidation wiring (sync invalidates integrations/sync-jobs/errors/external-events/recommendations). |
| `artifacts/web/src/pages/intel/IntelligenceDashboard.tsx` | Additive only: inserted `<DataSourcesStrip>` and `<CustomerJourneyVisual>` between the KPI row and the existing Channel Performance table. No existing layout/markup removed or reordered. |
| `artifacts/web/src/components/AppLayout.tsx` | Added `"integrations"` to `NavKey` union; added `Plug` icon import; added an `{ key: "integrations", label: "Integrations", href: "/integrations", icon: Plug }` entry to `GROWTH_INTEL_NAV`. |
| `artifacts/web/src/App.tsx` | Imported `Integrations` page and registered `<Route path="/integrations" component={Integrations} />`. |
| `docs/architecture-map.md` | Added a new "External Data Layer (Phase 4)" section above "The spine" describing the ingestion invariant (all external data enters through `insertMarketingEvent`) and a text diagram of provider → connector → ingestion → spine. Upgraded "Integration edges (Phase 4 and beyond)" to "Integration edges (Phase 4 — implemented)" reflecting the now-implemented connector list. |

`routes/index.ts` required **no change** — all Phase 4 routes were added to the already-registered `integrations.ts` router (`router.use(integrationsRouter)` at line 33), so no new router import/registration was necessary.

## Database tables added

| Table | Purpose | Key columns |
|---|---|---|
| `sync_jobs` | Lifecycle record for every ingestion run (manual or scheduled). | `id` (`SYNC-####`), `integrationId`, `provider`, `startedAt`, `completedAt`, `status` (`running`/`success`/`error`), `recordsProcessed`, `errors` (jsonb string array, sanitized), `createdAt`. |
| `external_events` | Raw provider event log, deduped on `(provider, externalId)`. | `id` (`EXT-####`), `provider`, `externalId`, `eventType`, `payload` (jsonb), `processedAt`, `marketingEventId`, `createdAt`. |
| `integrations.credentialsReference` (column added) | Stores only a credential **reference name**, never a secret value. | text, nullable. |

All new tables follow existing conventions: text primary keys with app-generated prefixes, no foreign-key constraints, jsonb with `.$type<T>()`, text ISO timestamps, `$inferSelect` row types (`SyncJobRow`, `ExternalEventRow`) re-exported via the existing `export * from "./intelligence"` in `schema/index.ts`.

## Routes added

All under the existing `integrations.ts` router (mounted at `/api`):

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/integrations/:id/connect` | Store a credential reference name; transitions status to `connected` if `checkRequiredCredentials` passes, else `error` with a safe reason. |
| POST | `/api/integrations/:id/sync` (optional `?demo=1`) | Runs `samplePayloadFor(providerKey)` through `ingestExternalRecords`; guarded to `status === "connected"` unless `?demo=1`. |
| GET | `/api/integrations/:id/sync-jobs` | Recent sync job history (`?limit=`, capped at 100). |
| GET | `/api/integrations/:id/errors` | Flattened, sanitized error list from recent sync jobs. |
| GET | `/api/external-events` | Raw external-event log rows (`?provider=&limit=`, capped at 500). |
| POST | `/api/ingest/website` | Webhook-style single-event website ingestion; auto-provisions the `website` integration row on first call; still behind the standard app-token guard on mutating routes. |

Existing routes enriched (not replaced): `GET /api/integrations` (now includes connector metadata + `lastSync`/`dataImported`/`errorCount`), `POST /api/integrations`, `PATCH /api/integrations/:id`.

## Connectors implemented

| Provider key | Status | Auth method | Notes |
|---|---|---|---|
| `website` | **New**, real | webhook | Maps `page_view`/`content_download`/`form_submission`/`consultation_request`/`demo_request` → `website_visit`/`content_download`/`form_submission`/`meeting_request`; carries `leadId` through when present on the raw record. |
| `ga4` | Real | oauth2 | `ga4EventName`, `sessionSource`, `sessionMedium`, `landingPage` metadata. |
| `google_ads` | Real | oauth2 | Maps to `campaign_interaction` with `campaignId`, `keyword`, `searchTerm`, `impressions`, `clicks`, `spend`, `conversions` — `spend` feeds the new recommendations ROI insight. |
| `callrail` | Real | api_key | Maps to `phone_call`; recording URLs stored only as an opaque `recordingUrlRef`, never a playable/signed URL. |
| `ringcentral` | Real | oauth2 | `call` → `phone_call`, `sms` → `campaign_interaction`, with `responseTimeMinutes`. |
| `meta_ads` | Real | oauth2 | `lead_form` → `form_submission`, else `campaign_interaction`; audience/geo metadata. |
| `linkedin_ads` | Real | oauth2 | `lead_gen_form` → `form_submission`, else `campaign_interaction`; targeting metadata (enterprise-focused). |
| `search_console` | Stub (unchanged intent) | oauth2 | `mapToEvents` returns `[]`; full v2 metadata present via `stubConnector()`. |
| `email` | Stub (unchanged intent) | api_key | Same stub pattern. |

All `mapToEvents` implementations are pure functions (no DB access); only `ingestion.ts` performs writes.

## AI recommendations enhancement

`generateRuleBasedRecommendations()` in `routes/recommendations.ts` keeps its 4 pre-existing insights (best-converting industry, best revenue-per-lead channel, best-performing location, inactive channel) and the untouched `generateWithLLM()` hook, and adds three ingested-signal insights:

1. **Source conversion multiplier** — compares each ingested event `source`'s lead-to-customer conversion rate against the overall average; surfaces the spec's canonical example pattern (e.g. "`google` traffic converts at 2.8x the average").
2. **Spend-vs-revenue by campaign** — sums `campaign_interaction.metadata.spend` (from `google_ads`/`meta_ads`/`linkedin_ads`) per campaign and compares against attributed conversion revenue for that campaign, surfacing both a best-ROI and a worst-ROI (overspend) insight.
3. **Phone call outcome rate** — uses `phone_call.metadata.callOutcome` (`qualified`/`converted`) from CallRail/RingCentral ingestion to surface a follow-up conversion-rate insight.

All three only fire when there is ingested data to support them, so a fresh install with zero connected integrations still shows exactly the original 4 insights.

## Verification results

Run from `/home/user/workspace/marketingos` with `fnm use 22`:

| Command | Result |
|---|---|
| `pnpm run typecheck` | **Exit 0.** All 5 typechecked workspace projects (`api-server`, `mobile`, `walkthrough`, `web`, `scripts`) report `Done` with zero `error TS` lines. |
| `pnpm --filter @workspace/api-server run build` | **Exit 0.** esbuild bundle produced (`dist/index.mjs`, 2.2mb) in 323ms. |
| `pnpm --filter @workspace/web run build` | **Exit 0.** Vite production build: 2914 modules transformed, `dist/public/assets/index-BDOYA1ii.js` (1.19MB / 338KB gzip). Only pre-existing sourcemap notices and a chunk-size advisory warning (non-fatal, present before Phase 4 too). |
| `VITE_DEMO_MODE=1 BASE_PATH=./ pnpm --filter @workspace/web run build` | **Exit 0.** Same build, demo bundle `dist/public/assets/index-CZzpxR91.js` (1.16MB / 330KB gzip). Confirms every new `intel-api.ts` function's `DEMO_MODE` branch compiles and the Integrations page + dashboard additions build cleanly with no backend. |

No errors were encountered that required a fix beyond normal iterative development — connector `mapToEvents` for `website` was adjusted mid-implementation to propagate `leadId` from the raw record into the `EventDraft` so ingested website events tied to a known lead correctly trigger `refreshLeadJourneyAndScore`.

## Hard constraints — compliance check

- **No duplicate models:** confirmed — no new events/leads/campaign tables; all ingested data becomes `marketing_events` (via the shared `insertMarketingEvent`) + `external_events` (raw log only).
- **No platform dependency:** the app has zero connected integrations by default and remains fully functional (existing invariant in `architecture-map.md` unchanged).
- **No real provider SDKs/network calls:** confirmed — `sample-payloads.ts` is the only data source for sync runs this phase.
- **No secrets stored anywhere:** confirmed — `credentialsReference` is a name only; `resolveCredential` reads `process.env`; all sync/error surfaces are sanitized strings.
- **Not built:** no auto budget changes, no autonomous campaigns, no auto-posting, no AI-generated ads, no CRM replacement.
- **Conventions matched:** string PKs with prefixes, text ISO timestamps, no FKs, `Router`/`IRouter` + `export default`, inline zod schemas — all followed in every new/modified file.
- **No commits:** all changes left in the working tree on `feat/phase-4-integrations` as instructed.
