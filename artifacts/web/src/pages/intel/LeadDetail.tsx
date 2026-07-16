// Module 2 — Lead detail. Route: /leads/:id
import { useMemo, useState } from "react";
import { useParams } from "wouter";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRightCircle,
  Handshake,
} from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useLead, useUpdateLead, useConvertLead, useLeadPrediction } from "@/hooks/useIntel";
import { fmtMoney } from "@/lib/format";
import { TrendingUp, Clock3 } from "lucide-react";
import { useRole } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfidenceBandPill } from "@/components/intel/ConfidenceBandPill";

const TIER_COLOR: Record<string, string> = {
  high: "var(--c-emerald)",
  medium: "var(--c-amber)",
  low: "var(--c-rose)",
  unscored: "var(--c-muted)",
};

export default function LeadDetail() {
  const { id = "" } = useParams();
  const { data: lead, isLoading, isError } = useLead(id);
  const updateLead = useUpdateLead(id);
  const convertLead = useConvertLead(id);
  const { data: prediction } = useLeadPrediction(id);
  const { capabilities } = useRole();

  const [convertOpen, setConvertOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const timeline = useMemo(() => {
    if (!lead) return [];
    return [...lead.events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }, [lead]);

  return (
    <AppLayout active="leads" title={lead?.companyName ?? "Lead"} subtitle="Growth Intelligence · Lead profile">
      {isLoading ? (
        <PageLoading />
      ) : isError || !lead ? (
        <PageError />
      ) : (
        <div className="mx-auto max-w-6xl p-6 lg:p-8 space-y-6 pb-20">
          {/* Profile + score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className="cadence-rise lg:col-span-2 rounded-2xl p-5 lg:p-6"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold" style={{ color: "var(--c-ink)" }}>{lead.companyName}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--c-muted)" }}>
                    <span className="flex items-center gap-1"><Building2 size={13} />{lead.industry || "—"}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} />{lead.location || "—"}</span>
                  </div>
                </div>
                <Badge style={{ background: TIER_COLOR[lead.scoreTier], color: "#fff" }}>{lead.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                <div className="flex items-center gap-2" style={{ color: "var(--c-ink-soft)" }}>
                  <Mail size={14} style={{ color: "var(--c-muted)" }} /> {lead.email || "—"}
                </div>
                <div className="flex items-center gap-2" style={{ color: "var(--c-ink-soft)" }}>
                  <Phone size={14} style={{ color: "var(--c-muted)" }} /> {lead.phone || "—"}
                </div>
                <div className="flex items-center gap-2" style={{ color: "var(--c-ink-soft)" }}>
                  Contact: {lead.contactName || "—"} {lead.contactRole ? `(${lead.contactRole})` : ""}
                </div>
                <div className="flex items-center gap-2" style={{ color: "var(--c-ink-soft)" }}>
                  <Calendar size={14} style={{ color: "var(--c-muted)" }} /> Created {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>

              {/* Actions */}
              {capabilities.canEditLeadStatus && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={lead.qualified ? "secondary" : "outline"}
                    onClick={() => updateLead.mutate({ qualified: !lead.qualified })}
                    disabled={updateLead.isPending}
                  >
                    <CheckCircle2 size={14} /> {lead.qualified ? "Qualified" : "Mark qualified"}
                  </Button>
                  <Button
                    size="sm"
                    variant={lead.salesAccepted ? "secondary" : "outline"}
                    onClick={() => updateLead.mutate({ salesAccepted: !lead.salesAccepted })}
                    disabled={updateLead.isPending}
                  >
                    <ArrowRightCircle size={14} /> {lead.salesAccepted ? "Sales accepted" : "Mark sales accepted"}
                  </Button>
                  {capabilities.canConvertLeads && !lead.isCustomer && (
                    <Button size="sm" onClick={() => setConvertOpen(true)}>
                      <Handshake size={14} /> Convert to customer
                    </Button>
                  )}
                  {lead.isCustomer && (
                    <Badge style={{ background: "var(--c-emerald)", color: "#fff" }}>Customer · {fmtMoney(lead.revenueGenerated)}</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Score card */}
            <div
              className="cadence-rise rounded-2xl p-5 lg:p-6"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "60ms" }}
            >
              <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>Lead score</div>
              <div className="mt-1 font-display text-4xl font-bold" style={{ color: TIER_COLOR[lead.scoreTier] }}>{lead.score}</div>
              <div className="mt-1 text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>{lead.scoreTier} tier</div>
              {lead.scoreReason && (
                <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{lead.scoreReason}</p>
              )}
              {lead.recommendedAction && (
                <div className="mt-3 rounded-lg p-3 text-[12.5px]" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                  <span className="font-semibold">Recommended: </span>{lead.recommendedAction}
                </div>
              )}
            </div>
          </div>

          {/* Phase 5 -- predictive lead intelligence */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "80ms" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                <TrendingUp size={16} style={{ color: "var(--c-brand)" }} /> Prediction
              </h3>
              {prediction && <ConfidenceBandPill band={prediction.confidenceBand} why={`Model ${prediction.modelVersion} - based on this lead's tier, industry cohort, and engagement history.`} />}
            </div>

            {!prediction ? (
              <p className="mt-2 text-[13px]" style={{ color: "var(--c-muted)" }}>
                No prediction yet for this lead. Predictions are (re)computed via the growth engine.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>Conversion probability</div>
                  <div className="mt-1 font-display text-3xl font-bold" style={{ color: "var(--c-brand)" }}>
                    {(prediction.conversionProbability * 100).toFixed(0)}%
                  </div>
                  <div className="mt-2 text-[12.5px]" style={{ color: "var(--c-ink-soft)" }}>
                    Expected revenue: <span className="font-semibold">{fmtMoney(prediction.expectedRevenue)}</span>
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>
                    <Clock3 size={12} /> Best follow-up time
                  </div>
                  <div className="mt-1 text-[15px] font-semibold" style={{ color: "var(--c-ink)" }}>
                    {prediction.bestFollowUpAt ? new Date(prediction.bestFollowUpAt).toLocaleString() : "Not applicable"}
                  </div>
                  {prediction.bestFollowUpReason && (
                    <div className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{prediction.bestFollowUpReason}</div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="text-[12px] font-semibold" style={{ color: "var(--c-muted)" }}>Why this prediction (explainability)</div>
                  <div className="mt-2 space-y-1.5">
                    {prediction.factors.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg p-2.5 text-[12.5px]" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                        <span
                          className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold"
                          style={{
                            color: f.effect === "+" ? "var(--c-emerald)" : f.effect === "-" ? "var(--c-rose)" : "var(--c-muted)",
                            background:
                              f.effect === "+"
                                ? "color-mix(in srgb, var(--c-emerald) 14%, transparent)"
                                : f.effect === "-"
                                  ? "color-mix(in srgb, var(--c-rose) 14%, transparent)"
                                  : "color-mix(in srgb, var(--c-muted) 14%, transparent)",
                          }}
                        >
                          {f.effect === "+" ? "+" : f.effect === "-" ? "-" : "o"}
                        </span>
                        <div>
                          <div className="font-semibold" style={{ color: "var(--c-ink)" }}>{f.label}</div>
                          <div style={{ color: "var(--c-ink-soft)" }}>{f.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 text-[11px]" style={{ color: "var(--c-muted)" }}>
                  This is a model-generated prediction, not a guarantee. It does not change this lead's status or trigger any outreach automatically.
                </div>
              </div>
            )}
          </div>

          {/* Attribution breakdown */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "100ms" }}
          >
            <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Attribution breakdown</h3>
            {lead.attribution.length === 0 ? (
              <p className="mt-2 text-[13px]" style={{ color: "var(--c-muted)" }}>
                No attribution rows yet — attribution is computed once this lead converts.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {lead.attribution.map((a) => (
                  <div key={a.id} className="rounded-xl p-3" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-muted)" }}>{a.model.replace("_", " ")}</div>
                    <div className="mt-1 text-[13.5px] font-semibold">{a.channel}</div>
                    <div className="mt-0.5 text-[12px]" style={{ color: "var(--c-ink-soft)" }}>{fmtMoney(a.attributedAmount)} · {(a.weight * 100).toFixed(0)}% weight</div>
                    <div className="mt-2">
                      <ConfidenceBandPill band={a.confidenceBand} why={a.confidenceReason} />
                    </div>
                    {a.confidenceReason && (
                      <div className="mt-1 text-[11px] leading-snug" style={{ color: "var(--c-muted)" }}>{a.confidenceReason}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Marketing journey timeline */}
          <div
            className="cadence-rise rounded-2xl p-5 lg:p-6"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "140ms" }}
          >
            <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>Marketing journey</h3>
            {timeline.length === 0 ? (
              <p className="mt-2 text-[13px]" style={{ color: "var(--c-muted)" }}>No events recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-4 border-l pl-4" style={{ borderColor: "var(--c-border)" }}>
                {timeline.map((event) => (
                  <div key={event.id} className="relative">
                    <span
                      className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--c-brand)" }}
                    />
                    <div className="text-[12px] font-medium" style={{ color: "var(--c-muted)" }}>
                      {new Date(event.occurredAt).toLocaleString()}
                    </div>
                    <div className="text-[13.5px] font-semibold" style={{ color: "var(--c-ink)" }}>{event.eventType}</div>
                    <div className="text-[12.5px]" style={{ color: "var(--c-ink-soft)" }}>
                      {event.channel ? `${event.channel} · ` : ""}{event.campaign ?? event.source}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="cadence sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert to customer</DialogTitle>
            <DialogDescription>Records the deal amount and creates a conversion + customer record.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <Label htmlFor="convert-amount">Deal amount ($)</Label>
            <Input id="convert-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button
              disabled={!amount || convertLead.isPending}
              onClick={() => {
                convertLead.mutate(
                  { amount: Number(amount) },
                  { onSuccess: () => { setConvertOpen(false); setAmount(""); } },
                );
              }}
            >
              {convertLead.isPending ? "Converting…" : "Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
