import { type ReactNode, useState } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import { CcaLogo } from "@/components/CcaLogo";

export type NavKey =
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

function SidebarContent({
  active,
  attentionCount,
  overdueCount,
  onNavigate,
}: {
  active: NavKey;
  attentionCount: number;
  overdueCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 text-white"
        style={{ height: 68, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <CcaLogo size={36} />
        <div className="leading-tight">
          <div className="font-display text-[17px] font-bold">CCA</div>
          <div
            className="text-[11px] font-medium text-blue-200/70"
          >
            Contractor Compliance Authority
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div
          className="px-2.5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-blue-200/50"
        >
          Workspace
        </div>
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
      </nav>

      {/* AI Copilot — real-data counts */}
      <div className="px-3 pb-3">
        <Link
          href="/assistant"
          onClick={onNavigate}
          className="relative block overflow-hidden rounded-2xl p-3.5 text-white transition-transform hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, var(--c-brand), var(--c-navy-2))",
            boxShadow: "0 10px 22px -10px rgba(37,99,235,0.7)",
          }}
        >
          <div
            className="cadence-ai-glow pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full"
            style={{ background: "rgba(255,255,255,0.22)", filter: "blur(8px)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold">
              <Sparkles size={14} /> CCA AI Copilot
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
          Your license. Our expertise. Your success.
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
  const { data } = useGetDashboardSummary();
  const attention = data?.attention ?? [];
  const attentionCount = attention.length;
  const overdueCount = data?.taskRollup?.overdue ?? 0;

  return (
    <div
      className="cadence flex h-screen w-full overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-[260px] shrink-0 flex-col"
        style={{
          background: "linear-gradient(180deg, #090e18 0%, #060913 100%)",
          borderRight: "1px solid var(--c-border)",
          boxShadow: "1px 0 24px rgba(0,0,0,0.4)"
        }}
      >
        <SidebarContent
          active={active}
          attentionCount={attentionCount}
          overdueCount={overdueCount}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="cadence w-[280px] p-0 border-r-[#20273a]"
          style={{ background: "#090e18" }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            active={active}
            attentionCount={attentionCount}
            overdueCount={overdueCount}
            onNavigate={() => setNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex shrink-0 items-center gap-4 px-4 sm:px-8"
          style={{
            height: 76,
            background: "var(--c-surface)",
            borderBottom: "1px solid var(--c-border)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
          }}
        >
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
            {actions}

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
              className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-white sm:flex transition-transform hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
                boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
              }}
            >
              <Plus size={16} strokeWidth={3} /> New campaign
            </Link>

            <div className="h-6 w-px bg-[var(--c-border)] mx-1" />

            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold text-white shadow-sm ring-1 ring-[var(--c-border)]"
              style={{
                background:
                  "linear-gradient(135deg, #1e293b, #0f172a)",
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
