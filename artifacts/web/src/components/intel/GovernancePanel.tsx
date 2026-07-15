// Phase 4.5 — compact "Intelligence Governance" card for the Executive
// Dashboard. Fed by GET /governance/summary. Additive: does not touch any
// existing dashboard layout, just renders its own card wherever it's placed.
import { ShieldCheck } from "lucide-react";
import { useGovernanceSummary } from "@/hooks/useIntel";
import { ConfidenceBandPill } from "@/components/intel/ConfidenceBandPill";

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
        {label}
      </span>
      <span className="font-display text-xl font-bold" style={{ color: "var(--c-ink)" }}>
        {value}
      </span>
    </div>
  );
}

export function GovernancePanel() {
  const { data, isLoading } = useGovernanceSummary();

  return (
    <div
      className="cadence-rise rounded-2xl p-5 lg:p-6"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: "var(--c-brand)" }} />
        <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
          Intelligence Governance
        </h3>
      </div>

      {isLoading || !data ? (
        <div className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
          Loading data confidence stats…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <StatBlock label="Avg. recommendation confidence" value={`${Math.round(data.avgRecommendationConfidence * 100)}%`} />
            <ConfidenceBandPill band={data.avgRecommendationConfidenceBand} />
          </div>
          <div className="flex flex-col gap-1.5">
            <StatBlock label="Avg. attribution confidence" value={`${Math.round(data.avgAttributionConfidence * 100)}%`} />
            <ConfidenceBandPill band={data.avgAttributionConfidenceBand} />
          </div>
          <StatBlock label="% recommendations actioned" value={`${Math.round(data.pctActioned * 100)}%`} />
          <StatBlock label="% with outcome recorded" value={`${Math.round(data.pctWithOutcome * 100)}%`} />
        </div>
      )}
    </div>
  );
}
