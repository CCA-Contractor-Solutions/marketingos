import { useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import {
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Calendar,
  Image as ImageIcon,
  FileText,
  Video,
  Link2,
  TrendingUp,
  Activity,
  CheckSquare,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  PlayCircle,
  BarChart,
  MessageSquare,
  Globe,
  Smartphone,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy data
const CAMPAIGN = {
  name: "Summer Launch — Aurora Headphones",
  subtitle: "Active · Q3 Hardware Push",
  owner: { name: "Sarah Jenkins", initials: "SJ", color: "#fb6f5a" },
  status: "pending_approval",
  budget: { total: 150000, spent: 42500 },
  dates: { start: "Jun 15, 2024", end: "Aug 30, 2024" },
  goals: [
    "Drive 15k pre-orders in first 30 days",
    "Achieve $2.5M in early revenue",
    "Increase brand awareness in fitness segment by 15%",
  ],
  personas: [
    { name: "Fitness Enthusiasts", desc: "Runners and gym-goers needing secure fit." },
    { name: "Daily Commuters", desc: "Professionals seeking ANC and comfort." },
  ],
  channels: ["Instagram", "TikTok", "YouTube", "Email", "Paid Search"],
  kpis: [
    { label: "Pre-orders", target: "15,000", current: "4,250", progress: 28, trend: "+12%" },
    { label: "Cost per Acquisition", target: "$45.00", current: "$42.50", progress: 100, trend: "-5%" },
    { label: "Ad Impressions", target: "5.0M", current: "1.2M", progress: 24, trend: "+8%" },
    { label: "Click-through Rate", target: "3.5%", current: "4.1%", progress: 100, trend: "+0.6%" },
  ],
  assets: [
    { id: 1, name: "Aurora_Hero_Video_Final.mp4", type: "video", size: "24.5 MB", date: "2 days ago" },
    { id: 2, name: "Social_Banners_1080x1080.fig", type: "design", size: "12.1 MB", date: "3 days ago" },
    { id: 3, name: "Landing_Page_Copy_V3.docx", type: "doc", size: "45 KB", date: "1 week ago" },
    { id: 4, name: "Product_Lifestyle_Shots.zip", type: "archive", size: "156 MB", date: "1 week ago" },
  ],
  tasks: [
    { id: 1, title: "Finalize influencer contracts", assignee: "MK", status: "completed" },
    { id: 2, title: "Setup TikTok ad tracking pixels", assignee: "SJ", status: "in_progress" },
    { id: 3, title: "Review email nurture sequence", assignee: "DR", status: "pending" },
  ],
  activity: [
    { id: 1, user: "Sarah Jenkins", action: "uploaded a new asset", target: "Aurora_Hero_Video_Final.mp4", time: "2 hours ago", avatar: "SJ", color: "#fb6f5a" },
    { id: 2, user: "David Ross", action: "left a comment on", target: "Landing Page Copy V3", time: "4 hours ago", avatar: "DR", color: "#2f9bf2" },
    { id: 3, user: "System", action: "auto-created task", target: "Setup TikTok ad tracking pixels", time: "1 day ago", avatar: "AI", color: "#4f46e5", isAI: true },
    { id: 4, user: "Marcus King", action: "changed status to", target: "Pending Approval", time: "2 days ago", avatar: "MK", color: "#18b386" },
  ]
};

export function CampaignDetail() {
  const [isApproved, setIsApproved] = useState(false);

  const approveCampaign = () => {
    setIsApproved(true);
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium"
        style={{ 
          background: isApproved ? "var(--c-emerald)" : "var(--c-amber)",
          color: "white" 
        }}
      >
        {isApproved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        {isApproved ? "Approved" : "Pending Approval"}
      </div>
      
      {!isApproved && (
        <button 
          onClick={approveCampaign}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))",
            boxShadow: "0 8px 18px -8px rgba(79,70,229,0.8)",
          }}
        >
          <CheckCircle2 size={16} /> Approve
        </button>
      )}

      <button className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5" style={{ color: "var(--c-ink-soft)" }}>
        <MoreHorizontal size={18} />
      </button>
    </div>
  );

  return (
    <AppLayout 
      active="campaigns" 
      title={CAMPAIGN.name} 
      subtitle={CAMPAIGN.subtitle} 
      actions={actions}
    >
      <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6 lg:space-y-8 pb-20">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column (Main Content) */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Goals & Audience */}
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 cadence-rise" style={{ animationDelay: "50ms" }}>
              <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                <div className="flex items-center gap-2 mb-4 text-[14px] font-semibold">
                  <Target size={16} style={{ color: "var(--c-brand)" }} /> Goals & Objectives
                </div>
                <ul className="space-y-3">
                  {CAMPAIGN.goals.map((goal, i) => (
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
                  {CAMPAIGN.personas.map((persona, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}>
                      <div className="font-semibold text-[13px]">{persona.name}</div>
                      <div className="mt-0.5 text-[12.5px] leading-snug" style={{ color: "var(--c-muted)" }}>{persona.desc}</div>
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
                    {CAMPAIGN.channels.map(channel => (
                      <div key={channel} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-ink-soft)" }}>
                        {channel === "Instagram" && <ImageIcon size={14} />}
                        {channel === "TikTok" && <Video size={14} />}
                        {channel === "YouTube" && <PlayCircle size={14} />}
                        {channel === "Email" && <MessageSquare size={14} />}
                        {channel === "Paid Search" && <Globe size={14} />}
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
                      <div className="font-medium">{CAMPAIGN.dates.start}</div>
                    </div>
                    <div className="flex-1 mx-4 h-px border-t border-dashed" style={{ borderColor: "var(--c-border-strong)" }} />
                    <div className="text-right">
                      <div style={{ color: "var(--c-muted)" }} className="text-[11.5px] mb-1 uppercase tracking-wider font-semibold">End</div>
                      <div className="font-medium">{CAMPAIGN.dates.end}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="cadence-rise" style={{ animationDelay: "150ms" }}>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="font-display text-[16px] font-bold">Campaign Targets</div>
                <button className="text-[13px] font-medium transition-colors hover:opacity-70" style={{ color: "var(--c-brand-600)" }}>
                  View full analytics
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CAMPAIGN.kpis.map((kpi, i) => (
                  <div key={i} className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                    <div className="text-[12.5px] font-medium" style={{ color: "var(--c-ink-soft)" }}>{kpi.label}</div>
                    <div className="my-3 flex items-baseline gap-2">
                      <div className="font-display text-[22px] font-bold">{kpi.current}</div>
                      <div className="text-[12px] font-medium" style={{ color: "var(--c-muted)" }}>/ {kpi.target}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span style={{ color: kpi.trend.startsWith('+') && kpi.progress !== 100 ? "var(--c-emerald)" : "var(--c-ink-soft)" }}>
                          {kpi.trend}
                        </span>
                        <span style={{ color: "var(--c-muted)" }}>{kpi.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-bg)]">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${kpi.progress}%`,
                            background: kpi.progress >= 100 ? "var(--c-emerald)" : "linear-gradient(90deg, var(--c-brand), var(--c-violet))" 
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
                {CAMPAIGN.assets.map((asset, i) => (
                  <div key={asset.id} className="flex items-center gap-4 p-3.5 transition-colors hover:bg-[var(--c-surface-2)]" style={{ borderBottom: i !== CAMPAIGN.assets.length - 1 ? "1px solid var(--c-border)" : "none" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--c-bg)", color: "var(--c-ink-soft)" }}>
                      {asset.type === "video" && <Video size={18} />}
                      {asset.type === "design" && <ImageIcon size={18} />}
                      {asset.type === "doc" && <FileText size={18} />}
                      {asset.type === "archive" && <Link2 size={18} />}
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
                <button className="text-[13px] font-medium transition-colors hover:opacity-70" style={{ color: "var(--c-brand-600)" }}>
                  View all 12 tasks
                </button>
              </div>
              
              <div className="rounded-2xl p-2" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}>
                {CAMPAIGN.tasks.map((task, i) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-[var(--c-surface-2)] group cursor-pointer">
                    <button 
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-[var(--c-border-strong)] bg-white text-transparent transition-all hover:border-[var(--c-brand)] group-hover:bg-[var(--c-bg)]"
                      style={task.status === 'completed' ? { background: "var(--c-brand)", borderColor: "var(--c-brand)", color: "white" } : {}}
                    >
                      <CheckSquare size={12} strokeWidth={3} />
                    </button>
                    <div 
                      className="flex-1 text-[13px] font-medium transition-all"
                      style={{ color: task.status === 'completed' ? "var(--c-muted)" : "var(--c-ink)", textDecoration: task.status === 'completed' ? "line-through" : "none" }}
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

          {/* Right Column (Sidebar) */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Cadence AI */}
            <div className="cadence-rise relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))", boxShadow: "0 12px 24px -8px rgba(79,70,229,0.35)", animationDelay: "50ms" }}>
              <div className="cadence-ai-glow pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full" style={{ background: "rgba(255,255,255,0.2)", filter: "blur(20px)" }} />
              
              <div className="relative">
                <div className="flex items-center gap-2 text-[14px] font-bold mb-4">
                  <Sparkles size={16} /> Cadence AI
                </div>
                
                <div className="space-y-3 mb-5">
                  <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
                    <div className="flex gap-2.5">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#fb6f5a]" />
                      <div>
                        <div className="text-[13px] font-semibold">Missing Instagram Assets</div>
                        <div className="mt-1 text-[12px] text-white/80 leading-snug">
                          Instagram is listed as a channel, but no 4:5 video creatives have been uploaded.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
                    <div className="flex gap-2.5">
                      <Activity size={15} className="shrink-0 mt-0.5 text-[#f5a524]" />
                      <div>
                        <div className="text-[13px] font-semibold">Budget Pacing Alert</div>
                        <div className="mt-1 text-[12px] text-white/80 leading-snug">
                          You've spent 28% of budget, but we're only 15% through the campaign timeline.
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <div className="font-display text-[20px] font-bold">${CAMPAIGN.budget.spent.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-[var(--c-muted)] mb-0.5">Total Budget</div>
                  <div className="text-[14px] font-semibold text-[var(--c-ink-soft)]">${CAMPAIGN.budget.total.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--c-bg)] mb-3">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-[var(--c-brand)]"
                  style={{ width: `${(CAMPAIGN.budget.spent / CAMPAIGN.budget.total) * 100}%` }}
                />
                <div 
                  className="absolute top-0 h-full w-0.5 bg-[var(--c-border-strong)] z-10"
                  style={{ left: "15%" }}
                  title="Time elapsed: 15%"
                />
              </div>
              
              <div className="text-[12px] text-[var(--c-ink-soft)] leading-snug">
                Pacing <strong className="text-[var(--c-amber)]">13% ahead</strong> of schedule. Consider pausing top-of-funnel ads next week.
              </div>
            </div>

            {/* Activity History */}
            <div className="cadence-rise rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)", animationDelay: "150ms" }}>
              <div className="font-display text-[15px] font-bold mb-5">Activity</div>
              
              <div className="relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--c-border)] space-y-5">
                {CAMPAIGN.activity.map((item) => (
                  <div key={item.id} className="relative flex gap-3">
                    <div 
                      className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-4 ring-white"
                      style={{ 
                        background: item.isAI ? "linear-gradient(135deg,var(--c-brand),var(--c-violet))" : item.color 
                      }}
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
              
              <button className="mt-2 w-full rounded-xl bg-[var(--c-bg)] py-2 text-[12.5px] font-semibold text-[var(--c-ink-soft)] transition-colors hover:bg-[var(--c-border)]">
                View all activity
              </button>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
