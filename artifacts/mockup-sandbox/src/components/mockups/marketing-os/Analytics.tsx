import { AppLayout } from "./_shared/AppLayout";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const KPI_DATA = [
  { label: "Total Revenue", value: "$482.4K", change: "+14.2%", trend: "up" },
  { label: "Marketing Qualified Leads", value: "2,845", change: "+8.1%", trend: "up" },
  { label: "Average ROAS", value: "3.4x", change: "-2.1%", trend: "down" },
  { label: "Website Traffic", value: "145.2K", change: "+24.5%", trend: "up" },
];

const REVENUE_DATA = [
  { name: "Week 1", revenue: 85000, target: 80000 },
  { name: "Week 2", revenue: 92000, target: 82000 },
  { name: "Week 3", revenue: 115000, target: 85000 },
  { name: "Week 4", revenue: 135000, target: 88000 },
  { name: "Week 5", revenue: 154000, target: 90000 },
];

const CHANNEL_DATA = [
  { name: "Paid Search", roas: 4.2 },
  { name: "Paid Social", roas: 3.1 },
  { name: "Email", roas: 5.4 },
  { name: "Display", roas: 1.8 },
  { name: "Affiliate", roas: 2.5 },
];

const TRAFFIC_DATA = [
  { name: "Organic", value: 45, color: "var(--c-brand)" },
  { name: "Direct", value: 25, color: "var(--c-violet)" },
  { name: "Paid", value: 20, color: "var(--c-sky)" },
  { name: "Social", value: 10, color: "var(--c-amber)" },
];

const FUNNEL_DATA = [
  { stage: "Impressions", count: "1.2M", percent: 100 },
  { stage: "Website Visits", count: "145K", percent: 12 },
  { stage: "Leads Generated", count: "12.4K", percent: 1.03 },
  { stage: "MQLs", count: "2.8K", percent: 0.23 },
  { stage: "Closed Won", count: "482", percent: 0.04 },
];

