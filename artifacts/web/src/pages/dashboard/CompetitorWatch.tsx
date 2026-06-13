import { ModuleCard } from "./Shared";
import { competitorWatch } from "./sampleData";
import { Eye } from "lucide-react";

export function CompetitorWatch() {
  return (
    <ModuleCard title="Competitor Watch" icon={Eye} accent="var(--c-rose)">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Competitor</th>
              <th className="pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Visibility</th>
              <th className="pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Rank Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {competitorWatch.map((c, i) => (
              <tr key={i}>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[13px] font-semibold text-slate-700">{c.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-[12px] font-medium text-slate-600">{c.visibility}</td>
                <td className={`py-2.5 text-[12px] font-bold text-right ${c.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {c.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleCard>
  );
}
