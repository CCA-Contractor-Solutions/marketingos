import { ModuleCard } from "./Shared";
import { awardCenter } from "./sampleData";
import { Trophy } from "lucide-react";

export function AwardCenter() {
  return (
    <ModuleCard title="Award Center" actionLabel="View all" actionHref="/collaboration" icon={Trophy} accent="var(--c-amber)">
      <div className="space-y-3">
        {awardCenter.map(award => (
          <div key={award.id} className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Trophy size={16} className="text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-amber-950 truncate">{award.name}</div>
              <div className="text-[11px] text-amber-700/80 mt-0.5">{award.org}</div>
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${
              award.status === 'Won' ? 'bg-amber-400 text-white shadow-sm' : 'bg-amber-100 text-amber-800'
            }`}>
              {award.status}
            </div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
