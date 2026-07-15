// ---------------------------------------------------------------------------
// Client-side campaign performance score (0-100).
//
// FORMULA (documented per Phase 3 spec — derived entirely client-side from
// fields already returned by GET /campaign-intelligence; no new backend
// field or stored model):
//
//   revenueScore     = min(revenue / 20,000, 1)        * 40   (40% weight)
//   conversionScore  = min(customers / max(leadsGenerated, 1), 1) * 35 (35% weight)
//   roiScore         = min(roi / 3, 1)                  * 25   (25% weight, roi=null -> 0)
//   performanceScore = round(revenueScore + conversionScore + roiScore)
//
// Rationale: revenue is the largest single weight because it is the most
// direct measure of campaign value; conversion rate (customers / leads)
// rewards efficient campaigns even at smaller scale; ROI is included but
// weighted lowest since it is null for campaigns with no budget entered.
// The $20,000 and 3x ROI reference points are soft caps — a campaign
// performs at "full marks" for a given dimension once it reaches that
// level, and score does not exceed 100.
// ---------------------------------------------------------------------------

import type { CampaignIntelligence } from "./intel-types";

const REVENUE_CAP = 20000;
const ROI_CAP = 3;

export function campaignPerformanceScore(campaign: CampaignIntelligence): number {
  const revenueScore = Math.min(campaign.revenue / REVENUE_CAP, 1) * 40;
  const conversionRate = campaign.leadsGenerated > 0 ? campaign.customers / campaign.leadsGenerated : 0;
  const conversionScore = Math.min(conversionRate, 1) * 35;
  const roiScore = campaign.roi != null ? Math.min(campaign.roi / ROI_CAP, 1) * 25 : 0;

  return Math.round(revenueScore + conversionScore + roiScore);
}

export function performanceTier(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Strong", color: "var(--c-emerald)" };
  if (score >= 40) return { label: "Moderate", color: "var(--c-amber)" };
  return { label: "Weak", color: "var(--c-rose)" };
}
