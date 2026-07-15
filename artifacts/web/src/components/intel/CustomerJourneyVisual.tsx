// Phase 4 -- Customer journey mini-visual. Additive, static illustration of
// the funnel stages that ingested external events now populate:
// impression -> visit -> engagement -> form -> call -> customer.
import { Eye, MousePointerClick, Sparkle, FileText, Phone, Award } from "lucide-react";

const STAGES: { label: string; icon: typeof Eye; source: string }[] = [
  { label: "Impression", icon: Eye, source: "Google Ads / Meta Ads / LinkedIn Ads" },
  { label: "Visit", icon: MousePointerClick, source: "Website / GA4" },
  { label: "Engagement", icon: Sparkle, source: "Website content" },
  { label: "Form", icon: FileText, source: "Website / Meta / LinkedIn lead forms" },
  { label: "Call", icon: Phone, source: "CallRail / RingCentral" },
  { label: "Customer", icon: Award, source: "CRM conversion" },
];

export function CustomerJourneyVisual() {
  return (
    <div
      className="cadence-rise rounded-2xl p-5 lg:p-6"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
        animationDelay: "220ms",
      }}
    >
      <h3 className="mb-1 text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
        Customer journey
      </h3>
      <p className="mb-4 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
        How ingested external events map onto the funnel, source by stage.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="flex items-center gap-2">
              <div
                className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 text-center"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", minWidth: 96 }}
              >
                <Icon size={16} style={{ color: "var(--c-brand)" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--c-ink)" }}>
                  {stage.label}
                </span>
                <span className="text-[10px] leading-tight" style={{ color: "var(--c-muted)" }}>
                  {stage.source}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <span className="text-[13px]" style={{ color: "var(--c-muted)" }}>
                  &rarr;
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
