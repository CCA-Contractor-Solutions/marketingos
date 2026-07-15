import { useRef } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { WelcomeWalkthrough } from "@/components/WelcomeWalkthrough";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Compass,
  PlayCircle,
  ArrowRight,
  LayoutDashboard,
  Megaphone,
  ListChecks,
  Sparkles,
  MessagesSquare,
  BarChart3,
  BookMarked,
  Rocket,
} from "lucide-react";

const GUIDE: {
  value: string;
  title: string;
  icon: typeof LayoutDashboard;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    value: "command-center",
    title: "Command Center",
    icon: LayoutDashboard,
    body: "Your home base. Live KPIs, color-coded module bands, and an AI copilot panel give you the full marketing pulse the moment you log in.",
    href: "/",
    cta: "Open Command Center",
  },
  {
    value: "campaigns",
    title: "Campaigns",
    icon: Megaphone,
    body: "Plan, launch, and track every campaign in one place. Drill into a campaign to see performance, assets, and AI-generated insights.",
    href: "/campaigns",
    cta: "View campaigns",
  },
  {
    value: "tasks",
    title: "Tasks",
    icon: ListChecks,
    body: "Keep the team moving with a board, list, calendar, timeline, and workload views. Set priorities and due dates that surface in Needs Attention.",
    href: "/tasks",
    cta: "Open tasks",
  },
  {
    value: "assistant",
    title: "AI Assistant",
    icon: Sparkles,
    body: "Ask MarketingOS AI to write copy, analyze results, forecast outcomes, or brainstorm ideas — answers arrive in seconds, grounded in your data.",
    href: "/assistant",
    cta: "Chat with AI",
  },
  {
    value: "collaboration",
    title: "Collaboration",
    icon: MessagesSquare,
    body: "Threads, mentions, and shared context keep marketing conversations next to the work, with AI summaries so nobody misses a beat.",
    href: "/collaboration",
    cta: "Open collaboration",
  },
  {
    value: "analytics",
    title: "Analytics",
    icon: BarChart3,
    body: "Dive into performance across channels with rich charts and AI insights that explain what changed and what to do next.",
    href: "/analytics",
    cta: "Explore analytics",
  },
  {
    value: "brand",
    title: "Brand Memory",
    icon: BookMarked,
    body: "Your voice, tone, and guidelines in one living source of truth, so every campaign and AI draft stays perfectly on-brand.",
    href: "/brand",
    cta: "Open Brand Memory",
  },
];

