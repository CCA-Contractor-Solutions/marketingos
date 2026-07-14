import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutDashboard,
  Megaphone,
  ListChecks,
  MessagesSquare,
  BarChart3,
  Sparkles,
  BookMarked,
  Bell,
  Plus,
  Menu,
  AlertTriangle,
  Activity,
  TrendingUp,
  Search,
  LineChart,
  BarChartBig,
  Eye,
  Lightbulb,
  Wallet,
  Filter,
  Newspaper,
  Mail,
  Brain,
  FileText,
  Star,
  Award,
  Video,
  CalendarClock,
  Gift,
  Workflow,
  Compass,
  Sparkle,
  Rocket,
  PenLine,
  Gauge,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { DemoBadge } from "@/components/DemoBadge";
import { Tour, TOUR_STEPS } from "@/components/Tour";

export type NavKey =
  | "welcome"
  | "dashboard"
  | "campaigns"
  | "tasks"
  | "assistant"
  | "collaboration"
  | "analytics"
  | "brand";

const NAV: {
  key: NavKey;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", label: "Command Center", href: "/", icon: LayoutDashboard },
  { key: "campaigns", label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { key: "tasks", label: "Tasks", href: "/tasks", icon: ListChecks },
  { key: "assistant", label: "AI Assistant", href: "/assistant", icon: Sparkles },
  {
    key: "collaboration",
    label: "Collaboration",
    href: "/collaboration",
    icon: MessagesSquare,
  },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "brand", label: "Brand Memory", href: "/brand", icon: BookMarked },
];

type ModuleItem = { id: string; label: string; icon: typeof LayoutDashboard };

const MODULE_GROUPS: {
  label: string;
  icon: typeof LayoutDashboard;
  items: ModuleItem[];
}[] = [
  {
    label: "Performance Pulse",
    icon: Gauge,
    items: [
      { id: "executive-health", label: "Executive Health", icon: Activity },
      { id: "roi-leads", label: "ROI on Leads", icon: TrendingUp },
      { id: "budget-pacing", label: "Budget Pacing", icon: Wallet },
      { id: "funnel-quality", label: "Funnel Quality", icon: Filter },
    ],
  },
  {
    label: "Growth Engine",
    icon: Rocket,
    items: [
      { id: "social-pulse", label: "Social Pulse", icon: Video },
      { id: "webinars", label: "Webinars & Events", icon: CalendarClock },
      { id: "referral-engine", label: "Referral Engine", icon: Gift },
      { id: "automation-flows", label: "Automation Flows", icon: Workflow },
    ],
  },
  {
    label: "Campaigns & Ads",
    icon: Megaphone,
    items: [
      { id: "campaign-center", label: "Campaign Center", icon: Megaphone },
      { id: "ad-health", label: "Ad Health", icon: Activity },
      { id: "email-builder", label: "Email Builder", icon: Mail },
    ],
  },
  {
    label: "Content & SEO",
    icon: PenLine,
    items: [
      { id: "seo-analytics", label: "SEO Analytics", icon: Search },
      { id: "seo-suggestions", label: "SEO Suggestions", icon: Lightbulb },
      { id: "content-opportunities", label: "Content Ideas", icon: FileText },
      { id: "press-releases", label: "Press Releases", icon: Newspaper },
    ],
  },
  {
    label: "Market Intelligence",
    icon: BarChartBig,
    items: [
      { id: "futurecast", label: "Futurecast", icon: LineChart },
      { id: "market-trends", label: "Market Trends", icon: BarChartBig },
      { id: "competitor-watch", label: "Competitor Watch", icon: Eye },
    ],
  },
  {
    label: "Brand & Signals",
    icon: Star,
    items: [
      { id: "reputation", label: "Reputation Signals", icon: Star },
      { id: "award-center", label: "Award Center", icon: Award },
      { id: "brainstorm", label: "Brainstorm Corner", icon: Brain },
      { id: "ai-suggestions", label: "AI Suggestions", icon: Sparkles },
      { id: "needs-attention", label: "Needs Attention", icon: AlertTriangle },
    ],
  },
];

const SECTION_LABEL =
  "px-2.5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-wider text-blue-200/50";

