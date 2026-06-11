import { useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCampaign,
  useApproveCampaign,
  getGetCampaignQueryKey,
} from "@workspace/api-client-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Image as ImageIcon,
  FileText,
  Video,
  Link2,
  Activity,
  CheckSquare,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  PlayCircle,
  MessageSquare,
  Globe,
} from "lucide-react";

function channelIcon(channel: string) {
  switch (channel) {
    case "Instagram":
      return <ImageIcon size={14} />;
    case "TikTok":
      return <Video size={14} />;
    case "YouTube":
      return <PlayCircle size={14} />;
    case "Email":
      return <MessageSquare size={14} />;
    case "Paid Search":
      return <Globe size={14} />;
    default:
      return <Globe size={14} />;
  }
}

function assetIcon(type: string) {
  switch (type) {
    case "video":
      return <Video size={18} />;
    case "design":
      return <ImageIcon size={18} />;
    case "doc":
      return <FileText size={18} />;
    default:
      return <Link2 size={18} />;
  }
}

export default function CampaignDetail() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const { data: c, isLoading, isError } = useGetCampaign(id);
  const approve = useApproveCampaign({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(id) });
      },
    },
  });

  const isApproved = c?.status === "approved";

  const actions = c ? (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium"
        style={{
          background: isApproved ? "var(--c-emerald)" : "var(--c-amber)",
          color: "white",
        }}
      >
        {isApproved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        {isApproved ? "Approved" : "Pending Approval"}
      </div>

      {!isApproved && (
        <button
          onClick={() => approve.mutate({ id })}
          disabled={approve.isPending}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))",
            boxShadow: "0 8px 18px -8px rgba(79,70,229,0.8)",
          }}
        >
          <CheckCircle2 size={16} /> {approve.isPending ? "Approving…" : "Approve"}
        </button>
      )}

      <button
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5"
        style={{ color: "var(--c-ink-soft)" }}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  ) : undefined;

  if (isLoading) {
    return (
      <AppLayout active="campaigns" title="Campaign">
        <PageLoading />
      </AppLayout>
    );
  }

  if (isError || !c) {
    return (
      <AppLayout active="campaigns" title="Campaign">
        <PageError message="Campaign not found." />
      </AppLayout>
    );
  }

  const spentPct = (c.budgetSpent / c.budgetTotal) * 100;

  return (
    <AppLayout active="campaigns" title={c.name} subtitle={c.subtitle} actions={actions}>
      <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 lg:space-y-8 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-8">
            {/* Goals & Audience */}
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 cadence-rise" style={{ animationDelay: "50ms" }}>
              <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                <div className="flex items-center gap-2 mb-4 text-[14px] font-semibold">
                  <Target size={16} style={{ color: "var(--c-brand)" }} /> Goals & Objectives
                </div>
                <ul className="space-y-3">
                  {c.goals.map((goal, i) => (
                    <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed" style={{ color: "var(--c-ink-soft)" }}>
                      <div className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--c-brand)" }} />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                <div className="flex items-center gap-2 mb-4 text-[14px] font-semibold">
                  <Users size={16} style={{ color: "var(--c-violet)" }} /> Target Personas
                </div>
                <div className="space-y-4">
                  {c.personas.map((persona, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}>
                      <div className="font-semibold text-[13px]">{persona.name}</div>
                      <div className="mt-0.5 text-[12.5px] leading-snug" style={{ color: "var(--c-muted)" }}>{persona.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Channels & Timeline */}
            <div className="rounded-2xl p-6 cadence-rise" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "100ms" }}>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <div className="text-[14px] font-semibold mb-4">Channels</div>
                  <div className="flex flex-wrap gap-2">
                    {c.channels.map((channel) => (
                      <div key={channel} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-ink-soft)" }}>
                        {channelIcon(channel)}
                        {channel}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-px bg-[var(--c-border)] hidden sm:block" />

                <div className="flex-1">
                  <div className="text-[14px] font-semibold mb-4">Timeline</div>
                  <div className="flex items-center justify-between text-[13px]">
                    <div>
                      <div style={{ color: "var(--c-muted)" }} className="text-[11.5px] mb-1 uppercase tracking-wider font-semibold">Start</div>
                      <div className="font-medium">{c.startDate}</div>
                    </div>
                    <div className="flex-1 mx-4 h-px border-t border-dashed" style={{ borderColor: "var(--c-border-strong)" }} />
                    <div className="text-right">
                      <div style={{ color: "var(--c-muted)" }} className="text-[11.5px] mb-1 uppercase tracking-wider font-semibold">End</div>
                      <div className="font-medium">{c.endDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="cadence-rise" style={{ animationDelay: "150ms" }}>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="font-display text-[16px] font-bold">Campaign Targets</div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {c.kpis.map((kpi, i) => (
                  <div key={i} className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                    <div className="text-[12.5px] font-medium" style={{ color: "var(--c-ink-soft)" }}>{kpi.label}</div>
                    <div className="my-3 flex items-baseline gap-2">
                      <div className="font-display text-[22px] font-bold">{kpi.current}</div>
                      <div className="text-[12px] font-medium" style={{ color: "var(--c-muted)" }}>/ {kpi.target}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span style={{ color: kpi.trend.startsWith("+") && kpi.progress !== 100 ? "var(--c-emerald)" : "var(--c-ink-soft)" }}>
                          {kpi.trend}
                        </span>
                        <span style={{ color: "var(--c-muted)" }}>{kpi.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-bg)]">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${kpi.progress}%`,
                            background: kpi.progress >= 100 ? "var(--c-emerald)" : "linear-gradient(90deg, var(--c-brand), var(--c-violet))",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div className="cadence-rise" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="font-display text-[16px] font-bold">Creative Assets</div>
                <button className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70" style={{ color: "var(--c-brand-600)" }}>
                  <Plus size={14} /> Add Asset
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                {c.assets.map((asset, i) => (
                  <div key={asset.id} className="flex items-center gap-4 p-3.5 transition-colors hover:bg-[var(--c-surface-2)]" style={{ borderBottom: i !== c.assets.length - 1 ? "1px solid var(--c-border)" : "none" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--c-bg)", color: "var(--c-ink-soft)" }}>
                      {assetIcon(asset.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold truncate">{asset.name}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--c-muted)" }}>{asset.size} • Uploaded {asset.date}</div>
                    </div>
                    <button className="h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors hover:bg-[var(--c-bg)]" style={{ color: "var(--c-ink)" }}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="cadence-rise" style={{ animationDelay: "250ms" }}>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="font-display text-[16px] font-bold">Linked Tasks</div>
              </div>
              <div className="rounded-2xl p-2" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                {c.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-[var(--c-surface-2)] group cursor-pointer">
                    <button
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-[var(--c-border-strong)] bg-white text-transparent transition-all hover:border-[var(--c-brand)] group-hover:bg-[var(--c-bg)]"
                      style={task.status === "completed" ? { background: "var(--c-brand)", borderColor: "var(--c-brand)", color: "white" } : {}}
                    >
                      <CheckSquare size={12} strokeWidth={3} />
                    </button>
                    <div
                      className="flex-1 text-[13px] font-medium transition-all"
                      style={{ color: task.status === "completed" ? "var(--c-muted)" : "var(--c-ink)", textDecoration: task.status === "completed" ? "line-through" : "none" }}
                    >
                      {task.title}
                    </div>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--c-bg)] text-[10px] font-bold text-[var(--c-ink-soft)] border border-[var(--c-border)]">
                      {task.assignee}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:space-y-8">
            {/* Cadence AI */}
            <div className="cadence-rise relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))", boxShadow: "0 12px 24px -8px rgba(79,70,229,0.35)", animationDelay: "50ms" }}>
              <div className="cadence-ai-glow pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full" style={{ background: "rgba(255,255,255,0.2)", filter: "blur(20px)" }} />
              <div className="relative">
                <div className="flex items-center gap-2 text-[14px] font-bold mb-4">
                  <Sparkles size={16} /> Cadence AI
                </div>
                <div className="space-y-3 mb-5">
                  {c.insights.map((insight) => (
                    <div key={insight.id} className="rounded-xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
                      <div className="flex gap-2.5">
                        {insight.severity === "alert" ? (
                          <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#fb6f5a]" />
                        ) : (
                          <Activity size={15} className="shrink-0 mt-0.5 text-[#f5a524]" />
                        )}
                        <div>
                          <div className="text-[13px] font-semibold">{insight.title}</div>
                          <div className="mt-1 text-[12px] text-white/80 leading-snug">{insight.body}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white text-[var(--c-brand)] py-2 text-[13px] font-bold transition-all hover:bg-white/90">
                  Generate assets <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="cadence-rise rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "100ms" }}>
              <div className="font-display text-[15px] font-bold mb-4">Budget Pacing</div>
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <div className="text-[12px] font-semibold text-[var(--c-ink-soft)] mb-0.5">Spent</div>
                  <div className="font-display text-[20px] font-bold">${c.budgetSpent.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-[var(--c-muted)] mb-0.5">Total Budget</div>
                  <div className="text-[14px] font-semibold text-[var(--c-ink-soft)]">${c.budgetTotal.toLocaleString()}</div>
                </div>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--c-bg)] mb-3">
                <div className="absolute left-0 top-0 h-full rounded-full bg-[var(--c-brand)]" style={{ width: `${spentPct}%` }} />
              </div>
              <div className="text-[12px] text-[var(--c-ink-soft)] leading-snug">
                {spentPct.toFixed(0)}% of total budget spent to date.
              </div>
            </div>

            {/* Activity */}
            <div className="cadence-rise rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "150ms" }}>
              <div className="font-display text-[15px] font-bold mb-5">Activity</div>
              <div className="relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--c-border)] space-y-5">
                {c.activity.map((item) => (
                  <div key={item.id} className="relative flex gap-3">
                    <div
                      className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-4 ring-white"
                      style={{ background: item.isAI ? "linear-gradient(135deg,var(--c-brand),var(--c-violet))" : item.color }}
                    >
                      {item.isAI ? <Sparkles size={12} /> : item.avatar}
                    </div>
                    <div className="flex-1 pt-1.5 pb-2">
                      <div className="text-[13px] leading-snug">
                        <span className="font-bold">{item.user}</span>{" "}
                        <span style={{ color: "var(--c-ink-soft)" }}>{item.action}</span>{" "}
                        <span className="font-semibold">{item.target}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
