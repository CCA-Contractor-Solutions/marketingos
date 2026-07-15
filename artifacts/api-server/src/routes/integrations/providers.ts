// ---------------------------------------------------------------------------
// Module 8 — Provider-agnostic integration connectors (Phase 4 v2).
//
// No hardcoded provider SDKs, no real network calls. Each connector
// describes how a real integration WOULD connect (providerKey/category,
// authMethod, requiredCredentials, dataAvailable, defaultSyncFrequency) and
// implements a pure `mapToEvents(rawRecords)` that turns a provider's raw
// records into MarketingOS event drafts — the same shape `POST /events`
// accepts. This keeps the connector interface stable so a later phase can
// swap in real SDKs/network calls without touching calling code in
// `routes/integrations.ts` or `lib/integrations/ingestion.ts`.
// ---------------------------------------------------------------------------

import type { EventDraft } from "../../lib/intelligence/events";
import { checkRequiredCredentials } from "../../lib/integrations/credentials";

export type IntegrationTestResult = { ok: boolean; reason?: string };
export type IntegrationSyncResult = {
  ok: boolean;
  reason?: string;
  recordsSynced?: number;
};

export type IntegrationAuthMethod = "oauth2" | "api_key" | "webhook" | "none";
export type IntegrationSyncFrequency = "realtime" | "hourly" | "daily" | "manual";

export interface IntegrationConnector {
  providerKey: string;
  category: "advertising" | "analytics" | "communication" | "email" | "automation";

  // --- Phase 4 metadata (human-facing; drives the Integration Center UI) ---
  authMethod: IntegrationAuthMethod;
  /** NAMES of env/vault keys this connector needs — never values. */
  requiredCredentials: string[];
  /** Human labels of what this connector can bring in, e.g. "Sessions". */
  dataAvailable: string[];
  defaultSyncFrequency: IntegrationSyncFrequency;

  /** Checks that required credentials are resolvable — never inspects/logs values. */
  validateAuth(): Promise<IntegrationTestResult>;

  /** Pure mapper: provider raw records -> MarketingOS event drafts. No DB access. */
  mapToEvents(rawRecords: unknown[]): EventDraft[];

  // --- kept for backward compatibility ---
  testConnection(): Promise<IntegrationTestResult>;
  sync(): Promise<IntegrationSyncResult>;
}

