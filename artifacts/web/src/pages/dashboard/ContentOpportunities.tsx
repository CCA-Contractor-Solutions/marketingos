import { ModuleCard } from "./Shared";
import { contentOpportunities } from "./sampleData";
import { Search, FileText } from "lucide-react";

export function ContentOpportunities() {
  return (
    <ModuleCard title="Content Opportunities" actionLabel="Draft" actionHref="/assistant" icon={FileText} accent="var(--c-emerald)">
      <div className="space-y-3">
        {contentOpportunities.map((c, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Search size={16} className="text-slate-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-800 leading-snug">{c.topic}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Vol: {c.searchVolume}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  c.opportunity === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {c.opportunity} Opp
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
