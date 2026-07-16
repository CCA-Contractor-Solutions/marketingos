// Phase 5 -- Module 2: Budget Intelligence. Route: /budget
//
// RECOMMENDATION ONLY. MarketingOS recommends; you decide and execute.
// Nothing here changes ad spend automatically -- "Apply" only records that a
// human reviewed the recommendation and decided to act on it. There is no
// write path from this page to any ad platform, campaign, or channel budget.
import { useState } from "react";
import { ArrowRight, RefreshCw, ShieldAlert, CheckCircle2, XCircle, Eye } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  useBudgetRecommendations,
  useGenerateBudgetRecommendations,
  useUpdateBudgetRecommendation,
} from "@/hooks/useIntel";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBandPill } from "@/components/intel/ConfidenceBandPill";
import type { BudgetRecommendation, GrowthRecommendationStatus } from "@/lib/intel-types";

const STATUS_LABEL: Record<GrowthRecommendationStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  applied: "Applied",
  dismissed: "Dismissed",
};

const STATUS_COLOR: Record<GrowthRecommendationStatus, string> = {
  new: "var(--c-muted)",
  reviewed: "var(--c-amber)",
  applied: "var(--c-emerald)",
  dismissed: "var(--c-rose)",
};

function ShiftCard({
  rec,
  onReview,
  onApply,
  onDismiss,
  disabled,
  canAct,
}: {
  rec: BudgetRecommendation;
  onReview: () => void;
  onApply: () => void;
  onDismiss: () => void;
  disabled: boolean;
  canAct: boolean;
}) {
  return (
    <div
      className="cadence-rise rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: "var(--c-ink)" }}>
          <span>{rec.fromChannel}</span>
          <ArrowRight size={14} style={{ color: "var(--c-muted)" }} />
          <span>{rec.toChannel}</span>
        </div>
        <Badge style={{ background: STATUS_COLOR[rec.status], color: "#fff" }}>{STATUS_LABEL[rec.status]}</Badge>
      </div>

      <ConfidenceBandPill band={rec.confidenceBand} why={rec.rationale} />

      <div className="grid grid-cols-2 gap-3 text-[12.5px]">
        <div className="rounded-xl p-3" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>Shift</div>
          <div className="mt-1 font-semibold" style={{ color: "var(--c-ink)" }}>{(rec.shiftPct * 100).toFixed(0)}% · {fmtMoney(rec.shiftAmount)}</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>Projected impact</div>
          <div className="mt-1 font-semibold" style={{ color: "var(--c-emerald)" }}>
            +{fmtNumber(rec.projectedQualifiedDelta)} QL · +{fmtMoney(rec.projectedRevenueDelta)}
          </div>
        </div>
      </div>

      <p className="text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{rec.rationale}</p>

      {canAct && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-[12px]"
            disabled={disabled || rec.status !== "new"}
            onClick={onReview}
          >
            <Eye size={13} /> Review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-[12px]"
            disabled={disabled || rec.status === "applied" || rec.status === "dismissed"}
            onClick={onApply}
          >
            <CheckCircle2 size={13} /> {rec.status === "applied" ? "Applied" : "Apply"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-[12px]"
            disabled={disabled || rec.status === "applied" || rec.status === "dismissed"}
            onClick={onDismiss}
          >
            <XCircle size={13} /> Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BudgetIntelligence() {
  const { data, isLoading, isError } = useBudgetRecommendations();
  const generateMutation = useGenerateBudgetRecommendations();
  const updateMutation = useUpdateBudgetRecommendation();
  const { capabilities } = useRole();

  const [pendingId, setPendingId] = useState<string | null>(null);

  const recommendations = data ?? [];

  function updateStatus(id: string, status: GrowthRecommendationStatus) {
    setPendingId(id);
    updateMutation.mutate({ id, status }, { onSettled: () => setPendingId(null) });
  }

  return (
    <AppLayout
      active="budget"
      title="Budget Intelligence"
      subtitle="Growth Intelligence · Recommended budget shifts across channels"
      actions={
        capabilities.canGenerateInsights ? (
          <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <RefreshCw size={14} className={generateMutation.isPending ? "animate-spin" : ""} />
            {generateMutation.isPending ? "Generating…" : "Generate recommendations"}
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 pb-20">
          <div
            className="cadence-rise flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "color-mix(in srgb, var(--c-amber) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--c-amber) 35%, transparent)" }}
          >
            <ShieldAlert size={18} style={{ color: "var(--c-amber)" }} className="mt-0.5 shrink-0" />
            <p className="text-[12.5px] leading-snug font-medium" style={{ color: "var(--c-ink)" }}>
              MarketingOS recommends; you decide and execute. Nothing changes ad spend automatically. "Apply" only records that you reviewed this recommendation and decided to act on it in your ad platforms yourself.
            </p>
          </div>

          <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
            {recommendations.length} recommendation{recommendations.length === 1 ? "" : "s"}.
          </p>

          {recommendations.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center text-[13px]"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-muted)" }}
            >
              No budget recommendations yet. Generate recommendations to see suggested shifts.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <ShiftCard
                  key={rec.id}
                  rec={rec}
                  canAct={capabilities.canCreateActions}
                  disabled={updateMutation.isPending && pendingId === rec.id}
                  onReview={() => updateStatus(rec.id, "reviewed")}
                  onApply={() => updateStatus(rec.id, "applied")}
                  onDismiss={() => updateStatus(rec.id, "dismissed")}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
