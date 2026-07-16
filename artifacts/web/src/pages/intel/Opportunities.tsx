// Module 4 — Opportunity Center. Route: /opportunities
import { useMemo, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, FileText, Plus, History, Globe2, PenSquare, Eye, XCircle } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useRecommendations, useGenerateRecommendations } from "@/hooks/useIntel";
import {
  useMarketOpportunities,
  useGenerateMarketOpportunities,
  useUpdateMarketOpportunity,
  useContentOpportunities,
  useGenerateContentOpportunities,
  useUpdateContentOpportunity,
} from "@/hooks/useIntel";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateActionDialog } from "@/components/intel/CreateActionDialog";
import { RecommendationAuditDialog } from "@/components/intel/RecommendationAuditDialog";
import { ConfidenceBandPill, dataBasisWhy } from "@/components/intel/ConfidenceBandPill";
import type {
  Recommendation,
  RecommendationCategory,
  MarketOpportunity,
  ContentOpportunity,
  GrowthRecommendationStatus,
} from "@/lib/intel-types";

type OpportunityGroup = {
  key: string;
  label: string;
  icon: typeof TrendingUp;
  match: (rec: Recommendation) => boolean;
};

const GROUPS: OpportunityGroup[] = [
  {
    key: "growth",
    label: "Growth Opportunities",
    icon: TrendingUp,
    match: (rec) => rec.category === "channel" || rec.category === "market",
  },
  {
    key: "underperforming",
    label: "Underperforming Campaigns",
    icon: TrendingDown,
    match: (rec) => rec.category === "campaign",
  },
  {
    key: "content",
    label: "Content Opportunities",
    icon: FileText,
    match: (rec) => rec.category === "segment" || rec.category === "general",
  },
];

const CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  campaign: "Campaign",
  channel: "Channel",
  segment: "Segment",
  market: "Market",
  general: "General",
};


const STATUS_LABEL: Record<GrowthRecommendationStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  applied: "Actioned",
  dismissed: "Dismissed",
};

const STATUS_COLOR: Record<GrowthRecommendationStatus, string> = {
  new: "var(--c-muted)",
  reviewed: "var(--c-amber)",
  applied: "var(--c-emerald)",
  dismissed: "var(--c-rose)",
};

function MarketOpportunityCard({
  opp,
  canAct,
  disabled,
  onUpdate,
}: {
  opp: MarketOpportunity;
  canAct: boolean;
  disabled: boolean;
  onUpdate: (status: GrowthRecommendationStatus) => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="text-[10px] capitalize">{opp.kind}</Badge>
        <Badge style={{ background: STATUS_COLOR[opp.status], color: "#fff" }}>{STATUS_LABEL[opp.status]}</Badge>
      </div>
      <ConfidenceBandPill band={opp.confidenceBand} why={dataBasisWhy(opp.dataBasis)} />
      <h4 className="text-[14px] font-semibold leading-snug" style={{ color: "var(--c-ink)" }}>{opp.title}</h4>
      <p className="flex-1 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{opp.insight}</p>
      <div className="text-[11px] font-semibold" style={{ color: "var(--c-muted)" }}>
        Signal strength: {(opp.signalStrength * 100).toFixed(0)}%
      </div>
      {canAct && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px]" disabled={disabled || opp.status !== "new"} onClick={() => onUpdate("reviewed")}>
            <Eye size={13} /> Review
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px]" disabled={disabled || opp.status === "applied" || opp.status === "dismissed"} onClick={() => onUpdate("applied")}>
            <Plus size={13} /> Mark actioned
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px]" disabled={disabled || opp.status === "applied" || opp.status === "dismissed"} onClick={() => onUpdate("dismissed")}>
            <XCircle size={13} /> Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

