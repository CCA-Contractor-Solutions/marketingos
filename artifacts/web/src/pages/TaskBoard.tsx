import { useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  parseDueDate,
  relativeLabel,
  isOverdue,
  isSameDay,
} from "./task-views/dates";
import {
  LayoutGrid,
  Calendar,
  Clock,
  List,
  Users,
  Plus,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Share2,
  Filter,
} from "lucide-react";
import ListView from "./task-views/ListView";
import CalendarView from "./task-views/CalendarView";
import WorkloadView from "./task-views/WorkloadView";
import TimelineView from "./task-views/TimelineView";
import TaskDetailSheet from "@/components/TaskDetailSheet";
import { formatISODate } from "./task-views/dates";

function PriorityIcon({ priority }: { priority: TaskPriority }) {
  if (priority === "high") return <ArrowUp size={14} style={{ color: "var(--c-rose)" }} />;
  if (priority === "medium") return <ArrowRight size={14} style={{ color: "var(--c-amber)" }} />;
  return <ArrowDown size={14} style={{ color: "var(--c-emerald)" }} />;
}

function TaskCard({
  task,
  onDragStart,
  onOpen,
}: {
  task: Task;
  onDragStart: (id: string) => void;
  onOpen: (task: Task) => void;
}) {
  const draggingRef = useRef(false);
  return (
    <div
      draggable
      onDragStart={() => {
        draggingRef.current = true;
        onDragStart(task.id);
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          draggingRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (draggingRef.current) return;
        onOpen(task);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-brand)] active:cursor-grabbing"
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
          {(() => {
            const due = parseDueDate(task.dueDate);
            if (!due) return null;
            const isToday = isSameDay(due, new Date());
            const overdue = isOverdue(due) && task.status !== "done";
            return (
              <div className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: overdue || isToday ? "var(--c-rose)" : "var(--c-muted)" }}>
                <Calendar size={13} />
                {relativeLabel(due)}
              </div>
            );
          })()}
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

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const VIEWS = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "list", label: "List", icon: List },
  { id: "workload", label: "Workload", icon: Users },
];

const STATUS_FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_FILTERS: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TaskBoard() {
  const [activeView, setActiveView] = useState("board");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  }>({ title: "", status: "backlog", priority: "medium" });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useListTasks();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });

  const updateTask = useUpdateTask({ mutation: { onSuccess: invalidate } });
  const createTask = useCreateTask({ mutation: { onSuccess: invalidate } });

  const tasks = Array.isArray(data) ? data : [];

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  const roster = (() => {
    const seen = new Map<string, { init: string; color: string }>();
    for (const t of tasks) {
      for (const a of t.assignees ?? []) {
        if (!seen.has(a.init)) seen.set(a.init, a);
      }
    }
    return [...seen.values()];
  })();

  const openDetail = (task: Task) => {
    setSelectedId(task.id);
    setDetailOpen(true);
  };

  const filteredTasks = tasks.filter(
    (t) =>
      (statusFilter === "all" || t.status === statusFilter) &&
      (priorityFilter === "all" || t.priority === priorityFilter),
  );

  const handleDrop = (status: TaskStatus) => {
    setDragOver(null);
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;
    updateTask.mutate({ id: task.id, data: { status } });
  };

  const handleReschedule = (taskId: string, date: Date) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const dueDate = formatISODate(date);
    if (task.dueDate === dueDate) return;
    updateTask.mutate({ id: taskId, data: { dueDate } });
  };

  const openAdd = (status: TaskStatus) => {
    setForm({ title: "", status, priority: "medium" });
    setAddOpen(true);
  };

  const submitAdd = () => {
    const title = form.title.trim();
    if (!title) return;
    createTask.mutate(
      { data: { title, status: form.status, priority: form.priority } },
      { onSuccess: () => setAddOpen(false) },
    );
  };

  const blockedCount = tasks.filter((t) => t.blocked).length;

  return (
    <AppLayout
      active="tasks"
      title="Tasks"
      subtitle="Manage and track marketing initiatives"
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: "var(--c-muted)" }} />
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}
              >
                <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(v) =>
                  setPriorityFilter(v as TaskPriority | "all")
                }
              >
                <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_FILTERS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex items-center gap-3 rounded-full py-1.5 pl-2.5 pr-4 text-[12px] font-semibold text-white shadow-sm"
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
        </div>

        {/* View content */}
        <div
          className={`cadence-scroll flex-1 bg-[#f6f7fb] p-6 ${
            activeView === "board" || activeView === "workload"
              ? "overflow-x-auto overflow-y-hidden"
              : "overflow-y-auto"
          }`}
        >
          {isLoading ? (
            <PageLoading />
          ) : isError ? (
            <PageError />
          ) : activeView === "list" ? (
            <ListView tasks={filteredTasks} onTaskClick={openDetail} />
          ) : activeView === "calendar" ? (
            <CalendarView
              tasks={filteredTasks}
              onTaskClick={openDetail}
              onReschedule={handleReschedule}
            />
          ) : activeView === "workload" ? (
            <WorkloadView tasks={filteredTasks} onTaskClick={openDetail} />
          ) : activeView === "timeline" ? (
            <TimelineView
              tasks={filteredTasks}
              onTaskClick={openDetail}
              onReschedule={handleReschedule}
            />
          ) : (
            <div className="flex h-full gap-5">
              {COLUMNS.map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.id);
                const isOver = dragOver === col.id;
                return (
                  <div
                    key={col.id}
                    className="flex h-full w-[320px] shrink-0 flex-col rounded-xl transition-colors"
                    style={{
                      background: isOver ? "rgba(37,99,235,0.06)" : "transparent",
                      outline: isOver ? "2px dashed rgba(37,99,235,0.3)" : "none",
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
                        onClick={() => openAdd(col.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5"
                        style={{ color: "var(--c-muted)" }}
                        aria-label={`Add task to ${col.label}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="cadence-scroll flex-1 overflow-y-auto px-1 pb-4">
                      <div className="flex flex-col gap-3">
                        {columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onDragStart={setDragId}
                            onOpen={openDetail}
                          />
                        ))}
                        <button
                          onClick={() => openAdd(col.id)}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Add a task to the board. It will be created via the API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                autoFocus
                value={form.title}
                placeholder="e.g. Draft Q3 launch brief"
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAdd();
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as TaskStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as TaskPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAdd}
              disabled={!form.title.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        roster={roster}
      />
    </AppLayout>
  );
}
