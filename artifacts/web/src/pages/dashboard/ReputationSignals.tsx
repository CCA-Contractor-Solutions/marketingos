import { ModuleCard, MiniBars } from "./Shared";
import { reputationSignals } from "./sampleData";
import { Star } from "lucide-react";

export function ReputationSignals() {
  return (
    <ModuleCard title="Reputation Signals" actionLabel="View all" actionHref="/analytics">
      <div className="flex items-center gap-6 h-full">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            <Star fill="currentColor" size={20} />
          </div>
          <div className="font-display text-[32px] font-bold text-slate-800 leading-none">{reputationSignals.rating}</div>
          <div className="text-[12px] text-slate-500 font-medium mt-1">{reputationSignals.reviews} Reviews</div>
        </div>
        <div className="flex-1 h-16">
          <MiniBars data={reputationSignals.trend} color="var(--c-brand)" />
        </div>
      </div>
    </ModuleCard>
  );
}
