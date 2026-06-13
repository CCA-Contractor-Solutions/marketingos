import { ModuleCard, ProgressRing } from "./Shared";
import { adHealth } from "./sampleData";
import { Activity } from "lucide-react";

export function AdHealth() {
  return (
    <ModuleCard title="Ad Health" actionLabel="Diagnose" actionHref="/assistant">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <ProgressRing progress={adHealth.score} size={48} strokeWidth={5} color="var(--c-brand)" />
          <div>
            <div className="text-[14px] font-bold text-slate-800">Overall Health: {adHealth.score}/100</div>
            <div className="text-[12px] text-slate-500 font-medium">ROAS is performing well</div>
          </div>
        </div>
        <div className="space-y-2">
          {adHealth.adSets.map((ad, i) => (
            <div key={i} className="flex items-center justify-between text-[12px]">
              <div className="font-medium text-slate-700 truncate w-32">{ad.name}</div>
              <div className="text-slate-500">CTR: {ad.ctr}</div>
              <div className="font-bold text-slate-800">{ad.roas}</div>
              <Activity size={14} className={ad.status === 'Warning' ? 'text-amber-500' : 'text-emerald-500'} />
            </div>
          ))}
        </div>
      </div>
    </ModuleCard>
  );
}
