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
} from "./intel-types";

// All backend endpoints are mounted under /api (matching the generated Orval
// client). Keep this prefix in one place.
const API = "/api";

// --- Intelligence summary (Phase 3 additions) --------------------------------

export function getIntelligenceOverview(): Promise<IntelligenceOverview> {
  return customFetch<IntelligenceOverview>(`${API}/intelligence/overview`, {
    method: "GET",
    responseType: "json",
  });
}

export function getIntelligenceFunnel(): Promise<FunnelStage[]> {
  return customFetch<FunnelStage[]>(`${API}/intelligence/funnel`, {
    method: "GET",
    responseType: "json",
  });
}

export function getLeadTrend(weeks = 8): Promise<LeadTrendPoint[]> {
  return customFetch<LeadTrendPoint[]>(`${API}/intelligence/lead-trend?weeks=${weeks}`, {
    method: "GET",
    responseType: "json",
  });
}

export function createActionFromRecommendation(
  body: CreateActionFromRecommendationRequest,
): Promise<CreateActionFromRecommendationResponse> {
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
  return customFetch<LeadSummary[]>(`${API}/leads${qs ? `?${qs}` : ""}`, {
    method: "GET",
    responseType: "json",
  });
}

export function getLead(id: string): Promise<LeadDetail> {
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
  return customFetch<AttributionSummary>(`${API}/attribution/summary`, {
    method: "GET",
    responseType: "json",
  });
}

export function getAttributionForLead(leadId: string): Promise<RevenueAttribution[]> {
  return customFetch<RevenueAttribution[]>(`${API}/attribution/lead/${leadId}`, {
    method: "GET",
    responseType: "json",
  });
}

// --- Channels ----------------------------------------------------------------------

export function getChannelIntelligence(): Promise<ChannelIntelligence[]> {
  return customFetch<ChannelIntelligence[]>(`${API}/channels/intelligence`, {
    method: "GET",
    responseType: "json",
  });
}

// --- Campaign intelligence -----------------------------------------------------------

export function listCampaignIntelligence(): Promise<CampaignIntelligence[]> {
  return customFetch<CampaignIntelligence[]>(`${API}/campaign-intelligence`, {
    method: "GET",
    responseType: "json",
  });
}

export function getCampaignIntelligence(campaignId: string): Promise<CampaignIntelligence> {
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
  return customFetch<Recommendation[]>(`${API}/recommendations`, {
    method: "GET",
    responseType: "json",
  });
}

export function generateRecommendations(): Promise<Recommendation[]> {
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
