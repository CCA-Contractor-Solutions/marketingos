import { pgTable, text, integer, boolean, jsonb, real } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// roles / users
// ---------------------------------------------------------------------------

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
});

export type RoleRow = typeof rolesTable.$inferSelect;

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  roleId: text("role_id"),
  createdAt: text("created_at").notNull().default(""),
});

export type UserRow = typeof usersTable.$inferSelect;

// ---------------------------------------------------------------------------
// leads
// ---------------------------------------------------------------------------

export type ScoreTier = "high" | "medium" | "low" | "unscored";
export type LeadStatus =
  | "new"
  | "working"
  | "qualified"
  | "sales_accepted"
  | "customer"
  | "lost";

export const leadsTable = pgTable("leads", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),

  // company fields
  companyName: text("company_name").notNull().default(""),
  industry: text("industry").notNull().default(""),
  location: text("location").notNull().default(""),
  website: text("website").notNull().default(""),
  companySize: text("company_size").notNull().default(""),

  // contact fields
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  contactRole: text("contact_role").notNull().default(""),

  // journey (denormalized cache, recomputed by intelligence lib)
  firstTouchChannel: text("first_touch_channel"),
  firstTouchCampaign: text("first_touch_campaign"),
  firstTouchAt: text("first_touch_at"),
  lastTouchChannel: text("last_touch_channel"),
  lastTouchCampaign: text("last_touch_campaign"),
  lastTouchAt: text("last_touch_at"),

  campaigns: jsonb("campaigns").$type<string[]>().notNull().default([]),
  pagesVisited: jsonb("pages_visited").$type<string[]>().notNull().default([]),
  contentConsumed: jsonb("content_consumed").$type<string[]>().notNull().default([]),

  // counters
  callCount: integer("call_count").notNull().default(0),
  emailCount: integer("email_count").notNull().default(0),

  // scoring
  score: integer("score").notNull().default(0),
  scoreTier: text("score_tier").$type<ScoreTier>().notNull().default("unscored"),
  scoreReason: text("score_reason").notNull().default(""),
  recommendedAction: text("recommended_action").notNull().default(""),

  // outcome
  qualified: boolean("qualified").notNull().default(false),
  salesAccepted: boolean("sales_accepted").notNull().default(false),
  isCustomer: boolean("is_customer").notNull().default(false),
  customerId: text("customer_id"),
  revenueGenerated: integer("revenue_generated").notNull().default(0),

  status: text("status").$type<LeadStatus>().notNull().default("new"),
});

export type LeadRow = typeof leadsTable.$inferSelect;

// ---------------------------------------------------------------------------
// customers
// ---------------------------------------------------------------------------

export const customersTable = pgTable("customers", {
  id: text("id").primaryKey(),
  leadId: text("lead_id"),
  companyName: text("company_name").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  convertedAt: text("converted_at").notNull().default(""),
  totalRevenue: integer("total_revenue").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

export type CustomerRow = typeof customersTable.$inferSelect;

// ---------------------------------------------------------------------------
// marketing_events (Module 1 core)
// ---------------------------------------------------------------------------

export type MarketingEventType =
  | "website_visit"
  | "landing_page_view"
  | "form_submission"
  | "content_download"
  | "email_open"
  | "email_click"
  | "phone_call"
  | "meeting_request"
  | "campaign_interaction"
  | "sales_conversion"
  | "customer_purchase";

export const marketingEventsTable = pgTable("marketing_events", {
  id: text("id").primaryKey(),
  leadId: text("lead_id"),
  customerId: text("customer_id"),
  eventType: text("event_type").$type<MarketingEventType>().notNull(),
  source: text("source").notNull().default(""),
  campaign: text("campaign"),
  channel: text("channel"),
  occurredAt: text("occurred_at").notNull().default(""),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: text("created_at").notNull().default(""),
});

export type MarketingEventRow = typeof marketingEventsTable.$inferSelect;

// ---------------------------------------------------------------------------
// campaign_intelligence (extends existing campaignsTable without altering it)
// ---------------------------------------------------------------------------

export const campaignIntelligenceTable = pgTable("campaign_intelligence", {
  campaignId: text("campaign_id").primaryKey(),
  objective: text("objective").notNull().default(""),
  audience: text("audience").notNull().default(""),
  service: text("service").notNull().default(""),
  industry: text("industry").notNull().default(""),
  location: text("location").notNull().default(""),
  budget: integer("budget").notNull().default(0),
  ownerName: text("owner_name").notNull().default(""),

  // performance (recomputed)
  leadsGenerated: integer("leads_generated").notNull().default(0),
  qualifiedLeads: integer("qualified_leads").notNull().default(0),
  customers: integer("customers").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  roi: real("roi"),

  channels: jsonb("channels").$type<string[]>().notNull().default([]),
});

export type CampaignIntelligenceRow = typeof campaignIntelligenceTable.$inferSelect;

// ---------------------------------------------------------------------------
// channels (Module 4)
// ---------------------------------------------------------------------------

export type ChannelCategory =
  | "paid"
  | "organic"
  | "social"
  | "referral"
  | "direct"
  | "email"
  | "events"
  | "partnerships";

export const channelsTable = pgTable("channels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").$type<ChannelCategory>().notNull().default("direct"),
  active: boolean("active").notNull().default(true),
});

