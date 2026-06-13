import { ModuleCard, ProgressRing } from "./Shared";
import { executiveHealth } from "./sampleData";
import { ShieldCheck } from "lucide-react";

export function ExecutiveHealth() {
  return (
    <ModuleCard title="Executive Marketing Health" actionLabel="View report" actionHref="/analytics" icon={ShieldCheck} accent="var(--c-emerald)">
      <div className="flex items-center gap-6">
        <div className="relative flex items-center justify-center shrink-0">
          <ProgressRing progress={executiveHealth.score} size={80} strokeWidth={8} color="var(--c-emerald)" />
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-2xl font-bold leading-none">{executiveHealth.score}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {executiveHealth.status}
            </span>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {executiveHealth.metrics.map((m, i) => (
              <div key={i}>
                <div className="text-[11px] text-slate-500 font-medium">{m.label}</div>
                <div className="text-[13px] font-bold">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}
