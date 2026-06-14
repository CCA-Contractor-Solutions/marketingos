import { ModuleCard } from "./Shared";
import { webinarsEvents } from "./sampleData";
import { CalendarClock, Users } from "lucide-react";

export function WebinarsEvents() {
  const { next, upcoming } = webinarsEvents;
  const pct = Math.round((next.registered / next.capacity) * 100);
  return (
    <ModuleCard title="Webinars & Events" actionLabel="Manage" actionHref="/campaigns" icon={CalendarClock} accent="var(--c-purple)">
      <div className="flex flex-col gap-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-purple)" }}>
              Up Next · {next.date}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Users size={12} /> {next.registered}/{next.capacity}
            </span>
          </div>
          <div className="mt-1.5 text-[14px] font-bold text-slate-800">{next.title}</div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--c-purple), var(--c-pink))" }} />
          </div>
          <div className="mt-1 text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>{pct}% of seats filled</div>
        </div>
        <div className="space-y-2">
          {upcoming.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
              <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-center shadow-sm">
                <span className="text-[12px] font-bold leading-none text-slate-800">{e.date.split(" ")[1]}</span>
                <span className="text-[8px] font-semibold uppercase" style={{ color: "var(--c-muted)" }}>{e.date.split(" ")[0]}</span>
              </div>
              <div className="min-w-0 flex-1 text-[12.5px] font-semibold text-slate-700 truncate">{e.title}</div>
              <span className="shrink-0 text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>{e.registered} reg.</span>
            </div>
          ))}
        </div>
      </div>
    </ModuleCard>
  );
}
