# Phase 4 Spec — External Data Intelligence Connections

Build the external-data ingestion layer INTO the existing MarketingOS monorepo. **Extend the existing connector framework (`routes/integrations/providers.ts`) and integrations table — do NOT rebuild, do NOT duplicate models, do NOT introduce a platform dependency.** External platforms are data providers only; MarketingOS stays the source of truth. Everything must flow: External → Integration layer → `marketing_events` → intelligence → recommendations → actions → revenue attribution.

## Ground truth (match these EXACTLY)
- Schema style: `lib/db/src/schema/intelligence.ts` — `pgTable`, `text()` snake_case cols, **string PKs** (app-generated), `jsonb().$type<T>()`, text ISO timestamps, NO FK constraints, `export type XRow = typeof x.$inferSelect;`. Add new tables here; re-export from `schema/index.ts` (already re-exports intelligence).
- Event ingestion: reuse the exact insert pattern in `routes/events.ts` (`insertEvent`, `nextEventId`, `refreshLeadJourneyAndScore`). New events created by connectors MUST go through the same marketing_events shape and call `refreshLeadJourneyAndScore(leadId)` when a leadId is present.
- Connector framework: `routes/integrations/providers.ts` already defines `IntegrationConnector` + `CONNECTOR_REGISTRY` (google_ads, meta_ads, linkedin_ads, ga4, search_console, callrail, ringcentral, email as stubs). **Extend this interface and these stubs — do not create a parallel framework.**
- Integrations table already exists (`integrationsTable`): id, providerKey, category, displayName, status ("available"|"connected"|"error"|"disabled"), config jsonb (reference keys only, NEVER secrets), lastSyncedAt, createdAt. Extend with `credentialsReference` (text, nullable) — a NAME/vault-key reference only.
- Route conventions: `const router: IRouter = Router()`, inline zod, `export default router`, register in `routes/index.ts`. Mutations are token-guarded automatically.
- Web client: add Phase 4 endpoints to `artifacts/web/src/lib/intel-api.ts` (with `${API}` prefix + DEMO_MODE branch pattern), types in `intel-types.ts`, hooks in `hooks/useIntel.ts`. Do NOT touch `lib/api-zod`/`api-client-react` generation.
- Everything must pass `pnpm run typecheck` and web+api builds.

## Data model — extend `lib/db/src/schema/intelligence.ts`

Add these tables (+ `$inferSelect` types, re-export already covered):

### sync_jobs
`syncJobsTable` "sync_jobs": id (text pk `SYNC-…`), integrationId (text), provider (text), startedAt (text ISO), completedAt (text nullable), status (text: "running"|"success"|"error"), recordsProcessed (integer default 0), errors (jsonb `string[]` default []), createdAt.

