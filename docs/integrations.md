# External Data Integrations (Phase 4)

Phase 4 adds an **External Data Layer** to MarketingOS: a connector
framework, an ingestion pipeline, and an Integration Management Center UI
that turn third-party provider data into the same `marketing_events` records
the rest of the platform already runs on (funnel, attribution, channel
intelligence, campaign intelligence, recommendations).

No new "events"/"leads"/"campaign" concept is introduced. External data
becomes `marketing_events` (intelligence-grade record) plus `external_events`
(raw provider log, for audit/debugging/dedup).

## Supported integrations

| Provider key      | Display name            | Category      | Auth method | Data available                                  | Default sync frequency |
|--------------------|--------------------------|---------------|-------------|--------------------------------------------------|-------------------------|
| `website`          | Website                  | analytics     | webhook     | website_visit, content_download, form_submission, meeting_request | realtime |
| `ga4`              | Google Analytics 4       | analytics     | oauth2      | website_visit, content_download                  | daily |
| `google_ads`       | Google Ads               | advertising   | oauth2      | campaign_interaction (spend, clicks, impressions, conversions) | daily |
| `callrail`         | CallRail                 | communication | api_key     | phone_call (tracking number, duration, outcome)  | hourly |
| `ringcentral`      | RingCentral               | communication | oauth2      | phone_call, campaign_interaction (SMS)           | hourly |
| `meta_ads`         | Meta Ads                 | advertising   | oauth2      | campaign_interaction, form_submission (lead ads) | daily |
| `linkedin_ads`     | LinkedIn Ads              | advertising   | oauth2      | campaign_interaction, form_submission (lead gen) | daily |
| `search_console`   | Google Search Console    | analytics     | oauth2      | *(stub -- not yet implemented)*                  | daily |
| `email`            | Email (Zoho Mail)        | email         | api_key     | *(stub -- not yet implemented)*                  | manual |

`search_console` and `email` remain framework-registered stubs from earlier
phases -- their `mapToEvents` returns an empty array and `validateAuth`
reports `not_implemented`, matching the Phase 4 spec's "keep stubs" directive.

## Data mapping

Every connector implements a pure `mapToEvents(rawRecords) => EventDraft[]`
function (no DB access). The ingestion service is the only place that turns
those drafts into rows. Mapping summary:

| Provider      | Raw event type(s)                                   | `marketing_events.eventType`                     | Key metadata fields |
|---------------|-------------------------------------------------------|---------------------------------------------------|----------------------|
| website       | page_view, content_download, form_submission, consultation_request, demo_request | website_visit / content_download / form_submission / meeting_request | page, url, utmSource, utmMedium, utmCampaign, formName, asset, email |
| ga4           | any GA4 event name                                    | website_visit / content_download                  | ga4EventName, sessionSource, sessionMedium, landingPage |
| google_ads    | click / conversion                                    | campaign_interaction                               | campaignId, keyword, searchTerm, impressions, clicks, spend, conversions |
| callrail      | call                                                   | phone_call                                         | trackingNumber, duration, callerInfo, recordingUrlRef, callOutcome |
| ringcentral   | call / sms                                             | phone_call / campaign_interaction                  | commType, direction, duration, responseTimeMinutes |
| meta_ads      | lead_form / impression / click                        | form_submission / campaign_interaction             | campaignId, audience, geo, impressions, clicks, spend, email |
| linkedin_ads  | lead_gen_form / impression / click                    | form_submission / campaign_interaction             | campaignId, targeting, impressions, clicks, spend, email |

Call recordings (CallRail) are stored as an opaque `recordingUrlRef` string
only -- never a playable/signed URL -- so no audio access is granted through
ingested metadata.

## Security model

- **No secrets are ever stored in the database.** The `integrations` table's
  `credentialsReference` column and the `connect` request body hold only a
  **reference name** (e.g. an environment variable name such as
  `GA4_OAUTH_TOKEN`), never a token/key/secret value.
- `lib/integrations/credentials.ts`'s `resolveCredential(ref)` is the only
  place that reads real values, and it reads exclusively from
  `process.env`. It never logs resolved values.
- `checkRequiredCredentials(refs[])` is used by `POST /integrations/:id/connect`
  to determine connect success/failure without ever returning credential
  values to the client -- only a boolean and the list of missing reference
  names.
