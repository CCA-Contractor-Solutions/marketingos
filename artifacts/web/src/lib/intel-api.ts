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
  Integration,
  IntegrationStatus,
  ConnectIntegrationRequest,
  ConnectIntegrationResponse,
  SyncIntegrationResponse,
  SyncJob,
  IntegrationError,
  ExternalEvent,
  IngestWebsiteRequest,
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
  return customFetch<Recommendation>(`${API}/recommendations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
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
