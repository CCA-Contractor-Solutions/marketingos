// Phase 5 -- Module 5: Executive Growth Briefing ("Good Morning, Rose"). Route: /briefing
//
// Templated (not free-form AI-written) daily/weekly digest assembled from
// Phase 5 predictions/recommendations plus earlier intelligence modules.
// Read-only + a single "Generate" action -- there is nothing here that
// changes spend, sends outreach, or posts content on its own.
import type { ReactNode } from "react";
import { Sparkles, TrendingUp, ShieldAlert, Lightbulb, ListChecks, RefreshCw } from "lucide-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import { useGrowthBriefing, useGenerateGrowthBriefing } from "@/hooks/useIntel";
import { useRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SEVERITY_COLOR: Record<string, string> = {
  low: "var(--c-amber)",
  medium: "var(--c-amber)",
  high: "var(--c-rose)",
};

function greetingName() {
  return "Rose";
}

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function GrowthBriefing() {
  const { data: briefing, isLoading, isError } = useGrowthBriefing();
  const generateMutation = useGenerateGrowthBriefing();
  const { capabilities } = useRole();

  return (
    <AppLayout
      active="briefing"
      title="Growth Briefing"
      subtitle="Growth Intelligence · Executive summary of wins, risks, and opportunities"
      actions={
        capabilities.canGenerateInsights ? (
          <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <RefreshCw size={14} className={generateMutation.isPending ? "animate-spin" : ""} />
            {generateMutation.isPending ? "Generating…" : "Generate briefing"}
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : !briefing ? (
        <div className="mx-auto max-w-4xl p-6 lg:p-8 pb-20">
          <div
            className="cadence-rise rounded-2xl p-8 text-center"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              No briefing yet. Generate one to see today's summary.
            </p>
            {capabilities.canGenerateInsights && (
              <Button className="mt-4" size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                <RefreshCw size={14} className={generateMutation.isPending ? "animate-spin" : ""} />
                {generateMutation.isPending ? "Generating…" : "Generate briefing"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl p-6 lg:p-8 space-y-6 pb-20">
          {/* Executive header */}
          <div
            className="cadence-rise relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white"
            style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-navy-2))", boxShadow: "0 20px 40px -18px rgba(13,148,136,0.5)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full"
              style={{ background: "rgba(255,255,255,0.14)", filter: "blur(10px)" }}
            />
            <div className="relative flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/70">
              <Sparkles size={14} /> {briefing.periodLabel || "Executive Briefing"}
            </div>
            <h2 className="relative mt-1 font-display text-2xl lg:text-3xl font-bold">
              {timeOfDayGreeting()}, {greetingName()}
            </h2>
            <p className="relative mt-3 max-w-2xl text-[14px] leading-relaxed text-white/90">{briefing.summary}</p>
          </div>

          <p className="text-[11px]" style={{ color: "var(--c-muted)" }}>
            This briefing is templated from your own MarketingOS data -- predictions, recommendations, and prior intelligence modules. It is informational only and does not take any action on your behalf.
          </p>

          {/* Wins */}
          <Section icon={TrendingUp} label="Wins" color="var(--c-emerald)" empty="No notable wins this period.">
            {briefing.wins.map((w, i) => (
              <ItemCard key={i} title={w.label} detail={w.detail} />
            ))}
          </Section>

          {/* Risks */}
          <Section icon={ShieldAlert} label="Risks" color="var(--c-rose)" empty="No risks flagged this period.">
            {briefing.risks.map((r, i) => (
              <ItemCard key={i} title={r.label} detail={r.detail} badge={r.severity} badgeColor={SEVERITY_COLOR[r.severity]} />
            ))}
          </Section>

          {/* Opportunities */}
          <Section icon={Lightbulb} label="Opportunities" color="var(--c-amber)" empty="No new opportunities surfaced this period.">
            {briefing.opportunities.map((o, i) => (
              <ItemCard key={i} title={o.label} detail={o.detail} />
            ))}
          </Section>

          {/* Recommended Actions */}
          <Section icon={ListChecks} label="Recommended Actions" color="var(--c-brand)" empty="No recommended actions this period.">
            {briefing.recommendedActions.map((a, i) => (
              <ItemCard key={i} title={a.label} detail={a.detail} />
            ))}
          </Section>

          <p className="text-[11px]" style={{ color: "var(--c-muted)" }}>
            Recommended actions are suggestions for a human to review and execute -- MarketingOS does not carry these out automatically.
          </p>
        </div>
      )}
    </AppLayout>
  );
}

function Section({
  icon: Icon,
  label,
  color,
  empty,
  children,
}: {
  icon: typeof TrendingUp;
  label: string;
  color: string;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean) && items.length > 0;
  return (
    <div
      className="cadence-rise rounded-2xl p-5 lg:p-6"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
    >
      <h3 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
        <Icon size={16} style={{ color }} /> {label}
      </h3>
      <div className="mt-3 space-y-2.5">
        {hasItems ? children : (
          <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>{empty}</p>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  title,
  detail,
  badge,
  badgeColor,
}: {
  title: string;
  detail: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13.5px] font-semibold" style={{ color: "var(--c-ink)" }}>{title}</div>
        {badge && (
          <Badge style={{ background: badgeColor, color: "#fff" }} className="capitalize text-[10px]">{badge}</Badge>
        )}
      </div>
      <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--c-ink-soft)" }}>{detail}</p>
    </div>
  );
}