function ContentOpportunityCard({
  opp,
  canAct,
  disabled,
  onUpdate,
}: {
  opp: ContentOpportunity;
  canAct: boolean;
  disabled: boolean;
  onUpdate: (status: GrowthRecommendationStatus) => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="text-[10px]">Content</Badge>
        <Badge style={{ background: STATUS_COLOR[opp.status], color: "#fff" }}>{STATUS_LABEL[opp.status]}</Badge>
      </div>
      <ConfidenceBandPill band={opp.confidenceBand} why={dataBasisWhy(opp.basedOn)} />
      <h4 className="text-[14px] font-semibold leading-snug" style={{ color: "var(--c-ink)" }}>{opp.topic}</h4>
      <p className="flex-1 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{opp.rationale}</p>
      {opp.projectedImpact && (
        <div className="rounded-lg p-2.5 text-[12px]" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <span className="font-semibold">Projected impact: </span>{opp.projectedImpact}
        </div>
      )}
      {canAct && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px]" disabled={disabled || opp.status !== "new"} onClick={() => onUpdate("reviewed")}>
            <Eye size={13} /> Review
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px]" disabled={disabled || opp.status === "applied" || opp.status === "dismissed"} onClick={() => onUpdate("applied")}>
            <Plus size={13} /> Mark actioned
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[12px]" disabled={disabled || opp.status === "applied" || opp.status === "dismissed"} onClick={() => onUpdate("dismissed")}>
            <XCircle size={13} /> Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Opportunities() {
  const { data, isLoading, isError } = useRecommendations();
  const generateMutation = useGenerateRecommendations();
  const { capabilities } = useRole();

  // Phase 5 -- market + content opportunities.
  const marketQuery = useMarketOpportunities();
  const generateMarketMutation = useGenerateMarketOpportunities();
  const updateMarketMutation = useUpdateMarketOpportunity();
  const contentQuery = useContentOpportunities();
  const generateContentMutation = useGenerateContentOpportunities();
  const updateContentMutation = useUpdateContentOpportunity();
  const [pendingMarketId, setPendingMarketId] = useState<string | null>(null);
  const [pendingContentId, setPendingContentId] = useState<string | null>(null);

  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [auditRecommendation, setAuditRecommendation] = useState<Recommendation | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const recommendations = data ?? [];
  const marketOpportunities = marketQuery.data ?? [];
  const contentOpportunities = contentQuery.data ?? [];

  function updateMarketStatus(id: string, status: GrowthRecommendationStatus) {
    setPendingMarketId(id);
    updateMarketMutation.mutate({ id, status }, { onSettled: () => setPendingMarketId(null) });
  }

  function updateContentStatus(id: string, status: GrowthRecommendationStatus) {
    setPendingContentId(id);
    updateContentMutation.mutate({ id, status }, { onSettled: () => setPendingContentId(null) });
  }

  const grouped = useMemo(() => {
    return GROUPS.map((group) => ({
      group,
      items: recommendations.filter((r) => group.match(r)),
    }));
  }, [recommendations]);

  return (
    <AppLayout active="opportunities" title="Opportunity Center" subtitle="Growth Intelligence · AI-surfaced growth opportunities">
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8 pb-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              {recommendations.length} recommendation{recommendations.length === 1 ? "" : "s"} across {grouped.filter((g) => g.items.length > 0).length} categories.
            </p>
            {capabilities.canGenerateInsights && (
              <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                <RefreshCw size={14} className={generateMutation.isPending ? "animate-spin" : ""} />
                {generateMutation.isPending ? "Generating…" : "Generate insights"}
              </Button>
            )}
          </div>

          {grouped.map(({ group, items }, gi) => {
            const Icon = group.icon;
            return (
              <div key={group.key} className="cadence-rise" style={{ animationDelay: `${gi * 60}ms` }}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={16} style={{ color: "var(--c-brand)" }} />
                  <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>{group.label}</h3>
                  <Badge variant="outline" className="text-[11px]">{items.length}</Badge>
                </div>
                {items.length === 0 ? (
                  <div
                    className="rounded-2xl p-6 text-center text-[13px]"
                    style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-muted)" }}
                  >
                    No opportunities in this category yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-2xl p-5 flex flex-col"
                        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">{CATEGORY_LABEL[rec.category]}</Badge>
                          <span className="text-[11px] font-semibold" style={{ color: "var(--c-muted)" }}>{Math.round(rec.confidence * 100)}% confidence</span>
                        </div>
                        <div className="mt-1.5">
                          <ConfidenceBandPill band={rec.confidenceBand} why={dataBasisWhy(rec.dataBasis, rec.dataSources)} />
                        </div>
                        <h4 className="mt-2 text-[14px] font-semibold leading-snug" style={{ color: "var(--c-ink)" }}>{rec.title}</h4>
                        <p className="mt-1.5 flex-1 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{rec.body}</p>
                        <div className="mt-3 flex items-center gap-1">
                          {capabilities.canCreateActions && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-fit px-2 text-[12px]"
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-fit px-2 text-[12px]"
                            onClick={() => {
                              setAuditRecommendation(rec);
                              setAuditDialogOpen(true);
                            }}
                          >
                            <History size={13} />
                            Audit trail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Phase 5 -- Market Opportunities */}
          <div className="cadence-rise" style={{ animationDelay: `${(grouped.length) * 60}ms` }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe2 size={16} style={{ color: "var(--c-brand)" }} />
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Market Opportunities</h3>
                <Badge variant="outline" className="text-[11px]">{marketOpportunities.length}</Badge>
              </div>
              {capabilities.canGenerateInsights && (
                <Button size="sm" variant="outline" onClick={() => generateMarketMutation.mutate()} disabled={generateMarketMutation.isPending}>
                  <RefreshCw size={14} className={generateMarketMutation.isPending ? "animate-spin" : ""} />
                  {generateMarketMutation.isPending ? "Generating…" : "Generate market opportunities"}
                </Button>
              )}
            </div>
            {marketOpportunities.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center text-[13px]"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-muted)" }}
              >
                No market opportunities detected yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketOpportunities.map((opp) => (
                  <MarketOpportunityCard
                    key={opp.id}
                    opp={opp}
                    canAct={capabilities.canCreateActions}
                    disabled={updateMarketMutation.isPending && pendingMarketId === opp.id}
                    onUpdate={(status) => updateMarketStatus(opp.id, status)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Phase 5 -- Content Opportunities */}
          <div className="cadence-rise" style={{ animationDelay: `${(grouped.length + 1) * 60}ms` }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PenSquare size={16} style={{ color: "var(--c-brand)" }} />
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Content Opportunities</h3>
                <Badge variant="outline" className="text-[11px]">{contentOpportunities.length}</Badge>
              </div>
              {capabilities.canGenerateInsights && (
                <Button size="sm" variant="outline" onClick={() => generateContentMutation.mutate()} disabled={generateContentMutation.isPending}>
                  <RefreshCw size={14} className={generateContentMutation.isPending ? "animate-spin" : ""} />
                  {generateContentMutation.isPending ? "Generating…" : "Generate content opportunities"}
                </Button>
              )}
            </div>
            {contentOpportunities.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center text-[13px]"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-muted)" }}
              >
                No content opportunities detected yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentOpportunities.map((opp) => (
                  <ContentOpportunityCard
                    key={opp.id}
                    opp={opp}
                    canAct={capabilities.canCreateActions}
                    disabled={updateContentMutation.isPending && pendingContentId === opp.id}
                    onUpdate={(status) => updateContentStatus(opp.id, status)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CreateActionDialog recommendation={selectedRecommendation} open={dialogOpen} onOpenChange={setDialogOpen} />
      <RecommendationAuditDialog
        recommendation={auditRecommendation}
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
      />
    </AppLayout>
  );
}
