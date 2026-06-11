import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import {
  Sparkles,
  Send,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCcw,
  PenTool,
  MessageSquare,
  Mail,
  FileText,
  Target,
  LayoutTemplate,
  BarChart2,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Hash,
  Activity,
  Layers,
  Settings2,
  Link2
} from "lucide-react";

export function AIAssistant() {
  return (
    <AppLayout
      title="Cadence AI"
      subtitle="Your marketing copilot"
      actions={
        <button
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            color: "var(--c-ink-soft)",
          }}
        >
          <Settings2 size={16} />
          Assistant Settings
        </button>
      }
    >
      <div className="flex h-full w-full">
        {/* Main Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="cadence-scroll flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* User Message */}
            <div className="flex w-full justify-end cadence-rise" style={{ animationDelay: "0ms" }}>
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] leading-relaxed text-white shadow-sm" style={{ background: "var(--c-ink)" }}>
                Generate 3 social post variants for the Q3 Enterprise Launch. Focus on the new predictive analytics feature. Our audience is CMOs.
              </div>
            </div>

            {/* AI Message */}
            <div className="flex w-full justify-start gap-4 cadence-rise" style={{ animationDelay: "150ms" }}>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                style={{
                  background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
                }}
              >
                <Sparkles size={16} />
              </div>
              
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="text-[14px] leading-relaxed" style={{ color: "var(--c-ink)" }}>
                  Here are 3 tailored social post variants for the Q3 Enterprise Launch, highlighting predictive analytics for CMOs:
                </div>

                {/* Rich Output Block */}
                <div className="flex flex-col gap-3 max-w-[90%]">
                  <VariantCard 
                    number="1"
                    platform="LinkedIn"
                    tone="Thought Leadership"
                    content="Stop guessing. Start predicting. Our Q3 Enterprise update introduces AI-driven predictive analytics that helps CMOs forecast campaign ROI before spending a dime. See how top marketing teams are staying ahead of the curve."
                    tags="#MarketingAnalytics #CMO #PredictiveAI"
                  />
                  <VariantCard 
                    number="2"
                    platform="Twitter / X"
                    tone="Punchy & Direct"
                    content="What if you knew your campaign's ROI before launching? The new Cadence Predictive Analytics engine for Enterprise is here. Built for marketing leaders who demand precision."
                    tags="#MarketingStrategy #Martech"
                  />
                  <VariantCard 
                    number="3"
                    platform="LinkedIn"
                    tone="Data-Driven Story"
                    content="Last quarter, marketing leaders wasted an average of 14% of their budget on low-performing channels. With our new predictive analytics feature, you can allocate spend with 92% confidence based on historical modeling. Ready to transform your marketing ops?"
                    tags="#DataDriven #MarketingOps #Leadership"
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--c-surface-2)]" style={{ color: "var(--c-muted)" }}>
                    <Copy size={14} /> Copy all
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--c-surface-2)]" style={{ color: "var(--c-muted)" }}>
                    <RefreshCcw size={14} /> Regenerate
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    <button className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-[var(--c-surface-2)]" style={{ color: "var(--c-muted)" }}>
                      <ThumbsUp size={14} />
                    </button>
                    <button className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors hover:bg-[var(--c-surface-2)]" style={{ color: "var(--c-muted)" }}>
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Composer */}
          <div className="shrink-0 p-6 pt-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <QuickAction icon={<PenTool size={13} />} label="Generate campaign brief" />
              <QuickAction icon={<MessageSquare size={13} />} label="Social posts" />
              <QuickAction icon={<Mail size={13} />} label="Email sequence" />
              <QuickAction icon={<Target size={13} />} label="Ad copy" />
              <QuickAction icon={<LayoutTemplate size={13} />} label="Landing page copy" />
              <QuickAction icon={<FileText size={13} />} label="Blog outline" />
              <QuickAction icon={<FileSearch size={13} />} label="Summarize thread" />
              <QuickAction icon={<BarChart2 size={13} />} label="Performance insight" />
            </div>
            
            <div 
              className="relative rounded-2xl shadow-sm transition-shadow focus-within:shadow-md"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
            >
              <textarea 
                className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-[14px] outline-none placeholder:text-[var(--c-muted)]"
                placeholder="Ask Cadence AI to write, analyze, or plan..."
                rows={2}
              />
              <button 
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl text-white transition-transform hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
              >
                <Send size={15} />
              </button>
            </div>
            <div className="mt-2 text-center text-[11px]" style={{ color: "var(--c-muted)" }}>
              Cadence AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>

        {/* Context Rail */}
        <div 
          className="w-[320px] shrink-0 overflow-y-auto border-l"
          style={{ background: "var(--c-surface-2)", borderColor: "var(--c-border)" }}
        >
          <div className="p-5 space-y-6">
            
            <div>
              <h3 className="font-display text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-ink-soft)" }}>
                Active Context
              </h3>
              
              <div className="space-y-3">
                <ContextCard 
                  icon={<Layers size={16} className="text-[var(--c-brand)]" />}
                  title="Q3 Enterprise Launch"
                  subtitle="Campaign • 3 days until launch"
                  active
                />
                <ContextCard 
                  icon={<Hash size={16} className="text-[var(--c-sky)]" />}
                  title="Enterprise personas"
                  subtitle="Audience segment • CMO focus"
                />
                <ContextCard 
                  icon={<Activity size={16} className="text-[var(--c-emerald)]" />}
                  title="Q2 Conversion Data"
                  subtitle="Data source • Connected 2h ago"
                />
              </div>
              
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-[12px] font-medium transition-colors hover:bg-[var(--c-surface)]" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)" }}>
                <Link2 size={14} /> Add context source
              </button>
            </div>

            <div>
              <h3 className="font-display text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-ink-soft)" }}>
                Brand Guardrails
              </h3>
              
              <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 text-[var(--c-emerald)]" />
                  <div>
                    <div className="text-[13px] font-semibold">Authoritative & Clear</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--c-muted)" }}>Use active voice. Avoid jargon unless industry standard.</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="mt-0.5 text-[var(--c-amber)]" />
                  <div>
                    <div className="text-[13px] font-semibold">No hyperbolic claims</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--c-muted)" }}>Do not use "revolutionary", "disruptive", or "magic".</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AppLayout>
  );
}