function baseValidateAuth(requiredCredentials: string[]): () => Promise<IntegrationTestResult> {
  return async () => {
    if (requiredCredentials.length === 0) return { ok: true };
    const { ok, missing } = checkRequiredCredentials(requiredCredentials);
    if (ok) return { ok: true };
    return { ok: false, reason: `missing credential(s): ${missing.join(", ")}` };
  };
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

// ---------------------------------------------------------------------------
// website — webhook-driven form/page/content activity (Module 2 live path).
// ---------------------------------------------------------------------------
const website: IntegrationConnector = {
  providerKey: "website",
  category: "analytics",
  authMethod: "webhook",
  requiredCredentials: [],
  dataAvailable: [
    "Page views",
    "Landing page views",
    "Form submissions",
    "Content downloads",
    "Consultation requests",
    "Demo requests",
  ],
  defaultSyncFrequency: "realtime",
  validateAuth: baseValidateAuth([]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      const type = str(r.type ?? r.eventType);
      const utmSource = str(r.utm_source ?? r.utmSource);
      const utmMedium = str(r.utm_medium ?? r.utmMedium);
      const utmCampaign = str(r.utm_campaign ?? r.utmCampaign) || null;

      const eventTypeMap: Record<string, EventDraft["eventType"]> = {
        page_view: "website_visit",
        landing_page_view: "landing_page_view",
        form_submission: "form_submission",
        content_download: "content_download",
        meeting_request: "meeting_request",
        consultation_request: "meeting_request",
        demo_request: "meeting_request",
      };

      const leadId = typeof r.leadId === "string" && r.leadId.length > 0 ? r.leadId : undefined;

      return {
        eventType: eventTypeMap[type] ?? "website_visit",
        source: utmSource || "website",
        campaign: utmCampaign,
        channel: utmMedium || (utmSource ? "organic" : "direct"),
        occurredAt: str(r.occurredAt) || undefined,
        leadId,
        metadata: {
          page: str(r.page),
          url: str(r.url),
          utmSource,
          utmMedium,
          utmCampaign,
          formName: r.formName,
          asset: r.asset,
          email: r.email,
        },
      };
    });
  },
  async testConnection() {
    return { ok: true };
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// ga4 — sessions / traffic source / landing page / conversions.
// ---------------------------------------------------------------------------
const ga4: IntegrationConnector = {
  providerKey: "ga4",
  category: "analytics",
  authMethod: "oauth2",
  requiredCredentials: ["GA4_PROPERTY_ID", "GA4_OAUTH_TOKEN"],
  dataAvailable: ["Sessions", "Users", "Traffic source", "Landing pages", "Conversions"],
  defaultSyncFrequency: "daily",
  validateAuth: baseValidateAuth(["GA4_PROPERTY_ID", "GA4_OAUTH_TOKEN"]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      const sessionMedium = str(r.sessionMedium);
      const sessionSource = str(r.sessionSource) || "google";
      const eventName = str(r.eventName);

      const eventType: EventDraft["eventType"] =
        eventName === "generate_lead" || eventName === "purchase"
          ? "sales_conversion"
          : str(r.landingPage).length > 0
            ? "landing_page_view"
            : "website_visit";

      return {
        eventType,
        source: sessionSource,
        campaign: str(r.campaign) || null,
        channel: sessionMedium || "organic",
        occurredAt: str(r.occurredAt) || undefined,
        metadata: {
          ga4EventName: eventName,
          sessionSource,
          sessionMedium,
          landingPage: r.landingPage,
        },
      };
    });
  },
  async testConnection() {
    return baseValidateAuth(["GA4_PROPERTY_ID", "GA4_OAUTH_TOKEN"])();
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// google_ads — campaign spend / impressions / clicks / conversions / keywords.
// ---------------------------------------------------------------------------
const googleAds: IntegrationConnector = {
  providerKey: "google_ads",
  category: "advertising",
  authMethod: "oauth2",
  requiredCredentials: ["GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_OAUTH_TOKEN"],
  dataAvailable: [
    "Campaign spend",
    "Impressions",
    "Clicks",
    "Conversions",
    "Keywords",
    "Search terms",
  ],
  defaultSyncFrequency: "daily",
  validateAuth: baseValidateAuth(["GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_OAUTH_TOKEN"]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      const costMicros = num(r.costMicros);
      const spend = costMicros / 1_000_000;
      const conversions = num(r.conversions);

      return {
        eventType: "campaign_interaction",
        source: "google_ads",
        campaign: str(r.campaignName) || str(r.campaignId) || null,
        channel: "paid_search",
        occurredAt: r.date ? `${str(r.date)}T00:00:00Z` : undefined,
        metadata: {
          campaignId: r.campaignId,
          keyword: r.keyword,
          searchTerm: r.searchTerm,
          impressions: num(r.impressions),
          clicks: num(r.clicks),
          spend,
          conversions,
        },
      };
    });
  },
  async testConnection() {
    return baseValidateAuth(["GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_OAUTH_TOKEN"])();
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// callrail — tracked phone calls.
// ---------------------------------------------------------------------------
const callrail: IntegrationConnector = {
  providerKey: "callrail",
  category: "communication",
  authMethod: "api_key",
  requiredCredentials: ["CALLRAIL_API_KEY"],
  dataAvailable: ["Calls", "Call duration", "Call outcome", "Tracking number", "Recording reference"],
  defaultSyncFrequency: "hourly",
  validateAuth: baseValidateAuth(["CALLRAIL_API_KEY"]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        eventType: "phone_call",
        source: str(r.source) || "callrail",
        campaign: str(r.campaign) || null,
        channel: "phone",
        occurredAt: str(r.occurredAt) || undefined,
        metadata: {
          trackingNumber: r.trackingNumber,
          duration: num(r.duration),
          callerInfo: r.callerNumberRef, // opaque reference only
          // Recording URLs are stored as an opaque reference only, where
          // permitted — never the raw signed/playable URL.
          recordingUrlRef: r.recordingUrlRef,
          callOutcome: r.callOutcome,
        },
      };
    });
  },
  async testConnection() {
    return baseValidateAuth(["CALLRAIL_API_KEY"])();
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// ringcentral — calls + SMS communication timeline.
// ---------------------------------------------------------------------------
const ringcentral: IntegrationConnector = {
  providerKey: "ringcentral",
  category: "communication",
  authMethod: "oauth2",
  requiredCredentials: ["RINGCENTRAL_OAUTH_TOKEN"],
  dataAvailable: ["Calls", "SMS", "Response time"],
  defaultSyncFrequency: "hourly",
  validateAuth: baseValidateAuth(["RINGCENTRAL_OAUTH_TOKEN"]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      const type = str(r.type);
      const eventType: EventDraft["eventType"] = type === "call" ? "phone_call" : "campaign_interaction";

      return {
        eventType,
        source: "ringcentral",
        campaign: str(r.campaign) || null,
        channel: type === "call" ? "phone" : "sms",
        occurredAt: str(r.occurredAt) || undefined,
        metadata: {
          commType: type,
          direction: r.direction,
          duration: r.duration != null ? num(r.duration) : undefined,
          responseTimeMinutes: num(r.responseTimeMinutes),
        },
      };
    });
  },
  async testConnection() {
    return baseValidateAuth(["RINGCENTRAL_OAUTH_TOKEN"])();
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// meta_ads — campaigns / spend / audience / leads.
// ---------------------------------------------------------------------------
const metaAds: IntegrationConnector = {
  providerKey: "meta_ads",
  category: "advertising",
  authMethod: "oauth2",
  requiredCredentials: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
  dataAvailable: ["Campaign spend", "Impressions", "Clicks", "Audience/geo", "Lead forms"],
  defaultSyncFrequency: "daily",
  validateAuth: baseValidateAuth(["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      const isLead = str(r.type) === "lead_form";

      return {
        eventType: isLead ? "form_submission" : "campaign_interaction",
        source: "meta_ads",
        campaign: str(r.campaignName) || str(r.campaignId) || null,
        channel: "paid_social",
        occurredAt: isLead ? str(r.occurredAt) || undefined : r.date ? `${str(r.date)}T00:00:00Z` : undefined,
        metadata: {
          campaignId: r.campaignId,
          audience: r.audience,
          geo: r.geo,
          impressions: r.impressions != null ? num(r.impressions) : undefined,
          clicks: r.clicks != null ? num(r.clicks) : undefined,
          spend: r.spend != null ? num(r.spend) : undefined,
          email: r.email,
        },
      };
    });
  },
  async testConnection() {
    return baseValidateAuth(["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"])();
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// linkedin_ads — campaigns / engagement / leads / audience (enterprise targeting).
// ---------------------------------------------------------------------------
const linkedinAds: IntegrationConnector = {
  providerKey: "linkedin_ads",
  category: "advertising",
  authMethod: "oauth2",
  requiredCredentials: ["LINKEDIN_ACCESS_TOKEN"],
  dataAvailable: ["Campaign spend", "Impressions", "Clicks", "Enterprise targeting", "Lead gen forms"],
  defaultSyncFrequency: "daily",
  validateAuth: baseValidateAuth(["LINKEDIN_ACCESS_TOKEN"]),
  mapToEvents(rawRecords) {
    return rawRecords.map((raw) => {
      const r = raw as Record<string, unknown>;
      const isLead = str(r.type) === "lead_gen_form";

      return {
        eventType: isLead ? "form_submission" : "campaign_interaction",
        source: "linkedin_ads",
        campaign: str(r.campaignName) || str(r.campaignId) || null,
        channel: "paid_social",
        occurredAt: isLead ? str(r.occurredAt) || undefined : r.date ? `${str(r.date)}T00:00:00Z` : undefined,
        metadata: {
          campaignId: r.campaignId,
          targeting: r.targeting, // enterprise-targeting metadata
          impressions: r.impressions != null ? num(r.impressions) : undefined,
          clicks: r.clicks != null ? num(r.clicks) : undefined,
          spend: r.spend != null ? num(r.spend) : undefined,
          email: r.email,
        },
      };
    });
  },
  async testConnection() {
    return baseValidateAuth(["LINKEDIN_ACCESS_TOKEN"])();
  },
  async sync() {
    return { ok: true, recordsSynced: 0 };
  },
};

// ---------------------------------------------------------------------------
// search_console / email — kept as stubs (not implemented this phase).
// ---------------------------------------------------------------------------
function stubConnector(
  providerKey: string,
  category: IntegrationConnector["category"],
  opts: {
    authMethod?: IntegrationAuthMethod;
    requiredCredentials?: string[];
    dataAvailable?: string[];
    defaultSyncFrequency?: IntegrationSyncFrequency;
  } = {},
): IntegrationConnector {
  const requiredCredentials = opts.requiredCredentials ?? [];
  return {
    providerKey,
    category,
    authMethod: opts.authMethod ?? "none",
    requiredCredentials,
    dataAvailable: opts.dataAvailable ?? [],
    defaultSyncFrequency: opts.defaultSyncFrequency ?? "manual",
    validateAuth: baseValidateAuth(requiredCredentials),
    mapToEvents() {
      return [];
    },
    async testConnection() {
      return { ok: false, reason: "not_configured" };
    },
    async sync() {
      return { ok: false, reason: "not_configured" };
    },
  };
}

export const CONNECTOR_REGISTRY: Record<string, IntegrationConnector> = {
  website,
  google_ads: googleAds,
  meta_ads: metaAds,
  linkedin_ads: linkedinAds,
  ga4,
  search_console: stubConnector("search_console", "analytics", {
    authMethod: "oauth2",
    requiredCredentials: ["SEARCH_CONSOLE_OAUTH_TOKEN"],
    dataAvailable: ["Search queries", "Impressions", "Clicks", "Average position"],
    defaultSyncFrequency: "daily",
  }),
  callrail,
  ringcentral,
  email: stubConnector("email", "email", {
    authMethod: "api_key",
    requiredCredentials: ["EMAIL_PROVIDER_API_KEY"],
    dataAvailable: ["Opens", "Clicks", "Bounces", "Unsubscribes"],
    defaultSyncFrequency: "hourly",
  }),
};

export function getConnector(providerKey: string): IntegrationConnector | undefined {
  return CONNECTOR_REGISTRY[providerKey];
}
