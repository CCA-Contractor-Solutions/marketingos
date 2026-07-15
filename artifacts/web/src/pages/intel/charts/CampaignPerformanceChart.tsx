// Module 6 — campaign performance chart. Backed by GET /campaign-intelligence.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney } from "@/lib/format";
import type { CampaignIntelligence } from "@/lib/intel-types";

export function CampaignPerformanceChart({ data }: { data: CampaignIntelligence[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px]" style={{ color: "var(--c-muted)" }}>
        No campaign performance data yet.
      </div>
    );
  }

  const chartData = [...data]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((c) => ({ name: c.objective || c.campaignId, revenue: c.revenue }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10.5, fill: "var(--c-muted)" }}
            dy={10}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={50}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--c-muted)" }} tickFormatter={(v: number) => fmtMoney(v)} />
          <Tooltip
            formatter={(value: number) => fmtMoney(value)}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-md)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
          <Bar dataKey="revenue" name="Revenue" fill="var(--chart-4)" radius={[6, 6, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
