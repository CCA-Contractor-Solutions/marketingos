// ---------------------------------------------------------------------------
// Phase 4 — Realistic sample payloads, per provider.
//
// No real provider SDKs/network calls are made in this phase. Each `/sync`
// call feeds a small, realistic, contractor-flavored (CCA — Contractor
// Certification & Advisory) sample dataset through the SAME
// `mapToEvents` → `ingestExternalRecords` pipeline a live integration would
// use, so the ingestion pipeline is fully demonstrable end-to-end.
//
// Each record carries a stable-looking `externalId` so idempotency/dedup
// (on provider + externalId) is also demonstrable — re-running sync against
// the same sample set does not create duplicate marketing_events.
// ---------------------------------------------------------------------------

export function samplePayloadFor(providerKey: string): unknown[] {
  switch (providerKey) {
    case "website":
      return WEBSITE_SAMPLE;
    case "ga4":
      return GA4_SAMPLE;
    case "google_ads":
      return GOOGLE_ADS_SAMPLE;
    case "callrail":
      return CALLRAIL_SAMPLE;
    case "ringcentral":
      return RINGCENTRAL_SAMPLE;
    case "meta_ads":
      return META_ADS_SAMPLE;
    case "linkedin_ads":
      return LINKEDIN_ADS_SAMPLE;
    default:
      return [];
  }
}

// --- website (webhook-style form/page activity) -----------------------------

const WEBSITE_SAMPLE = [
  {
    externalId: "WEB-VISIT-8841",
    type: "page_view",
    page: "/services/multi-state-licensing",
    url: "https://ccacontractors.com/services/multi-state-licensing",
    utm_source: "google",
    utm_medium: "organic",
    utm_campaign: "multi-state-licensing-seo",
    occurredAt: "2026-07-10T14:02:00Z",
  },
  {
    externalId: "WEB-DL-2210",
    type: "content_download",
    page: "/resources/multi-state-license-checklist",
    asset: "Multi-State License Checklist.pdf",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "multi-state-licensing-search",
    occurredAt: "2026-07-10T14:06:00Z",
  },
  {
    externalId: "WEB-FORM-5537",
    type: "form_submission",
    page: "/get-started",
    formName: "Consultation Request",
    email: "d.reyes@brightpathelectric.com",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "multi-state-licensing-search",
    occurredAt: "2026-07-10T14:11:00Z",
  },
  {
    externalId: "WEB-MEETING-1188",
    type: "meeting_request",
    page: "/schedule-consult",
    formName: "Schedule a Consult",
    email: "d.reyes@brightpathelectric.com",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "multi-state-licensing-search",
    occurredAt: "2026-07-10T15:20:00Z",
  },
];

// --- ga4 (sessions / traffic source / conversions) ---------------------------

const GA4_SAMPLE = [
  {
    externalId: "GA4-SESS-330912",
    eventName: "session_start",
    sessionSource: "google",
    sessionMedium: "organic",
    campaign: "contractor-license-seo",
    landingPage: "/services/contractor-license",
    occurredAt: "2026-07-09T09:12:00Z",
  },
  {
    externalId: "GA4-SESS-330944",
    eventName: "session_start",
    sessionSource: "google",
    sessionMedium: "cpc",
    campaign: "contractor-license-search",
    landingPage: "/services/multi-state-licensing",
    occurredAt: "2026-07-09T09:40:00Z",
  },
  {
    externalId: "GA4-CONV-330991",
    eventName: "generate_lead",
    sessionSource: "google",
    sessionMedium: "cpc",
    campaign: "contractor-license-search",
    landingPage: "/get-started",
    occurredAt: "2026-07-09T09:52:00Z",
  },
];

// --- google_ads (campaign spend / clicks / conversions / keywords) ----------

