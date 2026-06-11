import { useMemo } from "react";
import type { Task, TaskStatus } from "@workspace/api-client-react";
import { Sparkles } from "lucide-react";
import {
  PriorityIcon,
  STATUS_META,
  CampaignTag,
  EmptyState,
} from "./shared";
import { parseDueDate, formatShort, isOverdue } from "./dates";

type Group = {
  key: string;
  init: string;
  color: string;
  tasks: Task[];
};

const STATUS_ORDER: TaskStatus[] = [
  "backlog",
  "in_progress",
  "in_review",
  "done",
];

export default function WorkloadView({ tasks }: { tasks: Task[] }) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    const unassigned: Group = {
      key: "__unassigned",
      init: "?",
      color: "var(--c-muted)",
      tasks: [],
    };
    for (const task of tasks) {
      if (!task.assignees?.length) {
        unassigned.tasks.push(task);
        continue;
      }
      for (const a of task.assignees) {
        const existing = map.get(a.init);
        if (existing) existing.tasks.push(task);
        else map.set(a.init, { key: a.init, init: a.init, color: a.color, tasks: [task] });
      }
    }
    const result = [...map.values()].sort(
      (a, b) => b.tasks.length - a.tasks.length,
    );
    if (unassigned.tasks.length) result.push(unassigned);
    return result;
  }, [tasks]);

  const maxLoad = useMemo(
    () => Math.max(1, ...groups.map((g) => g.tasks.length)),
    [groups],
  );

  if (!tasks.length) {
    return <EmptyState message="No tasks match the current filters." />;
  }

  return (
    <div className="flex h-full gap-5">
      {groups.map((group) => {
        const open = group.tasks.filter((t) => t.status !== "done").length;
        const overdue = group.tasks.filter((t) => {
          const d = parseDueDate(t.dueDate);
          return d && isOverdue(d) && t.status !== "done";
        }).length;
        return (
          <div
            key={group.key}
            className="flex h-full w-[320px] shrink-0 flex-col"
          >
            <div className="mb-3 flex items-center gap-3 px-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white ring-2 ring-white"
                style={{ background: group.color }}
              >
                {group.init}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[13.5px] font-bold"
                    style={{ color: "var(--c-ink)" }}
                  >
                    {group.key === "__unassigned" ? "Unassigned" : group.init}
                  </span>
                  <span
                    className="text-[11.5px] font-semibold"
                    style={{ color: "var(--c-muted)" }}
                  >
                    {open} open
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: "var(--c-border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(group.tasks.length / maxLoad) * 100}%`,
                      background:
                        overdue > 0
                          ? "var(--c-rose)"
                          : "linear-gradient(90deg, var(--c-brand), var(--c-violet))",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="cadence-scroll flex-1 overflow-y-auto px-1 pb-4">
              <div className="flex flex-col gap-2.5">
                {group.tasks.map((task) => {
                  const meta = STATUS_META[task.status];
                  const due = parseDueDate(task.dueDate);
                  const od = due ? isOverdue(due) && task.status !== "done" : false;
                  return (
                    <div
                      key={`${group.key}-${task.id}`}
                      className="flex flex-col gap-2 rounded-xl p-3"
                      style={{
                        background: "var(--c-surface)",
                        border: "1px solid var(--c-border)",
                        boxShadow: "var(--c-shadow-sm)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <PriorityIcon priority={task.priority} />
                        <span
                          className="text-[10.5px] font-medium tracking-wide"
                          style={{ color: "var(--c-muted)" }}
                        >
                          {task.id}
                        </span>
                        {task.aiGenerated && (
                          <Sparkles size={11} style={{ color: "var(--c-brand)" }} />
                        )}
                        <span
                          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div
                        className="text-[13px] font-medium leading-snug"
                        style={{ color: "var(--c-ink)" }}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between">
                        {task.campaign ? (
                          <CampaignTag campaign={task.campaign} />
                        ) : (
                          <span />
                        )}
                        {due && (
                          <span
                            className="text-[11.5px] font-medium"
                            style={{
                              color: od ? "var(--c-rose)" : "var(--c-muted)",
                            }}
                          >
                            {formatShort(due)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {group.tasks.length === 0 && (
                  <div
                    className="rounded-xl border border-dashed py-6 text-center text-[12px]"
                    style={{
                      borderColor: "var(--c-border-strong)",
                      color: "var(--c-muted)",
                    }}
                  >
                    No tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
