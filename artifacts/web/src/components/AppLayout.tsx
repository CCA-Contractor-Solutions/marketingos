import { type ReactNode } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Megaphone,
  ListChecks,
  MessagesSquare,
  BarChart3,
  Sparkles,
  BookMarked,
  Search,
  Bell,
  Plus,
  ChevronsUpDown,
} from "lucide-react";

export type NavKey =
  | "dashboard"
  | "campaigns"
  | "tasks"
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
  {
    key: "collaboration",
    label: "Collaboration",
    href: "/collaboration",
    icon: MessagesSquare,
  },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "brand", label: "Brand Memory", href: "/brand", icon: BookMarked },
];

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
  return (
    <div
      className="cadence flex h-screen w-full overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden lg:flex w-[252px] shrink-0 flex-col"
        style={{
          background: "var(--c-surface)",
          borderRight: "1px solid var(--c-border)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 px-5"
          style={{ height: 68, borderBottom: "1px solid var(--c-border)" }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
              boxShadow: "0 6px 16px -6px rgba(79,70,229,0.7)",
            }}
          >
            <Sparkles size={18} strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[17px] font-bold">Cadence</div>
            <div
              className="text-[11px] font-medium"
              style={{ color: "var(--c-muted)" }}
            >
              Marketing OS
            </div>
          </div>
        </Link>

        {/* Workspace switcher */}
        <div className="px-3 pt-3">
          <button
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors"
            style={{
              background: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
            }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#11132a,#3b3f63)" }}
            >
              NV
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">Nova Labs</div>
              <div
                className="truncate text-[11px]"
                style={{ color: "var(--c-muted)" }}
              >
                Growth Team
              </div>
            </div>
            <ChevronsUpDown size={14} style={{ color: "var(--c-muted)" }} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3">
          <div
            className="px-2.5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--c-muted)" }}
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
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all"
                  style={{
                    color: on ? "var(--c-brand-600)" : "var(--c-ink-soft)",
                    background: on ? "var(--c-brand-50)" : "transparent",
                    boxShadow: on
                      ? "inset 0 0 0 1px rgba(79,70,229,0.12)"
                      : "none",
                  }}
                >
                  <Icon size={18} strokeWidth={on ? 2.4 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* AI assistant promo */}
        <div className="px-3 pb-4">
          <div
            className="relative overflow-hidden rounded-2xl p-3.5 text-white"
            style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed 70%,#a855f7)",
            }}
          >
            <div
              className="cadence-ai-glow pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full"
              style={{ background: "rgba(255,255,255,0.25)", filter: "blur(8px)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                <Sparkles size={14} /> Cadence AI
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-white/85">
                3 campaigns need attention and 2 tasks are overdue.
              </p>
              <Link
                href="/assistant"
                className="mt-2.5 block w-full rounded-lg bg-white/15 py-1.5 text-center text-[12px] font-semibold backdrop-blur transition-colors hover:bg-white/25"
              >
                Open assistant
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex shrink-0 items-center gap-4 px-6"
          style={{
            height: 68,
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid var(--c-border)",
          }}
        >
          <div className="min-w-0">
            <h1 className="font-display truncate text-[19px] font-bold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p
                className="truncate text-[12.5px]"
                style={{ color: "var(--c-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "var(--c-surface-2)",
                border: "1px solid var(--c-border)",
              }}
            >
              <Search size={15} style={{ color: "var(--c-muted)" }} />
              <input
                placeholder="Search campaigns, tasks…"
                className="w-44 bg-transparent text-[13px] outline-none placeholder:text-[var(--c-muted)]"
              />
            </div>
            {actions}
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "var(--c-surface-2)",
                border: "1px solid var(--c-border)",
              }}
            >
              <Bell size={16} style={{ color: "var(--c-ink-soft)" }} />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: "var(--c-coral)" }}
              />
            </button>
            <Link
              href="/campaigns"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))",
                boxShadow: "0 8px 18px -8px rgba(79,70,229,0.8)",
              }}
            >
              <Plus size={16} /> New campaign
            </Link>
            <div
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#fb6f5a,#f5a524)" }}
            >
              AR
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="cadence-scroll min-w-0 flex-1 overflow-y-auto">
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
