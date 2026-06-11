import { useMemo, useState } from "react";
import type { Task } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  PriorityIcon,
  STATUS_META,
  AssigneeStack,
  EmptyState,
} from "./shared";
import {
  parseDueDate,
  isSameDay,
  startOfDay,
  WEEKDAY_LABELS,
  formatMonthYear,
} from "./dates";

type DatedTask = { task: Task; date: Date };

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = useMemo(() => startOfDay(new Date()), []);

  const dated = useMemo<DatedTask[]>(() => {
    return tasks
      .map((task) => ({ task, date: parseDueDate(task.dueDate) }))
      .filter((t): t is DatedTask => t.date !== null);
  }, [tasks]);

  const unscheduled = useMemo(
    () => tasks.filter((t) => !parseDueDate(t.dueDate)),
    [tasks],
  );

  // Default to the month with the most scheduled tasks, else today's month.
  const initialMonth = useMemo(() => {
    if (!dated.length) return new Date(today.getFullYear(), today.getMonth(), 1);
    const counts = new Map<string, { date: Date; n: number }>();
    for (const { date } of dated) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = counts.get(key);
      if (entry) entry.n += 1;
      else
        counts.set(key, {
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          n: 1,
        });
    }
    let best = { date: new Date(today.getFullYear(), today.getMonth(), 1), n: -1 };
    for (const entry of counts.values()) if (entry.n > best.n) best = entry;
    return best.date;
  }, [dated, today]);

  const [month, setMonth] = useState(initialMonth);

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [month]);

  const tasksForDay = (day: Date) =>
    dated.filter((d) => isSameDay(d.date, day));

  const goMonth = (delta: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  if (!tasks.length) {
    return <EmptyState message="No tasks match the current filters." />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3
          className="font-display text-[16px] font-bold"
          style={{ color: "var(--c-ink)" }}
        >
          {formatMonthYear(month)}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
            }
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-black/5"
            style={{
              color: "var(--c-ink-soft)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
            }}
          >
            Today
          </button>
          <button
            onClick={() => goMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/5"
            style={{
              color: "var(--c-ink-soft)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => goMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/5"
            style={{
              color: "var(--c-ink-soft)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
            }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 overflow-hidden rounded-xl"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          boxShadow: "var(--c-shadow-sm)",
        }}
      >
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              color: "var(--c-muted)",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            {w}
          </div>
        ))}
        {grid.map((day, i) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const dayTasks = tasksForDay(day);
          return (
            <div
              key={i}
              className="flex min-h-[112px] flex-col gap-1 p-1.5"
              style={{
                borderBottom: i < 35 ? "1px solid var(--c-border)" : "none",
                borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--c-border)" : "none",
                background: inMonth ? "transparent" : "var(--c-surface-2)",
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    background: isToday ? "var(--c-brand)" : "transparent",
                    color: isToday
                      ? "#fff"
                      : inMonth
                        ? "var(--c-ink)"
                        : "var(--c-muted)",
                  }}
                >
                  {day.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: "var(--c-muted)" }}
                  >
                    {dayTasks.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map(({ task }) => {
                  const meta = STATUS_META[task.status];
                  return (
                    <div
                      key={task.id}
                      title={`${task.title} · ${meta.label}`}
                      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-medium leading-tight"
                      style={{
                        background: meta.bg,
                        color: meta.color,
                      }}
                    >
                      <PriorityIcon priority={task.priority} />
                      {task.aiGenerated && <Sparkles size={9} />}
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span
                    className="px-1.5 text-[10px] font-semibold"
                    style={{ color: "var(--c-muted)" }}
                  >
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
            Unscheduled · {unscheduled.length}
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
                <AssigneeStack assignees={task.assignees} size={20} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
