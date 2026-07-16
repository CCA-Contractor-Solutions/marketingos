// ---------------------------------------------------------------------------
// Phase 3 — typed API client for the Phase 2 intelligence backend + the
// small Phase 3 aggregation endpoints. The generated Orval hooks in
// `@workspace/api-client-react` only cover Phase 1 endpoints, so these
// functions call `customFetch` directly (same base URL + bearer token
// handling the generated hooks use — see `lib/api-client-react/src/custom-fetch.ts`).
//
// Every function here corresponds 1:1 to an endpoint documented in
// `docs/phase-3-api-contracts.md`.
// ---------------------------------------------------------------------------

import { customFetch } from "@workspace/api-client-react";
import type {
  IntelligenceOverview,
  FunnelStage,
  LeadTrendPoint,
  CreateActionFromRecommendationRequest,
  CreateActionFromRecommendationResponse,
  LeadSummary,
  LeadDetail,
  UpdateLeadRequest,
  ConvertLeadRequest,
  ConvertLeadResponse,
  AttributionSummary,
  RevenueAttribution,
  ChannelIntelligence,
  CampaignIntelligence,
  UpsertCampaignIntelligenceRequest,
  Recommendation,
  UpdateRecommendationRequest,
  RecommendationAuditEntry,
  RecordRecommendationOutcomeRequest,
  GovernanceSummary,
  Integration,
  IntegrationStatus,
  ConnectIntegrationRequest,
  ConnectIntegrationResponse,
  SyncIntegrationResponse,
  SyncJob,
  IntegrationError,
  ExternalEvent,
  IngestWebsiteRequest,
  LeadPrediction,
  PredictionFactor,
  RecomputePredictionsRequest,
  RecomputePredictionsResponse,
  BudgetRecommendation,
  MarketOpportunity,
  ContentOpportunity,
  GrowthBriefing,
  UpdateGrowthStatusRequest,
  ConfidenceBand,
} from "./intel-types";

// All backend endpoints are mounted under /api (matching the generated Orval
// client). Keep this prefix in one place.
const API = "/api";

// ---------------------------------------------------------------------------
// Demo mode. When VITE_DEMO_MODE is set at build time, the app has no backend
// (e.g. the static pplx.app preview). All reads are served from a single
// pre-captured dataset (public/demo-data/demo-data.json) and mutations become
// no-ops that return optimistic results, so the full UI is clickable with real
// seeded intelligence data. Live builds (unset flag) hit the real /api.
// ---------------------------------------------------------------------------

const DEMO_MODE =
  (import.meta.env as Record<string, string | undefined>).VITE_DEMO_MODE === "1";

type DemoDataset = {
  overview: IntelligenceOverview;
  funnel: FunnelStage[];
  leadTrend: LeadTrendPoint[];
  channels: ChannelIntelligence[];
  campaigns: CampaignIntelligence[];
  attributionSummary: AttributionSummary;
  recommendations: Recommendation[];
  leads: LeadSummary[];
  leadDetails: Record<string, LeadDetail>;
  leadAttribution: Record<string, RevenueAttribution[]>;
  campaignDetails: Record<string, CampaignIntelligence>;
  // Phase 4.5 -- governance (optional: older captured datasets may not have
  // these keys yet, so callers fall back to sensible static demo values).
  recommendationAudit?: Record<string, RecommendationAuditEntry[]>;
  governanceSummary?: GovernanceSummary;
  // Phase 5 -- predictive growth engine (optional: older captured datasets
  // may not have these keys yet, so every fn below falls back to a
  // sensible static/derived demo value instead of throwing).
  leadPredictions?: LeadPrediction[];
  budgetRecommendations?: BudgetRecommendation[];
  marketOpportunities?: MarketOpportunity[];
  contentOpportunities?: ContentOpportunity[];
  growthBriefing?: GrowthBriefing;
};

let _demoCache: Promise<DemoDataset> | null = null;
function demoData(): Promise<DemoDataset> {
  if (!_demoCache) {
    // Resolve relative to the current document base so it works whether the
    // app is served at root, a sub-path, or with a relative asset base.
    const url = new URL("demo-data/demo-data.json", document.baseURI).toString();
    _demoCache = fetch(url).then((r) => r.json());
  }
  return _demoCache;
}
function demoDelay<T>(value: T): Promise<T> {
  // Small delay so loading states are exercised, matching real network feel.
  return new Promise((resolve) => setTimeout(() => resolve(value), 150));
}

// --- Intelligence summary (Phase 3 additions) --------------------------------

export function getIntelligenceOverview(): Promise<IntelligenceOverview> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.overview));
  return customFetch<IntelligenceOverview>(`${API}/intelligence/overview`, {
    method: "GET",
    responseType: "json",
  });
}

export function getIntelligenceFunnel(): Promise<FunnelStage[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.funnel));
  return customFetch<FunnelStage[]>(`${API}/intelligence/funnel`, {
    method: "GET",
    responseType: "json",
  });
}

