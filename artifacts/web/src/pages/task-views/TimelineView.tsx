import { useMemo } from "react";
import type { Task } from "@workspace/api-client-react";
import { Sparkles } from "lucide-react";
import { PriorityIcon, STATUS_META, AssigneeStack, EmptyState } from "./shared";
import {
  parseDueDate,
  startOfDay,
  dayDiff,
  isSameDay,
  formatShort,
} from "./dates";

const DAY_WIDTH = 44;
const LABEL_WIDTH = 260;

type DatedTask = { task: Task; date: Date };

export default function TimelineView({ tasks }: { tasks: Task[] }) {
  const today = useMemo(() => startOfDay(new Date()), []);

  const dated = useMemo<DatedTask[]>(
    () =>
      tasks
        .map((task) => ({ task, date: parseDueDate(task.dueDate) }))
        .filter((t): t is DatedTask => t.date !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [tasks],
  );

  const unscheduled = useMemo(
    () => tasks.filter((t) => !parseDueDate(t.dueDate)),
    [tasks],
  );

  const range = useMemo(() => {
    if (!dated.length) return null;
    const dates = dated.map((d) => d.date.getTime());
    let min = new Date(Math.min(...dates));
    let max = new Date(Math.max(...dates));
    // Always include today for context, and pad the edges.
    if (today < min) min = today;
    if (today > max) max = today;
    min = new Date(min);
    min.setDate(min.getDate() - 2);
    max = new Date(max);
    max.setDate(max.getDate() + 2);
    const total = dayDiff(max, min) + 1;
    const days: Date[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(min);
      d.setDate(min.getDate() + i);
      days.push(d);
    }
    return { min, days, total };
  }, [dated, today]);

  if (!tasks.length) {
    return <EmptyState message="No tasks match the current filters." />;
  }

  const monthSpans: { label: string; span: number }[] = [];
  if (range) {
    for (const day of range.days) {
      const label = day.toLocaleString("en-US", { month: "short", year: "numeric" });
      const last = monthSpans[monthSpans.length - 1];
      if (last && last.label === label) last.span += 1;
      else monthSpans.push({ label, span: 1 });
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {range ? (
        <div
          className="cadence-scroll flex-1 overflow-auto rounded-xl"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--c-shadow-sm)",
          }}
        >
          <div style={{ width: LABEL_WIDTH + range.total * DAY_WIDTH }}>
            {/* Month header */}
            <div
              className="sticky top-0 z-20 flex"
              style={{ background: "var(--c-surface)" }}
            >
              <div
                className="sticky left-0 z-10 shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
                style={{
                  width: LABEL_WIDTH,
                  background: "var(--c-surface)",
                  borderRight: "1px solid var(--c-border)",
                  borderBottom: "1px solid var(--c-border)",
                  color: "var(--c-muted)",
                }}
              >
                Task
              </div>
              {monthSpans.map((m, i) => (
                <div
                  key={i}
                  className="shrink-0 px-2 py-2 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    width: m.span * DAY_WIDTH,
                    background: "var(--c-surface)",
                    borderRight: "1px solid var(--c-border)",
                    borderBottom: "1px solid var(--c-border)",
                    color: "var(--c-ink-soft)",
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className="flex" style={{ background: "var(--c-surface-2)" }}>
              <div
                className="sticky left-0 z-10 shrink-0"
                style={{
                  width: LABEL_WIDTH,
                  background: "var(--c-surface-2)",
                  borderRight: "1px solid var(--c-border)",
                  borderBottom: "1px solid var(--c-border)",
                }}
              />
              {range.days.map((day, i) => {
                const isToday = isSameDay(day, today);
                const weekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    className="flex shrink-0 flex-col items-center justify-center py-1.5"
                    style={{
                      width: DAY_WIDTH,
                      background: isToday
                        ? "var(--c-brand-50)"
                        : weekend
                          ? "rgba(0,0,0,0.02)"
                          : "transparent",
                      borderRight: "1px solid var(--c-border)",
                      borderBottom: "1px solid var(--c-border)",
                    }}
                  >
                    <span
                      className="text-[9px] font-semibold uppercase"
                      style={{ color: "var(--c-muted)" }}
                    >
                      {["S", "M", "T", "W", "T", "F", "S"][day.getDay()]}
                    </span>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{
                        background: isToday ? "var(--c-brand)" : "transparent",
                        color: isToday ? "#fff" : "var(--c-ink)",
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Task rows */}
            {dated.map(({ task, date }) => {
              const offset = dayDiff(date, range.min);
              const meta = STATUS_META[task.status];
              return (
                <div
                  key={task.id}
                  className="group flex transition-colors hover:bg-[var(--c-surface-2)]"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center gap-2 px-4 py-2.5"
                    style={{
                      width: LABEL_WIDTH,
                      background: "var(--c-surface)",
                      borderRight: "1px solid var(--c-border)",
                    }}
                  >
                    <PriorityIcon priority={task.priority} />
                    {task.aiGenerated && (
                      <Sparkles size={11} style={{ color: "var(--c-brand)" }} />
                    )}
                    <span
                      className="truncate text-[12.5px] font-medium"
                      style={{ color: "var(--c-ink)" }}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div
                    className="relative shrink-0"
                    style={{ width: range.total * DAY_WIDTH }}
                  >
                    <div
                      className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 shadow-sm"
                      style={{
                        left: offset * DAY_WIDTH + 4,
                        background: meta.bg,
                        border: `1px solid ${meta.color}`,
                        maxWidth: DAY_WIDTH * 5,
                      }}
                      title={`${task.title} · ${meta.label} · ${formatShort(date)}`}
                    >
                      <AssigneeStack assignees={task.assignees} size={18} />
                      <span
                        className="truncate text-[11px] font-semibold"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState message="No tasks have due dates to place on the timeline." />
      )}

      {unscheduled.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
          }}
        >
          <h4
            className="mb-2.5 text-[12px] font-bold uppercase tracking-wider"
            style={{ color: "var(--c-muted)" }}
          >
            No due date · {unscheduled.length}
          </h4>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                style={{
                  background: "var(--c-surface-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <PriorityIcon priority={task.priority} />
                <span
                  className="text-[12px] font-medium"
                  style={{ color: "var(--c-ink)" }}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
