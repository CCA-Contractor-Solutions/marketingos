import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTasks,
  useUpdateTask,
  useCreateTask,
  getListTasksQueryKey,
} from "@workspace/api-client-react";
import type { Task, TaskStatus, TaskPriority } from "@workspace/api-client-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  LayoutGrid,
  Calendar,
  Clock,
  List,
  Users,
  Plus,
  MoreHorizontal,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Share2,
} from "lucide-react";

function PriorityIcon({ priority }: { priority: TaskPriority }) {
  if (priority === "high") return <ArrowUp size={14} style={{ color: "var(--c-rose)" }} />;
  if (priority === "medium") return <ArrowRight size={14} style={{ color: "var(--c-amber)" }} />;
  return <ArrowDown size={14} style={{ color: "var(--c-emerald)" }} />;
}

function TaskCard({
  task,
  onDragStart,
}: {
  task: Task;
  onDragStart: (id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className="group relative flex cursor-grab flex-col gap-3 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 active:cursor-grabbing"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
      }}
    >
      {task.blocked && (
        <div className="absolute -left-px -top-px bottom-[-1px] w-1 rounded-l-xl bg-rose-500" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PriorityIcon priority={task.priority} />
          <span className="text-[11px] font-medium tracking-wide" style={{ color: "var(--c-muted)" }}>
            {task.id}
          </span>
          {task.aiGenerated && (
            <div
              className="flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
            >
              <Sparkles size={8} /> AI
            </div>
          )}
        </div>
        <button className="opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--c-muted)" }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      <div className="text-[13.5px] font-medium leading-snug" style={{ color: "var(--c-ink)" }}>
        {task.title}
      </div>

      {task.campaign && (
        <div className="flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)", color: "var(--c-ink-soft)" }}>
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--c-brand)" }} />
          {task.campaign}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: task.dueDate === "Yesterday" || task.dueDate === "Today" ? "var(--c-rose)" : "var(--c-muted)" }}>
              <Calendar size={13} />
              {task.dueDate}
            </div>
          )}
          {task.subtasks && (
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: "var(--c-muted)" }}>
              <CheckCircle2 size={13} />
              {task.subtasks.completed}/{task.subtasks.total}
            </div>
          )}
          {task.comments ? (
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: "var(--c-muted)" }}>
              <MessageSquare size={13} />
              {task.comments}
            </div>
          ) : null}
          {task.dependsOn && (
            <div
              className="flex items-center gap-1.5 text-[11.5px] font-medium"
              style={{ color: task.blocked ? "var(--c-rose)" : "var(--c-muted)" }}
              title={`Depends on ${task.dependsOn}`}
            >
              <Share2 size={13} />
              {task.dependsOn}
            </div>
          )}
        </div>

        <div className="flex -space-x-1.5">
          {task.assignees.map((user, i) => (
            <div
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white"
              style={{ background: user.color }}
            >
              {user.init}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
];

const VIEWS = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "list", label: "List", icon: List },
  { id: "workload", label: "Workload", icon: Users },
];

export default function TaskBoard() {
  const [activeView, setActiveView] = useState("board");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useListTasks();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });

  const updateTask = useUpdateTask({ mutation: { onSuccess: invalidate } });
  const createTask = useCreateTask({ mutation: { onSuccess: invalidate } });

  const tasks = data ?? [];

  const handleDrop = (status: TaskStatus) => {
    setDragOver(null);
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;
    updateTask.mutate({ id: task.id, data: { status } });
  };

  const handleAdd = (status: TaskStatus) => {
    const title = window.prompt("New task title");
    if (!title?.trim()) return;
    createTask.mutate({
      data: { title: title.trim(), status, priority: "medium" },
    });
  };

  const blockedCount = tasks.filter((t) => t.blocked).length;

  return (
    <AppLayout
      active="tasks"
      title="Tasks"
      subtitle="Manage and track marketing initiatives"
      actions={
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition-colors hover:bg-black/5" style={{ color: "var(--c-ink-soft)", border: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
            <Filter size={15} />
            Filter
          </button>
          <button className="flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition-colors hover:bg-black/5" style={{ color: "var(--c-ink-soft)", border: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
            <Share2 size={15} />
            Share
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {/* View switcher */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-surface)" }}>
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
            {VIEWS.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
                    isActive ? "shadow-sm" : "hover:bg-black/5"
                  }`}
                  style={{
                    background: isActive ? "var(--c-surface)" : "transparent",
                    color: isActive ? "var(--c-ink)" : "var(--c-muted)",
                  }}
                >
                  <Icon size={14} />
                  {view.label}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-3 rounded-full py-1.5 pl-2.5 pr-4 text-[12px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Sparkles size={12} className="text-white" />
            </div>
            <span>
              AI: {blockedCount} blocked task{blockedCount === 1 ? "" : "s"} need
              {blockedCount === 1 ? "s" : ""} your review
            </span>
            <ChevronRight size={14} className="ml-1 opacity-70" />
          </div>
        </div>

        {/* Board */}
        <div className="cadence-scroll flex-1 overflow-x-auto overflow-y-hidden bg-[#f6f7fb] p-6">
          {isLoading ? (
            <PageLoading />
          ) : isError ? (
            <PageError />
          ) : activeView !== "board" ? (
            <div className="flex h-full items-center justify-center text-[13px]" style={{ color: "var(--c-muted)" }}>
              The {activeView} view is coming soon. Switch back to Board.
            </div>
          ) : (
            <div className="flex h-full gap-5">
              {COLUMNS.map((col) => {
                const columnTasks = tasks.filter((t) => t.status === col.id);
                const isOver = dragOver === col.id;
                return (
                  <div
                    key={col.id}
                    className="flex h-full w-[320px] shrink-0 flex-col rounded-xl transition-colors"
                    style={{
                      background: isOver ? "rgba(79,70,229,0.06)" : "transparent",
                      outline: isOver ? "2px dashed rgba(79,70,229,0.3)" : "none",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(col.id);
                    }}
                    onDragLeave={() => setDragOver((p) => (p === col.id ? null : p))}
                    onDrop={() => handleDrop(col.id)}
                  >
                    <div className="mb-4 flex items-center justify-between px-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-[14px] font-bold" style={{ color: "var(--c-ink)" }}>
                          {col.label}
                        </h3>
                        <span className="flex h-5 items-center justify-center rounded-full px-2 text-[11px] font-bold" style={{ background: "var(--c-border)", color: "var(--c-ink-soft)" }}>
                          {columnTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAdd(col.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5"
                        style={{ color: "var(--c-muted)" }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="cadence-scroll flex-1 overflow-y-auto px-1 pb-4">
                      <div className="flex flex-col gap-3">
                        {columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} onDragStart={setDragId} />
                        ))}
                        <button
                          onClick={() => handleAdd(col.id)}
                          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-[13px] font-medium transition-colors hover:bg-[var(--c-surface-2)]"
                          style={{ borderColor: "var(--c-border-strong)", color: "var(--c-muted)" }}
                        >
                          <Plus size={16} className="transition-transform group-hover:scale-110" />
                          Add Task
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
