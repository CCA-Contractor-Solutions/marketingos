import React, { useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { 
  LayoutGrid, Calendar, Clock, List, Users, Plus, 
  MoreHorizontal, Sparkles, AlertCircle, MessageSquare, 
  CheckCircle2, ChevronRight, Check, Search, Filter,
  ArrowUp, ArrowRight, ArrowDown, Share2, AlignLeft
} from "lucide-react";

type Priority = "high" | "medium" | "low";
type Status = "backlog" | "in_progress" | "in_review" | "done";

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignees: { init: string; color: string }[];
  dueDate?: string;
  campaign?: string;
  subtasks?: { completed: number; total: number };
  comments?: number;
  aiGenerated?: boolean;
  blocked?: boolean;
  dependsOn?: string;
}

const mockTasks: Task[] = [
  {
    id: "TSK-101",
    title: "Draft Q3 Performance Marketing Brief",
    status: "backlog",
    priority: "high",
    assignees: [{ init: "AR", color: "#fb6f5a" }],
    dueDate: "Tomorrow",
    campaign: "Q3 Growth",
    subtasks: { completed: 1, total: 4 },
  },
  {
    id: "TSK-102",
    title: "Compile competitor ad intelligence report",
    status: "backlog",
    priority: "medium",
    assignees: [{ init: "MK", color: "#18b386" }],
    aiGenerated: true,
  },
  {
    id: "TSK-103",
    title: "Review influencer contract terms for Winter Launch",
    status: "in_progress",
    priority: "high",
    assignees: [{ init: "SJ", color: "#7c3aed" }, { init: "AR", color: "#fb6f5a" }],
    dueDate: "Today",
    campaign: "Winter Launch",
    comments: 3,
    blocked: true,
    dependsOn: "TSK-098",
  },
  {
    id: "TSK-104",
    title: "Update landing page copy for A/B test variant",
    status: "in_progress",
    priority: "medium",
    assignees: [{ init: "MK", color: "#18b386" }],
    dueDate: "Oct 12",
    campaign: "Conversion Opt",
    subtasks: { completed: 2, total: 3 },
    dependsOn: "TSK-101",
  },
  {
    id: "TSK-105",
    title: "Finalize email sequence for webinar registrants",
    status: "in_review",
    priority: "high",
    assignees: [{ init: "AR", color: "#fb6f5a" }],
    dueDate: "Yesterday",
    campaign: "Q3 Growth",
    comments: 8,
    aiGenerated: true,
  },
  {
    id: "TSK-106",
    title: "Approve social assets for product announcement",
    status: "in_review",
    priority: "low",
    assignees: [{ init: "SJ", color: "#7c3aed" }],
    campaign: "Winter Launch",
  },
  {
    id: "TSK-107",
    title: "Set up tracking pixels for new acquisition funnel",
    status: "done",
    priority: "high",
    assignees: [{ init: "MK", color: "#18b386" }],
    dueDate: "Oct 8",
    campaign: "Tech Debt",
    subtasks: { completed: 5, total: 5 },
    comments: 2,
  },
  {
    id: "TSK-108",
    title: "Weekly marketing sync notes & action items",
    status: "done",
    priority: "medium",
    assignees: [{ init: "SJ", color: "#7c3aed" }],
    aiGenerated: true,
  }
];

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  if (priority === "high") return <ArrowUp size={14} style={{ color: "var(--c-rose)" }} />;
  if (priority === "medium") return <ArrowRight size={14} style={{ color: "var(--c-amber)" }} />;
  return <ArrowDown size={14} style={{ color: "var(--c-emerald)" }} />;
};

const TaskCard = ({ task }: { task: Task }) => {
  return (
    <div 
      className="group relative flex flex-col gap-3 rounded-xl p-3.5 transition-all hover:-translate-y-0.5"
      style={{ 
        background: "var(--c-surface)", 
        border: "1px solid var(--c-border)",
        boxShadow: "var(--c-shadow-sm)"
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

export function TaskBoard() {
  const [activeView, setActiveView] = useState("board");

  const views = [
    { id: "board", label: "Board", icon: LayoutGrid },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "list", label: "List", icon: List },
    { id: "workload", label: "Workload", icon: Users },
  ];

  const columns = [
    { id: "backlog", label: "Backlog", count: 2 },
    { id: "in_progress", label: "In Progress", count: 2 },
    { id: "in_review", label: "In Review", count: 2 },
    { id: "done", label: "Done", count: 2 },
  ];

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
            {columns.map((col) => {
              const columnTasks = mockTasks.filter(t => t.status === col.id);
              
              return (
                <div key={col.id} className="flex h-full w-[320px] shrink-0 flex-col">
                  {/* Column Header */}
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[14px] font-bold" style={{ color: "var(--c-ink)" }}>
                        {col.label}
                      </h3>
                      <span className="flex h-5 items-center justify-center rounded-full px-2 text-[11px] font-bold" style={{ background: "var(--c-border)", color: "var(--c-ink-soft)" }}>
                        {col.count}
                      </span>
                    </div>
                    <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5" style={{ color: "var(--c-muted)" }}>
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="cadence-scroll flex-1 overflow-y-auto pb-4">
                    <div className="flex flex-col gap-3">
                      {columnTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      
                      {/* Add Task Button */}
                      <button 
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
    </AppLayout>
  );
}