export type ChannelRow = typeof channelsTable.$inferSelect;

// Optional cache table — primary path computes channel intelligence live.
export const channelStatsTable = pgTable("channel_stats", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  leads: integer("leads").notNull().default(0),
  qualifiedLeads: integer("qualified_leads").notNull().default(0),
  customers: integer("customers").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  roi: real("roi"),
  spend: integer("spend").notNull().default(0),
  computedAt: text("computed_at").notNull().default(""),
});

export type ChannelStatsRow = typeof channelStatsTable.$inferSelect;

// ---------------------------------------------------------------------------
// conversions + revenue attribution (Module 3)
// ---------------------------------------------------------------------------

export const conversionsTable = pgTable("conversions", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  customerId: text("customer_id").notNull(),
  campaign: text("campaign"),
  channel: text("channel"),
  amount: integer("amount").notNull().default(0),
  convertedAt: text("converted_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
});

export type ConversionRow = typeof conversionsTable.$inferSelect;

export type AttributionModel = "first_touch" | "last_touch" | "linear" | "assisted";

// Phase 4.5 — governance: band classification shared by both recommendation
// confidence (lib/intelligence/confidence.ts) and attribution confidence
// (lib/intelligence/attribution.ts).
export type ConfidenceBand = "high" | "medium" | "low";

export const revenueAttributionTable = pgTable("revenue_attribution", {
  id: text("id").primaryKey(),
  conversionId: text("conversion_id").notNull(),
  leadId: text("lead_id").notNull(),
  model: text("model").$type<AttributionModel>().notNull(),
  channel: text("channel").notNull().default(""),
  campaign: text("campaign"),
  weight: real("weight").notNull().default(0),
  attributedAmount: integer("attributed_amount").notNull().default(0),
  computedAt: text("computed_at").notNull().default(""),

  // Phase 4.5 — Data Quality & Intelligence Governance. Per-row attribution
  // confidence, computed in lib/intelligence/attribution.ts from touch
  // count, first->convert elapsed time, first-party vs. view-through
  // credit, and source reliability. See docs/data-governance.md.
  confidence: real("confidence").notNull().default(0),
  confidenceBand: text("confidence_band").$type<ConfidenceBand>().notNull().default("low"),
  confidenceReason: text("confidence_reason").notNull().default(""),
});

export type RevenueAttributionRow = typeof revenueAttributionTable.$inferSelect;

// ---------------------------------------------------------------------------
// ai_recommendations (Module 7)
// ---------------------------------------------------------------------------

export type RecommendationCategory = "campaign" | "channel" | "segment" | "market" | "general";
export type RecommendationStatus = "new" | "reviewed" | "applied" | "dismissed";

