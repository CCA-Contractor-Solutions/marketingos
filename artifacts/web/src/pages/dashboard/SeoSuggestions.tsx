import { ModuleCard } from "./Shared";
import { seoSuggestions } from "./sampleData";

export function SeoSuggestions() {
  return (
    <ModuleCard title="SEO Suggestions" actionLabel="View all" actionHref="/assistant">
      <div className="space-y-3">
        {seoSuggestions.slice(0,3).map(s => (
          <div key={s.id} className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl">
            <div className="text-[13px] font-semibold text-slate-800">{s.title}</div>
            <div className="flex gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${s.impact === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                {s.impact} Impact
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600">
                {s.effort} Effort
              </span>
            </div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
