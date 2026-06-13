import { TrendingUp } from "lucide-react";
import type { KpiTile } from "@workspace/api-client-react";

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 96;
  const h = 32;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = positive ? "var(--c-emerald)" : "var(--c-rose)";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({ kpi }: { kpi: KpiTile }) {
  return (
    <div
      className="rounded-2xl p-5 bg-white"
      style={{
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12.5px] font-medium" style={{ color: "var(--c-muted)" }}>
            {kpi.title}
          </div>
          <div className="font-display mt-1.5 text-[26px] font-bold leading-none text-slate-900">
            {kpi.value}
          </div>
        </div>
        <Sparkline data={kpi.sparkline} positive={kpi.isPositive} />
      </div>
      <div
        className="mt-3 inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[12px] font-semibold"
        style={{
          color: kpi.isPositive ? "var(--c-emerald)" : "var(--c-rose)",
          background: kpi.isPositive
            ? "rgba(16,185,129,0.1)"
            : "rgba(244,63,107,0.1)",
        }}
      >
        <TrendingUp size={13} /> {kpi.delta}
      </div>
    </div>
  );
}

export function DashboardMetrics({ kpis, isLoading }: { kpis: KpiTile[], isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 cadence-rise" style={{ animationDelay: "40ms" }}>
      {kpis.map((k, i) => (
        <KpiCard key={i} kpi={k} />
      ))}
      {isLoading &&
        !kpis.length &&
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[132px] rounded-2xl bg-white"
            style={{ border: "1px solid var(--c-border)" }}
          />
        ))}
    </div>
  );
}
