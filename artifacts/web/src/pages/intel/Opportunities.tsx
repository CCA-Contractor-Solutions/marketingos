// Module 4 — Opportunity Center. Route: /opportunities
import { useMemo, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, FileText, Plus, History } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useRecommendations, useGenerateRecommendations } from "@/hooks/useIntel";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateActionDialog } from "@/components/intel/CreateActionDialog";
import { RecommendationAuditDialog } from "@/components/intel/RecommendationAuditDialog";
import { ConfidenceBandPill, dataBasisWhy } from "@/components/intel/ConfidenceBandPill";
import type { Recommendation, RecommendationCategory } from "@/lib/intel-types";

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

export default function Opportunities() {
  const { data, isLoading, isError } = useRecommendations();
  const generateMutation = useGenerateRecommendations();
  const { capabilities } = useRole();

  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [auditRecommendation, setAuditRecommendation] = useState<Recommendation | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const recommendations = data ?? [];

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
