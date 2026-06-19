import { AppLayout } from "./_shared/AppLayout";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  MoreHorizontal,
  Target,
  ArrowUpRight,
  Megaphone,
  Briefcase,
  PlayCircle,
  AlertTriangle
} from "lucide-react";

export function Dashboard() {
  return (
    <AppLayout
      active="dashboard"
      title="Command Center"
      subtitle="Overview for Q3 (Jul 1 – Sep 30, 2024)"
      actions={
        <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--c-ink-soft)] px-3 py-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)]">
          <Calendar size={14} />
          <span>Last 30 Days</span>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* KPI Tiles Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiTile
            title="Revenue Pipeline"
            value="$2.4M"
            delta="+14.2%"
            isPositive={true}
            sparkline={[30, 40, 35, 50, 45, 60, 75]}
          />
          <KpiTile
            title="Marketing Qualified Leads"
            value="1,248"
            delta="+8.4%"
            isPositive={true}
            sparkline={[10, 15, 12, 18, 22, 19, 25]}
          />
          <KpiTile
            title="Return on Ad Spend"
            value="3.8x"
            delta="-0.2x"
            isPositive={false}
            sparkline={[4.2, 4.0, 4.1, 3.9, 3.7, 3.6, 3.8]}
          />
          <KpiTile
            title="Conversion Rate"
            value="4.6%"
            delta="+1.1%"
            isPositive={true}
            sparkline={[2.5, 3.0, 3.2, 3.5, 4.0, 4.2, 4.6]}
          />
          <KpiTile
            title="Website Traffic"
            value="184K"
            delta="+22%"
            isPositive={true}
            sparkline={[120, 130, 125, 140, 150, 160, 184]}
          />
          <KpiTile
            title="Social Engagement"
            value="8.2%"
            delta="-1.5%"
            isPositive={false}
            sparkline={[9.5, 9.2, 9.0, 8.8, 8.5, 8.0, 8.2]}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Active Campaigns */}
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: "var(--c-surface)",
                borderColor: "var(--c-border)",
                boxShadow: "var(--c-shadow-sm)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-[16px] font-bold">Active Campaigns</h2>
                <button className="text-[13px] font-medium flex items-center gap-1 hover:underline" style={{ color: "var(--c-brand-600)" }}>
                  View all <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <CampaignRow
                  name="Q3 Enterprise Summit Promo"
                  owner="Sarah J."
                  ownerColor="#4f46e5"
                  status="On Track"
                  statusColor="var(--c-emerald)"
                  progress={75}
                  budget="$45K"
                  spent="$32K"
                  channels={["Email", "LinkedIn"]}
                />
                <CampaignRow
                  name="Product Launch: Nexus 2.0"
                  owner="Mike T."
                  ownerColor="#7c3aed"
                  status="At Risk"
                  statusColor="var(--c-rose)"
                  progress={40}
                  budget="$120K"
                  spent="$65K"
                  channels={["Display", "Twitter", "PR"]}
                />
                <CampaignRow
                  name="Partner Co-marketing Q3"
                  owner="Elena R."
                  ownerColor="#f5a524"
                  status="Pacing"
                  statusColor="var(--c-amber)"
                  progress={60}
                  budget="$25K"
                  spent="$15K"
                  channels={["Webinar", "Email"]}
                />
              </div>
            </div>

            {/* This Week Schedule */}
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: "var(--c-surface)",
                borderColor: "var(--c-border)",
                boxShadow: "var(--c-shadow-sm)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-[16px] font-bold">This Week's Milestones</h2>
                <button className="p-1.5 rounded-lg hover:bg-[var(--c-surface-2)] transition-colors text-[var(--c-ink-soft)]">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="space-y-0 relative before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-[var(--c-border)]">
                <TimelineItem
                  date="Today, 10:00 AM"
                  title="Final review: Nexus 2.0 Launch Assets"
                  type="review"
                  isFirst
                />
                <TimelineItem
                  date="Tomorrow, 2:00 PM"
                  title="Q3 Enterprise Summit Email Drop 2"
                  type="launch"
                />
                <TimelineItem
                  date="Thursday, 9:00 AM"
                  title="Weekly Performance Sync"
                  type="meeting"
                />
                <TimelineItem
                  date="Friday, EOD"
                  title="Budget Reallocation Deadline"
                  type="deadline"
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* MarketingOS AI Panel */}
            <div
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
                boxShadow: "0 12px 32px -12px rgba(79,70,229,0.5)",
              }}
            >
              <div
                className="cadence-ai-glow pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", filter: "blur(12px)" }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 font-display text-[16px] font-bold mb-4">
                  <Sparkles size={18} />
                  MarketingOS AI Insights
                </div>

                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-white/90 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[13px] font-semibold text-white">Reallocate LinkedIn Budget</div>
                        <div className="text-[12px] text-white/80 mt-0.5 leading-relaxed">
                          "Product Launch" campaign is seeing high CPA on LinkedIn. Reallocating $10K to Twitter could improve overall ROI by 12%.
                        </div>
                        <button className="mt-2 text-[11px] font-bold uppercase tracking-wider text-white/90 bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1 rounded">
                          Apply Recommendation
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-[#fb6f5a] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[13px] font-semibold text-white">Missing Assets Detected</div>
                        <div className="text-[12px] text-white/80 mt-0.5 leading-relaxed">
                          2 video assets for tomorrow's "Email Drop 2" are still marked as in-progress.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Rollup */}
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: "var(--c-surface)",
                borderColor: "var(--c-border)",
                boxShadow: "var(--c-shadow-sm)",
              }}
            >
              <h2 className="font-display text-[16px] font-bold mb-4">Task Rollup</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl p-3 bg-[var(--c-surface-2)] border border-[var(--c-border)]">
                  <div className="text-[12px] font-medium text-[var(--c-ink-soft)] mb-1">To-do</div>
                  <div className="text-[20px] font-display font-bold">31</div>
                </div>
                <div className="rounded-xl p-3 bg-[var(--c-surface-2)] border border-[var(--c-border)]">
                  <div className="text-[12px] font-medium text-[var(--c-ink-soft)] mb-1">In Progress</div>
                  <div className="text-[20px] font-display font-bold">24</div>
                </div>
                <div className="rounded-xl p-3 bg-[var(--c-surface-2)] border border-[var(--c-border)]">
                  <div className="text-[12px] font-medium text-[var(--c-ink-soft)] mb-1">In Review</div>
                  <div className="text-[20px] font-display font-bold">12</div>
                </div>
                <div className="rounded-xl p-3 bg-emerald-50/50 border border-emerald-100">
                  <div className="text-[12px] font-medium text-emerald-600 mb-1">Done</div>
                  <div className="text-[20px] font-display font-bold text-emerald-700">86</div>
                </div>
                <div className="rounded-xl p-3 bg-red-50/50 border border-red-100">
                  <div className="text-[12px] font-medium text-red-600 mb-1">Overdue</div>
                  <div className="text-[20px] font-display font-bold text-red-700">3</div>
                </div>
                <div className="rounded-xl p-3 bg-amber-50/50 border border-amber-100">
                  <div className="text-[12px] font-medium text-amber-600 mb-1">Blocked</div>
                  <div className="text-[20px] font-display font-bold text-amber-700">1</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)] mb-2 px-1">Attention Needed</div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--c-surface-2)] transition-colors cursor-pointer group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-rose)]" />
                  <div className="flex-1 truncate text-[13px] font-medium group-hover:text-[var(--c-brand-600)] transition-colors">
                    Approve Q3 Budget Report
                  </div>
                  <div className="text-[11px] text-[var(--c-muted)]">Yesterday</div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--c-surface-2)] transition-colors cursor-pointer group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-rose)]" />
                  <div className="flex-1 truncate text-[13px] font-medium group-hover:text-[var(--c-brand-600)] transition-colors">
                    Review display ad copy
                  </div>
                  <div className="text-[11px] text-[var(--c-muted)]">Yesterday</div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--c-surface-2)] transition-colors cursor-pointer group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-amber)]" />
                  <div className="flex-1 truncate text-[13px] font-medium group-hover:text-[var(--c-brand-600)] transition-colors">
                    Video assets blocked by Legal
                  </div>
                  <div className="text-[11px] text-[var(--c-muted)]">Today</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function KpiTile({
  title,
  value,
  delta,
  isPositive,
  sparkline
}: {
  title: string;
  value: string;
  delta: string;
  isPositive: boolean;
  sparkline: number[];
}) {
  const max = Math.max(...sparkline);
  const min = Math.min(...sparkline);
  const range = max - min || 1;
  
  return (
    <div
      className="cadence-rise rounded-xl p-4 border flex flex-col"
      style={{
        background: "var(--c-surface)",
        borderColor: "var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <div className="text-[12.5px] font-medium text-[var(--c-ink-soft)] mb-2 truncate">
        {title}
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div>
          <div className="font-display text-[22px] font-bold leading-none mb-1.5">
            {value}
          </div>
          <div
            className="flex items-center gap-1 text-[11px] font-semibold"
            style={{ color: isPositive ? "var(--c-emerald)" : "var(--c-rose)" }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta}
          </div>
        </div>
        
        {/* Simple SVG Sparkline */}
        <div className="w-12 h-8 opacity-60">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke={isPositive ? "var(--c-emerald)" : "var(--c-rose)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkline
                .map((val, i) => {
                  const x = (i / (sparkline.length - 1)) * 100;
                  const y = 40 - ((val - min) / range) * 40;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function CampaignRow({
  name,
  owner,
  ownerColor,
  status,
  statusColor,
  progress,
  budget,
  spent,
  channels
}: {
  name: string;
  owner: string;
  ownerColor: string;
  status: string;
  statusColor: string;
  progress: number;
  budget: string;
  spent: string;
  channels: string[];
}) {
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-[var(--c-surface-2)] transition-colors border border-transparent hover:border-[var(--c-border)]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="font-semibold text-[14px] text-[var(--c-ink)] truncate group-hover:text-[var(--c-brand-600)] transition-colors">
            {name}
          </div>
          <div
            className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
            style={{ color: statusColor, background: `${statusColor}15` }}
          >
            {status}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--c-ink-soft)]">
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: ownerColor }}
            >
              {owner.charAt(0)}
            </div>
            {owner}
          </div>
          <div className="w-1 h-1 rounded-full bg-[var(--c-border-strong)]" />
          <div className="flex items-center gap-1.5">
            {channels.map((c) => (
              <span key={c} className="px-1.5 py-0.5 rounded bg-[var(--c-surface)] border border-[var(--c-border)] text-[10px] font-medium text-[var(--c-muted)]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:w-[240px] shrink-0">
        <div className="flex-1">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="font-medium text-[var(--c-ink-soft)]">Goal Progress</span>
            <span className="font-bold text-[var(--c-ink)]">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--c-border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--c-brand)" }}
            />
          </div>
        </div>

        <div className="w-[70px] text-right">
          <div className="text-[13px] font-bold text-[var(--c-ink)]">{spent}</div>
          <div className="text-[11px] text-[var(--c-muted)] font-medium">of {budget}</div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  date,
  title,
  type,
  isFirst,
  isLast
}: {
  date: string;
  title: string;
  type: "review" | "launch" | "meeting" | "deadline";
  isFirst?: boolean;
  isLast?: boolean;
}) {
  let icon = <CheckCircle2 size={12} />;
  let iconBg = "bg-[var(--c-surface)] text-[var(--c-brand)] border-[var(--c-brand)]";
  
  if (type === "launch") {
    icon = <Target size={12} />;
    iconBg = "bg-[var(--c-emerald)] text-white border-[var(--c-emerald)]";
  } else if (type === "meeting") {
    icon = <Briefcase size={12} />;
    iconBg = "bg-[var(--c-surface)] text-[var(--c-violet)] border-[var(--c-violet)]";
  } else if (type === "deadline") {
    icon = <AlertCircle size={12} />;
    iconBg = "bg-[var(--c-rose)] text-white border-[var(--c-rose)]";
  }

  return (
    <div className="relative pl-8 py-3">
      <div className={`absolute left-0 top-[18px] w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center z-10 ${iconBg}`}>
        {icon}
      </div>
      
      {isFirst && <div className="absolute left-[11px] top-0 bottom-[18px] w-px bg-[var(--c-surface)] z-0" />}
      {isLast && <div className="absolute left-[11px] top-[18px] bottom-0 w-px bg-[var(--c-surface)] z-0" />}

      <div className="text-[11.5px] font-bold text-[var(--c-brand-600)] mb-0.5">
        {date}
      </div>
      <div className="text-[13.5px] font-medium text-[var(--c-ink)]">
        {title}
      </div>
    </div>
  );
}
