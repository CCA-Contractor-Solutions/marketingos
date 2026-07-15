// ---------------------------------------------------------------------------
// Phase 3 — typed response shapes for the Phase 2 intelligence backend +
// the small Phase 3 read-aggregation endpoints (`/intelligence/*`,
// `/actions/from-recommendation`).
//
// These types mirror the API JSON exactly (see the route files under
// `artifacts/api-server/src/routes/`). They intentionally do NOT import any
// server-side types — this file is the single source of truth for the web
// app's view of the Phase 2/3 API surface.
// ---------------------------------------------------------------------------

export type ScoreTier = "high" | "medium" | "low" | "unscored";
export type LeadStatus =
  | "new"
  | "working"
  | "qualified"
  | "sales_accepted"
  | "customer"
  | "lost";

// --- GET /intelligence/overview --------------------------------------------
export type IntelligenceOverview = {
  totalLeads: number;
  qualifiedLeads: number;
  customers: number;
  revenue: number;
  conversionRate: number;
};

// --- GET /intelligence/funnel -----------------------------------------------
export type FunnelStage = {
  stage: string;
  count: number;
};

// --- GET /intelligence/lead-trend -------------------------------------------
export type LeadTrendPoint = {
  period: string; // ISO date (week start)
  leads: number;
  customers: number;
};

// --- POST /actions/from-recommendation --------------------------------------
export type CreateActionFromRecommendationRequest = {
  recommendationId: string;
  title: string;
  owner?: string;
  dueAt?: string;
};

export type CreateActionFromRecommendationResponse = {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignees: { init: string; color: string }[];
    dueDate: string | null;
    dueAt: string | null;
    campaign: string | null;
    aiGenerated: boolean;
    blocked: boolean;
  };
  recommendation: {
    id: string;
    status: string;
  };
};

// --- GET /leads / GET /leads/:id --------------------------------------------
export type LeadSummary = {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  contactName: string;
  email: string;
  score: number;
  scoreTier: ScoreTier;
  status: LeadStatus;
  firstTouchChannel: string | null;
  lastTouchChannel: string | null;
  isCustomer: boolean;
  revenueGenerated: number;
  createdAt: string;
};

export type LeadDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  industry: string;
  location: string;
  website: string;
  companySize: string;
  contactName: string;
  email: string;
  phone: string;
  contactRole: string;
  firstTouchChannel: string | null;
  firstTouchCampaign: string | null;
  firstTouchAt: string | null;
  lastTouchChannel: string | null;
  lastTouchCampaign: string | null;
  lastTouchAt: string | null;
  campaigns: string[];
  pagesVisited: string[];
  contentConsumed: string[];
  callCount: number;
  emailCount: number;
  score: number;
  scoreTier: ScoreTier;
  scoreReason: string;
  recommendedAction: string;
  qualified: boolean;
  salesAccepted: boolean;
  isCustomer: boolean;
  customerId: string | null;
  revenueGenerated: number;
  status: LeadStatus;
  events: MarketingEvent[];
  attribution: RevenueAttribution[];
};

export type UpdateLeadRequest = Partial<{
  qualified: boolean;
  salesAccepted: boolean;
  isCustomer: boolean;
  status: LeadStatus;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
}>;

export type ConvertLeadRequest = {
  amount: number;
  convertedAt?: string;
  campaign?: string | null;
  channel?: string | null;
};

export type ConvertLeadResponse = {
  lead: LeadDetail;
  customerId: string;
  conversionId: string;
};

// --- GET /events -------------------------------------------------------------
export type MarketingEvent = {
  id: string;
  leadId: string | null;
  customerId: string | null;
  eventType: string;
  source: string;
  campaign: string | null;
  channel: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
};

// --- GET /attribution/summary ------------------------------------------------
export type AttributionBucket<K extends string> = {
  revenue: number;
  attributions: number;
} & Record<K, string>;

export type AttributionSummary = {
  byModel: AttributionBucket<"model">[];
  byChannel: AttributionBucket<"channel">[];
  byCampaign: AttributionBucket<"campaign">[];
  // Phase 4.5 -- governance: average attribution confidence across all rows.
  avgConfidence: number;
  avgConfidenceBand: ConfidenceBand;
};

// --- GET /attribution/lead/:id -----------------------------------------------
export type ConfidenceBand = "high" | "medium" | "low";

export type RevenueAttribution = {
  id: string;
  conversionId: string;
  leadId: string;
  model: "first_touch" | "last_touch" | "linear" | "assisted";
  channel: string;
  campaign: string | null;
  weight: number;
  attributedAmount: number;
  computedAt: string;
  // Phase 4.5 -- governance: per-row attribution confidence.
  confidence: number;
  confidenceBand: ConfidenceBand;
  confidenceReason: string;
};

// --- GET /channels/intelligence -----------------------------------------------
export type ChannelIntelligence = {
  channelId: string;
  channelName: string;
  category: string;
  leads: number;
  qualifiedLeads: number;
  customers: number;
  revenue: number;
  spend: number;
  roi: number | null;
};