- Sync job errors (`sync_jobs.errors`) and the `/integrations/:id/errors`
  endpoint only ever contain sanitized, truncated error strings. Raw
  exception objects (which could carry request headers/bodies) are never
  serialized.
- This phase makes **no real outbound network/SDK calls**. All provider data
  comes from `lib/integrations/sample-payloads.ts`, a fixed set of realistic,
  CCA-themed sample payloads used to exercise the full ingestion path.

## Sync behavior

1. `POST /integrations/:id/connect` stores a credential reference name and
   flips status to `connected` if the connector's `requiredCredentials` all
   resolve via `checkRequiredCredentials` (or immediately if none are
   required).
2. `POST /integrations/:id/sync[?demo=1]` creates a `sync_jobs` row
   (`status: "running"`), pulls the provider's sample payload via
   `samplePayloadFor(providerKey)`, and calls `ingestExternalRecords`.
3. `ingestExternalRecords`, for each raw record:
   - Looks up any existing `external_events` row for `(provider, externalId)`.
     If it's already `processedAt`, the record is skipped (dedup).
   - Otherwise inserts (or reuses) the `external_events` raw-log row.
   - Runs the connector's `mapToEvents([raw])` (pure) to get `EventDraft[]`.
   - Inserts each draft via the **shared** `insertMarketingEvent` helper
     (the same helper `POST /events` uses), so there is exactly one write
     path into `marketing_events`.
   - Marks the `external_events` row `processedAt` + `marketingEventId`.
   - Calls `refreshLeadJourneyAndScore(leadId)` once per distinct lead
     touched by the batch.
4. The `sync_jobs` row is updated to `success` or `error` with
   `recordsProcessed` and a sanitized `errors[]` list, and the parent
   integration's `lastSyncedAt` is bumped.
5. `POST /ingest/website` is a standing webhook-style endpoint (token
   guarded, like all mutating `/api` routes) that runs a single
   website-provider record through the same `ingestExternalRecords` path in
   real time, auto-provisioning the `website` integration row on first call.

## API routes (Phase 4 additions)

| Method | Path                                 | Purpose |
|--------|---------------------------------------|---------|
| GET    | `/api/integrations`                   | List integrations enriched with connector metadata, last sync, data imported, error count |
| POST   | `/api/integrations`                   | Register a new integration row (existing, unchanged) |
| PATCH  | `/api/integrations/:id`               | Update status/config/credentialsReference (existing, unchanged) |
| POST   | `/api/integrations/:id/connect`       | Store a credential reference and attempt to transition to `connected` |
| POST   | `/api/integrations/:id/sync`          | Run a sample-data sync through the ingestion pipeline |
| GET    | `/api/integrations/:id/sync-jobs`     | List recent sync job history for an integration |
| GET    | `/api/integrations/:id/errors`        | List recent sanitized sync errors for an integration |
| GET    | `/api/external-events`                | List raw external-event log rows, optional `?provider=&limit=` |
| POST   | `/api/ingest/website`                 | Webhook-style single-event website ingestion |

## Front end

- `src/pages/intel/Integrations.tsx` -- the Integration Management Center:
  per-connector cards with status, last sync, data imported, error count, a
  details dialog (auth method, required credentials, data available, sync
  frequency, recent sync jobs/errors), a Connect dialog (collects reference
  **names** only, with an explicit "we store references, never secrets"
  notice), a Sync now button, and an enable/disable toggle.
- Nav entry "Integrations" added to the Growth Intelligence nav group
  (`src/components/AppLayout.tsx`), routed at `/integrations`
  (`src/App.tsx`).
- `src/components/intel/DataSourcesStrip.tsx` and
  `src/components/intel/CustomerJourneyVisual.tsx` are additive additions to
  the Executive Dashboard (`src/pages/intel/IntelligenceDashboard.tsx`)
  showing connected-source pills and a static impression -> visit ->
  engagement -> form -> call -> customer journey map.
- Every new `intel-api.ts` function has a `DEMO_MODE` branch returning
  static/deterministic data so the demo build (`VITE_DEMO_MODE=1`) remains
  fully clickable with no backend.

## What Phase 4 explicitly does not do

- No real provider SDK or network calls (sample payloads only).
- No autonomous budget changes, autonomous campaigns, auto-posting, or
  AI-generated ads.
- No CRM replacement -- ingested data augments `marketing_events`, it does
  not introduce a parallel leads/contacts model.
- No secrets are stored anywhere in the database or logs.