function SidebarContent({
  active,
  attentionCount,
  overdueCount,
  onNavigate,
  onStartTour,
}: {
  active: NavKey;
  attentionCount: number;
  overdueCount: number;
  onNavigate?: () => void;
  onStartTour: () => void;
}) {
  const [location, setLocation] = useLocation();

  const goToModule = (id: string) => {
    const scrollWhenReady = (attempts = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts < 30) {
        window.requestAnimationFrame(() => scrollWhenReady(attempts + 1));
      }
    };
    onNavigate?.();
    if (location !== "/") {
      setLocation("/");
    }
    scrollWhenReady();
  };

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 text-white"
        style={{ height: 68, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <BrandMark size={38} />
        <div className="leading-tight">
          <div className="font-display text-[16px] font-bold">
            <span
              style={{
                background:
                  "linear-gradient(90deg, var(--c-violet), var(--c-purple))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              MarketingOS
            </span>
          </div>
          <div className="text-[11px] font-medium text-blue-200/70">
            Command Center
          </div>
        </div>
      </Link>

      <nav data-tour="nav" className="flex-1 overflow-y-auto px-3 py-3">
        {/* Getting Started */}
        <div className={SECTION_LABEL.replace("pt-5", "pt-2")}>
          Getting Started
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/welcome"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all"
            style={{
              color: active === "welcome" ? "#fff" : "rgba(255,255,255,0.6)",
              background:
                active === "welcome" ? "rgba(255,255,255,0.1)" : "transparent",
              boxShadow:
                active === "welcome"
                  ? "inset 0 0 0 1px rgba(255,255,255,0.1)"
                  : "none",
            }}
          >
            <Sparkle size={18} strokeWidth={active === "welcome" ? 2.4 : 2} />
            <span>Welcome Center</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onStartTour();
            }}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13.5px] font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            <Compass size={18} strokeWidth={2} />
            <span>Take a tour</span>
          </button>
        </div>

        {/* Workspace */}
        <div className={SECTION_LABEL}>Workspace</div>
        <div className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const on = item.key === active;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all"
                style={{
                  color: on ? "#fff" : "rgba(255,255,255,0.6)",
                  background: on ? "rgba(255,255,255,0.1)" : "transparent",
                  boxShadow: on ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : "none",
                }}
              >
                <Icon size={18} strokeWidth={on ? 2.4 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Modules grouped */}
        {MODULE_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.label}>
              <div className={`${SECTION_LABEL} flex items-center gap-1.5`}>
                <GroupIcon size={11} strokeWidth={2.5} />
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => goToModule(m.id)}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-medium text-white/55 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <Icon size={16} strokeWidth={2} className="shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* AI Copilot — real-data counts */}
      <div className="px-3 pb-3">
        <Link
          href="/assistant"
          onClick={onNavigate}
          className="relative block overflow-hidden rounded-2xl p-3.5 text-white transition-transform hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, var(--c-brand), var(--c-navy-2))",
            boxShadow: "0 14px 28px -12px rgba(13,148,136,0.55)",
          }}
        >
          <div
            className="cadence-ai-glow pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full"
            style={{ background: "rgba(255,255,255,0.22)", filter: "blur(8px)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold">
              <Sparkles size={14} /> MarketingOS AI Copilot
            </div>
            <p className="mt-1 text-[11.5px] leading-snug text-white/85">
              {attentionCount} item{attentionCount === 1 ? "" : "s"} need
              {attentionCount === 1 ? "s" : ""} attention
              {overdueCount > 0
                ? ` · ${overdueCount} task${overdueCount === 1 ? "" : "s"} overdue`
                : ""}
              .
            </p>
            <span className="mt-2.5 block w-full rounded-lg bg-white/15 py-1.5 text-center text-[12px] font-semibold backdrop-blur transition-colors hover:bg-white/25">
              Open assistant
            </span>
          </div>
        </Link>
      </div>

      {/* Brand tagline + user */}
      <div
        className="px-3 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className="px-1 pb-3 text-[11px] font-medium italic leading-snug text-blue-200/55">
          Plan. Launch. Optimize. Grow.
        </p>
        <div className="flex items-center gap-2.5 px-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--c-brand), var(--c-navy-2))",
            }}
          >
            JM
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold text-white">
              Jessica Miller
            </div>
            <div className="truncate text-[11px] text-blue-200/55">
              Marketing Director
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: NavKey;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { data } = useGetDashboardSummary();
  const attention = data?.attention ?? [];
  const attentionCount = attention.length;
  const overdueCount = data?.taskRollup?.overdue ?? 0;

  const startTour = () => {
    if (active === "dashboard") {
      setTourOpen(true);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("start-tour", "1");
      }
      setLocation("/");
    }
  };

  useEffect(() => {
    if (active !== "dashboard") return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("start-tour") === "1") {
      sessionStorage.removeItem("start-tour");
      const t = setTimeout(() => setTourOpen(true), 500);
      return () => clearTimeout(t);
    }
    if (localStorage.getItem("marketingos-tour-seen") === "1") return;
    const t = setTimeout(() => {
      setTourOpen(true);
      localStorage.setItem("marketingos-tour-seen", "1");
    }, 900);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      className="cadence flex h-screen w-full overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-[260px] shrink-0 flex-col"
        style={{
          background: "linear-gradient(180deg, #0a1410 0%, #05090a 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "1px 0 32px rgba(0,0,0,0.45)",
        }}
      >
        <SidebarContent
          active={active}
          attentionCount={attentionCount}
          overdueCount={overdueCount}
          onStartTour={startTour}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="cadence w-[280px] p-0 border-r-[#16201a]"
          style={{ background: "#0a1410" }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            active={active}
            attentionCount={attentionCount}
            overdueCount={overdueCount}
            onNavigate={() => setNavOpen(false)}
            onStartTour={startTour}
          />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="relative flex shrink-0 items-center gap-4 px-4 sm:px-8"
          style={{
            height: 76,
            background: "var(--c-surface)",
            borderBottom: "1px solid var(--c-border)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, var(--c-brand), color-mix(in srgb, var(--c-brand) 55%, var(--c-teal)), transparent)",
            }}
          />
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lg:hidden"
            style={{
              background: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
              color: "var(--c-ink)",
            }}
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="font-display truncate text-[22px] font-bold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p
                className="truncate text-[13px] font-medium"
                style={{ color: "var(--c-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <DemoBadge className="hidden sm:inline-flex" />
            {actions}

            <button
              type="button"
              onClick={startTour}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--c-surface-2)]"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                color: "var(--c-ink-soft)",
              }}
            >
              <Compass size={16} style={{ color: "var(--c-brand)" }} />
              <span className="hidden md:inline">Take a tour</span>
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--c-surface-2)]"
                  style={{
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  <Bell size={18} style={{ color: "var(--c-ink-soft)" }} />
                  {attentionCount > 0 && (
                    <span
                      className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-[var(--c-surface)]"
                      style={{ background: "var(--c-rose)" }}
                    />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="cadence w-80 p-0"
                style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface-2)" }}
                >
                  <AlertTriangle size={15} style={{ color: "var(--c-amber)" }} />
                  <span className="text-[13.5px] font-semibold">
                    Needs Attention
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {attentionCount === 0 ? (
                    <div
                      className="px-4 py-8 text-center text-[13px] font-medium"
                      style={{ color: "var(--c-muted)" }}
                    >
                      You're all caught up.
                    </div>
                  ) : (
                    attention.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 px-4 py-3"
                        style={{ borderBottom: "1px solid var(--c-border)" }}
                      >
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{
                            background:
                              a.severity === "high"
                                ? "var(--c-rose)"
                                : "var(--c-amber)",
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium leading-snug">
                            {a.title}
                          </div>
                          <div
                            className="mt-1 text-[11.5px] font-medium"
                            style={{ color: "var(--c-muted)" }}
                          >
                            {a.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Link
              href="/campaigns"
              data-tour="new-campaign"
              className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-white sm:flex transition-transform hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, var(--c-brand), var(--c-brand-600))",
                boxShadow: "0 6px 16px -4px rgba(13,148,136,0.45)",
              }}
            >
              <Plus size={16} strokeWidth={3} /> New campaign
            </Link>

            <div className="h-6 w-px bg-[var(--c-border)] mx-1" />

            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold text-white shadow-sm ring-1 ring-[var(--c-border)]"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
              }}
            >
              JM
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="cadence-scroll min-w-0 flex-1 overflow-y-auto bg-[var(--c-bg)]">
          {children}
        </main>
      </div>

      <Tour open={tourOpen} steps={TOUR_STEPS} onClose={() => setTourOpen(false)} />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center p-20">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
        style={{
          borderTopColor: "var(--c-brand)",
          borderRightColor: "var(--c-brand)",
        }}
      />
    </div>
  );
}

export function PageError({ message }: { message?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-20 text-center">
      <div className="font-display text-[16px] font-bold" style={{ color: "var(--c-ink)" }}>
        Something went wrong
      </div>
      <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
        {message ?? "Unable to load data. Please try again."}
      </div>
    </div>
  );
}
