import { Link } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import type {
  KpiTile,
  CampaignSummary,
  Milestone,
  Insight,
  AttentionItem,
  TaskRollup,
} from "@workspace/api-client-react";
import { AppLayout, PageError } from "@/components/AppLayout";
import { CcaLogo } from "@/components/CcaLogo";
import { fmtMoney } from "@/lib/format";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  CalendarDays,
  Flag,
  Users,
  Circle,
} from "lucide-react";

const MILESTONE_ICON: Record<string, typeof Flag> = {
  review: CheckCircle2,
  launch: Flag,
  meeting: Users,
  deadline: Clock,
};

const INSIGHT_STYLE: Record<
  string,
  { bg: string; border: string; icon: typeof Sparkles; color: string }
> = {
  warning: {
    bg: "rgba(245,165,36,0.08)",
    border: "rgba(245,165,36,0.25)",
    icon: AlertTriangle,
    color: "var(--c-amber)",
  },
  alert: {
    bg: "rgba(244,63,107,0.07)",
    border: "rgba(244,63,107,0.22)",
    icon: AlertTriangle,
    color: "var(--c-rose)",
  },
  info: {
    bg: "var(--c-brand-50)",
    border: "rgba(37,99,235,0.18)",
    icon: Sparkles,
    color: "var(--c-brand)",
  },
};

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

function KpiCard({ kpi }: { kpi: KpiTile }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12.5px] font-medium" style={{ color: "var(--c-muted)" }}>
            {kpi.title}
          </div>
          <div className="font-display mt-1.5 text-[26px] font-bold leading-none">
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
            ? "rgba(24,179,134,0.1)"
            : "rgba(244,63,107,0.1)",
        }}
      >
        <TrendingUp size={13} /> {kpi.delta}
      </div>
    </div>
  );
}

