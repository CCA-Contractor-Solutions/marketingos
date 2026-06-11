import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateTask,
  getListTasksQueryKey,
} from "@workspace/api-client-react";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskUpdate,
  Assignee,
} from "@workspace/api-client-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { Sparkles, CheckCircle2, MessageSquare, Share2 } from "lucide-react";
import { parseDueDate } from "@/pages/task-views/dates";

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

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type FormState = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  campaign: string;
  dueDate: string;
  blocked: boolean;
  assignees: Assignee[];
};

function buildForm(task: Task): FormState {
  const parsed = parseDueDate(task.dueDate);
  return {
    title: task.title,
    status: task.status,
    priority: task.priority,
    campaign: task.campaign ?? "",
    dueDate: parsed ? toInputDate(parsed) : "",
    blocked: task.blocked,
    assignees: task.assignees ?? [],
  };
}

function sameAssignees(a: Assignee[], b: Assignee[]): boolean {
  if (a.length !== b.length) return false;
  const key = (x: Assignee) => `${x.init}|${x.color}`;
  const sa = [...a].map(key).sort();
  const sb = [...b].map(key).sort();
  return sa.every((v, i) => v === sb[i]);
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold" style={{ color: "var(--c-muted)" }}>
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  roster = [],
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roster?: Assignee[];
}) {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
    },
  });

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (task) setForm(buildForm(task));
  }, [task?.id]);

  const dirty = useMemo(() => {
    if (!task || !form) return false;
    const base = buildForm(task);
    return (
      base.title !== form.title ||
      base.status !== form.status ||
      base.priority !== form.priority ||
      base.campaign !== form.campaign ||
      base.dueDate !== form.dueDate ||
      base.blocked !== form.blocked ||
      !sameAssignees(base.assignees, form.assignees)
    );
  }, [task, form]);

  if (!task || !form) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[440px]" />
      </Sheet>
    );
  }

  const update = (patch: Partial<FormState>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  const handleSave = () => {
    const base = buildForm(task);
    const data: TaskUpdate = {};
    const title = form.title.trim();
    if (title && title !== base.title) data.title = title;
    if (form.status !== base.status) data.status = form.status;
    if (form.priority !== base.priority) data.priority = form.priority;
    if (form.campaign !== base.campaign) data.campaign = form.campaign;
    if (form.blocked !== base.blocked) data.blocked = form.blocked;
    if (!sameAssignees(form.assignees, base.assignees))
      data.assignees = form.assignees;
    if (form.dueDate !== base.dueDate) {
      if (form.dueDate) {
        data.dueDate = form.dueDate;
        data.dueAt = new Date(`${form.dueDate}T12:00:00`).toISOString();
      } else {
        data.dueDate = "";
        data.dueAt = "";
      }
    }

    if (Object.keys(data).length === 0) {
      onOpenChange(false);
      return;
    }

    updateTask.mutate({ id: task.id, data });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[460px]"
        style={{ background: "var(--c-surface)" }}
      >
        <SheetHeader className="space-y-2 border-b px-6 py-5 text-left" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold tracking-wide"
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
          </div>
          <SheetTitle
            className="text-[17px] font-bold leading-snug"
            style={{ color: "var(--c-ink)" }}
          >
            {task.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            View and edit the details for this task.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          <FieldRow label="Title">
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Task title"
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => update({ status: v as TaskStatus })}
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
            </FieldRow>

            <FieldRow label="Priority">
              <Select
                value={form.priority}
                onValueChange={(v) => update({ priority: v as TaskPriority })}
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
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => update({ dueDate: e.target.value })}
              />
            </FieldRow>

            <FieldRow label="Campaign">
              <Input
                value={form.campaign}
                onChange={(e) => update({ campaign: e.target.value })}
                placeholder="No campaign"
              />
            </FieldRow>
          </div>

          <FieldRow label="Assignees">
            {(() => {
              const options: Assignee[] = [];
              const seen = new Set<string>();
              for (const a of [...roster, ...form.assignees]) {
                if (!seen.has(a.init)) {
                  seen.add(a.init);
                  options.push(a);
                }
              }
              const toggle = (a: Assignee) =>
                update({
                  assignees: form.assignees.some((x) => x.init === a.init)
                    ? form.assignees.filter((x) => x.init !== a.init)
                    : [...form.assignees, a],
                });
              if (!options.length) {
                return (
                  <span className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                    No team members available
                  </span>
                );
              }
              return (
                <div className="flex flex-wrap gap-2">
                  {options.map((a) => {
                    const active = form.assignees.some((x) => x.init === a.init);
                    return (
                      <button
                        key={a.init}
                        type="button"
                        onClick={() => toggle(a)}
                        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12px] font-semibold transition-all"
                        style={{
                          background: active ? "var(--c-surface-2)" : "transparent",
                          border: `1px solid ${active ? a.color : "var(--c-border)"}`,
                          color: active ? "var(--c-ink)" : "var(--c-muted)",
                          opacity: active ? 1 : 0.7,
                        }}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ background: a.color }}
                        >
                          {a.init}
                        </span>
                        {active ? "Assigned" : "Assign"}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </FieldRow>

          <div
            className="flex items-center justify-between rounded-lg px-3.5 py-3"
            style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold" style={{ color: "var(--c-ink)" }}>
                Blocked
              </span>
              <span className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>
                Mark this task as blocked
              </span>
            </div>
            <Switch
              checked={form.blocked}
              onCheckedChange={(v) => update({ blocked: v })}
            />
          </div>

          {(task.dependsOn || task.subtasks || task.comments) && (
            <div
              className="flex flex-wrap items-center gap-4 rounded-lg px-3.5 py-3"
              style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
            >
              {task.subtasks && (
                <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--c-ink-soft)" }}>
                  <CheckCircle2 size={14} />
                  {task.subtasks.completed}/{task.subtasks.total} subtasks
                </div>
              )}
              {task.comments ? (
                <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--c-ink-soft)" }}>
                  <MessageSquare size={14} />
                  {task.comments} comments
                </div>
              ) : null}
              {task.dependsOn && (
                <div
                  className="flex items-center gap-1.5 text-[12px] font-medium"
                  style={{ color: task.blocked ? "var(--c-rose)" : "var(--c-ink-soft)" }}
                >
                  <Share2 size={14} />
                  Depends on {task.dependsOn}
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="gap-2 border-t px-6 py-4" style={{ borderColor: "var(--c-border)" }}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || !form.title.trim() || updateTask.isPending}
          >
            {updateTask.isPending ? "Saving…" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
