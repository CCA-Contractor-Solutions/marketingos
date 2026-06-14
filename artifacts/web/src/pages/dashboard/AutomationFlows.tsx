import { ModuleCard } from "./Shared";
import { automationFlows } from "./sampleData";
import { Workflow } from "lucide-react";

export function AutomationFlows() {
  return (
    <ModuleCard title="Automation Flows" actionLabel="Manage" actionHref="/campaigns" icon={Workflow} accent="var(--c-indigo)">
      <div className="flex flex-col gap-3">
        {automationFlows.map((f) => {
          const active = f.status === "Active";
          return (
            <div key={f.id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 text-[13px] font-semibold text-slate-800 truncate">{f.name}</div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color: active ? "var(--c-emerald)" : "var(--c-muted)",
                    background: active ? "rgba(16,185,129,0.12)" : "var(--c-surface-3)",
                  }}
                >
                  {f.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
                  {f.contacts.toLocaleString()} in flow
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${f.openRate}%`, background: "linear-gradient(90deg, var(--c-indigo), var(--c-brand))" }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-slate-700">{f.openRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModuleCard>
  );
}
