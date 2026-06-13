import { ModuleCard } from "./Shared";
import { brainstormCorner } from "./sampleData";
import { Lightbulb, Plus } from "lucide-react";
import { Link } from "wouter";

export function BrainstormCorner() {
  return (
    <ModuleCard title="Brainstorm Corner" icon={Lightbulb} accent="#a855f7">
      <div className="flex flex-wrap gap-2 mb-4">
        {brainstormCorner.map(idea => (
          <div key={idea.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
            <Lightbulb size={12} className="text-purple-500" />
            <span className="text-[12px] font-medium text-purple-900">{idea.text}</span>
            <span className="text-[10px] font-bold text-purple-400 bg-white px-1.5 rounded-full">{idea.count}</span>
          </div>
        ))}
      </div>
      <Link href="/assistant" className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
        <Plus size={16} /> Generate More Ideas
      </Link>
    </ModuleCard>
  );
}
