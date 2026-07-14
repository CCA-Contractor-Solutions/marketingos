import { AppLayout } from "@/components/AppLayout";
import { BookMarked, Ban, MessageSquareWarning, Palette, Sparkles } from "lucide-react";

/**
 * Brand Memory — standing guardrails only.
 * Visual directions / mockups / full brand CMS still require Rose visual input first
 * (founder decision 2026-07-13). Do not invent a navy (or purple) default palette here.
 */
const GUARDRAILS: {
  icon: typeof Ban;
  title: string;
  body: string;
}[] = [
  {
    icon: Palette,
    title: "Ask Rose before branded visuals",
    body: "Dark navy is not the default/core build color. Do not force navy into interfaces or prompts. Before visual directions, mockups, dashboards, portals, or branded prompts — ask Rose for visual input. Older navy-heavy references are historical only.",
  },
  {
    icon: Ban,
    title: "No gold in CCA collateral",
    body: "CCA must not use gold in brand collateral or website materials.",
  },
  {
    icon: MessageSquareWarning,
    title: "Positioning principle (phrase not locked)",
    body: "CCA is technology-enabled and AI-supported, but human-reviewed and human-executed. Working training line exists (“Powered by AI. Reviewed and Executed by Humans.”) — do not treat it as final public copy until Rose locks it.",
  },
  {
    icon: Sparkles,
    title: "Who we talk to",
    body: "Target clients are contractor businesses with meaningful compliance exposure — not generic small businesses. Preliminary Exposure Review is a lead-capture tool only.",
  },
];

export default function BrandMemory() {
  return (
    <AppLayout
      active="brand"
      title="Brand Memory"
      subtitle="Standing guardrails — Rose visual input required before new palettes"
    >
      <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--c-shadow-sm)",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
            style={{
              background: "linear-gradient(135deg, var(--c-brand), var(--c-brand-600))",
              boxShadow: "0 10px 22px -10px rgba(13,148,136,0.7)",
            }}
          >
            <BookMarked size={22} />
          </div>
          <h2 className="font-display mt-4 text-[20px] font-bold">Brand Memory</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            This page holds <strong>approved standing rules</strong> so MarketingOS AI and drafts
            stay honest. Full voice/CMS packs and color systems ship only after Rose gives visual
            input for that build — not by copying historical navy defaults.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
            style={{ background: "var(--c-brand-50)", color: "var(--c-brand-600)" }}
          >
            <Sparkles size={14} /> Guardrails live · Palette pending Rose
          </div>
        </div>

        <ul className="grid gap-3">
          {GUARDRAILS.map((g) => {
            const Icon = g.icon;
            return (
              <li
                key={g.title}
                className="flex gap-3 rounded-2xl p-4 sm:p-5"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--c-brand-50)", color: "var(--c-brand-600)" }}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold">{g.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                    {g.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-center text-[12px]" style={{ color: "var(--c-muted)" }}>
          Source: Rose founder decisions 2026-07-13 · Company Brain + Command Center Decision Log D22 /
          M1–M5. Demo campaign widgets elsewhere remain demo-labeled until real feeds replace them.
        </p>
      </div>
    </AppLayout>
  );
}