const QUICK_START = [
  { title: "Launch a campaign", desc: "Spin up your first campaign in seconds.", href: "/campaigns", icon: Megaphone, color: "var(--c-coral)" },
  { title: "Ask the AI Copilot", desc: "Draft, analyze, and forecast instantly.", href: "/assistant", icon: Sparkles, color: "var(--c-violet)" },
  { title: "Check your metrics", desc: "See live KPIs on the Command Center.", href: "/", icon: BarChart3, color: "var(--c-brand)" },
  { title: "Organize your tasks", desc: "Plan the work across five views.", href: "/tasks", icon: ListChecks, color: "var(--c-emerald)" },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLDivElement>(null);

  const startTour = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("start-tour", "1");
    }
    setLocation("/");
  };

  const scrollToVideo = () => {
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppLayout
      active="welcome"
      title="Welcome Center"
      subtitle="Everything you need to get started with MarketingOS"
    >
      <div className="mx-auto max-w-[1100px] space-y-10 p-4 pb-20 sm:p-6 lg:p-8">
        {/* Hero */}
        <div
          className="cadence-rise relative overflow-hidden rounded-3xl px-7 py-10 text-white sm:px-10 sm:py-12"
          style={{
            background: "linear-gradient(120deg, #090e18 0%, #134e4a 68%, #0d9488 100%)",
            boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="cadence-ai-glow pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full"
            style={{ background: "rgba(124,58,237,0.35)", filter: "blur(40px)" }}
          />
          <div
            className="cadence-ai-glow pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full"
            style={{ background: "rgba(20,184,166,0.25)", filter: "blur(44px)", animationDelay: "0.8s" }}
          />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-200">
              <Sparkles size={14} /> Marketing Operations Platform
            </div>
            <h2 className="font-display mt-3 text-[32px] font-bold leading-tight sm:text-[44px] tracking-tight">
              Welcome to{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #a78bfa, #e879f9, #818cf8)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                MarketingOS
              </span>{" "}
              Command Center
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-emerald-100/85 sm:text-[16px]">
              One workspace to plan, launch, optimize, and grow every marketing
              effort. Watch the quick walkthrough, take a guided tour, or jump
              straight into the action below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToVideo}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold text-white transition-transform hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #0d9488)",
                  boxShadow: "0 10px 24px -8px rgba(124,58,237,0.7)",
                }}
              >
                <PlayCircle size={18} /> Watch walkthrough
              </button>
              <button
                type="button"
                onClick={startTour}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold text-white transition-colors"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Compass size={18} /> Start guided tour
              </button>
            </div>
          </div>
        </div>

        {/* Walkthrough video */}
        <div ref={videoRef} className="scroll-mt-6">
          <div className="mb-4 flex items-center gap-2">
            <PlayCircle size={20} style={{ color: "var(--c-brand)" }} />
            <h3 className="font-display text-[20px] font-bold" style={{ color: "var(--c-ink)" }}>
              The 60-second walkthrough
            </h3>
          </div>
          <p className="mb-5 text-[14px] font-medium" style={{ color: "var(--c-muted)" }}>
            A narrated, animated tour of everything MarketingOS Command Center can do.
          </p>
          <WelcomeWalkthrough />
        </div>

        {/* Quick start */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Rocket size={20} style={{ color: "var(--c-purple)" }} />
            <h3 className="font-display text-[20px] font-bold" style={{ color: "var(--c-ink)" }}>
              Quick start
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_START.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.title}
                  href={q.href}
                  className="group flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${q.color} 14%, transparent)`, color: q.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="mt-4 font-display text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                    {q.title}
                  </div>
                  <p className="mt-1 flex-1 text-[13px] font-medium leading-snug" style={{ color: "var(--c-muted)" }}>
                    {q.desc}
                  </p>
                  <span
                    className="mt-3 flex items-center gap-1 text-[13px] font-semibold transition-colors"
                    style={{ color: "var(--c-brand)" }}
                  >
                    Go <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User guide */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <BookMarked size={20} style={{ color: "var(--c-sky)" }} />
            <h3 className="font-display text-[20px] font-bold" style={{ color: "var(--c-ink)" }}>
              User guide
            </h3>
          </div>
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
          >
            <Accordion type="single" collapsible className="w-full">
              {GUIDE.map((g) => {
                const Icon = g.icon;
                return (
                  <AccordionItem
                    key={g.value}
                    value={g.value}
                    className="border-b px-5"
                    style={{ borderColor: "var(--c-border)" }}
                  >
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <span className="flex items-center gap-3 text-left">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: "var(--c-surface-2)", color: "var(--c-brand)" }}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="font-display text-[15px] font-bold" style={{ color: "var(--c-ink)" }}>
                          {g.title}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <p className="text-[13.5px] font-medium leading-relaxed" style={{ color: "var(--c-ink-soft)" }}>
                        {g.body}
                      </p>
                      <Link
                        href={g.href}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-transform hover:scale-105"
                        style={{
                          background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
                          color: "#fff",
                        }}
                      >
                        {g.cta} <ArrowRight size={14} />
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>

        {/* Guided tour banner */}
        <div
          className="relative overflow-hidden rounded-3xl px-7 py-8 text-white sm:px-10"
          style={{
            background: "linear-gradient(120deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="cadence-ai-glow pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full"
            style={{ background: "rgba(168,85,247,0.4)", filter: "blur(40px)" }}
          />
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                <Compass size={14} /> Guided tour
              </div>
              <h3 className="font-display mt-2 text-[22px] font-bold leading-tight sm:text-[26px]">
                Prefer a hands-on tour of the app?
              </h3>
              <p className="mt-2 text-[14px] text-indigo-100/85">
                We'll spotlight each part of the Command Center, one step at a time.
              </p>
            </div>
            <button
              type="button"
              onClick={startTour}
              className="flex shrink-0 items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-bold transition-transform hover:scale-105"
              style={{ background: "#fff", color: "#312e81" }}
            >
              <Compass size={18} /> Start the tour
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
