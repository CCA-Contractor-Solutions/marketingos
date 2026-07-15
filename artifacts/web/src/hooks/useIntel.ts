// ---------------------------------------------------------------------------
// Phase 3 — React Query hooks wrapping `src/lib/intel-api.ts`. Mirrors the
// query-key + mutation conventions used by the generated Orval hooks
// elsewhere in the app (e.g. `useListCampaigns` / `useCreateCampaign`), but
// hand-written since these Phase 2/3 endpoints are outside the Orval spec.
// ---------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import * as intelApi from "@/lib/intel-api";
import type {
  IntelligenceOverview,
  FunnelStage,
  LeadTrendPoint,
  LeadSummary,
  LeadDetail,
  UpdateLeadRequest,
  ConvertLeadRequest,
  AttributionSummary,
  RevenueAttribution,
  ChannelIntelligence,
  CampaignIntelligence,
  UpsertCampaignIntelligenceRequest,
  Recommendation,
  CreateActionFromRecommendationRequest,
  Integration,
  IntegrationStatus,
  ConnectIntegrationRequest,
  SyncJob,
  IntegrationError,
  ExternalEvent,
} from "@/lib/intel-types";
import type { ListLeadsParams, ListExternalEventsParams } from "@/lib/intel-api";

// --- Query keys ----------------------------------------------------------------

export const intelKeys = {
  overview: ["intel", "overview"] as const,
  funnel: ["intel", "funnel"] as const,
  leadTrend: (weeks: number) => ["intel", "lead-trend", weeks] as const,
  leads: (params: ListLeadsParams) => ["intel", "leads", params] as const,
  lead: (id: string) => ["intel", "lead", id] as const,
  attributionSummary: ["intel", "attribution", "summary"] as const,
  attributionForLead: (leadId: string) => ["intel", "attribution", "lead", leadId] as const,
  channelIntelligence: ["intel", "channels"] as const,
  campaignIntelligenceList: ["intel", "campaign-intelligence"] as const,
  campaignIntelligence: (campaignId: string) => ["intel", "campaign-intelligence", campaignId] as const,
  recommendations: ["intel", "recommendations"] as const,
  integrations: ["intel", "integrations"] as const,
  integrationSyncJobs: (id: string) => ["intel", "integrations", id, "sync-jobs"] as const,
  integrationErrors: (id: string) => ["intel", "integrations", id, "errors"] as const,
  externalEvents: (params: ListExternalEventsParams) => ["intel", "external-events", params] as const,
};

// --- Intelligence summary -------------------------------------------------------

export function useIntelligenceOverview(options?: Partial<UseQueryOptions<IntelligenceOverview>>) {
  return useQuery({
    queryKey: intelKeys.overview,
    queryFn: intelApi.getIntelligenceOverview,
    ...options,
  });
}

export function useIntelligenceFunnel(options?: Partial<UseQueryOptions<FunnelStage[]>>) {
  return useQuery({
    queryKey: intelKeys.funnel,
    queryFn: intelApi.getIntelligenceFunnel,
    ...options,
  });
}

export function useLeadTrend(weeks = 8, options?: Partial<UseQueryOptions<LeadTrendPoint[]>>) {
  return useQuery({
    queryKey: intelKeys.leadTrend(weeks),
    queryFn: () => intelApi.getLeadTrend(weeks),
    ...options,
  });
}

export function useCreateActionFromRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateActionFromRecommendationRequest) =>
      intelApi.createActionFromRecommendation(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// --- Leads -----------------------------------------------------------------------

export function useLeads(params: ListLeadsParams = {}, options?: Partial<UseQueryOptions<LeadSummary[]>>) {
  return useQuery({
    queryKey: intelKeys.leads(params),
    queryFn: () => intelApi.listLeads(params),
    ...options,
  });
}

export function useLead(id: string, options?: Partial<UseQueryOptions<LeadDetail>>) {
  return useQuery({
    queryKey: intelKeys.lead(id),
    queryFn: () => intelApi.getLead(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateLeadRequest) => intelApi.updateLead(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.lead(id) });
      queryClient.invalidateQueries({ queryKey: ["intel", "leads"] });
    },
  });
}

export function useConvertLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ConvertLeadRequest) => intelApi.convertLead(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.lead(id) });
      queryClient.invalidateQueries({ queryKey: ["intel", "leads"] });
      queryClient.invalidateQueries({ queryKey: intelKeys.overview });
      queryClient.invalidateQueries({ queryKey: intelKeys.funnel });
    },
  });
}

