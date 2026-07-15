// Module 6 — lead growth chart. Backed by GET /intelligence/lead-trend.
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LeadTrendPoint } from "@/lib/intel-types";

export function LeadGrowthChart({ data }: { data: LeadTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px]" style={{ color: "var(--c-muted)" }}>
        Not enough lead data yet to chart a trend.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--c-emerald)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--c-emerald)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--c-muted)" }}
            dy={10}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--c-muted)" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--c-border)",
              boxShadow: "var(--c-shadow-md)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
          <Area type="monotone" dataKey="leads" name="Leads" stroke="var(--chart-1)" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
          <Area type="monotone" dataKey="customers" name="Customers" stroke="var(--c-emerald)" strokeWidth={2} fillOpacity={1} fill="url(#colorCustomers)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