export function Analytics() {
  return (
    <AppLayout
      active="analytics"
      title="Analytics Overview"
      subtitle="Last 30 Days: Oct 1 - Oct 31, 2024"
      actions={
        <>
          <button
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors"
            style={{
              background: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
              color: "var(--c-ink-soft)",
            }}
          >
            <Calendar size={15} /> Last 30 Days <ChevronDown size={14} />
          </button>
          <button
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-[var(--c-surface-2)]"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              color: "var(--c-ink)",
            }}
          >
            <Filter size={15} /> Add Filter
          </button>
        </>
      }
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 cadence-rise" style={{ animationDelay: "50ms" }}>
          {KPI_DATA.map((kpi, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                boxShadow: "var(--c-shadow-sm)",
              }}
            >
              <div className="text-[13px] font-medium" style={{ color: "var(--c-muted)" }}>
                {kpi.label}
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div className="font-display text-2xl font-bold">{kpi.value}</div>
                <div
                  className={`flex items-center gap-1 text-[12px] font-semibold ${
                    kpi.trend === "up" ? "text-[var(--c-emerald)]" : "text-[var(--c-rose)]"
                  }`}
                >
                  {kpi.trend === "up" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {kpi.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights & Automated Report */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 cadence-rise" style={{ animationDelay: "100ms" }}>
          <div
            className="lg:col-span-2 relative overflow-hidden rounded-2xl p-6 text-white"
            style={{
              background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
              boxShadow: "0 12px 24px -12px rgba(79,70,229,0.5)",
            }}
          >
            <div
              className="cadence-ai-glow pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)", filter: "blur(24px)" }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-white/90">
                <Sparkles size={16} /> Cadence AI Insight
              </div>
              <h2 className="font-display mt-3 text-2xl font-bold leading-tight">
                Paid Search ROAS is underperforming, while Email drives highest LTV.
              </h2>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md flex-1">
                  <div className="text-[12px] font-semibold text-white/80">Observation</div>
                  <div className="mt-1 text-[13.5px] font-medium leading-snug">
                    "Q3 Enterprise Webinar" campaign on LinkedIn is consuming 40% of social budget with a 0.8x ROAS.
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md flex-1">
                  <div className="text-[12px] font-semibold text-white/80">Recommendation</div>
                  <div className="mt-1 text-[13.5px] font-medium leading-snug">
                    Reallocate $15k from LinkedIn to Email Nurture Sequence B, which has a 5.4x ROAS this month.
                  </div>
                </div>
              </div>
              <button className="mt-5 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-[var(--c-brand)] transition-opacity hover:opacity-90 shadow-sm">
                Apply Recommended Changes
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-sm)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-bold" style={{ color: "var(--c-ink)" }}>
                Automated Reports
              </div>
              <button style={{ color: "var(--c-muted)" }}>
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 flex-1">
              {[
                { name: "Weekly Executive Summary", time: "Every Monday, 8AM" },
                { name: "Paid Performance Deep Dive", time: "Every 1st of Month" },
              ].map((report, i) => (
                <div
                  key={i}
                  className="group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors hover:bg-[var(--c-surface-2)]"
                  style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold" style={{ color: "var(--c-ink)" }}>
                      {report.name}
                    </div>
                    <div className="mt-0.5 truncate text-[11px]" style={{ color: "var(--c-muted)" }}>
                      {report.time}
                    </div>
                  </div>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    style={{ border: "1px solid var(--c-border)", color: "var(--c-ink-soft)" }}
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-4 w-full rounded-xl py-2 text-[13px] font-semibold transition-colors hover:bg-[var(--c-bg)]"
              style={{
                background: "var(--c-surface-2)",
                border: "1px dashed var(--c-border-strong)",
                color: "var(--c-brand)",
              }}
            >
              + Create New Report
            </button>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 cadence-rise" style={{ animationDelay: "150ms" }}>
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-sm)",
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                  Revenue vs Target
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                  Cumulative revenue generated from attributed campaigns.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[12px] font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: "var(--c-brand)" }} /> Revenue
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: "var(--c-border-strong)" }} /> Target
                </div>
              </div>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--c-brand)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--c-brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--c-muted)" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--c-muted)" }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--c-border)",
                      boxShadow: "var(--c-shadow-md)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="var(--c-border-strong)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--c-brand)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-sm)",
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                  ROAS by Channel
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                  Return on ad spend across active marketing channels.
                </p>
              </div>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHANNEL_DATA} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--c-border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--c-ink-soft)", fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--c-bg)" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--c-border)",
                      boxShadow: "var(--c-shadow-md)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="roas" radius={[0, 4, 4, 0]} barSize={24}>
                    {CHANNEL_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.roas > 3 ? "var(--c-violet)" : "var(--c-brand-50)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 cadence-rise" style={{ animationDelay: "200ms" }}>
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-sm)",
            }}
          >
            <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
              Traffic Sources
            </h3>
            <div className="h-[220px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={TRAFFIC_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {TRAFFIC_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--c-border)",
                      boxShadow: "var(--c-shadow-md)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {TRAFFIC_DATA.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                  <div className="text-[12px] font-medium text-[var(--c-ink-soft)]">{item.name}</div>
                  <div className="ml-auto text-[12px] font-bold text-[var(--c-ink)]">{item.value}%</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-sm)",
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                  Conversion Funnel
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                  Lead progression through the marketing pipeline.
                </p>
              </div>
            </div>
            <div className="space-y-4 mt-8">
              {FUNNEL_DATA.map((stage, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-[120px] shrink-0 text-right text-[13px] font-semibold text-[var(--c-ink-soft)]">
                    {stage.stage}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-7 w-full overflow-hidden rounded-r-lg bg-[var(--c-bg)]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-lg transition-all duration-1000"
                        style={{
                          width: `${Math.max(stage.percent, 2)}%`,
                          background: `linear-gradient(90deg, var(--c-brand) 0%, var(--c-violet) 100%)`,
                          opacity: 1 - i * 0.15,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-[80px] shrink-0 text-left">
                    <div className="font-display text-[14px] font-bold text-[var(--c-ink)]">
                      {stage.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