function CampaignRow({ c }: { c: CampaignSummary }) {
  return (
    <Link
      href={`/campaigns/${c.id}`}
      className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-[var(--c-surface-2)]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
        style={{ background: c.ownerColor ?? "linear-gradient(135deg,#2563eb,#1e40af)" }}
      >
        {c.owner
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold">{c.name}</span>
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: `${c.statusColor}1a`, color: c.statusColor }}
          >
            {c.status}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--c-bg)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${c.progress}%`,
                background: "linear-gradient(90deg,var(--c-brand),var(--c-violet))",
              }}
            />
          </div>
          <span className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
            {c.progress}%
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-[13px] font-semibold">{fmtMoney(c.budgetSpent)}</div>
        <div className="text-[11px]" style={{ color: "var(--c-muted)" }}>
          of {fmtMoney(c.budgetTotal)}
        </div>
      </div>
      <ArrowUpRight
        size={16}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--c-brand)" }}
      />
    </Link>
  );
}

function MilestoneRow({
  m,
  isLast,
}: {
  m: Milestone;
  isLast: boolean;
}) {
  const Icon = MILESTONE_ICON[m.type] ?? Circle;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--c-brand-50)", color: "var(--c-brand)" }}
        >
          <Icon size={15} />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1" style={{ background: "var(--c-border)" }} />
        )}
      </div>
      <div className="pb-5">
        <div className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
          {m.date}
        </div>
        <div className="mt-0.5 text-[13px] font-semibold">{m.title}</div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const s = INSIGHT_STYLE[insight.severity] ?? INSIGHT_STYLE.info;
  const Icon = s.icon;
  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={16} style={{ color: s.color }} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold">{insight.title}</div>
          <div className="mt-1 text-[12px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>
            {insight.body}
          </div>
        </div>
      </div>
    </div>
  );
}

const ROLLUP: { key: keyof TaskRollup; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "var(--c-muted)" },
  { key: "inProgress", label: "In Progress", color: "var(--c-sky)" },
  { key: "inReview", label: "In Review", color: "var(--c-violet)" },
  { key: "done", label: "Done", color: "var(--c-emerald)" },
  { key: "overdue", label: "Overdue", color: "var(--c-rose)" },
  { key: "blocked", label: "Blocked", color: "var(--c-amber)" },
];

function AttentionRow({ a }: { a: AttentionItem }) {
  const color = a.severity === "high" ? "var(--c-rose)" : "var(--c-amber)";
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium">{a.title}</div>
      </div>
      <div className="shrink-0 text-[11px]" style={{ color: "var(--c-muted)" }}>
        {a.time}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboardSummary();

  return (
    <AppLayout
      active="dashboard"
      title="Command Center"
      subtitle="Good morning, Jessica — here's your marketing pulse"
    >
      {isError ? (
        <PageError />
      ) : (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
          {/* CCA hero */}
          <div
            className="cadence-rise relative overflow-hidden rounded-3xl px-8 py-10 text-white"
            style={{
              background: "linear-gradient(120deg, #090e18 0%, #1e3a8a 70%, #2563eb 100%)",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <div
              className="cadence-ai-glow pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full"
              style={{ background: "rgba(59,130,246,0.35)", filter: "blur(32px)" }}
            />
            <div className="relative flex items-center gap-6">
              <div className="hidden shrink-0 sm:block rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <CcaLogo size={56} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-blue-200">
                  <Sparkles size={14} /> Contractor Compliance Authority
                </div>
                <h2 className="font-display mt-2 text-[28px] font-bold leading-tight sm:text-[36px] tracking-tight">
                  Marketing Command Center
                </h2>
                <p className="mt-2 text-[15px] text-blue-100/90 font-medium">
                  Plan, launch, approve, and optimize every campaign in one place.
                </p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 cadence-rise"
            style={{ animationDelay: "40ms" }}
          >
            {(data?.kpis ?? []).map((k, i) => (
              <KpiCard key={i} kpi={k} />
            ))}
            {isLoading &&
              !data &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[132px] rounded-2xl"
                  style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
                />
              ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Campaigns + Milestones */}
            <div className="space-y-6 lg:col-span-2">
              <div
                className="rounded-2xl p-6 cadence-rise"
                style={{
                  animationDelay: "80ms",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-md)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-[18px] font-bold">Active Campaigns</h2>
                  <Link
                    href="/campaigns"
                    className="flex items-center gap-1 text-[12.5px] font-semibold"
                    style={{ color: "var(--c-brand)" }}
                  >
                    View all <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="flex flex-col gap-0.5">
                  {(data?.campaigns ?? []).map((c) => (
                    <CampaignRow key={c.id} c={c} />
                  ))}
                </div>
              </div>

              {/* Task rollup */}
              <div
                className="rounded-2xl p-6 cadence-rise"
                style={{
                  animationDelay: "120ms",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-md)",
                }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-display text-[18px] font-bold">Task Overview</h2>
                  <Link
                    href="/tasks"
                    className="flex items-center gap-1 text-[12.5px] font-semibold"
                    style={{ color: "var(--c-brand)" }}
                  >
                    Open board <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ROLLUP.map((r) => (
                    <div
                      key={r.key}
                      className="rounded-xl p-3"
                      style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: r.color }}
                        />
                        <span className="text-[11.5px] font-medium" style={{ color: "var(--c-muted)" }}>
                          {r.label}
                        </span>
                      </div>
                      <div className="font-display mt-1 text-[22px] font-bold">
                        {data?.taskRollup ? data.taskRollup[r.key] : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* AI insights */}
              <div
                className="rounded-2xl p-6 cadence-rise"
                style={{
                  animationDelay: "100ms",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-md)",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={18} style={{ color: "var(--c-brand)" }} />
                  <h2 className="font-display text-[16px] font-bold">CCA AI Insights</h2>
                </div>
                <div className="space-y-2.5">
                  {(data?.insights ?? []).map((ins) => (
                    <InsightCard key={ins.id} insight={ins} />
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div
                className="rounded-2xl p-6 cadence-rise"
                style={{
                  animationDelay: "140ms",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-md)",
                }}
              >
                <div className="mb-5 flex items-center gap-2">
                  <CalendarDays size={18} style={{ color: "var(--c-brand)" }} />
                  <h2 className="font-display text-[16px] font-bold">This Week's Milestones</h2>
                </div>
                <div>
                  {(data?.milestones ?? []).map((m, i) => (
                    <MilestoneRow
                      key={m.id}
                      m={m}
                      isLast={i === (data?.milestones.length ?? 0) - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Needs attention */}
              <div
                className="rounded-2xl p-6 cadence-rise"
                style={{
                  animationDelay: "160ms",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-md)",
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} style={{ color: "var(--c-amber)" }} />
                  <h2 className="font-display text-[16px] font-bold">Needs Attention</h2>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
                  {(data?.attention ?? []).map((a) => (
                    <AttentionRow key={a.id} a={a} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
