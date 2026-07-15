import type { ChannelRow, ConversionRow, LeadRow, MarketingEventRow } from "@workspace/db";

// ---------------------------------------------------------------------------
// Module 4 — Channel intelligence.
//
// Computes per-channel performance live from events + leads + conversions,
// rather than relying on a stored cache. `spend` is derived from a caller-
// supplied map (e.g. integration/campaign budgets) when available.
// ---------------------------------------------------------------------------

export type ChannelIntelligence = {
  channelId: string;
  channelName: string;
  category: string;
  leads: number;
  qualifiedLeads: number;
  customers: number;
  revenue: number;
  spend: number;
  roi: number | null;
};

export function computeChannelIntelligence(
  channels: ChannelRow[],
  leads: LeadRow[],
  events: MarketingEventRow[],
  conversions: ConversionRow[],
  spendByChannelName: Record<string, number> = {},
): ChannelIntelligence[] {
  // Map lead -> first-touch channel name (denormalized cache already holds
  // this, but we also fall back to computing from events for robustness).
  const leadChannel = new Map<string, string>();
  for (const lead of leads) {
    if (lead.firstTouchChannel) leadChannel.set(lead.id, lead.firstTouchChannel);
  }
  for (const event of events) {
    if (!event.leadId || !event.channel) continue;
    if (!leadChannel.has(event.leadId)) leadChannel.set(event.leadId, event.channel);
  }

  const results: ChannelIntelligence[] = channels.map((channel) => {
    let leadCount = 0;
    let qualifiedCount = 0;
    let customerCount = 0;

    for (const lead of leads) {
      const channelName = leadChannel.get(lead.id);
      if (channelName !== channel.name) continue;
      leadCount += 1;
      if (lead.qualified) qualifiedCount += 1;
      if (lead.isCustomer) customerCount += 1;
    }

    let revenue = 0;
    for (const conversion of conversions) {
      let channelName = conversion.channel ?? undefined;
      if (!channelName) channelName = leadChannel.get(conversion.leadId);
      if (channelName === channel.name) revenue += conversion.amount;
    }

    const spend = spendByChannelName[channel.name] ?? 0;
    const roi = spend > 0 ? (revenue - spend) / spend : null;

    return {
      channelId: channel.id,
      channelName: channel.name,
      category: channel.category,
      leads: leadCount,
      qualifiedLeads: qualifiedCount,
      customers: customerCount,
      revenue,
      spend,
      roi,
    };
  });

  return results.sort((a, b) => b.revenue - a.revenue);
}