export function useRescoreLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => intelApi.rescoreLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.lead(id) });
    },
  });
}

// --- Attribution -------------------------------------------------------------------

export function useAttributionSummary(options?: Partial<UseQueryOptions<AttributionSummary>>) {
  return useQuery({
    queryKey: intelKeys.attributionSummary,
    queryFn: intelApi.getAttributionSummary,
    ...options,
  });
}

export function useAttributionForLead(
  leadId: string,
  options?: Partial<UseQueryOptions<RevenueAttribution[]>>,
) {
  return useQuery({
    queryKey: intelKeys.attributionForLead(leadId),
    queryFn: () => intelApi.getAttributionForLead(leadId),
    enabled: !!leadId,
    ...options,
  });
}

// --- Channels ------------------------------------------------------------------------

export function useChannelIntelligence(options?: Partial<UseQueryOptions<ChannelIntelligence[]>>) {
  return useQuery({
    queryKey: intelKeys.channelIntelligence,
    queryFn: intelApi.getChannelIntelligence,
    ...options,
  });
}

// --- Campaign intelligence -------------------------------------------------------------

export function useCampaignIntelligenceList(
  options?: Partial<UseQueryOptions<CampaignIntelligence[]>>,
) {
  return useQuery({
    queryKey: intelKeys.campaignIntelligenceList,
    queryFn: intelApi.listCampaignIntelligence,
    ...options,
  });
}

export function useCampaignIntelligence(
  campaignId: string,
  options?: Partial<UseQueryOptions<CampaignIntelligence>>,
) {
  return useQuery({
    queryKey: intelKeys.campaignIntelligence(campaignId),
    queryFn: () => intelApi.getCampaignIntelligence(campaignId),
    enabled: !!campaignId,
    ...options,
  });
}

export function useUpsertCampaignIntelligence(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertCampaignIntelligenceRequest) =>
      intelApi.upsertCampaignIntelligence(campaignId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.campaignIntelligence(campaignId) });
      queryClient.invalidateQueries({ queryKey: intelKeys.campaignIntelligenceList });
    },
  });
}

// --- Recommendations --------------------------------------------------------------------

export function useRecommendations(options?: Partial<UseQueryOptions<Recommendation[]>>) {
  return useQuery({
    queryKey: intelKeys.recommendations,
    queryFn: intelApi.listRecommendations,
    ...options,
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: intelApi.generateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.recommendations });
    },
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "new" | "reviewed" | "applied" | "dismissed" }) =>
      intelApi.updateRecommendation(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.recommendations });
    },
  });
}

// --- Integrations (Phase 4) -------------------------------------------------------------

export function useIntegrations(options?: Partial<UseQueryOptions<Integration[]>>) {
  return useQuery({
    queryKey: intelKeys.integrations,
    queryFn: intelApi.listIntegrations,
    ...options,
  });
}

export function useConnectIntegration(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ConnectIntegrationRequest) => intelApi.connectIntegration(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.integrations });
    },
  });
}

export function useSyncIntegration(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (demo?: boolean) => intelApi.syncIntegration(id, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.integrations });
      queryClient.invalidateQueries({ queryKey: intelKeys.integrationSyncJobs(id) });
      queryClient.invalidateQueries({ queryKey: intelKeys.integrationErrors(id) });
      queryClient.invalidateQueries({ queryKey: ["intel", "external-events"] });
      queryClient.invalidateQueries({ queryKey: intelKeys.recommendations });
    },
  });
}

export function useIntegrationSyncJobs(id: string, options?: Partial<UseQueryOptions<SyncJob[]>>) {
  return useQuery({
    queryKey: intelKeys.integrationSyncJobs(id),
    queryFn: () => intelApi.getIntegrationSyncJobs(id),
    enabled: !!id,
    ...options,
  });
}

export function useIntegrationErrors(id: string, options?: Partial<UseQueryOptions<IntegrationError[]>>) {
  return useQuery({
    queryKey: intelKeys.integrationErrors(id),
    queryFn: () => intelApi.getIntegrationErrors(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateIntegrationStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: IntegrationStatus) => intelApi.updateIntegrationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelKeys.integrations });
    },
  });
}

export function useExternalEvents(
  params: ListExternalEventsParams = {},
  options?: Partial<UseQueryOptions<ExternalEvent[]>>,
) {
  return useQuery({
    queryKey: intelKeys.externalEvents(params),
    queryFn: () => intelApi.listExternalEvents(params),
    ...options,
  });
}
