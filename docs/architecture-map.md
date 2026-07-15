# MarketingOS Architecture Map — the Spine

This is the canonical mental model for MarketingOS. Every future feature should fit somewhere on this spine. **MarketingOS is the source of truth for marketing intelligence** — external systems (Zoho, Google Ads, CallRail, etc.) are optional inputs/outputs that plug into the edges, never dependencies of the core.

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

## Integration edges (Phase 4 and beyond)

External providers attach at the **Events** edge (inbound activity) and the **Channels/Revenue** edge (spend + outcomes) through the provider-agnostic framework — never by becoming a core dependency.

| Edge | Inbound examples | Framework |
|---|---|---|
| Events in | Website forms, Google Analytics, CallRail, RingCentral, email opens/clicks | `integrations` table + `routes/integrations/providers.ts` (`IntegrationConnector` + `CONNECTOR_REGISTRY`, all stubs today) |
| Spend in | Google Ads, Meta Ads, LinkedIn Ads (feeds channel `spend` → ROI) | same |

**Phase 4 priority order:** Website forms → Google Analytics → Google Ads → CallRail → RingCentral → Meta Ads → LinkedIn. Each is a connector implementation behind the existing interface; the core spine does not change.

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
