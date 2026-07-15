// Module 6 — conversion funnel chart. Backed by GET /intelligence/funnel.
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtNumber } from "@/lib/format";
import type { FunnelStage } from "@/lib/intel-types";

const STAGE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--c-emerald)"];

export function ConversionFunnelChart({ data }: { data: FunnelStage[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px]" style={{ color: "var(--c-muted)" }}>
        No funnel data yet.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--c-border)" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="stage"
            type="category"
            axisLine={false}
            tickLine={false}
            width={110}
            tick={{ fontSize: 12, fill: "var(--c-ink-soft)", fontWeight: 500 }}
          />
          <Tooltip
            formatter={(value: number) => fmtNumber(value)}
            cursor={{ fill: "var(--c-bg)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-md)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
          <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]} barSize={26}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
