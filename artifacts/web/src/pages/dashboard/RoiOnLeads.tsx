import { ModuleCard } from "./Shared";
import { roiOnLeads } from "./sampleData";
import { TrendingUp } from "lucide-react";

export function RoiOnLeads() {
  return (
    <ModuleCard title="ROI on Leads" actionLabel="View all" actionHref="/analytics" icon={TrendingUp} accent="var(--c-brand)">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Cost per Lead</div>
          <div className="text-[18px] font-bold text-slate-800">{roiOnLeads.cpl}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Conversion Rate</div>
          <div className="text-[18px] font-bold text-slate-800">{roiOnLeads.conversion}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Influenced Revenue</div>
          <div className="text-[18px] font-bold text-emerald-600">{roiOnLeads.revenue}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Overall ROI</div>
          <div className="text-[18px] font-bold text-emerald-600">{roiOnLeads.roi}</div>
        </div>
      </div>
    </ModuleCard>
  );
}