export function getLeadTrend(weeks = 8): Promise<LeadTrendPoint[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.leadTrend));
  return customFetch<LeadTrendPoint[]>(`${API}/intelligence/lead-trend?weeks=${weeks}`, {
    method: "GET",
    responseType: "json",
  });
}

export function createActionFromRecommendation(
  body: CreateActionFromRecommendationRequest,
): Promise<CreateActionFromRecommendationResponse> {
  if (DEMO_MODE) {
    return demoDelay({
      task: {
        id: `TSK-DEMO-${Math.floor(Math.random() * 900 + 100)}`,
        title: body.title,
        status: "backlog",
        aiGenerated: true,
      },
      recommendation: { id: body.recommendationId, status: "applied" },
    } as unknown as CreateActionFromRecommendationResponse);
  }
  return customFetch<CreateActionFromRecommendationResponse>(`${API}/actions/from-recommendation`, {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Leads --------------------------------------------------------------------

export type ListLeadsParams = {
  tier?: string;
  status?: string;
  channel?: string;
};

export function listLeads(params: ListLeadsParams = {}): Promise<LeadSummary[]> {
  const search = new URLSearchParams();
  if (params.tier) search.set("tier", params.tier);
  if (params.status) search.set("status", params.status);
  if (params.channel) search.set("channel", params.channel);
  const qs = search.toString();
  if (DEMO_MODE) {
    return demoData().then((d) => {
      let leads = d.leads;
      if (params.tier) leads = leads.filter((l) => l.scoreTier === params.tier);
      if (params.status) leads = leads.filter((l) => l.status === params.status);
      return demoDelay(leads);
    });
  }
  return customFetch<LeadSummary[]>(`${API}/leads${qs ? `?${qs}` : ""}`, {
    method: "GET",
    responseType: "json",
  });
}

export function getLead(id: string): Promise<LeadDetail> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.leadDetails[id]));
  return customFetch<LeadDetail>(`${API}/leads/${id}`, {
    method: "GET",
    responseType: "json",
  });
}

export function updateLead(id: string, body: UpdateLeadRequest): Promise<LeadDetail> {
  return customFetch<LeadDetail>(`${API}/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

export function convertLead(id: string, body: ConvertLeadRequest): Promise<ConvertLeadResponse> {
  return customFetch<ConvertLeadResponse>(`${API}/leads/${id}/convert`, {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

export function rescoreLead(id: string): Promise<LeadDetail> {
  return customFetch<LeadDetail>(`${API}/leads/${id}/score`, {
    method: "POST",
    responseType: "json",
  });
}

// --- Attribution ----------------------------------------------------------------

export function getAttributionSummary(): Promise<AttributionSummary> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.attributionSummary));
  return customFetch<AttributionSummary>(`${API}/attribution/summary`, {
    method: "GET",
    responseType: "json",
  });
}

export function getAttributionForLead(leadId: string): Promise<RevenueAttribution[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.leadAttribution[leadId] ?? []));
  return customFetch<RevenueAttribution[]>(`${API}/attribution/lead/${leadId}`, {
    method: "GET",
    responseType: "json",
  });
}

// --- Channels ----------------------------------------------------------------------

export function getChannelIntelligence(): Promise<ChannelIntelligence[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.channels));
  return customFetch<ChannelIntelligence[]>(`${API}/channels/intelligence`, {
    method: "GET",
    responseType: "json",
  });
}

// --- Campaign intelligence -----------------------------------------------------------

export function listCampaignIntelligence(): Promise<CampaignIntelligence[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.campaigns));
  return customFetch<CampaignIntelligence[]>(`${API}/campaign-intelligence`, {
    method: "GET",
    responseType: "json",
  });
}

export function getCampaignIntelligence(campaignId: string): Promise<CampaignIntelligence> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.campaignDetails[campaignId]));
  return customFetch<CampaignIntelligence>(`${API}/campaign-intelligence/${campaignId}`, {
    method: "GET",
    responseType: "json",
  });
}

export function upsertCampaignIntelligence(
  campaignId: string,
  body: UpsertCampaignIntelligenceRequest,
): Promise<CampaignIntelligence> {
  return customFetch<CampaignIntelligence>(`${API}/campaign-intelligence/${campaignId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Recommendations -------------------------------------------------------------------

export function listRecommendations(): Promise<Recommendation[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.recommendations));
  return customFetch<Recommendation[]>(`${API}/recommendations`, {
    method: "GET",
    responseType: "json",
  });
}

export function generateRecommendations(): Promise<Recommendation[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.recommendations));
  return customFetch<Recommendation[]>(`${API}/recommendations/generate`, {
    method: "POST",
    responseType: "json",
  });
}

