# Phase 2 Spec — CCA Growth Intelligence Operating System

Native lead intelligence + revenue attribution foundation, built INTO the existing MarketingOS monorepo. **Not a Zoho extension. Not a dashboard.** This is the data-intelligence backend + typed API. MarketingOS owns the data.

## Hard rules (match existing conventions exactly)
- Drizzle tables in `lib/db/src/schema/*.ts`, one domain file, re-exported from `lib/db/src/schema/index.ts`.
- Follow `schema/marketing.ts` style: `pgTable`, `text("col")` snake_case columns, **string primary keys** (app-generated IDs like `LEAD-1001`), `jsonb("x").$type<T>()`, `integer`, `boolean`, `.notNull().default(...)`, and `export type XRow = typeof xTable.$inferSelect;`.
- Timestamps: store as `text` ISO-8601 strings (matches existing `time`/`dueAt` convention) — column name e.g. `occurred_at`, `created_at`.
- DB client: `import { db, <table> } from "@workspace/db"`. Query with `drizzle-orm` (`asc`, `desc`, `eq`, `and`, `sql`, `inArray`).
- API routes: one file per module in `artifacts/api-server/src/routes/`, `const router: IRouter = Router();`, `export default router;`, register in `routes/index.ts` via `router.use(xRouter)`.
- **Validation:** do NOT edit `lib/api-zod` (it is Orval-generated). Define request-body validators INLINE in each route file using `import { z } from "zod"` (zod is available transitively; if not, add `zod` to api-server deps via catalog). Use `.safeParse()` and return 400 on failure — mirror `campaigns.ts`.
- All new POST/PATCH endpoints are automatically protected by the existing `requireApiToken` guard (mutations require the bearer token). GET stays public.
- ID generation: follow the `campaigns.ts` pattern (count rows → prefix + offset). Prefixes: leads `LEAD-`, customers `CUST-`, events `EVT-`, channels `CH-`, conversions `CONV-`, attribution `ATTR-`, recommendations `REC-`, integrations `INTG-`, assets `ASST-`, users `USR-`, roles `ROLE-`.
- Everything must pass `pnpm run typecheck` and `pnpm --filter @workspace/api-server run build`.

## Data model (tables) — file `lib/db/src/schema/intelligence.ts`

### users / roles
- `rolesTable` "roles": id, name, description, permissions jsonb string[].
- `usersTable` "users": id, name, email, roleId (text, ref roles by id — no FK constraint, matches existing no-FK convention), createdAt.

### leads
- `leadsTable` "leads":
  - id, createdAt, updatedAt
  - company fields: companyName, industry, location, website, companySize
  - contact fields: contactName, email, phone, contactRole
  - journey (denormalized cache, recomputed by intelligence lib): firstTouchChannel, firstTouchCampaign, firstTouchAt, lastTouchChannel, lastTouchCampaign, lastTouchAt
  - jsonb: campaigns string[] (campaign ids influencing), pagesVisited string[], contentConsumed string[]
  - counters: callCount int, emailCount int
  - scoring: score int default 0, scoreTier text ("high"|"medium"|"low"|"unscored"), scoreReason text, recommendedAction text
  - outcome: qualified bool, salesAccepted bool, isCustomer bool, customerId text nullable, revenueGenerated int default 0 (cents or whole dollars — use whole dollars, matches campaign budget ints)
  - status text ("new"|"working"|"qualified"|"sales_accepted"|"customer"|"lost")

### customers
- `customersTable` "customers": id, leadId (originating lead), companyName, contactName, email, convertedAt, totalRevenue int, createdAt.

### marketing_events (Module 1 core)
- `marketingEventsTable` "marketing_events":
  - id, leadId (nullable), customerId (nullable), eventType text, source text, campaign text (nullable), channel text (nullable), occurredAt text (ISO), metadata jsonb `Record<string,unknown>` default {}, createdAt.
  - eventType examples: website_visit, landing_page_view, form_submission, content_download, email_open, email_click, phone_call, meeting_request, campaign_interaction, sales_conversion, customer_purchase.