const GOOGLE_ADS_SAMPLE = [
  {
    externalId: "GADS-CAMP-77213-2026-07-09",
    campaignId: "77213",
    campaignName: "Multi-State Contractor Licensing — Search",
    keyword: "multi state contractor license",
    searchTerm: "how to get a contractor license in another state",
    impressions: 4820,
    clicks: 212,
    costMicros: 486_000_000, // $486.00
    conversions: 6,
    date: "2026-07-09",
  },
  {
    externalId: "GADS-CAMP-77213-2026-07-10",
    campaignId: "77213",
    campaignName: "Multi-State Contractor Licensing — Search",
    keyword: "contractor license reciprocity",
    searchTerm: "contractor license reciprocity states",
    impressions: 5110,
    clicks: 244,
    costMicros: 527_000_000, // $527.00
    conversions: 8,
    date: "2026-07-10",
  },
];

// --- callrail (tracked calls) -----------------------------------------------

const CALLRAIL_SAMPLE = [
  {
    externalId: "CR-CALL-90142",
    trackingNumber: "+1-800-555-0142",
    callerNumberRef: "caller-90142", // opaque reference, not raw PII
    duration: 312,
    campaign: "contractor-license-search",
    source: "google_ads",
    callOutcome: "qualified",
    recordingUrlRef: "callrail://recording/90142", // reference only, where permitted
    occurredAt: "2026-07-10T16:05:00Z",
  },
  {
    externalId: "CR-CALL-90177",
    trackingNumber: "+1-800-555-0142",
    callerNumberRef: "caller-90177",
    duration: 94,
    campaign: "multi-state-licensing-search",
    source: "google_ads",
    callOutcome: "received",
    recordingUrlRef: "callrail://recording/90177",
    occurredAt: "2026-07-11T10:22:00Z",
  },
  {
    externalId: "CR-CALL-90201",
    trackingNumber: "+1-800-555-0198",
    callerNumberRef: "caller-90201",
    duration: 501,
    campaign: "multi-state-licensing-search",
    source: "google_ads",
    callOutcome: "converted",
    recordingUrlRef: "callrail://recording/90201",
    occurredAt: "2026-07-11T13:47:00Z",
  },
];

// --- ringcentral (calls + SMS communication timeline) -----------------------

const RINGCENTRAL_SAMPLE = [
  {
    externalId: "RC-CALL-55021",
    type: "call",
    direction: "inbound",
    duration: 268,
    responseTimeMinutes: 3,
    campaign: "contractor-license-search",
    occurredAt: "2026-07-11T08:31:00Z",
  },
  {
    externalId: "RC-SMS-55066",
    type: "sms",
    direction: "outbound",
    responseTimeMinutes: 12,
    campaign: "contractor-license-search",
    occurredAt: "2026-07-11T08:44:00Z",
  },
];

// --- meta_ads (campaigns / audience / leads) --------------------------------

const META_ADS_SAMPLE = [
  {
    externalId: "META-CAMP-3391-2026-07-09",
    campaignId: "3391",
    campaignName: "CCA — Licensing Awareness (Facebook/IG)",
    audience: "Small business owners, 35-54, Home Services",
    geo: "TX, FL, GA, NC",
    impressions: 38210,
    clicks: 601,
    spend: 342.5,
    date: "2026-07-09",
  },
  {
    externalId: "META-LEAD-3391-8842",
    campaignId: "3391",
    campaignName: "CCA — Licensing Awareness (Facebook/IG)",
    type: "lead_form",
    audience: "Small business owners, 35-54, Home Services",
    geo: "TX",
    email: "m.chen@summitrooferstx.com",
    occurredAt: "2026-07-10T11:15:00Z",
  },
];

// --- linkedin_ads (enterprise-targeted campaigns) ---------------------------

const LINKEDIN_ADS_SAMPLE = [
  {
    externalId: "LI-CAMP-9021-2026-07-09",
    campaignId: "9021",
    campaignName: "CCA — Multi-State Licensing for Enterprise Contractors",
    targeting: "Job title: Compliance Manager, Operations Director; Industry: Construction",
    impressions: 12040,
    clicks: 188,
    spend: 610.0,
    date: "2026-07-09",
  },
  {
    externalId: "LI-LEAD-9021-4471",
    campaignId: "9021",
    campaignName: "CCA — Multi-State Licensing for Enterprise Contractors",
    type: "lead_gen_form",
    targeting: "Job title: Compliance Manager; Industry: Construction",
    email: "j.patel@nationwidebuildgroup.com",
    occurredAt: "2026-07-10T09:03:00Z",
  },
];
