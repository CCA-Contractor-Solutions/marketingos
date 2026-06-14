import { ModuleCard } from "./Shared";
import { Link } from "wouter";
import { Mail, Edit3 } from "lucide-react";

export function EmailBuilder() {
  return (
    <ModuleCard title="Email Builder" icon={Mail} accent="var(--c-violet)">
      <div className="flex flex-col items-center justify-center text-center p-6 h-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
          <Mail size={24} />
        </div>
        <h3 className="text-[14px] font-semibold text-slate-800 mb-1">Create an Email</h3>
        <p className="text-[12px] text-slate-500 mb-4 max-w-[200px]">Use the AI Copilot to draft a compliance newsletter.</p>
        <Link href="/assistant" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-slate-800 transition-colors">
          <Edit3 size={14} /> Design Email
        </Link>
      </div>
    </ModuleCard>
  );
}
