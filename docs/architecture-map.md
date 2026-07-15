# MarketingOS Architecture Map — the Spine

This is the canonical mental model for MarketingOS. Every future feature should fit somewhere on this spine. **MarketingOS is the source of truth for marketing intelligence** — external systems (Zoho, Google Ads, CallRail, etc.) are optional inputs/outputs that plug into the edges, never dependencies of the core.

## External Data Layer (Phase 4)

Before the spine, an **External Data Layer** now sits at the Events edge:
third-party providers (website, GA4, Google Ads, CallRail, RingCentral, Meta
Ads, LinkedIn Ads) feed the same `marketing_events` table the rest of the
spine reads from, via a connector framework + ingestion service. No new
events/leads/campaign model is introduced -- ingested data becomes
`marketing_events` (intelligence-grade) plus `external_events` (raw log for
dedup/audit).

```
  Website / GA4 / Google Ads / CallRail / RingCentral / Meta Ads / LinkedIn Ads
                              |
                              v
     IntegrationConnector.mapToEvents()  (pure, per-provider mapping)
                              |
                              v
     ingestExternalRecords()  -- dedup on (provider, externalId) via
                                  external_events; wraps run in sync_jobs
                              |
                              v
     insertMarketingEvent()  -- SAME shared helper routes/events.ts uses
                              |
                              v
                     marketing_events  (spine's source of truth, unchanged)
```

**Ingestion invariant:** all external provider data enters the spine through
exactly one write path -- `insertMarketingEvent` -- so Events remain the
single source of truth regardless of how many connectors are active.
Connectors: `website` (webhook, NEW/realtime), `ga4`, `google_ads`,
`callrail`, `ringcentral`, `meta_ads`, `linkedin_ads` are fully implemented;
`search_console` and `email` remain framework-registered stubs. See
[`docs/integrations.md`](./integrations.md) for the full provider table,
security model, and sync lifecycle.

## The spine

```
                        ┌──────────────────────────────────────────────────────────┐
                        │                     MarketingOS core                       │
                        │                                                            │
  CHANNELS  ─────►  EVENTS  ─────►  INTELLIGENCE  ─────►  RECOMMENDATIONS  ─────►  ACTIONS  ─────►  REVENUE
  (where)          (what             (scoring,            (AI analyst:            (tasks:          (attribution
                    happened)         journey,             opportunities,          owner,           back to
                                      attribution,         warnings,               status,          channels &
                                      channel &            growth ideas)           due date)        campaigns)
                                      campaign rollups)                                              │
                        │                                                            │              │
                        └──────────────────────────────────────────────────────────┘              │
                                        ▲                                                           │
                                        └───────────── revenue attribution feeds back ─────────────┘
```

Read it as one sentence: **Channels produce Events; Events are turned into Intelligence; Intelligence produces Recommendations; Recommendations become Actions; Actions drive Revenue; Revenue is attributed back to the Channels and Campaigns that caused it — closing the loop.**

## Stage-by-stage (with the code that implements each)

| Stage | Meaning | Tables | Backend | Front-end |
|---|---|---|---|---|
| **Channels** | Where marketing activity originates (Google Ads, Organic, LinkedIn, Referral, …). | `channels`, `channel_stats` | `routes/channels.ts` | Channel Performance table + Channel Comparison chart |
| **Events** | Every interaction becomes an immutable event (visit, download, call, meeting, conversion, purchase). The atomic unit of truth. | `marketing_events` | `routes/events.ts` (`POST /events`, `/events/batch`) | Lead journey timeline |
| **Intelligence** | Events are aggregated into meaning: lead **journey**, **scoring**, **attribution**, and **channel/campaign rollups**. | `leads`, `customers`, `conversions`, `revenue_attribution`, `campaign_intelligence` | `lib/intelligence/{journey,scoring,attribution,channels}.ts`; `routes/{leads,attribution,channels,campaign-intelligence,intelligence-summary}.ts` | Executive Dashboard, Lead Workspace, Campaign Ops |
| **Recommendations** | The AI Marketing Analyst reads Intelligence and proposes opportunities, warnings, growth moves. Rule-based today; LLM hook (`generateWithLLM`) reserved for later. | `ai_recommendations` | `routes/recommendations.ts` | AI Intelligence Feed, Opportunity Center |
| **Actions** | A recommendation becomes a tracked unit of work (owner, status, due date, completion). **Reuses the existing `tasks` table — no separate action model.** | `tasks` (with `aiGenerated: true`) | `POST /actions/from-recommendation` (in `routes/intelligence-summary.ts`) + existing task endpoints | "Create Action" dialogs → Task Board |
| **Revenue** | Conversions record revenue; the Attribution Engine credits it back across the touch channels/campaigns (first / last / linear / assisted), closing the loop to Channels. | `conversions`, `revenue_attribution` | `lib/intelligence/attribution.ts`; `routes/attribution.ts` | Revenue Attribution chart, campaign revenue impact |

## Integration edges (Phase 4 -- implemented)

External providers attach at the **Events** edge (inbound activity) and the **Channels/Revenue** edge (spend + outcomes) through the provider-agnostic framework -- never by becoming a core dependency.

| Edge | Inbound examples | Framework |
|---|---|---|
| Events in | Website forms (webhook), Google Analytics 4, CallRail, RingCentral, email opens/clicks (stub) | `integrations` table + `routes/integrations/providers.ts` (`IntegrationConnector` v2 + `CONNECTOR_REGISTRY`) + `lib/integrations/ingestion.ts` |
| Spend in | Google Ads, Meta Ads, LinkedIn Ads (feeds `campaign_interaction.metadata.spend` into recommendations ROI insights) | same |

**Implemented in Phase 4:** Website forms, Google Analytics 4, Google Ads, CallRail, RingCentral, Meta Ads, LinkedIn Ads. `search_console` and `email` remain stubs. Every connector is behind the same interface; the core spine is unchanged -- see the External Data Layer section above and [`docs/integrations.md`](./integrations.md).

## Invariants (do not violate)

1. **One model per concept.** Leads, events, campaigns, channels, conversions, attribution each have exactly one table. Actions reuse `tasks`. Never fork these.
2. **No external system is a dependency.** MarketingOS runs and is fully useful with zero integrations connected. Zoho/etc. are optional edges.
3. **Events are the source of truth.** Journey, score, attribution, and rollups are all derived from `marketing_events` — recompute from events rather than hand-editing derived fields.
4. **Human-reviewed AI.** Recommendations are drafts; a human turns them into Actions. The LLM path is an explicit, opt-in hook.
5. **All intelligence flows through this spine.** New features must map to a stage above.

## Layer reference

- **Data model:** `lib/db/src/schema/{marketing,intelligence}.ts`
- **Intelligence logic:** `artifacts/api-server/src/lib/intelligence/`
- **API:** `artifacts/api-server/src/routes/` (contracts in `docs/phase-3-api-contracts.md`)
- **Front-end:** `artifacts/web/src/pages/intel/`, hooks in `src/hooks/useIntel.ts`, client in `src/lib/intel-api.ts`
