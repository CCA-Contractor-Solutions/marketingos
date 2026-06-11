import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import "../_group.css";
import { useAppState } from "../state/AppState";
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
  X,
} from "lucide-react";

type NavKey =
  | "dashboard"
  | "campaigns"
  | "tasks"
  | "collaboration"
  | "analytics"
  | "brand";

const NAV: {
  key: NavKey;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}[] = [
  { key: "dashboard", label: "Command Center", icon: LayoutDashboard, path: "/" },
  { key: "campaigns", label: "Campaigns", icon: Megaphone, path: "/campaigns" },
  { key: "tasks", label: "Tasks", icon: ListChecks, path: "/tasks" },
  { key: "collaboration", label: "Collaboration", icon: MessagesSquare, path: "/collaboration" },
  { key: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { key: "brand", label: "Brand Memory", icon: BookMarked, path: "/brand" },
];

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [location, navigate] = useLocation();
  const { addCampaign } = useAppState();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const isActive = (path: string) =>
    path === "/"
      ? location === "/"
      : location === path || location.startsWith(path + "/");
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
        <div
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
        </div>

        {/* Workspace switcher */}
        <div className="px-3 pt-3">
          <button
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors"
            style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#11132a,#3b3f63)" }}
            >
              NV
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">Nova Labs</div>
              <div className="truncate text-[11px]" style={{ color: "var(--c-muted)" }}>
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
              const on = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.path}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all"
                  style={{
                    color: on ? "var(--c-brand-600)" : "var(--c-ink-soft)",
                    background: on ? "var(--c-brand-50)" : "transparent",
                    boxShadow: on ? "inset 0 0 0 1px rgba(79,70,229,0.12)" : "none",
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
              <p className="truncate text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
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
              style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
            >
              <Bell size={16} style={{ color: "var(--c-ink-soft)" }} />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: "var(--c-coral)" }}
              />
            </button>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))",
                boxShadow: "0 8px 18px -8px rgba(79,70,229,0.8)",
              }}
            >
              <Plus size={16} /> New campaign
            </button>
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

      {showNewCampaign && (
        <NewCampaignModal
          onClose={() => setShowNewCampaign(false)}
          onCreate={(input) => {
            addCampaign(input);
            setShowNewCampaign(false);
            navigate("/");
          }}
        />
      )}
    </div>
  );
}

const CHANNEL_OPTIONS = ["Email", "LinkedIn", "Twitter", "Display", "Webinar", "PR"];

function NewCampaignModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    name: string;
    owner: string;
    budget: string;
    channels: string[];
  }) => void;
}) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [budget, setBudget] = useState("");
  const [channels, setChannels] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleChannel = (c: string) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({
      name: trimmed,
      owner: owner.trim() || "You",
      budget: budget.trim() ? (budget.trim().startsWith("$") ? budget.trim() : `$${budget.trim()}`) : "$0",
      channels,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(17,19,42,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-campaign-title"
        className="cadence-rise w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "0 24px 48px -12px rgba(17,19,42,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <h2 id="new-campaign-title" className="font-display text-[16px] font-bold">New campaign</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: "var(--c-muted)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Field label="Campaign name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Q4 Holiday Push"
              className="w-full rounded-xl px-3 py-2 text-[13.5px] outline-none focus:border-[var(--c-brand)]"
              style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner">
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl px-3 py-2 text-[13.5px] outline-none focus:border-[var(--c-brand)]"
                style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
              />
            </Field>
            <Field label="Budget">
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$50K"
                className="w-full rounded-xl px-3 py-2 text-[13.5px] outline-none focus:border-[var(--c-brand)]"
                style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)", color: "var(--c-ink)" }}
              />
            </Field>
          </div>

          <Field label="Channels">
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((c) => {
                const on = channels.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleChannel(c)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all"
                    style={{
                      background: on ? "var(--c-brand-50)" : "var(--c-surface-2)",
                      border: `1px solid ${on ? "var(--c-brand)" : "var(--c-border)"}`,
                      color: on ? "var(--c-brand-600)" : "var(--c-ink-soft)",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--c-border)" }}>
          <button
            onClick={onClose}
            className="rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-black/5"
            style={{ color: "var(--c-ink-soft)", border: "1px solid var(--c-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,var(--c-brand),var(--c-violet))" }}
          >
            Create campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
