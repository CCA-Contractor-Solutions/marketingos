// Module 1 — Executive Dashboard. Route: /intelligence
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Sparkles, RefreshCw, Users, Target, DollarSign, TrendingUp, Percent, Plus } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  useIntelligenceOverview,
  useChannelIntelligence,
  useCampaignIntelligenceList,
  useRecommendations,
  useGenerateRecommendations,
} from "@/hooks/useIntel";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { campaignPerformanceScore, performanceTier } from "@/lib/intel-scoring";
import { useRole } from "@/lib/roles";
import { CreateActionDialog } from "@/components/intel/CreateActionDialog";
import { useIntegrations } from "@/hooks/useIntel";
import { DataSourcesStrip } from "@/components/intel/DataSourcesStrip";
import { CustomerJourneyVisual } from "@/components/intel/CustomerJourneyVisual";
import type { Recommendation } from "@/lib/intel-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function KpiCard({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  delay: number;
}) {
  return (
    <div
      className="cadence-rise rounded-2xl p-5"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>
          {label}
        </div>
        <Icon size={16} style={{ color: "var(--c-brand)" }} />
      </div>
      <div className="mt-2 font-display text-2xl font-bold" style={{ color: "var(--c-ink)" }}>
        {value}
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  campaign: "Campaign",
  channel: "Channel",
  segment: "Segment",
  market: "Market",
  general: "General",
};

export default function IntelligenceDashboard() {
  const { capabilities } = useRole();
  const overview = useIntelligenceOverview();
  const channels = useChannelIntelligence();
  const campaigns = useCampaignIntelligenceList();
  const recommendations = useRecommendations();
  const generateMutation = useGenerateRecommendations();
  const integrations = useIntegrations();

  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isLoading = overview.isLoading || channels.isLoading || campaigns.isLoading || recommendations.isLoading;
  const isError = overview.isError || channels.isError || campaigns.isError || recommendations.isError;

  const sortedChannels = useMemo(
    () => [...(channels.data ?? [])].sort((a, b) => b.revenue - a.revenue),
    [channels.data],
  );

  const scoredCampaigns = useMemo(
    () =>
      [...(campaigns.data ?? [])]
        .map((c) => ({ ...c, score: campaignPerformanceScore(c) }))
        .sort((a, b) => b.score - a.score),
    [campaigns.data],
  );

  const groupedRecommendations = useMemo(() => {
    const groups = new Map<string, Recommendation[]>();
    for (const rec of recommendations.data ?? []) {
      const list = groups.get(rec.category) ?? [];
      list.push(rec);
      groups.set(rec.category, list);
    }
    return Array.from(groups.entries());
  }, [recommendations.data]);

  return (
    <AppLayout
      active="intelligence"
      title="Executive Dashboard"
      subtitle="Growth Intelligence · Live rollups"
    >
      {isLoading ? (
        <PageLoading />
      ) : isError || !overview.data ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 lg:space-y-8 pb-20">
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Total leads" value={fmtNumber(overview.data.totalLeads)} icon={Users} delay={0} />
            <KpiCard label="Qualified leads" value={fmtNumber(overview.data.qualifiedLeads)} icon={Target} delay={40} />
            <KpiCard label="Customers" value={fmtNumber(overview.data.customers)} icon={TrendingUp} delay={80} />
            <KpiCard label="Revenue" value={fmtMoney(overview.data.revenue)} icon={DollarSign} delay={120} />
            <KpiCard
              label="Conversion rate"
              value={`${(overview.data.conversionRate * 100).toFixed(1)}%`}
              icon={Percent}
              delay={160}
            />
          </div>

          {/* Phase 4 -- Data sources strip (additive) */}
          <DataSourcesStrip integrations={integrations.data ?? []} isLoading={integrations.isLoading} />

          {/* Phase 4 -- Customer journey mini-visual (additive) */}
          <CustomerJourneyVisual />

          {/* Channel performance */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "200ms" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Channel Performance</h3>
                <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--c-muted)" }}>Sorted by revenue, highest first.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Qualified</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedChannels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
                        No channel data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedChannels.map((c) => (
                      <TableRow key={c.channelId}>
                        <TableCell className="font-medium whitespace-nowrap">{c.channelName}</TableCell>
                        <TableCell className="whitespace-nowrap capitalize">{c.category}</TableCell>
                        <TableCell className="text-right">{fmtNumber(c.leads)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(c.qualifiedLeads)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(c.customers)}</TableCell>
                        <TableCell className="text-right font-semibold">{fmtMoney(c.revenue)}</TableCell>
                        <TableCell className="text-right">{c.roi != null ? `${(c.roi * 100).toFixed(0)}%` : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Campaign performance */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "240ms" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Campaign Performance</h3>
                <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                  Score = 40% revenue + 35% conversion rate + 25% ROI (0–100, capped).
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
                        No campaign intelligence yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scoredCampaigns.map((c) => {
                      const tier = performanceTier(c.score);
                      return (
                        <TableRow key={c.campaignId}>
                          <TableCell className="font-medium whitespace-nowrap">
                            <Link href={`/campaign-ops/${c.campaignId}`} className="hover:underline" style={{ color: "var(--c-brand-600)" }}>
                              {c.objective || c.campaignId}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">{fmtNumber(c.leadsGenerated)}</TableCell>
                          <TableCell className="text-right">{fmtNumber(c.customers)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmtMoney(c.revenue)}</TableCell>
                          <TableCell className="text-right">{c.roi != null ? `${(c.roi * 100).toFixed(0)}%` : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Badge style={{ background: tier.color, color: "#fff" }}>{c.score} · {tier.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* AI Intelligence Feed */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "280ms" }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "var(--c-brand)" }} />
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>AI Intelligence Feed</h3>
              </div>
              {capabilities.canGenerateInsights && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  <RefreshCw size={14} className={generateMutation.isPending ? "animate-spin" : ""} />
                  {generateMutation.isPending ? "Generating…" : "Generate insights"}
                </Button>
              )}
            </div>

            {groupedRecommendations.length === 0 ? (
              <div className="py-8 text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
                No recommendations yet. {capabilities.canGenerateInsights ? "Generate insights to get started." : ""}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedRecommendations.map(([category, recs]) => (
                  <div key={category}>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                      {CATEGORY_LABELS[category] ?? category}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recs.map((rec) => (
                        <div
                          key={rec.id}
                          className="rounded-xl p-4"
                          style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-[13.5px] font-semibold leading-snug" style={{ color: "var(--c-ink)" }}>
                              {rec.title}
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {Math.round(rec.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>
                            {rec.body}
                          </p>
                          {capabilities.canCreateActions && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 h-8 px-2 text-[12px]"
                              disabled={rec.status === "applied"}
                              onClick={() => {
                                setSelectedRecommendation(rec);
                                setDialogOpen(true);
                              }}
                            >
                              <Plus size={13} />
                              {rec.status === "applied" ? "Action created" : "Create action"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CreateActionDialog
        recommendation={selectedRecommendation}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
