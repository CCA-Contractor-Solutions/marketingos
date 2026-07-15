import type { MarketingEventRow } from "@workspace/db";

// ---------------------------------------------------------------------------
// Module 2 — Journey computation.
//
// Pure function: given a lead's events (any order), derive the denormalized
// journey cache fields stored on the lead row. Callers are responsible for
// fetching the events (ordered or not — we sort here) and persisting the
// result back onto the lead.
// ---------------------------------------------------------------------------

export type JourneySummary = {
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
};

function byOccurredAtAsc(a: MarketingEventRow, b: MarketingEventRow): number {
  return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
}

function emptyJourney(): JourneySummary {
  return {
    firstTouchChannel: null,
    firstTouchCampaign: null,
    firstTouchAt: null,
    lastTouchChannel: null,
    lastTouchCampaign: null,
    lastTouchAt: null,
    campaigns: [],
    pagesVisited: [],
    contentConsumed: [],
    callCount: 0,
    emailCount: 0,
  };
}

export function computeJourney(events: MarketingEventRow[]): JourneySummary {
  if (events.length === 0) return emptyJourney();

  const ordered = [...events].sort(byOccurredAtAsc);
  const first = ordered[0]!;
  const last = ordered[ordered.length - 1]!;

  const campaigns = new Set<string>();
  const pagesVisited = new Set<string>();
  const contentConsumed = new Set<string>();
  let callCount = 0;
  let emailCount = 0;

  for (const event of ordered) {
    if (event.campaign) campaigns.add(event.campaign);

    if (event.eventType === "website_visit" || event.eventType === "landing_page_view") {
      const page = event.metadata?.["page"];
      if (typeof page === "string" && page.length > 0) pagesVisited.add(page);
    }

    if (event.eventType === "content_download") {
      const content = event.metadata?.["contentName"] ?? event.metadata?.["asset"];
      if (typeof content === "string" && content.length > 0) contentConsumed.add(content);
    }

    if (event.eventType === "phone_call") callCount += 1;
    if (event.eventType === "email_open" || event.eventType === "email_click") emailCount += 1;
  }

  return {
    firstTouchChannel: first.channel ?? null,
    firstTouchCampaign: first.campaign ?? null,
    firstTouchAt: first.occurredAt ?? null,
    lastTouchChannel: last.channel ?? null,
    lastTouchCampaign: last.campaign ?? null,
    lastTouchAt: last.occurredAt ?? null,
    campaigns: Array.from(campaigns),
    pagesVisited: Array.from(pagesVisited),
    contentConsumed: Array.from(contentConsumed),
    callCount,
    emailCount,
  };
}
