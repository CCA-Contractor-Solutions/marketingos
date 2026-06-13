import { ModuleCard } from "./Shared";
import { funnelQuality } from "./sampleData";
import { Filter } from "lucide-react";

export function FunnelQuality() {
  return (
    <ModuleCard title="Funnel Quality" icon={Filter} accent="var(--c-brand)">
      <div className="flex flex-col gap-2 mt-2">
        {funnelQuality.map((stage, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-24 text-[12px] font-semibold text-slate-600">{stage.stage}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded-r-full overflow-hidden relative">
              <div 
                className="h-full rounded-r-full flex items-center px-3"
                style={{ 
                  width: `${stage.percent}%`, 
                  background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                  minWidth: 'fit-content'
                }}
              >
                <span className="text-[11px] font-bold text-white shadow-sm">{stage.count}</span>
              </div>
            </div>
            <div className="w-12 text-right text-[12px] font-medium text-slate-500">{stage.percent}%</div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
