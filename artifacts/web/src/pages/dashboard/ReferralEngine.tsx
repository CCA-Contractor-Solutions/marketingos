import { ModuleCard } from "./Shared";
import { referralEngine } from "./sampleData";
import { Gift, TrendingUp } from "lucide-react";

export function ReferralEngine() {
  const r = referralEngine;
  const stats = [
    { label: "Active Referrers", value: String(r.activeReferrers), color: "var(--c-teal)" },
    { label: "Referred Leads", value: String(r.referredLeads), color: "var(--c-brand)" },
    { label: "Conversion", value: r.conversion, color: "var(--c-emerald)" },
    { label: "Rewards Paid", value: r.rewardPaid, color: "var(--c-amber)" },
  ];
  return (
    <ModuleCard title="Referral Engine" actionLabel="View all" actionHref="/analytics" icon={Gift} accent="var(--c-teal)">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 p-3">
              <div className="font-display text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div
          className="flex items-center justify-between gap-2 rounded-xl p-3"
          style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>Top Referrer</div>
            <div className="text-[13px] font-bold text-slate-800 truncate">{r.topReferrer}</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold" style={{ color: "var(--c-emerald)" }}>
            <TrendingUp size={13} /> {r.growth}
          </span>
        </div>
      </div>
    </ModuleCard>
  );
}