export function updateRecommendation(
  id: string,
  body: UpdateRecommendationRequest,
): Promise<Recommendation> {
  if (DEMO_MODE) {
    return demoData().then((d) => {
      const rec = d.recommendations.find((r) => r.id === id);
      return demoDelay(rec ? { ...rec, status: body.status } : (d.recommendations[0] as Recommendation));
    });
  }
  return customFetch<Recommendation>(`${API}/recommendations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Phase 4.5: recommendation audit trail + outcome ----------------------------------

export function getRecommendationAudit(id: string): Promise<RecommendationAuditEntry[]> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.recommendationAudit?.[id] ?? []));
  return customFetch<RecommendationAuditEntry[]>(`${API}/recommendations/${id}/audit`, {
    method: "GET",
    responseType: "json",
  });
}

export function recordRecommendationOutcome(
  id: string,
  body: RecordRecommendationOutcomeRequest,
): Promise<Recommendation> {
  if (DEMO_MODE) {
    return demoData().then((d) => {
      const rec = d.recommendations.find((r) => r.id === id);
      const now = new Date().toISOString();
      return demoDelay(
        rec
          ? { ...rec, outcome: body.outcome, outcomeRecordedAt: now }
          : (d.recommendations[0] as Recommendation),
      );
    });
  }
  return customFetch<Recommendation>(`${API}/recommendations/${id}/outcome`, {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Phase 4.5: governance summary ------------------------------------------------------

const DEMO_GOVERNANCE_SUMMARY: GovernanceSummary = {
  totalRecommendations: 6,
  avgRecommendationConfidence: 0.74,
  avgRecommendationConfidenceBand: "medium",
  recommendationsByBand: [
    { band: "high", count: 3, pct: 0.5 },
    { band: "medium", count: 2, pct: 0.33 },
    { band: "low", count: 1, pct: 0.17 },
  ],
  pctActioned: 0.33,
  pctWithOutcome: 0.17,
  totalAttributionRows: 42,
  avgAttributionConfidence: 0.68,
  avgAttributionConfidenceBand: "medium",
};

export function getGovernanceSummary(): Promise<GovernanceSummary> {
  if (DEMO_MODE) return demoData().then((d) => demoDelay(d.governanceSummary ?? DEMO_GOVERNANCE_SUMMARY));
  return customFetch<GovernanceSummary>(`${API}/governance/summary`, {
    method: "GET",
    responseType: "json",
  });
}

// ---------------------------------------------------------------------------
// Phase 4 -- Integrations (External Data Layer)
// ---------------------------------------------------------------------------

const DEMO_INTEGRATIONS: Integration[] = [
  {
    id: "INTG-100",
    providerKey: "website",
    category: "analytics",
    displayName: "CCA Website",
    status: "connected",
    config: {},
    credentialsReference: null,
    lastSyncedAt: "2026-07-14T18:20:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "webhook",
    requiredCredentials: [],
    dataAvailable: ["website_visit", "content_download", "form_submission", "meeting_request"],
    defaultSyncFrequency: "realtime",
    lastSync: {
      id: "SYNC-1010",
      status: "success",
      startedAt: "2026-07-14T18:19:50.000Z",
      completedAt: "2026-07-14T18:20:00.000Z",
      recordsProcessed: 6,
    },
    dataImported: 214,
    errorCount: 0,
  },
  {
    id: "INTG-101",
    providerKey: "ga4",
    category: "analytics",
    displayName: "Google Analytics 4",
    status: "connected",
    config: {},
    credentialsReference: "GA4_OAUTH_TOKEN",
    lastSyncedAt: "2026-07-14T12:00:00.000Z",
    createdAt: "2026-05-01T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "oauth2",
    requiredCredentials: ["GA4_OAUTH_TOKEN", "GA4_PROPERTY_ID"],
    dataAvailable: ["website_visit", "content_download"],
    defaultSyncFrequency: "daily",
    lastSync: {
      id: "SYNC-1009",
      status: "success",
      startedAt: "2026-07-14T11:59:40.000Z",
      completedAt: "2026-07-14T12:00:00.000Z",
      recordsProcessed: 5,
    },
    dataImported: 118,
    errorCount: 0,
  },
  {
    id: "INTG-102",
    providerKey: "google_ads",
    category: "advertising",
    displayName: "Google Ads",
    status: "connected",
    config: {},
    credentialsReference: "GOOGLE_ADS_OAUTH_TOKEN",
    lastSyncedAt: "2026-07-14T06:00:00.000Z",
    createdAt: "2026-05-02T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "oauth2",
    requiredCredentials: ["GOOGLE_ADS_OAUTH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
    dataAvailable: ["campaign_interaction"],
    defaultSyncFrequency: "daily",
    lastSync: {
      id: "SYNC-1008",
      status: "success",
      startedAt: "2026-07-14T05:59:45.000Z",
      completedAt: "2026-07-14T06:00:00.000Z",
      recordsProcessed: 4,
    },
    dataImported: 76,
    errorCount: 0,
  },
  {
    id: "INTG-103",
    providerKey: "callrail",
    category: "communication",
    displayName: "CallRail",
    status: "connected",
    config: {},
    credentialsReference: "CALLRAIL_API_KEY",
    lastSyncedAt: "2026-07-14T09:00:00.000Z",
    createdAt: "2026-05-03T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "api_key",
    requiredCredentials: ["CALLRAIL_API_KEY", "CALLRAIL_ACCOUNT_ID"],
    dataAvailable: ["phone_call"],
    defaultSyncFrequency: "hourly",
    lastSync: {
      id: "SYNC-1007",
      status: "success",
      startedAt: "2026-07-14T08:59:50.000Z",
      completedAt: "2026-07-14T09:00:00.000Z",
      recordsProcessed: 5,
    },
    dataImported: 63,
    errorCount: 0,
  },
  {
    id: "INTG-104",
    providerKey: "ringcentral",
    category: "communication",
    displayName: "RingCentral",
    status: "available",
    config: {},
    credentialsReference: null,
    lastSyncedAt: null,
    createdAt: "2026-05-03T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "oauth2",
    requiredCredentials: ["RINGCENTRAL_OAUTH_TOKEN", "RINGCENTRAL_ACCOUNT_ID"],
    dataAvailable: ["phone_call", "campaign_interaction"],
    defaultSyncFrequency: "hourly",
    lastSync: null,
    dataImported: 0,
    errorCount: 0,
  },
  {
    id: "INTG-105",
    providerKey: "meta_ads",
    category: "advertising",
    displayName: "Meta Ads",
    status: "connected",
    config: {},
    credentialsReference: "META_ADS_ACCESS_TOKEN",
    lastSyncedAt: "2026-07-14T07:00:00.000Z",
    createdAt: "2026-05-04T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "oauth2",
    requiredCredentials: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"],
    dataAvailable: ["campaign_interaction", "form_submission"],
    defaultSyncFrequency: "daily",
    lastSync: {
      id: "SYNC-1006",
      status: "success",
      startedAt: "2026-07-14T06:59:50.000Z",
      completedAt: "2026-07-14T07:00:00.000Z",
      recordsProcessed: 4,
    },
    dataImported: 52,
    errorCount: 0,
  },
  {
    id: "INTG-106",
    providerKey: "linkedin_ads",
    category: "advertising",
    displayName: "LinkedIn Ads",
    status: "error",
    config: {},
    credentialsReference: "LINKEDIN_ADS_ACCESS_TOKEN",
    lastSyncedAt: "2026-07-13T22:00:00.000Z",
    createdAt: "2026-05-05T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "oauth2",
    requiredCredentials: ["LINKEDIN_ADS_ACCESS_TOKEN", "LINKEDIN_ADS_ACCOUNT_ID"],
    dataAvailable: ["campaign_interaction", "form_submission"],
    defaultSyncFrequency: "daily",
    lastSync: {
      id: "SYNC-1005",
      status: "error",
      startedAt: "2026-07-13T21:59:40.000Z",
      completedAt: "2026-07-13T22:00:00.000Z",
      recordsProcessed: 0,
    },
    dataImported: 21,
    errorCount: 1,
  },
  {
    id: "INTG-107",
    providerKey: "search_console",
    category: "analytics",
    displayName: "Google Search Console",
    status: "available",
    config: {},
    credentialsReference: null,
    lastSyncedAt: null,
    createdAt: "2026-05-06T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "oauth2",
    requiredCredentials: ["SEARCH_CONSOLE_OAUTH_TOKEN"],
    dataAvailable: [],
    defaultSyncFrequency: "daily",
    lastSync: null,
    dataImported: 0,
    errorCount: 0,
  },
  {
    id: "INTG-108",
    providerKey: "email",
    category: "email",
    displayName: "Email (Zoho Mail)",
    status: "disabled",
    config: {},
    credentialsReference: null,
    lastSyncedAt: null,
    createdAt: "2026-05-06T00:00:00.000Z",
    connectorAvailable: true,
    authMethod: "api_key",
    requiredCredentials: ["ZOHO_MAIL_API_KEY"],
    dataAvailable: [],
    defaultSyncFrequency: "manual",
    lastSync: null,
    dataImported: 0,
    errorCount: 0,
  },
];

const DEMO_SYNC_JOBS: Record<string, SyncJob[]> = {
  "INTG-100": [
    {
      id: "SYNC-1010",
      integrationId: "INTG-100",
      provider: "website",
      startedAt: "2026-07-14T18:19:50.000Z",
      completedAt: "2026-07-14T18:20:00.000Z",
      status: "success",
      recordsProcessed: 6,
      errors: [],
      createdAt: "2026-07-14T18:19:50.000Z",
    },
  ],
  "INTG-106": [
    {
      id: "SYNC-1005",
      integrationId: "INTG-106",
      provider: "linkedin_ads",
      startedAt: "2026-07-13T21:59:40.000Z",
      completedAt: "2026-07-13T22:00:00.000Z",
      status: "error",
      recordsProcessed: 0,
      errors: ["record LI-EXT-4: missing credential(s): LINKEDIN_ADS_ACCESS_TOKEN"],
      createdAt: "2026-07-13T21:59:40.000Z",
    },
  ],
};

const DEMO_ERRORS: Record<string, IntegrationError[]> = {
  "INTG-106": [
    {
      jobId: "SYNC-1005",
      occurredAt: "2026-07-13T22:00:00.000Z",
      message: "record LI-EXT-4: missing credential(s): LINKEDIN_ADS_ACCESS_TOKEN",
    },
  ],
};

const DEMO_EXTERNAL_EVENTS: ExternalEvent[] = [
  {
    id: "EXT-1000",
    provider: "website",
    externalId: "WEB-EXT-1",
    eventType: "form_submission",
    payload: { page: "/scope-intake", formName: "Scope Intake" },
    processedAt: "2026-07-14T18:20:00.000Z",
    marketingEventId: "EVT-1042",
    createdAt: "2026-07-14T18:19:55.000Z",
  },
  {
    id: "EXT-1001",
    provider: "google_ads",
    externalId: "GADS-EXT-2",
    eventType: "click",
    payload: { keyword: "multi-state contractor license", spend: 42.5 },
    processedAt: "2026-07-14T06:00:00.000Z",
    marketingEventId: "EVT-1039",
    createdAt: "2026-07-14T05:59:55.000Z",
  },
];

function findIntegration(id: string): Integration | undefined {
  return DEMO_INTEGRATIONS.find((i) => i.id === id);
}

export function listIntegrations(): Promise<Integration[]> {
  if (DEMO_MODE) return demoDelay(DEMO_INTEGRATIONS);
  return customFetch<Integration[]>(`${API}/integrations`, {
    method: "GET",
    responseType: "json",
  });
}

export function connectIntegration(
  id: string,
  body: ConnectIntegrationRequest,
): Promise<ConnectIntegrationResponse> {
  if (DEMO_MODE) {
    const existing = findIntegration(id);
    return demoDelay({
      ...(existing as Integration),
      status: "connected",
      credentialsReference: body.credentialsReference ?? existing?.credentialsReference ?? null,
    });
  }
  return customFetch<ConnectIntegrationResponse>(`${API}/integrations/${id}/connect`, {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

export function syncIntegration(id: string, demo = false): Promise<SyncIntegrationResponse> {
  if (DEMO_MODE) {
    return demoDelay({
      jobId: `SYNC-DEMO-${Math.floor(Math.random() * 900 + 100)}`,
      status: "success",
      recordsProcessed: 4,
      skippedDuplicates: 0,
      marketingEventsCreated: 4,
      leadsRefreshed: 1,
      errors: [],
    });
  }
  const qs = demo ? "?demo=1" : "";
  return customFetch<SyncIntegrationResponse>(`${API}/integrations/${id}/sync${qs}`, {
    method: "POST",
    responseType: "json",
  });
}

export function getIntegrationSyncJobs(id: string): Promise<SyncJob[]> {
  if (DEMO_MODE) return demoDelay(DEMO_SYNC_JOBS[id] ?? []);
  return customFetch<SyncJob[]>(`${API}/integrations/${id}/sync-jobs`, {
    method: "GET",
    responseType: "json",
  });
}

export function getIntegrationErrors(id: string): Promise<IntegrationError[]> {
  if (DEMO_MODE) return demoDelay(DEMO_ERRORS[id] ?? []);
  return customFetch<IntegrationError[]>(`${API}/integrations/${id}/errors`, {
    method: "GET",
    responseType: "json",
  });
}

export function updateIntegrationStatus(
  id: string,
  status: IntegrationStatus,
): Promise<Integration> {
  if (DEMO_MODE) {
    const existing = findIntegration(id);
    return demoDelay({ ...(existing as Integration), status });
  }
  return customFetch<Integration>(`${API}/integrations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    responseType: "json",
  });
}

