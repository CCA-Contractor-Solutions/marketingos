import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Globe,
  Heart,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { KpiTile } from "@workspace/api-client-react";

const KPI_ACCENTS = [
  "var(--c-brand)",
  "var(--c-violet)",
  "var(--c-emerald)",
  "var(--c-amber)",
  "var(--c-sky)",
  "var(--c-rose)",
];

function kpiIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (
    t.includes("revenue") ||
    t.includes("pipeline") ||
    t.includes("spend") ||
    t.includes("cost") ||
    t.includes("budget")
  )
    return DollarSign;
  if (t.includes("lead") || t.includes("qualified") || t.includes("mql"))
    return Users;
  if (t.includes("roas") || t.includes("return") || t.includes("roi"))
    return TrendingUp;
  if (t.includes("conversion") || t.includes("rate")) return Target;
  if (
    t.includes("traffic") ||
    t.includes("visit") ||
    t.includes("session") ||
    t.includes("web")
  )
    return Globe;
  if (t.includes("engage") || t.includes("social") || t.includes("follow"))
    return Heart;
  return BarChart3;
}

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

export function KpiCard({ kpi, index = 0 }: { kpi: KpiTile; index?: number }) {
  const accent = KPI_ACCENTS[index % KPI_ACCENTS.length];
  const Icon = kpiIcon(kpi.title);
  return (
    <div
      className="cadence-card relative overflow-hidden rounded-2xl bg-white p-5"
      style={{
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{
              background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #0b1224))`,
              boxShadow: `0 4px 10px -3px color-mix(in srgb, ${accent} 70%, transparent)`,
            }}
          >
            <Icon size={17} strokeWidth={2.4} />
          </span>
          <div
            className="max-w-[110px] text-[12.5px] font-medium leading-tight"
            style={{ color: "var(--c-muted)" }}
          >
            {kpi.title}
          </div>
        </div>
        <Sparkline data={kpi.sparkline} positive={kpi.isPositive} />
      </div>
      <div className="font-display relative mt-3.5 text-[26px] font-bold leading-none text-slate-900">
        {kpi.value}
      </div>
      <div
        className="relative mt-3 inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[12px] font-semibold"
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
        <KpiCard key={i} kpi={k} index={i} />
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
