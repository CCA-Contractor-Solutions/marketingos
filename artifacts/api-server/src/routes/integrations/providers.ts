// ---------------------------------------------------------------------------
// Module 8 — Provider-agnostic integration connectors.
//
// No hardcoded provider SDKs. Each connector is a stub that describes how a
// real integration WOULD connect (providerKey/category) and exposes the same
// shape (testConnection/sync) regardless of the underlying provider. Real
// implementations can be swapped in later without changing calling code in
// routes/integrations.ts.
// ---------------------------------------------------------------------------

export type IntegrationTestResult = { ok: boolean; reason?: string };
export type IntegrationSyncResult = {
  ok: boolean;
  reason?: string;
  recordsSynced?: number;
};

export interface IntegrationConnector {
  providerKey: string;
  category: "advertising" | "analytics" | "communication" | "email" | "automation";
  testConnection(): Promise<IntegrationTestResult>;
  sync(): Promise<IntegrationSyncResult>;
}

function stubConnector(
  providerKey: string,
  category: IntegrationConnector["category"],
): IntegrationConnector {
  return {
    providerKey,
    category,
    async testConnection() {
      return { ok: false, reason: "not_configured" };
    },
    async sync() {
      return { ok: false, reason: "not_configured" };
    },
  };
}

export const CONNECTOR_REGISTRY: Record<string, IntegrationConnector> = {
  google_ads: stubConnector("google_ads", "advertising"),
  meta_ads: stubConnector("meta_ads", "advertising"),
  linkedin_ads: stubConnector("linkedin_ads", "advertising"),
  ga4: stubConnector("ga4", "analytics"),
  search_console: stubConnector("search_console", "analytics"),
  callrail: stubConnector("callrail", "communication"),
  ringcentral: stubConnector("ringcentral", "communication"),
  email: stubConnector("email", "email"),
};

export function getConnector(providerKey: string): IntegrationConnector | undefined {
  return CONNECTOR_REGISTRY[providerKey];
}
