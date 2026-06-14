import { Link } from "wouter";
import { ArrowUpRight, Megaphone } from "lucide-react";
import type { CampaignSummary } from "@workspace/api-client-react";
import { ModuleCard } from "./Shared";
import { fmtMoney } from "@/lib/format";

export function CampaignCommandCenter({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <ModuleCard title="Campaign Command Center" actionLabel="View all" actionHref="/campaigns" icon={Megaphone} accent="var(--c-violet)">
      <div className="flex flex-col gap-2">
        {campaigns.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-[var(--c-surface-2)] border border-transparent hover:border-[var(--c-border)]"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white shadow-sm"
              style={{ background: c.ownerColor ?? "linear-gradient(135deg,#16a34a,#166534)" }}
            >
              {c.owner.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13.5px] font-semibold">{c.name}</span>
                <span
                  className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${c.statusColor}1a`, color: c.statusColor }}
                >
                  {c.status}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--c-surface-3)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.progress}%`,
                      background: "linear-gradient(90deg,var(--c-brand),var(--c-violet))",
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
                  {c.progress}%
                </span>
              </div>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <div className="text-[13px] font-semibold">{fmtMoney(c.budgetSpent)}</div>
              <div className="text-[11px]" style={{ color: "var(--c-muted)" }}>
                of {fmtMoney(c.budgetTotal)}
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--c-brand)" }}
            />
          </Link>
        ))}
      </div>
    </ModuleCard>
  );
}
