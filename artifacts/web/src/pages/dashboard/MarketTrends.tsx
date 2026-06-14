import { ModuleCard } from "./Shared";
import { marketTrends } from "./sampleData";
import { BarChart3 } from "lucide-react";

export function MarketTrends() {
  return (
    <ModuleCard title="Market Trends" actionLabel="View report" actionHref="/analytics" icon={BarChart3} accent="var(--c-sky)">
      <div className="space-y-4">
        {marketTrends.map((t, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-[12px] font-medium text-slate-600 truncate">{t.label}</div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.value}%` }} />
            </div>
            <div className={`w-10 shrink-0 text-right text-[12px] font-bold ${t.delta.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.delta}
            </div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
