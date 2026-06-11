import { useMemo, useState } from "react";
import type { Task } from "@workspace/api-client-react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Sparkles } from "lucide-react";
import {
  StatusBadge,
  PriorityBadge,
  AssigneeStack,
  PRIORITY_META,
  STATUS_META,
  EmptyState,
} from "./shared";
import { parseDueDate, formatShort, isOverdue } from "./dates";

type SortKey = "title" | "status" | "priority" | "dueDate" | "campaign";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  backlog: 0,
  in_progress: 1,
  in_review: 2,
  done: 3,
};
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function compare(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "priority":
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case "campaign":
      return (a.campaign ?? "").localeCompare(b.campaign ?? "");
    case "dueDate": {
      const da = parseDueDate(a.dueDate);
      const db = parseDueDate(b.dueDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    }
  }
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className="sticky top-0 z-10 select-none px-4 py-3"
      style={{ background: "var(--c-surface)" }}
    >
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider transition-colors ${
          align === "right" ? "justify-end" : ""
        }`}
        style={{ color: active ? "var(--c-ink)" : "var(--c-muted)" }}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )
        ) : (
          <ChevronsUpDown size={13} className="opacity-50" />
        )}
      </button>
    </th>
  );
}

export default function ListView({ tasks }: { tasks: Task[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      const r = compare(a, b, sortKey);
      return sortDir === "asc" ? r : -r;
    });
    return copy;
  }, [tasks, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (!tasks.length) {
    return <EmptyState message="No tasks match the current filters." />;
  }

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
            <SortHeader
              label="Task"
              active={sortKey === "title"}
              dir={sortDir}
              onClick={() => toggleSort("title")}
            />
            <SortHeader
              label="Status"
              active={sortKey === "status"}
              dir={sortDir}
              onClick={() => toggleSort("status")}
            />
            <SortHeader
              label="Priority"
              active={sortKey === "priority"}
              dir={sortDir}
              onClick={() => toggleSort("priority")}
            />
            <SortHeader
              label="Campaign"
              active={sortKey === "campaign"}
              dir={sortDir}
              onClick={() => toggleSort("campaign")}
            />
            <SortHeader
              label="Due"
              active={sortKey === "dueDate"}
              dir={sortDir}
              onClick={() => toggleSort("dueDate")}
            />
            <th
              className="sticky top-0 z-10 px-4 py-3 text-right text-[11.5px] font-bold uppercase tracking-wider"
              style={{ background: "var(--c-surface)", color: "var(--c-muted)" }}
            >
              Assignees
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => {
            const due = parseDueDate(task.dueDate);
            const overdue = due ? isOverdue(due) && task.status !== "done" : false;
            return (
              <tr
                key={task.id}
                className="transition-colors hover:bg-[var(--c-surface-2)]"
                style={{ borderBottom: "1px solid var(--c-border)" }}
              >
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium tracking-wide"
                        style={{ color: "var(--c-muted)" }}
                      >
                        {task.id}
                      </span>
                      {task.aiGenerated && (
                        <span
                          className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
                          }}
                        >
                          <Sparkles size={8} /> AI
                        </span>
                      )}
                      {task.blocked && (
                        <span
                          className="rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: "rgba(244,63,107,0.12)",
                            color: "var(--c-rose)",
                          }}
                        >
                          Blocked
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[13.5px] font-medium leading-snug"
                      style={{ color: "var(--c-ink)" }}
                    >
                      {task.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3 align-middle">
                  {task.campaign ? (
                    <span
                      className="text-[12.5px] font-medium"
                      style={{ color: "var(--c-ink-soft)" }}
                    >
                      {task.campaign}
                    </span>
                  ) : (
                    <span
                      className="text-[12.5px]"
                      style={{ color: "var(--c-muted)" }}
                    >
                      —
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  {due ? (
                    <span
                      className="text-[12.5px] font-medium"
                      style={{
                        color: overdue ? "var(--c-rose)" : "var(--c-ink-soft)",
                      }}
                    >
                      {formatShort(due)}
                    </span>
                  ) : (
                    <span
                      className="text-[12.5px]"
                      style={{ color: "var(--c-muted)" }}
                    >
                      No date
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex justify-end">
                    <AssigneeStack assignees={task.assignees} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
        className="px-4 py-2.5 text-[11.5px] font-medium"
        style={{ color: "var(--c-muted)", background: "var(--c-surface-2)" }}
      >
        {sorted.length} task{sorted.length === 1 ? "" : "s"} ·{" "}
        {Object.entries(STATUS_META)
          .map(
            ([s, meta]) =>
              `${tasks.filter((t) => t.status === s).length} ${meta.label.toLowerCase()}`,
          )
          .join(" · ")}{" "}
        ·{" "}
        {Object.entries(PRIORITY_META)
          .map(
            ([p, meta]) =>
              `${tasks.filter((t) => t.priority === p).length} ${meta.label.toLowerCase()}`,
          )
          .join(" · ")}
      </div>
    </div>
  );
}
