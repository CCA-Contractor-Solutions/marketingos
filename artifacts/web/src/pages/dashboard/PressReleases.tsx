import { ModuleCard } from "./Shared";
import { pressReleases } from "./sampleData";
import { Link } from "wouter";
import { FileText, Newspaper } from "lucide-react";

export function PressReleases() {
  return (
    <ModuleCard title="Press Releases" actionLabel="Draft new" actionHref="/assistant" icon={Newspaper} accent="var(--c-sky)">
      <div className="space-y-3">
        {pressReleases.map(pr => (
          <div key={pr.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <FileText size={16} className="text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-800 truncate">{pr.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{pr.date}</div>
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${
              pr.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
              pr.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {pr.status}
            </div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
