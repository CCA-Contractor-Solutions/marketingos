import type { Task, TaskStatus, TaskPriority } from "@workspace/api-client-react";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  backlog: { label: "Backlog", color: "var(--c-ink-soft)", bg: "var(--c-border)" },
  in_progress: {
    label: "In Progress",
    color: "var(--c-brand)",
    bg: "var(--c-brand-50)",
  },
  in_review: {
    label: "In Review",
    color: "#9a6a00",
    bg: "rgba(245,165,36,0.16)",
  },
  done: { label: "Done", color: "#0c7a59", bg: "rgba(24,179,134,0.16)" },
};

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string }
> = {
  high: { label: "High", color: "var(--c-rose)" },
  medium: { label: "Medium", color: "var(--c-amber)" },
  low: { label: "Low", color: "var(--c-emerald)" },
};

export function PriorityIcon({ priority }: { priority: TaskPriority }) {
  const color = PRIORITY_META[priority].color;
  if (priority === "high") return <ArrowUp size={14} style={{ color }} />;
  if (priority === "medium") return <ArrowRight size={14} style={{ color }} />;
  return <ArrowDown size={14} style={{ color }} />;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
      style={{ color: meta.color }}
    >
      <PriorityIcon priority={priority} />
      {meta.label}
    </span>
  );
}

export function AssigneeStack({
  assignees,
  size = 24,
}: {
  assignees: Task["assignees"];
  size?: number;
}) {
  if (!assignees?.length) {
    return (
      <span className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>
        Unassigned
      </span>
    );
  }
  return (
    <div className="flex -space-x-1.5">
      {assignees.map((user, i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
          style={{
            background: user.color,
            width: size,
            height: size,
            fontSize: size * 0.38,
          }}
        >
          {user.init}
        </div>
      ))}
    </div>
  );
}

export function CampaignTag({ campaign }: { campaign: string }) {
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
      style={{
        background: "var(--c-surface-2)",
        border: "1px solid var(--c-border)",
        color: "var(--c-ink-soft)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--c-brand)" }}
      />
      {campaign}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex h-full min-h-[200px] items-center justify-center text-[13px]"
      style={{ color: "var(--c-muted)" }}
    >
      {message}
    </div>
  );
}