### campaigns (extend — do NOT break existing `campaignsTable`)
- Create a SEPARATE `campaignIntelligenceTable` "campaign_intelligence" keyed by campaignId (text pk = existing campaign id) so we don't alter the existing table/contract:
  - campaignId (pk), objective, audience, service, industry, location, budget int, ownerName
  - performance (recomputed): leadsGenerated int, qualifiedLeads int, customers int, revenue int, roi real (numeric) — store roi as text or real; use `real`.
  - channels jsonb string[]

### channels (Module 4)
- `channelsTable` "channels": id, name (e.g. "Google Ads"), category text ("paid"|"organic"|"social"|"referral"|"direct"|"email"|"events"|"partnerships"), active bool default true.
- Channel performance is COMPUTED (not stored) by the intelligence lib from events + leads + conversions. Provide a stored `channelStatsTable` "channel_stats" ONLY as an optional cache: channelId, leads int, qualifiedLeads int, customers int, revenue int, roi real, spend int, computedAt. (Cache is optional; primary path computes live.)

### conversions + revenue attribution (Module 3)
- `conversionsTable` "conversions": id, leadId, customerId, campaign text nullable, channel text nullable, amount int, convertedAt text, createdAt.
- `revenueAttributionTable` "revenue_attribution": id, conversionId, leadId, model text ("first_touch"|"last_touch"|"linear"|"assisted"), channel text, campaign text nullable, weight real (0..1), attributedAmount int, computedAt.

### ai_recommendations (Module 7)
- `aiRecommendationsTable` "ai_recommendations": id, category text ("campaign"|"channel"|"segment"|"market"|"general"), title, body, confidence real, dataBasis jsonb, status text ("new"|"reviewed"|"applied"|"dismissed"), createdAt.

### integrations (Module 8)
- `integrationsTable` "integrations": id, providerKey text (e.g. "google_ads","meta_ads","ga4","callrail","ringcentral"), category text ("advertising"|"analytics"|"communication"|"email"|"automation"), displayName, status text ("available"|"connected"|"error"|"disabled") default "available", config jsonb `Record<string,unknown>` default {} (NEVER store secrets here — store a reference key only), lastSyncedAt text nullable, createdAt.

### assets (Module 6 support) — optional light table
- `marketingAssetsTable` "marketing_assets": id, name, type text, campaign text nullable, url text nullable, status text ("draft"|"in_review"|"approved"|"published"|"retired") default "draft", createdAt.

Add `export type XRow = typeof xTable.$inferSelect;` for every table.

## Intelligence library — `artifacts/api-server/src/lib/intelligence/`
Pure functions (unit-testable, no HTTP). Files:
- `scoring.ts` — Module 5. `scoreLead(lead, events): { score, tier, reason, recommendedAction }`. Configurable rule weights in a `SCORING_RULES` const:
  - high intent (+30 each, cap): requested consultation (event meeting_request / eventType consultation), pricing/service inquiry (form_submission w/ metadata.intent="pricing"), phone_call, meeting_request; multiple visits (>=3 website_visit → +15); content engagement (>=2 content_download → +10).
  - medium (+8): content_download, email_click/email_open, website activity.
  - low (+2): basic website_visit.
  - Map total → tier: >=60 high, >=25 medium, else low; unscored if no events. Reason = top contributing rules. recommendedAction per tier ("Route to sales now" / "Nurture with targeted content" / "Continue monitoring").
