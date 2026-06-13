import { ModuleCard } from "./Shared";
import { futurecast } from "./sampleData";
import { LineChart } from "lucide-react";

export function Futurecast() {
  return (
    <ModuleCard title="Futurecast" icon={LineChart} accent="#8b5cf6">
      <div className="grid grid-cols-2 gap-4 h-full content-center">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Est. Leads</div>
          <div className="text-[24px] font-display font-bold text-slate-800">{futurecast.leads.forecast}</div>
          <div className="text-[12px] font-semibold text-emerald-600 mt-1">{futurecast.leads.trend} vs last mo</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Est. Revenue</div>
          <div className="text-[24px] font-display font-bold text-slate-800">{futurecast.revenue.forecast}</div>
          <div className="text-[12px] font-semibold text-emerald-600 mt-1">{futurecast.revenue.trend} vs last mo</div>
        </div>
      </div>
    </ModuleCard>
  );
}
