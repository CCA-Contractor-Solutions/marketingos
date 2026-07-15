// Module 3 — Campaign Ops detail. Route: /campaign-ops/:campaignId
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Pencil } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useCampaignIntelligence, useUpsertCampaignIntelligence } from "@/hooks/useIntel";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { campaignPerformanceScore, performanceTier } from "@/lib/intel-scoring";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RevenueAttributionChart } from "@/pages/intel/charts/RevenueAttributionChart";
import { useAttributionSummary } from "@/hooks/useIntel";

export default function CampaignOpsDetail() {
  const { campaignId = "" } = useParams();
  const { data: campaign, isLoading, isError } = useCampaignIntelligence(campaignId);
  const attribution = useAttributionSummary();
  const upsert = useUpsertCampaignIntelligence(campaignId);
  const { capabilities } = useRole();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ objective: "", audience: "", service: "", budget: "" });

  useEffect(() => {
    if (campaign) {
      setForm({
        objective: campaign.objective,
        audience: campaign.audience,
        service: campaign.service,
        budget: String(campaign.budget),
      });
    }
  }, [campaign]);

  return (
    <AppLayout active="campaign-ops" title={campaign?.objective || campaignId} subtitle="Growth Intelligence · Campaign detail">
      {isLoading ? (
        <PageLoading />
      ) : isError || !campaign ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-6xl p-6 lg:p-8 space-y-6 pb-20">
          {/* Strategy card */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: "var(--c-ink)" }}>{campaign.objective || campaign.campaignId}</h2>
                <p className="mt-1 text-[13px]" style={{ color: "var(--c-muted)" }}>
                  {campaign.audience || "—"} · {campaign.service || "—"} · {campaign.industry || "—"} · {campaign.location || "—"}
                </p>
              </div>
              {capabilities.canEditCampaignStrategy && (
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil size={14} /> Edit strategy
                </Button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {campaign.channels.map((ch) => (
                <Badge key={ch} variant="outline">{ch}</Badge>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Budget", value: fmtMoney(campaign.budget) },
              { label: "Leads", value: fmtNumber(campaign.leadsGenerated) },
              { label: "Qualified", value: fmtNumber(campaign.qualifiedLeads) },
              { label: "Customers", value: fmtNumber(campaign.customers) },
              { label: "Revenue", value: fmtMoney(campaign.revenue) },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                className="cadence-rise rounded-2xl p-4"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: `${i * 30}ms` }}
              >
                <div className="text-[12.5px] font-medium" style={{ color: "var(--c-muted)" }}>{kpi.label}</div>
                <div className="mt-1.5 font-display text-xl font-bold" style={{ color: "var(--c-ink)" }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Score + revenue chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className="cadence-rise rounded-2xl p-5 lg:p-6"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
            >
              <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>Performance score</div>
              {(() => {
                const score = campaignPerformanceScore(campaign);
                const tier = performanceTier(score);
                return (
                  <>
                    <div className="mt-1 font-display text-4xl font-bold" style={{ color: tier.color }}>{score}</div>
                    <div className="mt-1 text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>{tier.label}</div>
                    <p className="mt-3 text-[12px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>
                      40% revenue + 35% conversion rate + 25% ROI, capped at 100.
                    </p>
                  </>
                );
              })()}
            </div>
            <div
              className="cadence-rise lg:col-span-2 rounded-2xl p-5 lg:p-6"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "60ms" }}
            >
              <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Revenue by channel</h3>
              <p className="mt-0.5 mb-2 text-[12.5px]" style={{ color: "var(--c-muted)" }}>Attribution across all campaigns' channels for context.</p>
              <RevenueAttributionChart data={attribution.data} />
            </div>
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="cadence sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit campaign strategy</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objective">Objective</Label>
              <Input id="objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service">Service</Label>
              <Input id="service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input id="budget" type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={upsert.isPending}
              onClick={() => {
                upsert.mutate(
                  {
                    objective: form.objective,
                    audience: form.audience,
                    service: form.service,
                    budget: Number(form.budget) || 0,
                  },
                  { onSuccess: () => setEditOpen(false) },
                );
              }}
            >
              {upsert.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
