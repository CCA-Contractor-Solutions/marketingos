import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export function ModuleCard({
  title,
  actionLabel,
  actionHref,
  children,
  className = "",
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl p-5 ${className}`}
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[16px] font-bold">{title}</h2>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="flex items-center gap-1 text-[12px] font-semibold transition-colors hover:text-[var(--c-brand-600)]"
            style={{ color: "var(--c-brand)" }}
          >
            {actionLabel} <ArrowRight size={13} />
          </Link>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
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
