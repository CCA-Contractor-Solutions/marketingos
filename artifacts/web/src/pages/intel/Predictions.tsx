// Phase 5 -- Module 1: Predictive Lead Intelligence overview. Route: /predictions
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { TrendingUp, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useLeadPredictions, useLeads, useRecomputePredictions } from "@/hooks/useIntel";
import { fmtMoney } from "@/lib/format";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBandPill } from "@/components/intel/ConfidenceBandPill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortDir = "asc" | "desc";

export default function Predictions() {
  const { data: predictions, isLoading, isError } = useLeadPredictions();
  const { data: leads } = useLeads();
  const recompute = useRecomputePredictions();
  const { capabilities } = useRole();

  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const leadById = useMemo(() => {
    const map = new Map((leads ?? []).map((l) => [l.id, l]));
    return map;
  }, [leads]);

  const sorted = useMemo(() => {
    const rows = [...(predictions ?? [])];
    rows.sort((a, b) => (sortDir === "desc" ? b.conversionProbability - a.conversionProbability : a.conversionProbability - b.conversionProbability));
    return rows;
  }, [predictions, sortDir]);

  const avgProbability = predictions && predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.conversionProbability, 0) / predictions.length
    : 0;
  const totalExpectedRevenue = (predictions ?? []).reduce((sum, p) => sum + p.expectedRevenue, 0);
  const highConfidenceCount = (predictions ?? []).filter((p) => p.confidenceBand === "high").length;

  return (
    <AppLayout
      active="predictions"
      title="Predictive Lead Intelligence"
      subtitle="Growth Intelligence · Conversion probability, expected revenue, and best follow-up timing"
      actions={
        capabilities.canGenerateInsights ? (
          <Button size="sm" variant="outline" onClick={() => recompute.mutate({})} disabled={recompute.isPending}>
            <RefreshCw size={14} className={recompute.isPending ? "animate-spin" : ""} />
            {recompute.isPending ? "Recomputing…" : "Recompute predictions"}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="cadence-rise rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
              <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>Average conversion probability</div>
              <div className="mt-1 font-display text-2xl font-bold" style={{ color: "var(--c-brand)" }}>{(avgProbability * 100).toFixed(0)}%</div>
            </div>
            <div className="cadence-rise rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "60ms" }}>
              <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>Total expected revenue</div>
              <div className="mt-1 font-display text-2xl font-bold" style={{ color: "var(--c-ink)" }}>{fmtMoney(totalExpectedRevenue)}</div>
            </div>
            <div className="cadence-rise rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "100ms" }}>
              <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>High-confidence predictions</div>
              <div className="mt-1 font-display text-2xl font-bold" style={{ color: "var(--c-emerald)" }}>{highConfidenceCount}</div>
            </div>
          </div>

          <p className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>
            Predictions are model-generated estimates, not guarantees. Recomputing refreshes the numbers below -- it never contacts leads, changes their status, or triggers outreach automatically.
          </p>

          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "140ms" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={16} style={{ color: "var(--c-brand)" }} />
              <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                {sorted.length} prediction{sorted.length === 1 ? "" : "s"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                        className="flex items-center gap-1 font-medium"
                        title="Sort by conversion probability"
                      >
                        Conv. probability
                        {sortDir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                      </button>
                    </TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Expected revenue</TableHead>
                    <TableHead>Best follow-up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
                        No predictions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((p) => {
                      const lead = leadById.get(p.leadId);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            <Link href={`/leads/${p.leadId}`} className="hover:underline" style={{ color: "var(--c-brand-600)" }}>
                              {lead?.companyName ?? p.leadId}
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              style={{
                                background:
                                  p.confidenceBand === "high" ? "var(--c-emerald)" : p.confidenceBand === "medium" ? "var(--c-amber)" : "var(--c-rose)",
                                color: "#fff",
                              }}
                            >
                              {(p.conversionProbability * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <ConfidenceBandPill band={p.confidenceBand} />
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">{fmtMoney(p.expectedRevenue)}</TableCell>
                          <TableCell className="whitespace-nowrap text-[12.5px]" style={{ color: "var(--c-ink-soft)" }}>
                            {p.bestFollowUpAt ? new Date(p.bestFollowUpAt).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