function VariantCard({ number, platform, tone, content, tags }: { number: string, platform: string, tone: string, content: string, tags: string }) {
  return (
    <div 
      className="group relative overflow-hidden rounded-xl border p-4 transition-all hover:border-[var(--c-brand-600)]"
      style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--c-surface-2)] text-[11px] font-bold text-[var(--c-ink-soft)]">
            {number}
          </div>
          <span className="text-[12px] font-semibold text-[var(--c-ink)]">{platform}</span>
          <span className="text-[10px] text-[var(--c-muted)]">•</span>
          <span className="text-[12px] font-medium text-[var(--c-muted)]">{tone}</span>
        </div>
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <button className="flex items-center gap-1 text-[11px] font-medium text-[var(--c-brand)] hover:text-[var(--c-brand-600)]">
            <Copy size={12} /> Copy
          </button>
        </div>
      </div>
      <p className="text-[13.5px] leading-relaxed text-[var(--c-ink)] mb-2">
        {content}
      </p>
      <p className="text-[12px] font-medium text-[var(--c-brand)]">
        {tags}
      </p>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button 
      className="flex items-center gap-1.5 rounded-full border bg-[var(--c-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--c-ink-soft)] shadow-sm transition-all hover:border-[var(--c-brand)] hover:text-[var(--c-brand)]"
      style={{ borderColor: "var(--c-border)" }}
    >
      {icon} {label}
    </button>
  );
}

function ContextCard({ icon, title, subtitle, active = false }: { icon: React.ReactNode, title: string, subtitle: string, active?: boolean }) {
  return (
    <div 
      className="flex items-start gap-3 rounded-xl border p-3 transition-colors"
      style={{ 
        background: active ? "var(--c-brand-50)" : "var(--c-surface)",
        borderColor: active ? "var(--c-brand)" : "var(--c-border)",
      }}
    >
      <div className="mt-0.5 rounded-lg bg-white p-1.5 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[var(--c-ink)]">{title}</div>
        <div className="truncate text-[11.5px] text-[var(--c-muted)] mt-0.5">{subtitle}</div>
      </div>
      {active && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--c-brand)] text-white">
          <CheckCircle2 size={10} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}
