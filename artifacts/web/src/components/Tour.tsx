import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X, Check } from "lucide-react";

export type TourStep = {
  selector: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
};

export const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav"]',
    title: "Your navigation hub",
    body: "Jump between the Command Center, Campaigns, Tasks, the AI Assistant and more. Every workspace lives one click away here.",
    placement: "right",
  },
  {
    selector: '[data-tour="hero"]',
    title: "The Command Center",
    body: "This is mission control for your marketing. Plan, launch, optimize and grow — all from one colorful dashboard.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="kpis"]',
    title: "Metrics that matter",
    body: "Live KPIs — revenue pipeline, qualified leads, return on ad spend and more — update at a glance so you always know where you stand.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="modules"]',
    title: "Modern marketing modules",
    body: "Color-coded bands group everything: performance, the growth engine, campaigns, content and SEO, market intelligence, and brand signals.",
    placement: "top",
  },
  {
    selector: '[data-tour="copilot"]',
    title: "Your AI Copilot",
    body: "Ask for forecasts, draft press releases, diagnose ad health, or brainstorm ideas. Your assistant is always on, right beside your work.",
    placement: "left",
  },
  {
    selector: '[data-tour="new-campaign"]',
    title: "Launch in seconds",
    body: "Ready to go? Spin up a brand-new campaign from anywhere with this button. That's the tour — now go make some noise!",
    placement: "bottom",
  },
];

const PAD = 8;

type Rect = { top: number; left: number; width: number; height: number };

export function Tour({
  open,
  steps,
  onClose,
}: {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
}) {
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const present = steps.filter((s) => document.querySelector(s.selector));
    setActiveSteps(present.length > 0 ? present : steps);
    setIndex(0);
  }, [open, steps]);

  const current = activeSteps[index];

  const measure = () => {
    if (!current) return;
    const el = document.querySelector(current.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useLayoutEffect(() => {
    if (!open || !current) return;
    const el = document.querySelector(current.selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(measure, 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current, index]);

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, activeSteps]);

  if (!open || !current) return null;

  const isLast = index === activeSteps.length - 1;

  function next() {
    if (index < activeSteps.length - 1) setIndex((i) => i + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 720;
  const TIP_W = Math.min(340, vw - 32);

  let tipTop = vh / 2 - 90;
  let tipLeft = vw / 2 - TIP_W / 2;

  if (rect) {
    const placement = current.placement ?? "bottom";
    const cx = rect.left + rect.width / 2;
    if (placement === "bottom") {
      tipTop = rect.top + rect.height + PAD + 12;
      tipLeft = cx - TIP_W / 2;
    } else if (placement === "top") {
      tipTop = rect.top - PAD - 12 - 200;
      tipLeft = cx - TIP_W / 2;
    } else if (placement === "right") {
      tipTop = rect.top;
      tipLeft = rect.left + rect.width + PAD + 12;
    } else if (placement === "left") {
      tipTop = rect.top;
      tipLeft = rect.left - PAD - 12 - TIP_W;
    }
  }

  tipLeft = Math.max(16, Math.min(tipLeft, vw - TIP_W - 16));
  tipTop = Math.max(16, Math.min(tipTop, vh - 220));

  return createPortal(
    <div className="cadence" style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
      {/* click catcher */}
      <div
        style={{ position: "absolute", inset: 0, cursor: "default" }}
        onClick={onClose}
      />

      {/* spotlight */}
      {rect && (
        <div
          style={{
            position: "fixed",
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 16,
            boxShadow:
              "0 0 0 9999px rgba(9, 14, 24, 0.72), 0 0 0 2px var(--c-brand)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "none",
          }}
        />
      )}
      {!rect && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(9, 14, 24, 0.72)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* tooltip */}
      <div
        role="dialog"
        aria-label="Product tour"
        style={{
          position: "fixed",
          top: tipTop,
          left: tipLeft,
          width: TIP_W,
          background: "var(--c-surface)",
          borderRadius: 18,
          border: "1px solid var(--c-border)",
          boxShadow: "0 24px 60px -12px rgba(9,14,24,0.45)",
          padding: 18,
          transition: "top 0.3s cubic-bezier(0.16,1,0.3,1), left 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 18,
            right: 18,
            height: 4,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, var(--c-brand), var(--c-purple), var(--c-pink), var(--c-coral))",
          }}
        />
        <div className="flex items-start justify-between gap-3">
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "var(--c-brand)" }}
          >
            Step {index + 1} of {activeSteps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--c-surface-2)]"
            style={{ color: "var(--c-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        <h3
          className="font-display mt-2 text-[17px] font-bold leading-tight"
          style={{ color: "var(--c-ink)" }}
        >
          {current.title}
        </h3>
        <p
          className="mt-1.5 text-[13px] font-medium leading-relaxed"
          style={{ color: "var(--c-ink-soft)" }}
        >
          {current.body}
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          {activeSteps.map((_, i) => (
            <span
              key={i}
              style={{
                height: 6,
                width: i === index ? 18 : 6,
                borderRadius: 999,
                background: i === index ? "var(--c-brand)" : "var(--c-border)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-semibold transition-colors"
            style={{ color: "var(--c-muted)" }}
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[var(--c-surface-2)]"
                style={{
                  color: "var(--c-ink)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-white transition-transform hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
                boxShadow: "0 6px 16px -6px rgba(22,163,74,0.6)",
              }}
            >
              {isLast ? (
                <>
                  Finish <Check size={14} strokeWidth={3} />
                </>
              ) : (
                <>
                  Next <ArrowRight size={14} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
