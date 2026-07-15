// Module 6 — revenue attribution chart. Backed by GET /attribution/summary
// (byChannel bucket — grouped bar of revenue per channel).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney } from "@/lib/format";
import type { AttributionSummary } from "@/lib/intel-types";

export function RevenueAttributionChart({ data }: { data: AttributionSummary | undefined }) {
  const rows = data?.byChannel ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px]" style={{ color: "var(--c-muted)" }}>
        No attributed revenue yet.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
          <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--c-muted)" }} dy={10} />
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
          <Bar dataKey="revenue" name="Attributed revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
