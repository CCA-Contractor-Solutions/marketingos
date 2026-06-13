import { type ReactNode } from "react";
import { Link } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { AppLayout, PageError } from "@/components/AppLayout";
import { CcaLogo } from "@/components/CcaLogo";
import { Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import type { Insight, AttentionItem } from "@workspace/api-client-react";

// Primitives and Top Row
import { DashboardMetrics } from "./dashboard/DashboardMetrics";
import { AiCopilotPanel } from "./dashboard/AiCopilotPanel";
import { ModuleCard } from "./dashboard/Shared";

// Modules
import { ExecutiveHealth } from "./dashboard/ExecutiveHealth";
import { RoiOnLeads } from "./dashboard/RoiOnLeads";
import { CampaignCommandCenter } from "./dashboard/CampaignCommandCenter";
import { SeoAnalytics } from "./dashboard/SeoAnalytics";
import { SeoSuggestions } from "./dashboard/SeoSuggestions";
import { MarketTrends } from "./dashboard/MarketTrends";
import { CompetitorWatch } from "./dashboard/CompetitorWatch";
import { Futurecast } from "./dashboard/Futurecast";
import { PressReleases } from "./dashboard/PressReleases";
import { EmailBuilder } from "./dashboard/EmailBuilder";
import { AdHealth } from "./dashboard/AdHealth";
import { BrainstormCorner } from "./dashboard/BrainstormCorner";
import { AwardCenter } from "./dashboard/AwardCenter";
import { BudgetPacing } from "./dashboard/BudgetPacing";
import { FunnelQuality } from "./dashboard/FunnelQuality";
import { ContentOpportunities } from "./dashboard/ContentOpportunities";
import { ReputationSignals } from "./dashboard/ReputationSignals";

const INSIGHT_STYLE: Record<
  string,
  { bg: string; border: string; icon: typeof Sparkles; color: string }
> = {
  warning: {
    bg: "rgba(245,165,36,0.08)",
    border: "rgba(245,165,36,0.25)",
    icon: AlertTriangle,
    color: "var(--c-amber)",
  },
  alert: {
    bg: "rgba(244,63,107,0.07)",
    border: "rgba(244,63,107,0.22)",
    icon: AlertTriangle,
    color: "var(--c-rose)",
  },
  info: {
    bg: "var(--c-brand-50)",
    border: "rgba(37,99,235,0.18)",
    icon: Sparkles,
    color: "var(--c-brand)",
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const s = INSIGHT_STYLE[insight.severity] ?? INSIGHT_STYLE.info;
  const Icon = s.icon;
  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={16} style={{ color: s.color }} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-800">{insight.title}</div>
          <div className="mt-1 text-[12px] leading-snug text-slate-600">
            {insight.body}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttentionRow({ a }: { a: AttentionItem }) {
  const color = a.severity === "high" ? "var(--c-rose)" : "var(--c-amber)";
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-slate-800">{a.title}</div>
      </div>
      <div className="shrink-0 text-[11px]" style={{ color: "var(--c-muted)" }}>
        {a.time}
      </div>
    </div>
  );
}

function Section({
  id,
  span,
  children,
}: {
  id: string;
  span?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className={`scroll-mt-6 flex flex-col [&>*]:flex-1 ${span ? "md:col-span-2" : ""}`}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboardSummary();

  return (
    <AppLayout
      active="dashboard"
      title="Command Center"
      subtitle="Good morning, Jessica — here's your marketing pulse"
    >
      {isError ? (
        <PageError />
      ) : (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
          {/* Top layout: Main Workspace + Copilot Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left side workspace (3 cols) */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Dark Navy Hero Banner */}
              <div
                className="cadence-rise relative overflow-hidden rounded-3xl px-8 py-10 text-white"
                style={{
                  background: "linear-gradient(120deg, #090e18 0%, #1e3a8a 70%, #2563eb 100%)",
                  boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.4)",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <div
                  className="cadence-ai-glow pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full"
                  style={{ background: "rgba(59,130,246,0.35)", filter: "blur(32px)" }}
                />
                <div className="relative flex items-center gap-6">
                  <div className="hidden shrink-0 sm:block rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                    <CcaLogo size={56} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-blue-200">
                      <Sparkles size={14} /> Contractor Compliance Authority
                    </div>
                    <h2 className="font-display mt-2 text-[28px] font-bold leading-tight sm:text-[36px] tracking-tight">
                      CCA Marketing Command Center
                    </h2>
                    <p className="mt-2 text-[15px] text-blue-100/90 font-medium">
                      Plan. Launch. Optimize. Grow.
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI Row (Real Data) */}
              <DashboardMetrics kpis={data?.kpis ?? []} isLoading={isLoading} />

              {/* Dense Grid of Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 cadence-rise" style={{ animationDelay: "80ms" }}>
                <Section id="executive-health"><ExecutiveHealth /></Section>
                <Section id="roi-leads"><RoiOnLeads /></Section>
                <Section id="seo-analytics"><SeoAnalytics /></Section>

                <Section id="campaign-center" span><CampaignCommandCenter campaigns={data?.campaigns ?? []} /></Section>
                <Section id="futurecast"><Futurecast /></Section>

                <Section id="market-trends"><MarketTrends /></Section>
                <Section id="competitor-watch"><CompetitorWatch /></Section>
                <Section id="seo-suggestions"><SeoSuggestions /></Section>

                <Section id="ad-health"><AdHealth /></Section>
                <Section id="budget-pacing"><BudgetPacing /></Section>
                <Section id="funnel-quality" span><FunnelQuality /></Section>

                <Section id="press-releases"><PressReleases /></Section>
                <Section id="email-builder"><EmailBuilder /></Section>
                <Section id="brainstorm"><BrainstormCorner /></Section>

                <Section id="content-opportunities"><ContentOpportunities /></Section>
                <Section id="reputation"><ReputationSignals /></Section>
                <Section id="award-center"><AwardCenter /></Section>

                {/* AI Suggestions (Real Data) */}
                <Section id="ai-suggestions" span>
                  <ModuleCard title="AI Suggestions" actionLabel="View all" actionHref="/assistant" icon={Sparkles} accent="var(--c-brand)">
                    <div className="space-y-2.5">
                      {(data?.insights ?? []).slice(0, 3).map((ins) => (
                        <InsightCard key={ins.id} insight={ins} />
                      ))}
                    </div>
                  </ModuleCard>
                </Section>

                {/* Attention (Real Data) */}
                <Section id="needs-attention">
                  <ModuleCard title="Needs Attention" actionLabel="Open tasks" actionHref="/tasks" icon={AlertTriangle} accent="var(--c-rose)">
                    <div className="divide-y divide-slate-100">
                      {(data?.attention ?? []).slice(0, 4).map((a) => (
                        <AttentionRow key={a.id} a={a} />
                      ))}
                    </div>
                  </ModuleCard>
                </Section>
              </div>

            </div>

            {/* Right side Copilot panel (1 col) */}
            <div className="xl:col-span-1">
              <div className="sticky top-6 h-[calc(100vh-140px)]">
                <AiCopilotPanel />
              </div>
            </div>

          </div>
        </div>
      )}
    </AppLayout>
  );
}
