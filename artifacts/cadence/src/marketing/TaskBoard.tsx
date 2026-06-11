import { useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import {
  LayoutGrid, Calendar, Clock, List, Users, Plus,
  MoreHorizontal, Sparkles, MessageSquare,
  CheckCircle2, ChevronRight, Search, Filter,
  ArrowUp, ArrowRight, ArrowDown, Share2, Trash2, X, CornerDownLeft
} from "lucide-react";
import { useAppState } from "./state/AppState";
import type { Priority, Task, TaskStatus } from "./state/data";

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  if (priority === "high") return <ArrowUp size={14} style={{ color: "var(--c-rose)" }} />;
  if (priority === "medium") return <ArrowRight size={14} style={{ color: "var(--c-amber)" }} />;
  return <ArrowDown size={14} style={{ color: "var(--c-emerald)" }} />;
};

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
];

const TaskCard = ({
  task,
  isDragging,
  menuOpen,
  onToggleMenu,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
}: {
  task: Task;
  isDragging: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative flex flex-col gap-3 rounded-xl p-3.5 transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)",
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
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
        <div className="relative">
          <button
            onClick={onToggleMenu}
            className="opacity-0 transition-opacity group-hover:opacity-100 data-[open=true]:opacity-100"
            data-open={menuOpen}
            style={{ color: "var(--c-muted)" }}
            aria-label="Task actions"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-30 w-44 overflow-hidden rounded-xl py-1 text-[12.5px]"
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                boxShadow: "var(--c-shadow-lg, 0 12px 28px -8px rgba(17,19,42,0.25))",
              }}
            >
              <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-muted)" }}>
                Move to
              </div>
              {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onMove(c.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium transition-colors hover:bg-[var(--c-surface-2)]"
                  style={{ color: "var(--c-ink-soft)" }}
                >
                  <ArrowRight size={13} /> {c.label}
                </button>
              ))}
              <div className="my-1 h-px" style={{ background: "var(--c-border)" }} />
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-medium transition-colors hover:bg-rose-50"
                style={{ color: "var(--c-rose)" }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
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
          {task.comments && (
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: "var(--c-muted)" }}>
              <MessageSquare size={13} />
              {task.comments}
            </div>
          )}
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
};

const Composer = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState("");
  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
    setValue("");
  };
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-3"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-brand)", boxShadow: "var(--c-shadow-sm)" }}
    >
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Write a task name…"
        rows={2}
        className="w-full resize-none bg-transparent text-[13.5px] font-medium leading-snug outline-none placeholder:text-[var(--c-muted)]"
        style={{ color: "var(--c-ink)" }}
      />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--c-muted)" }}>
          <CornerDownLeft size={12} /> to add
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: "var(--c-muted)" }}
            aria-label="Cancel"
          >
            <X size={15} />
          </button>
          <button
            onClick={submit}
            className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export function TaskBoard() {
  const { tasks, addTask, moveTask, deleteTask } = useAppState();
  const [activeView, setActiveView] = useState("board");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [composing, setComposing] = useState<TaskStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const views = [
    { id: "board", label: "Board", icon: LayoutGrid },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "list", label: "List", icon: List },
    { id: "workload", label: "Workload", icon: Users },
  ];

  const handleDrop = (status: TaskStatus) => {
    if (draggingId) moveTask(draggingId, status);
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleAdd = (status: TaskStatus, title: string) => {
    addTask({ title, status });
    setComposing(null);
  };

  return (
    <AppLayout title="Tasks"
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
        {/* View Switcher & AI Affordance */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-surface)" }}>
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
            {views.map((view) => {
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
                    color: isActive ? "var(--c-ink)" : "var(--c-muted)"
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
            <span>AI: 1 blocked task needs your review</span>
            <ChevronRight size={14} className="ml-1 opacity-70" />
          </div>
        </div>

        {/* Board Content */}
        {activeView === "board" ? (
        <div className="cadence-scroll flex-1 overflow-x-auto overflow-y-hidden bg-[#f6f7fb] p-6">
          <div className="flex h-full gap-5">
            {COLUMNS.map((col) => {
              const columnTasks = tasks.filter(t => t.status === col.id);
              const isOver = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  className="flex h-full w-[320px] shrink-0 flex-col"
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.id) setDragOverCol(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverCol((prev) => (prev === col.id ? null : prev));
                    }
                  }}
                  onDrop={() => handleDrop(col.id)}
                >
                  {/* Column Header */}
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[14px] font-bold" style={{ color: "var(--c-ink)" }}>
                        {col.label}
                      </h3>
                      <span className="flex h-5 items-center justify-center rounded-full px-2 text-[11px] font-bold" style={{ background: "var(--c-border)", color: "var(--c-ink-soft)" }}>
                        {columnTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setComposing(col.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5"
                      style={{ color: "var(--c-muted)" }}
                      aria-label={`Add task to ${col.label}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div
                    className="cadence-scroll flex-1 overflow-y-auto rounded-xl pb-4 transition-colors"
                    style={{
                      outline: isOver ? "2px dashed var(--c-brand)" : "2px dashed transparent",
                      outlineOffset: 2,
                      background: isOver ? "rgba(79,70,229,0.04)" : "transparent",
                    }}
                  >
                    <div className="flex flex-col gap-3 p-0.5">
                      {composing === col.id && (
                        <Composer
                          onSubmit={(title) => handleAdd(col.id, title)}
                          onCancel={() => setComposing(null)}
                        />
                      )}
                      {columnTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isDragging={draggingId === task.id}
                          menuOpen={menuOpen === task.id}
                          onToggleMenu={() =>
                            setMenuOpen((prev) => (prev === task.id ? null : task.id))
                          }
                          onDragStart={() => setDraggingId(task.id)}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverCol(null);
                          }}
                          onMove={(status) => {
                            moveTask(task.id, status);
                            setMenuOpen(null);
                          }}
                          onDelete={() => {
                            deleteTask(task.id);
                            setMenuOpen(null);
                          }}
                        />
                      ))}

                      {composing !== col.id && (
                        <button
                          onClick={() => setComposing(col.id)}
                          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-[13px] font-medium transition-colors"
                          style={{ borderColor: "var(--c-border-strong)", color: "var(--c-muted)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--c-surface-2)";
                            e.currentTarget.style.color = "var(--c-ink)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--c-muted)";
                          }}
                        >
                          <Plus size={16} className="transition-transform group-hover:scale-110" />
                          Add Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#f6f7fb] p-6 text-center">
            {(() => {
              const view = views.find((v) => v.id === activeView);
              const Icon = view?.icon ?? LayoutGrid;
              const label = view?.label ?? "This";
              return (
                <>
                  <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-brand)" }}
                  >
                    <Icon size={26} />
                  </div>
                  <h3 className="font-display text-[16px] font-bold" style={{ color: "var(--c-ink)" }}>
                    {label} view
                  </h3>
                  <p className="mt-1 max-w-xs text-[13px]" style={{ color: "var(--c-muted)" }}>
                    The {label.toLowerCase()} view is coming in the full app. Switch back to Board to manage tasks.
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Click-away layer for the card menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </AppLayout>
  );
}
