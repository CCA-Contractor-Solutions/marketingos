import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function ModuleCard({
  title,
  actionLabel,
  actionHref,
  icon: Icon,
  accent = "var(--c-brand)",
  children,
  className = "",
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
  accent?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 45%, transparent))`,
        }}
      />
      <div className={`flex flex-col flex-1 min-h-0 ${className}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #0b1224))`,
                  boxShadow: `0 4px 10px -3px color-mix(in srgb, ${accent} 70%, transparent)`,
                }}
              >
                <Icon size={16} strokeWidth={2.4} />
              </span>
            )}
            <h2 className="font-display truncate text-[16px] font-bold">{title}</h2>
          </div>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="flex shrink-0 items-center gap-1 text-[12px] font-semibold transition-colors hover:text-[var(--c-brand-600)]"
              style={{ color: "var(--c-brand)" }}
            >
              {actionLabel} <ArrowRight size={13} />
            </Link>
          )}
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 6,
  color = "var(--c-brand)",
  trackColor = "var(--c-surface-2)",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        stroke={trackColor}
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export function MiniBars({ data, height = 30, color = "var(--c-brand)" }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-full w-full" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm opacity-80 transition-all hover:opacity-100"
          style={{
            height: `${(val / max) * 100}%`,
            background: color,
            minHeight: "4px"
          }}
        />
      ))}
    </div>
  );
}