// --- GET /campaign-intelligence / GET /campaign-intelligence/:campaignId -----
export type CampaignIntelligence = {
  campaignId: string;
  objective: string;
  audience: string;
  service: string;
  industry: string;
  location: string;
  budget: number;
  ownerName: string;
  leadsGenerated: number;
  qualifiedLeads: number;
  customers: number;
  revenue: number;
  roi: number | null;
  channels: string[];
};

export type UpsertCampaignIntelligenceRequest = Partial<{
  objective: string;
  audience: string;
  service: string;
  industry: string;
  location: string;
  budget: number;
  ownerName: string;
  channels: string[];
}>;

// --- GET /recommendations ------------------------------------------------------
export type RecommendationCategory = "campaign" | "channel" | "segment" | "market" | "general";
export type RecommendationStatus = "new" | "reviewed" | "applied" | "dismissed";

export type Recommendation = {
  id: string;
  category: RecommendationCategory;
  title: string;
  body: string;
  confidence: number;
  // Phase 4.5 -- governance additions.
  confidenceBand: ConfidenceBand;
  dataBasis: Record<string, unknown>;
  status: RecommendationStatus;
  createdAt: string;
  generatedReason: string;
  dataSources: string[];
  actionTaken: boolean;
  actionId: string | null;
  outcome: string | null;
  outcomeRecordedAt: string | null;
};

export type UpdateRecommendationRequest = {
  status: RecommendationStatus;
};

// ---------------------------------------------------------------------------
// Phase 4.5 -- Data Quality & Intelligence Governance
// ---------------------------------------------------------------------------

// --- GET /recommendations/:id/audit -------------------------------------------
export type RecommendationAuditEvent =
  | "generated"
  | "viewed"
  | "action_created"
  | "dismissed"
  | "outcome_recorded";

export type RecommendationAuditEntry = {
  id: string;
  recommendationId: string;
  event: RecommendationAuditEvent;
  detail: Record<string, unknown>;
  createdAt: string;
};

// --- POST /recommendations/:id/outcome -----------------------------------------
export type RecordRecommendationOutcomeRequest = {
  outcome: string;
};

// --- GET /governance/summary ---------------------------------------------------
export type GovernanceBandBreakdown = {
  band: ConfidenceBand;
  count: number;
  pct: number;
};

export type GovernanceSummary = {
  totalRecommendations: number;
  avgRecommendationConfidence: number;
  avgRecommendationConfidenceBand: ConfidenceBand;
  recommendationsByBand: GovernanceBandBreakdown[];
  pctActioned: number;
  pctWithOutcome: number;
  totalAttributionRows: number;
  avgAttributionConfidence: number;
  avgAttributionConfidenceBand: ConfidenceBand;
};

// ---------------------------------------------------------------------------
// Phase 4 — External Data Integrations (Module 8 extension)
// ---------------------------------------------------------------------------

export type IntegrationCategory = "advertising" | "analytics" | "communication" | "email" | "automation";
export type IntegrationStatus = "available" | "connected" | "error" | "disabled";
export type IntegrationAuthMethod = "oauth2" | "api_key" | "webhook" | "none";
export type IntegrationSyncFrequency = "realtime" | "hourly" | "daily" | "manual";
export type SyncJobStatus = "running" | "success" | "error";

export type SyncJobSummary = {
  id: string;
  status: SyncJobStatus;
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
};

// --- GET /integrations ------------------------------------------------------
export type Integration = {
  id: string;
  providerKey: string;
  category: IntegrationCategory;
  displayName: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  credentialsReference: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  connectorAvailable: boolean;
  authMethod: IntegrationAuthMethod;
  requiredCredentials: string[];
  dataAvailable: string[];
  defaultSyncFrequency: IntegrationSyncFrequency;
  lastSync: SyncJobSummary | null;
  dataImported: number;
  errorCount: number;
};

// --- POST /integrations/:id/connect -----------------------------------------
export type ConnectIntegrationRequest = {
  credentialsReference?: string | null;
};

export type ConnectIntegrationResponse = Integration & { connectReason?: string };

// --- POST /integrations/:id/sync --------------------------------------------
export type SyncIntegrationResponse = {
  jobId: string;
  status: SyncJobStatus;
  recordsProcessed: number;
  skippedDuplicates: number;
  marketingEventsCreated: number;
  leadsRefreshed: number;
  errors: string[];
};

// --- GET /integrations/:id/sync-jobs ----------------------------------------
export type SyncJob = {
  id: string;
  integrationId: string;
  provider: string;
  startedAt: string;
  completedAt: string | null;
  status: SyncJobStatus;
  recordsProcessed: number;
  errors: string[];
  createdAt: string;
};

// --- GET /integrations/:id/errors -------------------------------------------
export type IntegrationError = {
  jobId: string;
  occurredAt: string;
  message: string;
};

// --- GET /external-events ---------------------------------------------------
export type ExternalEvent = {
  id: string;
  provider: string;
  externalId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string | null;
  marketingEventId: string | null;
  createdAt: string;
};

// --- POST /ingest/website ----------------------------------------------------
export type IngestWebsiteRequest = {
  page?: string;
  url?: string;
  eventType?: string;
  type?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  leadId?: string | null;
  email?: string;
  formName?: string;
  asset?: string;
  externalId?: string;
  occurredAt?: string;
};
