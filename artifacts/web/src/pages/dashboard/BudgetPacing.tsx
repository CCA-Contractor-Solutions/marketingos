import { ModuleCard, ProgressRing } from "./Shared";
import { budgetPacing } from "./sampleData";
import { fmtMoney } from "@/lib/format";

export function BudgetPacing() {
  return (
    <ModuleCard title="Budget Pacing">
      <div className="flex items-center gap-6 p-2">
        <div className="relative flex items-center justify-center shrink-0">
          <ProgressRing progress={budgetPacing.percent} size={80} strokeWidth={8} color="var(--c-brand)" />
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-xl font-bold leading-none text-slate-800">{budgetPacing.percent}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Spent</div>
            <div className="text-[16px] font-bold text-slate-800">{fmtMoney(budgetPacing.spent)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Remaining</div>
            <div className="text-[16px] font-bold text-emerald-600">{fmtMoney(budgetPacing.remaining)}</div>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}