### external_events
`externalEventsTable` "external_events": id (text pk `EXT-…`), provider (text), externalId (text — the provider's own id, for idempotency/dedup), eventType (text), payload (jsonb `Record<string,unknown>` default {}), processedAt (text nullable — set once mapped into marketing_events), marketingEventId (text nullable — link to the created marketing_events row), createdAt. Add an index-friendly note: dedup on (provider, externalId) in code before insert.

### integrations (extend, do not replace)
Add column `credentialsReference: text("credentials_reference")` (nullable). Reference/env-var name ONLY.

No other new tables. Website/GA/Ads/Call data all become `marketing_events` (+ `external_events` raw record + `campaign_intelligence`/`channel` rollups already exist).

## Connector framework v2 — extend `routes/integrations/providers.ts`

Expand `IntegrationConnector` (keep backward-compatible; existing `testConnection`/`sync` stay) to add:
```
authMethod: "oauth2" | "api_key" | "webhook" | "none";
requiredCredentials: string[];        // NAMES of env/vault keys, never values
dataAvailable: string[];              // human labels: "Sessions","Campaign spend",...
defaultSyncFrequency: "realtime" | "hourly" | "daily" | "manual";
validateAuth(ctx): Promise<IntegrationTestResult>;   // checks creds resolvable (not the value)
// map a provider's raw records into MarketingOS event drafts (pure, no DB):
mapToEvents(rawRecords: unknown[]): EventDraft[];
```
Where `EventDraft` = the `CreateEventBody` shape from events.ts (eventType, source, campaign?, channel?, occurredAt?, metadata, plus optional leadId/customerId). Keep `sync()` but have it (in real impls) call a provider fetch → `mapToEvents` → hand drafts to the ingestion service.

Credential resolution: add `lib/integrations/credentials.ts` — `resolveCredential(ref: string): string | undefined` that reads from `process.env[ref]` ONLY (never stores/echoes the value; on missing, returns undefined and callers log a safe "missing credential: <ref>" — never the value). This is the whole security model: DB stores the reference name; the actual secret lives in env/secret-manager; connectors resolve at runtime.

### Per-provider connectors (extend the 8 stubs; add `website` + `google_ads` real-shaped mappers)
Each connector stays SDK-free (no real network calls required for this phase) but implements a **real `mapToEvents`** so ingestion is demonstrable, plus metadata (authMethod/requiredCredentials/dataAvailable/defaultSyncFrequency). Provider list + specifics:
- **website** (category "analytics", authMethod "webhook", NEW registry entry): maps page views / form submissions / downloads / consultation & demo requests → events (`website_visit`,`landing_page_view`,`form_submission`,`content_download`,`meeting_request`), carrying UTM/source/campaign/page in metadata.
- **ga4** (analytics, oauth2, creds ["GA4_PROPERTY_ID","GA4_OAUTH_TOKEN"]): sessions/users/traffic-source/landing-page/conversions → `website_visit`/`landing_page_view`/`sales_conversion`, mapping source→channel.
- **google_ads** (advertising, oauth2, ["GOOGLE_ADS_CUSTOMER_ID","GOOGLE_ADS_OAUTH_TOKEN"]): campaign/spend/impr/clicks/conversions/keywords/search-terms → `campaign_interaction` events + updates spend on `campaign_intelligence`/channel. Keyword/search term in metadata.
- **callrail** (communication, api_key, ["CALLRAIL_API_KEY"]): calls → `phone_call` events (+ metadata: trackingNumber, duration, callerInfo, recordingUrlRef). Distinguish received/qualified/converted via metadata.callOutcome.
- **ringcentral** (communication, oauth2, ["RINGCENTRAL_OAUTH_TOKEN"]): calls + SMS → `phone_call`/`campaign_interaction` (comm timeline) events with responseTimeMinutes metadata.
- **meta_ads** (advertising, oauth2, ["META_ACCESS_TOKEN","META_AD_ACCOUNT_ID"]): campaigns/spend/audience/leads → `campaign_interaction`/`form_submission` events; audience/geo/demographics in metadata.
- **linkedin_ads** (advertising, oauth2, ["LINKEDIN_ACCESS_TOKEN"]): campaigns/engagement/leads/audience → events; enterprise-targeting metadata.
- keep **search_console**, **email** stubs.

## Ingestion service — `lib/integrations/ingestion.ts`
`ingestExternalRecords(provider, integrationId, rawRecords)`:
1. For each raw record: upsert an `external_events` row (dedup on provider+externalId; skip if already processed).
2. Run the provider connector's `mapToEvents` to get drafts.
3. Insert each as a `marketing_events` row (reuse the events.ts insert shape — factor a shared `insertMarketingEvent(draft)` helper into `lib/intelligence/refresh.ts` or a new `lib/intelligence/events.ts` and have routes/events.ts import it too, so there's ONE insert path — no duplication).
4. Set `external_events.processedAt` + `marketingEventId`.
5. Call `refreshLeadJourneyAndScore` for any leadId touched.
6. Return counts. Wrap in a `sync_jobs` record (running→success/error, recordsProcessed, safe error strings only).

## Routes (register in routes/index.ts)
Extend `routes/integrations.ts` (or a new `routes/integrations-sync.ts`) with:
- `GET /integrations` — already exists; ENRICH `toIntegration` to also include connector metadata (authMethod, requiredCredentials, dataAvailable, defaultSyncFrequency, connectorAvailable) and derived `lastSync`, plus `dataImported` (count of external_events for that provider) and `errorCount` (from latest sync job).
- `POST /integrations/:id/connect` — sets status per validateAuth: if required creds resolvable → "connected", else "error" with a safe reason (never the secret). Stores only `credentialsReference` names from body.
- `POST /integrations/:id/sync` — creates a sync_job, runs ingestion with a small built-in SAMPLE dataset per provider (since no real SDK/creds in this phase) so ingestion is demonstrable end-to-end, returns job summary. Guard: only if status "connected" (or allow a `?demo=1`).
- `GET /integrations/:id/sync-jobs` — recent jobs for that integration.
- `GET /integrations/:id/errors` — safe error log (from sync_jobs.errors).
- `GET /external-events?provider=&limit=` — recent raw external events.
- `POST /ingest/website` — public-ish webhook-style endpoint (still behind token guard for now) that accepts a website event payload (page, url, utm_source/medium/campaign, eventType, leadId?/email?) and runs it through ingestion as provider "website". This is Module 2's live path.

Each provider `/sync` uses a **realistic CCA sample payload** (contractor-flavored: e.g. Google Ads "multi-state licensing" keywords, GA4 sessions from "contractor license" search, CallRail calls) so the pipeline visibly creates events, updates attribution, and moves dashboard numbers.

## AI recommendations — enhance `routes/recommendations.ts`
Augment `generateRuleBasedRecommendations` to use imported signals when present: e.g. compare conversion rate by channel/source derived from ingested events, surface spend-vs-revenue (Google Ads spend vs attributed revenue), and produce specific insights like the spec examples ("Google search traffic for multi-state licensing produces customers at 2.8x the average conversion rate"). Keep it rule-based + data-grounded; the `generateWithLLM` hook stays. Do not remove existing insights.

## Front-end — Module 1: Integration Management Center  → route `/integrations`
New page `src/pages/intel/Integrations.tsx` + nav entry in the "Growth Intelligence" section of AppLayout. Uses new hooks. Show a card/table per integration: name, provider, category badge, **status** (Not Connected/Pending/Connected/Syncing/Error/Disabled — map from status + job state), connection state, **last sync**, **data imported** (count), **error count**. Per-connector detail (dialog or expandable): authentication method, required credentials (names only), data available, sync frequency, recent error log. Actions: Connect (dialog collecting credential REFERENCE names only — with a clear note "we store references, never secrets"), Sync now, Enable/Disable. DEMO_MODE: read from demo dataset; connect/sync are optimistic no-ops.

Also enhance the Executive Dashboard (Module: Dashboard Updates): add a compact "Data sources" strip showing connected integrations + a customer-journey mini-visual (impression → visit → engagement → form → call → customer) driven by event types when present. Keep it additive; don't break existing layout.

## Security requirements (enforce)
- Never store raw credentials in DB/logs/responses. Only reference names in `credentialsReference`/`config`.
- `resolveCredential` reads env only; on missing, safe log `missing credential: <REF_NAME>` (name, not value).
- Sync/connect error messages are sanitized (no tokens, no PII beyond what's already in leads).
- Recording URLs (CallRail) stored as reference/opaque only in metadata; note "where permitted".

## Docs
- Create `docs/integrations.md`: supported integrations table (provider, category, auth method, required credential names, data available, sync frequency), data mapping (provider record → marketing_event type + channel), the security model (reference-only, env resolution), and sync behavior (sync_jobs lifecycle, external_events dedup).
- Update `docs/architecture-map.md`: add an "External Data Layer" section at the top of the spine (External Platforms → Integration Layer → Events…), and list the connectors + the ingestion invariant (all external data becomes marketing_events; no platform becomes the source of truth).

## Explicitly DO NOT build
Automated ad budget changes, autonomous campaigns, auto-posting, AI-generated ads, CRM replacement. (Phase 5+.)

## Testing / acceptance (verify before done)
- Connector framework extended (not duplicated); `mapToEvents` produces valid event drafts.
- `POST /integrations/:id/sync` creates a sync_job, ingests sample records → external_events → marketing_events, updates a lead's journey/score and attribution, and moves dashboard/overview numbers.
- `POST /ingest/website` creates an event from a website payload with UTM/source/campaign.
- Integration Management Center renders status/last-sync/data-imported/errors.
- No duplicate models; Phase 2/3 endpoints & pages still work.
- `pnpm run typecheck` exit 0; web + api-server build exit 0.

## Deliverables
Schema + framework v2 + ingestion service + connectors + routes + Integration Center UI + recommendation enhancement + dashboard data-source strip + docs. Do NOT commit/push/PR — parent verifies on a live DB, builds, and PRs. Write `docs/phase-4-implementation-notes.md` (files, tables, routes, providers, verification) and report back.
