import { ModuleCard, MiniBars } from "./Shared";
import { socialPulse } from "./sampleData";
import { Video } from "lucide-react";

export function SocialPulse() {
  return (
    <ModuleCard title="Social Pulse" actionLabel="View all" actionHref="/analytics" icon={Video} accent="var(--c-pink)">
      <div className="flex flex-col gap-3">
        {socialPulse.map((p) => (
          <div key={p.platform} className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-800 truncate">{p.platform}</div>
              <div className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>{p.views} views</div>
            </div>
            <div className="w-16 shrink-0">
              <MiniBars data={p.trend} height={24} color={p.color} />
            </div>
            <span
              className="shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-bold"
              style={{ color: "var(--c-emerald)", background: "rgba(16,185,129,0.1)" }}
            >
              {p.delta}
            </span>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
