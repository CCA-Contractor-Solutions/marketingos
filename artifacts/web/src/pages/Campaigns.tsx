import { Link } from "wouter";
import { useListCampaigns } from "@workspace/api-client-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { fmtMoney } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";

export default function Campaigns() {
  const { data, isLoading, isError } = useListCampaigns();

  return (
    <AppLayout
      active="campaigns"
      title="Campaigns"
      subtitle="All active and upcoming marketing initiatives"
    >
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className="p-6 max-w-6xl mx-auto pb-20">
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 cadence-rise"
            style={{ animationDelay: "40ms" }}
          >
            {(data ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="group rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  boxShadow: "var(--c-shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                      style={{
                        background:
                          c.ownerColor ?? "linear-gradient(135deg,#2563eb,#1e40af)",
                      }}
                    >
                      {c.owner
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-display text-[15px] font-bold leading-tight">
                        {c.name}
                      </div>
                      <div className="mt-0.5 text-[12px]" style={{ color: "var(--c-muted)" }}>
                        {c.owner}
                      </div>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ background: `${c.statusColor}1a`, color: c.statusColor }}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--c-bg)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.progress}%`,
                        background:
                          "linear-gradient(90deg,var(--c-brand),var(--c-violet))",
                      }}
                    />
                  </div>
                  <span
                    className="text-[11.5px] font-semibold"
                    style={{ color: "var(--c-ink-soft)" }}
                  >
                    {c.progress}%
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {c.channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
                        style={{ background: "var(--c-bg)", color: "var(--c-ink-soft)" }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-right">
                    <div>
                      <div className="text-[13px] font-semibold">
                        {fmtMoney(c.budgetSpent)}
                        <span style={{ color: "var(--c-muted)" }}>
                          {" "}
                          / {fmtMoney(c.budgetTotal)}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--c-brand)" }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