export const aiRecommendationsTable = pgTable("ai_recommendations", {
  id: text("id").primaryKey(),
  category: text("category").$type<RecommendationCategory>().notNull().default("general"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  confidence: real("confidence").notNull().default(0),
  dataBasis: jsonb("data_basis").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").$type<RecommendationStatus>().notNull().default("new"),
  createdAt: text("created_at").notNull().default(""),

  // Phase 4.5 — Data Quality & Intelligence Governance. Populated at
  // generation time by lib/intelligence/confidence.ts + the rule that fired
  // in routes/recommendations.ts, so every recommendation can show its
  // "why" instead of being a black box.
  generatedReason: text("generated_reason").notNull().default(""),
  dataSources: jsonb("data_sources").$type<string[]>().notNull().default([]),

  // Outcome tracking — set once a human turns the recommendation into an
  // action (see POST /actions/from-recommendation) and, later, records what
  // happened. Deliberately free-text/manual — no autonomous action-taking.
  actionTaken: boolean("action_taken").notNull().default(false),
  actionId: text("action_id"),
  outcome: text("outcome"),
  outcomeRecordedAt: text("outcome_recorded_at"),
});

export type AiRecommendationRow = typeof aiRecommendationsTable.$inferSelect;

// ---------------------------------------------------------------------------
// recommendation_audit (Phase 4.5 — Module 7 governance extension)
//
// Prevents black-box AI: every meaningful lifecycle event for a
// recommendation (generated / viewed / action_created / dismissed /
// outcome_recorded) is written here, ordered by createdAt, so the UI can
// render a full "what/why/when/result" audit trail per recommendation.
// ---------------------------------------------------------------------------

export type RecommendationAuditEvent =
  | "generated"
  | "viewed"
  | "action_created"
  | "dismissed"
  | "outcome_recorded";

export const recommendationAuditTable = pgTable("recommendation_audit", {
  id: text("id").primaryKey(),
  recommendationId: text("recommendation_id").notNull(),
  event: text("event").$type<RecommendationAuditEvent>().notNull(),
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: text("created_at").notNull().default(""),
});

export type RecommendationAuditRow = typeof recommendationAuditTable.$inferSelect;

// ---------------------------------------------------------------------------
// integrations (Module 8)
// ---------------------------------------------------------------------------

export type IntegrationCategory = "advertising" | "analytics" | "communication" | "email" | "automation";
export type IntegrationStatus = "available" | "connected" | "error" | "disabled";

export const integrationsTable = pgTable("integrations", {
  id: text("id").primaryKey(),
  providerKey: text("provider_key").notNull(),
  category: text("category").$type<IntegrationCategory>().notNull().default("analytics"),
  displayName: text("display_name").notNull().default(""),
  status: text("status").$type<IntegrationStatus>().notNull().default("available"),
  // NEVER store secrets here — store a reference key only (e.g. an env var
  // name or vault key), never raw tokens/credentials.
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  // Reference/vault-key NAME only (e.g. "GA4_OAUTH_TOKEN") — never a raw
  // secret value. The actual credential is resolved at runtime from env via
  // `lib/integrations/credentials.ts#resolveCredential`.
  credentialsReference: text("credentials_reference"),
  lastSyncedAt: text("last_synced_at"),
  createdAt: text("created_at").notNull().default(""),
});

export type IntegrationRow = typeof integrationsTable.$inferSelect;

// ---------------------------------------------------------------------------
// sync_jobs (Phase 4 — Module 8 extension)
//
// One row per connector sync attempt (manual "Sync now" or connect-time
// validation run). Ingestion (lib/integrations/ingestion.ts) creates a
// "running" row up front and updates it to "success"/"error" when finished.
// ---------------------------------------------------------------------------

export type SyncJobStatus = "running" | "success" | "error";

export const syncJobsTable = pgTable("sync_jobs", {
  id: text("id").primaryKey(),
  integrationId: text("integration_id").notNull(),
  provider: text("provider").notNull().default(""),
  startedAt: text("started_at").notNull().default(""),
  completedAt: text("completed_at"),
  status: text("status").$type<SyncJobStatus>().notNull().default("running"),
  recordsProcessed: integer("records_processed").notNull().default(0),
  // Safe, sanitized error strings only — never raw secrets/tokens.
  errors: jsonb("errors").$type<string[]>().notNull().default([]),
  createdAt: text("created_at").notNull().default(""),
});

export type SyncJobRow = typeof syncJobsTable.$inferSelect;

// ---------------------------------------------------------------------------
// external_events (Phase 4 — Module 8 extension)
//
// Raw, provider-native record log — kept separate from `marketing_events`
// (the normalized, provider-agnostic event model). Every raw record ingested
// from a connector or webhook lands here first for idempotency/audit, then
// (once mapped via a connector's `mapToEvents`) is turned into exactly one
// `marketing_events` row, linked back via `marketingEventId`.
//
// Dedup invariant (enforced in code, not a DB constraint — matching this
// schema's no-FK/no-unique-constraint convention): before inserting, callers
// must check for an existing row with the same (provider, externalId) and
// skip if one is already processed.
// ---------------------------------------------------------------------------

export const externalEventsTable = pgTable("external_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull().default(""),
  // The provider's own record id — used for dedup, never regenerated.
  externalId: text("external_id").notNull().default(""),
  eventType: text("event_type").notNull().default(""),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  // Set once this raw record has been mapped into a marketing_events row.
  processedAt: text("processed_at"),
  marketingEventId: text("marketing_event_id"),
  createdAt: text("created_at").notNull().default(""),
});

export type ExternalEventRow = typeof externalEventsTable.$inferSelect;

// ---------------------------------------------------------------------------
// marketing_assets (Module 6 support)
// ---------------------------------------------------------------------------

export type MarketingAssetStatus = "draft" | "in_review" | "approved" | "published" | "retired";

export const marketingAssetsTable = pgTable("marketing_assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default(""),
  campaign: text("campaign"),
  url: text("url"),
  status: text("status").$type<MarketingAssetStatus>().notNull().default("draft"),
  createdAt: text("created_at").notNull().default(""),
});

export type MarketingAssetRow = typeof marketingAssetsTable.$inferSelect;
