import type { LeadRow, MarketingEventRow, ScoreTier } from "@workspace/db";

// ---------------------------------------------------------------------------
// Module 5 — Lead scoring.
//
// Pure, rule-based scoring engine. Weights are configurable in SCORING_RULES
// so the model can be tuned without touching the scoring algorithm itself.
// ---------------------------------------------------------------------------

export const SCORING_RULES = {
  highIntent: {
    consultationRequest: 30, // meeting_request event, or eventType "consultation"
    pricingInquiry: 30, // form_submission with metadata.intent === "pricing"
    phoneCall: 30,
    meetingRequest: 30,
    multipleVisitsThreshold: 3, // >= 3 website_visit events
    multipleVisitsBonus: 15,
    contentEngagementThreshold: 2, // >= 2 content_download events
    contentEngagementBonus: 10,
  },
  medium: {
    contentDownload: 8,
    emailInteraction: 8, // email_click / email_open
    websiteActivity: 8, // any additional website activity beyond the base visit
  },
  low: {
    basicVisit: 2,
  },
  tiers: {
    high: 60,
    medium: 25,
  },
} as const;

export type ScoreResult = {
  score: number;
  tier: ScoreTier;
  reason: string;
  recommendedAction: string;
};

type Contribution = { label: string; points: number };

function recommendedActionForTier(tier: ScoreTier): string {
  switch (tier) {
    case "high":
      return "Route to sales now";
    case "medium":
      return "Nurture with targeted content";
    case "low":
      return "Continue monitoring";
    default:
      return "Awaiting engagement data";
  }
}

export function scoreLead(_lead: LeadRow, events: MarketingEventRow[]): ScoreResult {
  if (events.length === 0) {
    return {
      score: 0,
      tier: "unscored",
      reason: "No marketing events recorded yet.",
      recommendedAction: recommendedActionForTier("unscored"),
    };
  }

  const contributions: Contribution[] = [];
  const { highIntent, medium, low } = SCORING_RULES;

  let websiteVisitCount = 0;
  let contentDownloadCount = 0;
  let hasConsultationRequest = false;
  let hasPricingInquiry = false;
  let hasPhoneCall = false;
  let hasMeetingRequest = false;
  let emailInteractionCount = 0;

  for (const event of events) {
    switch (event.eventType) {
      case "website_visit":
        websiteVisitCount += 1;
        break;
      case "content_download":
        contentDownloadCount += 1;
        break;
      case "meeting_request":
        hasMeetingRequest = true;
        break;
      case "phone_call":
        hasPhoneCall = true;
        break;
      case "form_submission": {
        const intent = event.metadata?.["intent"];
        if (intent === "pricing" || intent === "consultation") {
          hasPricingInquiry = true;
        }
        break;
      }
      case "email_click":
      case "email_open":
        emailInteractionCount += 1;
        break;
      default:
        break;
    }

    if (event.eventType === "campaign_interaction") {
      const consultation = event.metadata?.["consultation"];
      if (consultation === true) hasConsultationRequest = true;
    }
  }

  // High-intent signals (capped once each, per spec).
  if (hasMeetingRequest || hasConsultationRequest) {
    contributions.push({ label: "Requested consultation/meeting", points: highIntent.meetingRequest });
  }
  if (hasPricingInquiry) {
    contributions.push({ label: "Pricing/service inquiry", points: highIntent.pricingInquiry });
  }
  if (hasPhoneCall) {
    contributions.push({ label: "Phone call engagement", points: highIntent.phoneCall });
  }
  if (websiteVisitCount >= highIntent.multipleVisitsThreshold) {
    contributions.push({
      label: `Multiple website visits (${websiteVisitCount})`,
      points: highIntent.multipleVisitsBonus,
    });
  }
  if (contentDownloadCount >= highIntent.contentEngagementThreshold) {
    contributions.push({
      label: `Content engagement (${contentDownloadCount} downloads)`,
      points: highIntent.contentEngagementBonus,
    });
  }

  // Medium signals.
  if (contentDownloadCount > 0 && contentDownloadCount < highIntent.contentEngagementThreshold) {
    contributions.push({ label: "Content download", points: medium.contentDownload });
  }
  if (emailInteractionCount > 0) {
    contributions.push({
      label: `Email engagement (${emailInteractionCount})`,
      points: medium.emailInteraction,
    });
  }
  if (websiteVisitCount > 0 && websiteVisitCount < highIntent.multipleVisitsThreshold) {
    contributions.push({ label: "Website activity", points: medium.websiteActivity });
  }

  // Low signal — baseline for any basic visit not already scored above.
  if (contributions.length === 0 && websiteVisitCount > 0) {
    contributions.push({ label: "Basic website visit", points: low.basicVisit });
  }

  const score = contributions.reduce((sum, c) => sum + c.points, 0);

  let tier: ScoreTier;
  if (score >= SCORING_RULES.tiers.high) tier = "high";
  else if (score >= SCORING_RULES.tiers.medium) tier = "medium";
  else tier = "low";

  const topContributions = [...contributions]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((c) => c.label);

  const reason = topContributions.length > 0
    ? `Top signals: ${topContributions.join("; ")}`
    : "Limited engagement signals recorded.";

  return {
    score,
    tier,
    reason,
    recommendedAction: recommendedActionForTier(tier),
  };
}
