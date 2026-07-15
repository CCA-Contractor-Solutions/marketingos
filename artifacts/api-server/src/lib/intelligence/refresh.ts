import { eq } from "drizzle-orm";
import { db, leadsTable, marketingEventsTable, type LeadRow } from "@workspace/db";
import { computeJourney } from "./journey";
import { scoreLead } from "./scoring";

// ---------------------------------------------------------------------------
// Shared helper: recompute + persist a lead's denormalized journey cache and
// score. Used by both the events routes (on ingest) and the leads routes
// (on-demand re-score).
// ---------------------------------------------------------------------------

export async function refreshLeadJourneyAndScore(leadId: string): Promise<LeadRow | null> {
  const [leadRows, events] = await Promise.all([
    db.select().from(leadsTable).where(eq(leadsTable.id, leadId)).limit(1),
    db.select().from(marketingEventsTable).where(eq(marketingEventsTable.leadId, leadId)),
  ]);

  const lead = leadRows[0];
  if (!lead) return null;

  const journey = computeJourney(events);
  const scoreResult = scoreLead(lead, events);

  const updated = await db
    .update(leadsTable)
    .set({
      firstTouchChannel: journey.firstTouchChannel,
      firstTouchCampaign: journey.firstTouchCampaign,
      firstTouchAt: journey.firstTouchAt,
      lastTouchChannel: journey.lastTouchChannel,
      lastTouchCampaign: journey.lastTouchCampaign,
      lastTouchAt: journey.lastTouchAt,
      campaigns: journey.campaigns,
      pagesVisited: journey.pagesVisited,
      contentConsumed: journey.contentConsumed,
      callCount: journey.callCount,
      emailCount: journey.emailCount,
      score: scoreResult.score,
      scoreTier: scoreResult.tier,
      scoreReason: scoreResult.reason,
      recommendedAction: scoreResult.recommendedAction,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(leadsTable.id, leadId))
    .returning();

  return updated[0] ?? null;
}
