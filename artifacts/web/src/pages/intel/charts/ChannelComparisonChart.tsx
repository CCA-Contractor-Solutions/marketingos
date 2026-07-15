// Module 6 — channel comparison chart. Backed by GET /channels/intelligence.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney } from "@/lib/format";
import type { ChannelIntelligence } from "@/lib/intel-types";

export function ChannelComparisonChart({ data }: { data: ChannelIntelligence[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px]" style={{ color: "var(--c-muted)" }}>
        No channel performance data yet.
      </div>
    );
  }

  const chartData = data.slice(0, 8).map((c) => ({ name: c.channelName, revenue: c.revenue }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--c-border)" />
          <XAxis type="number" hide tickFormatter={(v: number) => fmtMoney(v)} />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            width={110}
            tick={{ fontSize: 12, fill: "var(--c-ink-soft)", fontWeight: 500 }}
          />
          <Tooltip
            formatter={(value: number) => fmtMoney(value)}
            cursor={{ fill: "var(--c-bg)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-md)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} barSize={20} fill="var(--chart-2)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