export type ListExternalEventsParams = {
  provider?: string;
  limit?: number;
};

export function listExternalEvents(params: ListExternalEventsParams = {}): Promise<ExternalEvent[]> {
  if (DEMO_MODE) {
    let events = DEMO_EXTERNAL_EVENTS;
    if (params.provider) events = events.filter((e) => e.provider === params.provider);
    return demoDelay(events);
  }
  const search = new URLSearchParams();
  if (params.provider) search.set("provider", params.provider);
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return customFetch<ExternalEvent[]>(`${API}/external-events${qs ? `?${qs}` : ""}`, {
    method: "GET",
    responseType: "json",
  });
}

export function ingestWebsiteEvent(body: IngestWebsiteRequest): Promise<SyncIntegrationResponse> {
  if (DEMO_MODE) {
    return demoDelay({
      jobId: `SYNC-DEMO-${Math.floor(Math.random() * 900 + 100)}`,
      status: "success",
      recordsProcessed: 1,
      skippedDuplicates: 0,
      marketingEventsCreated: 1,
      leadsRefreshed: body.leadId ? 1 : 0,
      errors: [],
    });
  }
  return customFetch<SyncIntegrationResponse>(`${API}/ingest/website`, {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// ---------------------------------------------------------------------------
// Phase 5 — Predictive Growth Engine.
//
// GUARDRAIL (repeated here, matching the backend): every mutation below is a
// RECOMMENDATION-ONLY write. Budget/market/content PATCH calls only ever
// record a human decision (status: new -> reviewed -> applied/dismissed).
// "applied" means "a person decided to act on this and we recorded that" —
// it never changes spend, posts content, or triggers anything on an
// external platform. There is no code path here that writes to an ad
// platform, CMS, or CRM. See docs/phase-5-spec.md ("Guardrails").
//
// Every fn has a DEMO_MODE branch: reads are served from optional Phase 5
// keys on the demo dataset when present, and derived from `d.leads` /
// small static fallbacks otherwise, so the demo build always compiles and
// renders real-looking (but inert) predictive data with no backend.
// ---------------------------------------------------------------------------

function demoConfidenceBand(score: number): ConfidenceBand {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

// Deterministically derives a plausible LeadPrediction from a LeadSummary
// when no captured `leadPredictions` demo data exists yet. Not random --
// same lead always produces the same demo prediction.
function derivePredictionForLead(lead: LeadSummary): LeadPrediction {
  const tierBase: Record<string, number> = { high: 0.72, medium: 0.46, low: 0.22, unscored: 0.12 };
  const base = tierBase[lead.scoreTier] ?? 0.2;
  const customerBoost = lead.isCustomer ? 0.2 : 0;
  const conversionProbability = Math.max(0.01, Math.min(0.99, base + customerBoost));
  const expectedDealSize = 8500;
  const expectedRevenue = Math.round(conversionProbability * expectedDealSize);
  const sampleSize = lead.scoreTier === "high" ? 22 : lead.scoreTier === "medium" ? 14 : 6;
  const confidence = Math.max(0.15, Math.min(0.92, sampleSize / 30 + (lead.scoreTier === "unscored" ? -0.1 : 0)));
  const factors: PredictionFactor[] = [
    {
      label: `${lead.scoreTier} tier prior`,
      effect: lead.scoreTier === "high" ? "+" : lead.scoreTier === "low" ? "-" : "neutral",
      detail: `Leads in the ${lead.scoreTier} score tier convert at roughly this base rate historically.`,
    },
    {
      label: `${lead.industry || "industry"} cohort rate`,
      effect: "neutral",
      detail: `Calibrated against past conversions for ${lead.industry || "this industry"} leads from ${lead.firstTouchChannel ?? "this channel"}.`,
    },
  ];
  if (lead.isCustomer) {
    factors.push({ label: "already a customer", effect: "+", detail: "This lead has already converted." });
  }
  const bestFollowUpAt = lead.isCustomer ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const bestFollowUpReason = lead.isCustomer
    ? "No follow-up needed — already converted."
    : lead.scoreTier === "high"
      ? "High intent — follow up within 24h to strike while warm."
      : "Establish or continue contact within 24h.";
  return {
    id: `PRED-DEMO-${lead.id}`,
    leadId: lead.id,
    conversionProbability,
    expectedRevenue,
    bestFollowUpAt,
    bestFollowUpReason,
    confidence,
    confidenceBand: demoConfidenceBand(confidence),
    factors,
    modelVersion: "v1-demo",
    createdAt: new Date().toISOString(),
  };
}

async function demoLeadPredictions(): Promise<LeadPrediction[]> {
  const d = await demoData();
  if (d.leadPredictions && d.leadPredictions.length > 0) return d.leadPredictions;
  return [...d.leads]
    .map(derivePredictionForLead)
    .sort((a, b) => b.conversionProbability - a.conversionProbability);
}

export function listLeadPredictions(leadId?: string): Promise<LeadPrediction[]> {
  if (DEMO_MODE) {
    return demoLeadPredictions().then((preds) => demoDelay(leadId ? preds.filter((p) => p.leadId === leadId) : preds));
  }
  const qs = leadId ? `?leadId=${encodeURIComponent(leadId)}` : "";
  return customFetch<LeadPrediction[]>(`${API}/predictions/leads${qs}`, {
    method: "GET",
    responseType: "json",
  });
}

export function getLeadPrediction(leadId: string): Promise<LeadPrediction | null> {
  if (DEMO_MODE) {
    return demoLeadPredictions().then((preds) => demoDelay(preds.find((p) => p.leadId === leadId) ?? null));
  }
  return customFetch<LeadPrediction>(`${API}/predictions/leads/${leadId}`, {
    method: "GET",
    responseType: "json",
  }).catch(() => null);
}

export function recomputePredictions(
  body: RecomputePredictionsRequest = {},
): Promise<RecomputePredictionsResponse> {
  if (DEMO_MODE) {
    return demoLeadPredictions().then((preds) => {
      const filtered = body.leadIds && body.leadIds.length > 0 ? preds.filter((p) => body.leadIds!.includes(p.leadId)) : preds;
      return demoDelay({ recomputed: filtered.length, predictions: filtered });
    });
  }
  return customFetch<RecomputePredictionsResponse>(`${API}/predictions/recompute`, {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Budget Intelligence (Module 2) -------------------------------------------
// RECOMMENDATION ONLY. "MarketingOS recommends; you decide and execute.
// Nothing changes ad spend automatically." Applying a recommendation here
// only records a human decision -- see guardrail comment above.

const DEMO_BUDGET_RECOMMENDATIONS: BudgetRecommendation[] = [
  {
    id: "BUD-DEMO-1000",
    fromChannel: "Display Ads",
    toChannel: "Organic Search",
    shiftPct: 0.15,
    shiftAmount: 900,
    projectedQualifiedDelta: 6,
    projectedRevenueDelta: 5200,
    rationale:
      "Display Ads is currently the lowest-ROI spending channel while Organic Search is the highest. Projection: shifting 15% of Display Ads spend and holding today's per-dollar qualified/revenue rates for both channels constant at the margin — not a guarantee.",
    confidence: 0.58,
    confidenceBand: "medium",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

async function demoBudgetRecommendations(): Promise<BudgetRecommendation[]> {
  const d = await demoData();
  return d.budgetRecommendations ?? DEMO_BUDGET_RECOMMENDATIONS;
}

export function listBudgetRecommendations(): Promise<BudgetRecommendation[]> {
  if (DEMO_MODE) return demoBudgetRecommendations().then(demoDelay);
  return customFetch<BudgetRecommendation[]>(`${API}/budget/recommendations`, {
    method: "GET",
    responseType: "json",
  });
}

export function generateBudgetRecommendations(): Promise<BudgetRecommendation[]> {
  if (DEMO_MODE) return demoBudgetRecommendations().then(demoDelay);
  return customFetch<BudgetRecommendation[]>(`${API}/budget/recommendations/generate`, {
    method: "POST",
    responseType: "json",
  });
}

export function updateBudgetRecommendation(
  id: string,
  body: UpdateGrowthStatusRequest,
): Promise<BudgetRecommendation> {
  if (DEMO_MODE) {
    return demoBudgetRecommendations().then((recs) => {
      const rec = recs.find((r) => r.id === id);
      return demoDelay(rec ? { ...rec, status: body.status } : (recs[0] as BudgetRecommendation));
    });
  }
  return customFetch<BudgetRecommendation>(`${API}/budget/recommendations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Market Opportunities (Module 3) ------------------------------------------

const DEMO_MARKET_OPPORTUNITIES: MarketOpportunity[] = [
  {
    id: "MOP-DEMO-1000",
    kind: "segment",
    title: "Commercial contractors in FL show rising compliance demand",
    insight:
      "Commercial-industry leads located in FL convert at roughly 1.8x the overall average, and volume is up over the last 30 days.",
    signalStrength: 0.45,
    confidence: 0.52,
    confidenceBand: "medium",
    dataBasis: { industry: "Commercial", location: "FL", lift: 1.8, sampleSize: 9 },
    status: "new",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "MOP-DEMO-1001",
    kind: "trend",
    title: "Search interest in multi-state licensing is trending",
    insight: "Event volume from organic search sources referencing multi-state licensing is up over the prior 30 days.",
    signalStrength: 0.38,
    confidence: 0.4,
    confidenceBand: "low",
    dataBasis: { source: "organic_search", priorWindowEvents: 4, recentWindowEvents: 9 },
    status: "new",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

async function demoMarketOpportunities(): Promise<MarketOpportunity[]> {
  const d = await demoData();
  return d.marketOpportunities ?? DEMO_MARKET_OPPORTUNITIES;
}

export function listMarketOpportunities(): Promise<MarketOpportunity[]> {
  if (DEMO_MODE) return demoMarketOpportunities().then(demoDelay);
  return customFetch<MarketOpportunity[]>(`${API}/market/opportunities`, {
    method: "GET",
    responseType: "json",
  });
}

export function generateMarketOpportunities(): Promise<MarketOpportunity[]> {
  if (DEMO_MODE) return demoMarketOpportunities().then(demoDelay);
  return customFetch<MarketOpportunity[]>(`${API}/market/opportunities/generate`, {
    method: "POST",
    responseType: "json",
  });
}

export function updateMarketOpportunity(
  id: string,
  body: UpdateGrowthStatusRequest,
): Promise<MarketOpportunity> {
  if (DEMO_MODE) {
    return demoMarketOpportunities().then((opps) => {
      const opp = opps.find((o) => o.id === id);
      return demoDelay(opp ? { ...opp, status: body.status } : (opps[0] as MarketOpportunity));
    });
  }
  return customFetch<MarketOpportunity>(`${API}/market/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Content Opportunities (Module 4) -----------------------------------------

const DEMO_CONTENT_OPPORTUNITIES: ContentOpportunity[] = [
  {
    id: "COP-DEMO-1000",
    topic: "Create an electrical contractor licensing guide",
    rationale:
      "Modeled on the HVAC licensing guide, which drove roughly 4x the average content-download engagement. Electrical-industry leads show similar demand with no analogous content yet.",
    basedOn: { analogousAsset: "HVAC Licensing Guide", multiplier: 4 },
    projectedImpact: "Projected ~4x engagement vs. an average asset, based on the analogous HVAC guide.",
    confidence: 0.5,
    confidenceBand: "medium",
    status: "new",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

async function demoContentOpportunities(): Promise<ContentOpportunity[]> {
  const d = await demoData();
  return d.contentOpportunities ?? DEMO_CONTENT_OPPORTUNITIES;
}

export function listContentOpportunities(): Promise<ContentOpportunity[]> {
  if (DEMO_MODE) return demoContentOpportunities().then(demoDelay);
  return customFetch<ContentOpportunity[]>(`${API}/content/opportunities`, {
    method: "GET",
    responseType: "json",
  });
}

export function generateContentOpportunities(): Promise<ContentOpportunity[]> {
  if (DEMO_MODE) return demoContentOpportunities().then(demoDelay);
  return customFetch<ContentOpportunity[]>(`${API}/content/opportunities/generate`, {
    method: "POST",
    responseType: "json",
  });
}

export function updateContentOpportunity(
  id: string,
  body: UpdateGrowthStatusRequest,
): Promise<ContentOpportunity> {
  if (DEMO_MODE) {
    return demoContentOpportunities().then((opps) => {
      const opp = opps.find((o) => o.id === id);
      return demoDelay(opp ? { ...opp, status: body.status } : (opps[0] as ContentOpportunity));
    });
  }
  return customFetch<ContentOpportunity>(`${API}/content/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    responseType: "json",
  });
}

// --- Executive Growth Briefing (Module 5, "Good Morning, Rose") ---------------

function demoGrowthBriefing(): GrowthBriefing {
  const label = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return {
    id: "BRIEF-DEMO-1000",
    periodLabel: `Daily · ${label}`,
    wins: [
      { label: "New customer", detail: "ABC Construction converted this week, generating $8,500 in revenue." },
      { label: "Likely to close soon", detail: "2 leads currently show high-confidence conversion probability ≥ 60%." },
    ],
    risks: [
      { label: "Display Ads running at a loss", detail: "ROI is negative this period — spending more than it returns.", severity: "medium" },
      { label: "A high-value lead is going cold", detail: "No follow-up in 9+ days on a previously warm lead.", severity: "medium" },
    ],
    opportunities: [
      { label: "Commercial contractors in FL", detail: "Conversion lift ~1.8x the overall average.", sourceId: "MOP-DEMO-1000" },
      { label: "Electrical contractor licensing guide", detail: "Projected ~4x engagement vs. an average asset.", sourceId: "COP-DEMO-1000" },
    ],
    recommendedActions: [
      { label: "Review budget shift: Display Ads → Organic Search", detail: "Projected +6 qualified, +$5,200 revenue.", sourceId: "BUD-DEMO-1000" },
      { label: "Follow up with top likely-to-convert leads", detail: "Top 3 leads by conversion probability need outreach.", sourceId: null },
      { label: "Draft the electrical contractor licensing guide", detail: "Modeled on the high-performing HVAC guide.", sourceId: "COP-DEMO-1000" },
    ],
    summary:
      "Good morning. One new customer closed this week and two leads look likely to convert soon. Watch Display Ads (negative ROI) and one high-value lead going cold. Top opportunities: commercial contractors in FL and an electrical licensing content gap. Recommended next steps: review the Display → Organic Search budget shift, follow up with your top likely-to-convert leads, and draft the electrical licensing guide.",
    createdAt: new Date().toISOString(),
  };
}

export function getGrowthBriefing(): Promise<GrowthBriefing | null> {
  if (DEMO_MODE) {
    return demoData().then((d) => demoDelay(d.growthBriefing ?? demoGrowthBriefing()));
  }
  return customFetch<GrowthBriefing>(`${API}/growth/briefing`, {
    method: "GET",
    responseType: "json",
  }).catch(() => null);
}

export function generateGrowthBriefing(): Promise<GrowthBriefing> {
  if (DEMO_MODE) {
    return demoData().then((d) => demoDelay(d.growthBriefing ?? demoGrowthBriefing()));
  }
  return customFetch<GrowthBriefing>(`${API}/growth/briefing/generate`, {
    method: "POST",
    responseType: "json",
  });
}