- `attribution.ts` — Module 3. Given a conversion + that lead's ordered events, produce attribution rows for first_touch (100% earliest channel), last_touch (100% latest channel), linear (even split across distinct touch channels), assisted (all non-last touches share credit). Return array of `{model, channel, campaign, weight, attributedAmount}`.
- `journey.ts` — Module 2. `computeJourney(events)`: first/last touch channel+campaign+at, distinct campaigns[], pagesVisited[], contentConsumed[], callCount, emailCount. Used to refresh a lead's denormalized journey cache.
- `channels.ts` — Module 4. `computeChannelIntelligence(channels, leads, events, conversions)`: per channel → leads, qualifiedLeads, customers, revenue, spend (from integrations/campaign budgets if available else 0), roi = spend>0 ? (revenue-spend)/spend : null. Return sorted by revenue desc.

## API routes (register all in routes/index.ts)
- `events.ts` — Module 1: `POST /events` (ingest single event; validates; creates event; if leadId present, recompute+persist that lead's journey cache and re-score). `POST /events/batch`. `GET /events?leadId=&channel=&type=&limit=`.
- `leads.ts` — Module 2: `GET /leads` (filter by tier/status/channel), `POST /leads` (create; used by website form), `GET /leads/:id` (full intelligence profile: lead + journey + events + score + attribution if customer), `PATCH /leads/:id` (update outcome flags: qualified/salesAccepted/isCustomer/status), `POST /leads/:id/score` (force re-score), `POST /leads/:id/convert` (create customer + conversion + attribution; set lead.isCustomer, revenueGenerated).
- `attribution.ts` — Module 3: `GET /attribution/summary` (revenue by model + channel + campaign), `GET /attribution/lead/:id`.
- `channels.ts` — Module 4: `GET /channels`, `POST /channels`, `GET /channels/intelligence` (computed report).
- `campaign-intelligence.ts` — Module 6: `GET /campaign-intelligence`, `GET /campaign-intelligence/:campaignId`, `PUT /campaign-intelligence/:campaignId` (upsert objective/audience/etc.), and a compute step that rolls up leads/qualified/customers/revenue/roi for that campaign from leads+conversions.
- `recommendations.ts` — Module 7: `GET /recommendations`, `POST /recommendations/generate` (foundation: compute a few rule-based insights from real data — e.g., compare conversion rate by industry, channel revenue vs lead volume, top-performing location — persist as ai_recommendations rows; leave a clearly-marked hook `generateWithLLM()` that can later call the existing OpenAI client but is NOT required to run), `PATCH /recommendations/:id` (status).
- `integrations.ts` — Module 8: `GET /integrations` (registry), `POST /integrations` (register provider), `PATCH /integrations/:id` (status/config). Include a `providers.ts` with a provider-agnostic `IntegrationConnector` interface (`{ providerKey, category, testConnection(), sync() }`) and a `CONNECTOR_REGISTRY` map seeded with stub connectors for google_ads, meta_ads, linkedin_ads, ga4, search_console, callrail, ringcentral, email — each a stub returning `{ ok: false, reason: "not_configured" }`. **No hardcoded provider SDKs.**

## Seed — extend `artifacts/api-server/src/seed.ts`
Add idempotent seeding (only if `leads` table empty) of realistic CCA-contractor sample intelligence so the foundation is demonstrable:
- ~4 channels (Google Ads, Google Organic, LinkedIn, Referral) in channelsTable.
- ~6 leads across tiers/industries (commercial vs residential contractors, FL/TX/multi-state), each with a realistic ordered set of marketing_events (visit → download → call → meeting), 2 of them converted to customers with conversions + attribution rows. Include the "ABC Construction" example: Google Search first touch, Multi-State Expansion campaign, compliance guide download → website visit → phone call → consultation, Customer, $15,000.
- campaign_intelligence rows for the existing seeded campaigns.
- integrations registry rows (all "available").
- Run scoring + journey compute on seeded leads so scores/journeys are populated.
Keep existing seed content intact; append new sections guarded by their own emptiness checks.

## Deliverable
All tables + intelligence libs + routes + seed, registered and compiling. Report a summary of files created/changed. Do not push or open a PR — the parent will verify, build, and PR.
