// Module 3 — Campaign Ops dashboard. Route: /campaign-ops
import { useMemo } from "react";
import { Link } from "wouter";
import { Target } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useCampaignIntelligenceList } from "@/hooks/useIntel";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { CampaignPerformanceChart } from "@/pages/intel/charts/CampaignPerformanceChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CampaignOps() {
  const { data, isLoading, isError } = useCampaignIntelligenceList();
  const campaigns = data ?? [];

  const totals = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => ({
        leads: acc.leads + c.leadsGenerated,
        customers: acc.customers + c.customers,
        revenue: acc.revenue + c.revenue,
        budget: acc.budget + c.budget,
      }),
      { leads: 0, customers: 0, revenue: 0, budget: 0 },
    );
  }, [campaigns]);

  return (
    <AppLayout active="campaign-ops" title="Campaign Ops" subtitle="Growth Intelligence · Live campaign rollups">
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 pb-20">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active campaigns", value: fmtNumber(campaigns.length) },
              { label: "Total leads generated", value: fmtNumber(totals.leads) },
              { label: "Total customers", value: fmtNumber(totals.customers) },
              { label: "Total revenue", value: fmtMoney(totals.revenue) },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                className="cadence-rise rounded-2xl p-5"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: `${i * 40}ms` }}
              >
                <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>{kpi.label}</div>
                <div className="mt-2 font-display text-2xl font-bold" style={{ color: "var(--c-ink)" }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "160ms" }}
          >
            <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Revenue by campaign</h3>
            <p className="mt-0.5 mb-2 text-[12.5px]" style={{ color: "var(--c-muted)" }}>Top 8 campaigns by revenue.</p>
            <CampaignPerformanceChart data={campaigns} />
          </div>

          {/* Table */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "200ms" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Target size={16} style={{ color: "var(--c-brand)" }} />
              <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>All campaigns</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
                        No campaign intelligence data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((c) => (
                      <TableRow key={c.campaignId}>
                        <TableCell className="whitespace-nowrap font-medium">
                          <Link href={`/campaign-ops/${c.campaignId}`} className="hover:underline" style={{ color: "var(--c-brand-600)" }}>
                            {c.objective || c.campaignId}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{c.ownerName || "—"}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{fmtMoney(c.budget)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(c.leadsGenerated)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(c.customers)}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">{fmtMoney(c.revenue)}</TableCell>
                        <TableCell className="text-right">{c.roi != null ? `${(c.roi * 100).toFixed(0)}%` : "—"}</TableCell>
                      </TableRow>
                    ))
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
