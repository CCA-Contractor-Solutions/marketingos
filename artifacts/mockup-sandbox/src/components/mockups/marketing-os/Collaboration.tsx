import React, { useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import {
  Search,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Send,
  Paperclip,
  MoreHorizontal,
  Clock,
  ChevronRight,
  Bot,
  Hash,
  Users,
  Settings,
  ArrowRight,
  ListTodo
} from "lucide-react";

// --- Mock Data ---

const THREADS = [
  {
    id: "t1",
    title: "Q3 B2B Lead Gen Launch",
    campaign: "Q3 Enterprise Growth",
    lastMessage: "Let's bump LinkedIn by 15% and pull from...",
    time: "10:42 AM",
    unread: 0,
    active: true,
    avatars: ["SB", "MD", "EW"]
  },
  {
    id: "t2",
    title: "Social Media Refocus - August",
    campaign: "Brand Awareness",
    lastMessage: "The new creative looks much better.",
    time: "Yesterday",
    unread: 3,
    active: false,
    avatars: ["EW", "KL"]
  },
  {
    id: "t3",
    title: "Enterprise Summit 2024 Sponsorship",
    campaign: "Field Marketing",
    lastMessage: "Have we received the booth dimensions yet?",
    time: "Tue",
    unread: 0,
    active: false,
    avatars: ["SB", "RJ", "KL", "MD"]
  }
];

const MESSAGES = [
  {
    id: "m1",
    sender: "Sarah Baker",
    initials: "SB",
    role: "Marketing Director",
    time: "09:15 AM",
    content: "Hey team, the landing page copy is locked. Elena, how are the hero assets coming along? We need them by EOD tomorrow to stay on schedule.",
    color: "linear-gradient(135deg, var(--c-brand), var(--c-violet))"
  },
  {
    id: "m2",
    sender: "Elena Wei",
    initials: "EW",
    role: "Lead Designer",
    time: "09:32 AM",
    content: "Assets are 90% there. Just tweaking the contrast for mobile layouts. I'll drop the Figma link in the main campaign channel once done.",
    color: "linear-gradient(135deg, var(--c-emerald), var(--c-sky))"
  },
  {
    id: "m3",
    sender: "Mike Davis",
    initials: "MD",
    role: "Content Manager",
    time: "10:05 AM",
    content: "I've drafted the email sequence. Review link is in the campaign folder. Needs approval before we can load it into Marketo.",
    color: "linear-gradient(135deg, var(--c-amber), var(--c-coral))"
  },
  {
    id: "m4",
    sender: "David Chen",
    initials: "DC",
    role: "Performance Marketing",
    time: "10:28 AM",
    content: "Flagging a risk here: The ad budget allocation for LinkedIn seems too low given the new target CPA we discussed yesterday. At the current daily cap, we might not hit the volume targets for the top-of-funnel phase.",
    isRisk: true,
    color: "linear-gradient(135deg, var(--c-rose), var(--c-coral))"
  },
  {
    id: "m5",
    sender: "Sarah Baker",
    initials: "SB",
    role: "Marketing Director",
    time: "10:42 AM",
    content: "Good catch David. Let's bump LinkedIn by 15% and pull from the display network budget. Make the adjustment today.",
    isDecision: true,
    color: "linear-gradient(135deg, var(--c-brand), var(--c-violet))"
  }
];

const AI_TASKS = [
  { id: "task1", title: "Finalize and upload hero assets for landing page", assignee: "Elena Wei" },
  { id: "task2", title: "Review and approve email sequence draft", assignee: "Sarah Baker" },
  { id: "task3", title: "Reallocate 15% display budget to LinkedIn", assignee: "David Chen" }
];

export function Collaboration() {
  const [activeThread, setActiveThread] = useState("t1");
  const currentThread = THREADS.find((t) => t.id === activeThread) ?? THREADS[0];
  const [messageText, setMessageText] = useState("");

  return (
    <AppLayout
      active="collaboration"
      title="Collaboration"
      subtitle="Q3 Enterprise Growth"
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[var(--c-surface)]" style={{ color: "var(--c-ink-soft)", border: "1px solid var(--c-border)" }}>
            <Users size={14} />
            Manage Access
          </button>
        </div>
      }
    >
      <div className="flex h-full w-full overflow-hidden cadence-rise">
        
        {/* Left Column: Thread List */}
        <div 
          className="w-[300px] shrink-0 flex flex-col"
          style={{ borderRight: "1px solid var(--c-border)", background: "var(--c-surface-2)" }}
        >
          <div className="p-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div 
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "var(--c-shadow-sm)" }}
            >
              <Search size={16} style={{ color: "var(--c-muted)" }} />
              <input 
                type="text" 
                placeholder="Search threads..." 
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--c-muted)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 cadence-scroll">
            {THREADS.map((thread) => {
              const isActive = activeThread === thread.id;
              return (
              <button
                key={thread.id}
                onClick={() => setActiveThread(thread.id)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: isActive ? "var(--c-surface)" : "transparent",
                  border: `1px solid ${isActive ? "var(--c-border)" : "transparent"}`,
                  boxShadow: isActive ? "var(--c-shadow-sm)" : "none",
                }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="font-semibold text-[13.5px] truncate pr-2" style={{ color: isActive ? "var(--c-brand-600)" : "var(--c-ink)" }}>
                    {thread.title}
                  </div>
                  <div className="text-[11px] whitespace-nowrap mt-0.5" style={{ color: isActive ? "var(--c-brand)" : "var(--c-muted)", fontWeight: thread.unread > 0 ? 600 : 400 }}>
                    {thread.time}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 mb-2">
                  <Hash size={12} style={{ color: "var(--c-muted)" }} />
                  <span className="text-[11px] font-medium truncate" style={{ color: "var(--c-ink-soft)" }}>
                    {thread.campaign}
                  </span>
                </div>

                <div className="text-[12px] line-clamp-1 mb-3" style={{ color: isActive ? "var(--c-ink)" : "var(--c-muted)" }}>
                  {thread.lastMessage}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {thread.avatars.map((initials, i) => (
                      <div 
                        key={i}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white"
                        style={{ background: i === 0 ? "linear-gradient(135deg, var(--c-brand), var(--c-violet))" : "var(--c-muted)" }}
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  {thread.unread > 0 && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "var(--c-brand)" }}>
                      {thread.unread}
                    </div>
                  )}
                </div>
              </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--c-surface)" }}>
          <div className="h-14 px-6 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-3">
              <Hash size={18} style={{ color: "var(--c-brand)" }} />
              <div>
                <div className="font-semibold text-[14px]">{currentThread.title}</div>
                <div className="text-[11px]" style={{ color: "var(--c-muted)" }}>{currentThread.avatars.length} participants</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg hover:bg-[var(--c-bg)] transition-colors text-[var(--c-muted)] hover:text-[var(--c-ink)]">
                <Search size={16} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-[var(--c-bg)] transition-colors text-[var(--c-muted)] hover:text-[var(--c-ink)]">
                <Settings size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 cadence-scroll">
            <div className="text-center">
              <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                Today
              </span>
            </div>

            {MESSAGES.map((msg) => (
              <div key={msg.id} className="flex gap-4 group">
                <div 
                  className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-[13px] font-bold text-white shadow-sm"
                  style={{ background: msg.color }}
                >
                  {msg.initials}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[14px]">{msg.sender}</span>
                    <span className="text-[11px] font-medium" style={{ color: "var(--c-brand)" }}>{msg.role}</span>
                    <span className="text-[11px]" style={{ color: "var(--c-muted)" }}>{msg.time}</span>
                  </div>
                  
                  <div className="text-[14px] leading-relaxed" style={{ color: "var(--c-ink)" }}>
                    {msg.content}
                  </div>

                  {msg.isRisk && (
                    <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl border border-rose-100 bg-rose-50/50">
                      <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[12px] font-bold text-rose-700 mb-0.5">Risk Flagged</div>
                        <div className="text-[13px] text-rose-600/90 leading-snug">LinkedIn budget insufficient for target CPA volume.</div>
                      </div>
                    </div>
                  )}

                  {msg.isDecision && (
                    <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
                      <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[12px] font-bold text-indigo-700 mb-0.5">Decision Recorded</div>
                        <div className="text-[13px] text-indigo-600/90 leading-snug">Increase LinkedIn budget by 15%, pull from display network.</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start pt-1">
                   <button className="p-1.5 rounded text-[var(--c-muted)] hover:bg-[var(--c-bg)]">
                     <MoreHorizontal size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4" style={{ background: "var(--c-surface)", borderTop: "1px solid var(--c-border)" }}>
            <div 
              className="relative rounded-2xl flex flex-col overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-[var(--c-brand)] focus-within:ring-opacity-20"
              style={{ border: "1px solid var(--c-border)", background: "var(--c-surface-2)" }}
            >
              <textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Reply to thread..."
                className="w-full bg-transparent p-4 text-[14px] outline-none resize-none min-h-[80px]"
              />
              <div className="flex items-center justify-between p-2 pt-0">
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-ink)] hover:bg-[var(--c-surface)] transition-colors">
                    <Paperclip size={18} />
                  </button>
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--c-brand-50), #f3e8ff)", color: "var(--c-violet)" }}
                  >
                    <Sparkles size={14} />
                    AI Assist
                  </button>
                </div>
                <button 
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-white transition-transform hover:scale-105 active:scale-95"
                  style={{ background: "var(--c-brand)", opacity: messageText ? 1 : 0.5 }}
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Summary */}
        <div 
          className="w-[340px] shrink-0 overflow-y-auto cadence-scroll p-6"
          style={{ borderLeft: "1px solid var(--c-border)", background: "var(--c-bg)" }}
        >
          <div 
            className="rounded-2xl p-5 relative overflow-hidden shadow-sm"
            style={{ 
              background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
              color: "white"
            }}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-display font-bold text-[15px]">
                  <Sparkles size={18} className="text-indigo-200" />
                  MarketingOS AI Summary
                </div>
                <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Decisions */}
                <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm border border-white/10">
                  <div className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Key Decisions
                  </div>
                  <ul className="text-[13px] space-y-1.5 text-white/90 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0" />
                      Landing page copy is locked.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0" />
                      LinkedIn ad budget increased by 15%.
                    </li>
                  </ul>
                </div>

                {/* Risks */}
                <div className="bg-rose-500/20 rounded-xl p-3.5 backdrop-blur-sm border border-rose-500/30">
                  <div className="text-[11px] font-bold text-rose-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Flagged Risks
                  </div>
                  <div className="text-[13px] text-white/90 font-medium">
                    Initial LinkedIn budget might fail to hit top-of-funnel volume targets.
                  </div>
                </div>

                {/* Proposed Tasks */}
                <div className="pt-2">
                  <div className="text-[12px] font-bold text-indigo-100 mb-3 flex items-center justify-between">
                    <span>Proposed Action Items</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">3 Tasks</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {AI_TASKS.map((task) => (
                      <div key={task.id} className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                        <div className="text-[12px] font-medium leading-snug mb-2 text-white">{task.title}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-indigo-400 flex items-center justify-center text-[8px] font-bold text-white">
                            {task.assignee.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[10px] text-indigo-100">{task.assignee}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-2.5 bg-white text-[var(--c-violet)] rounded-xl text-[13px] font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <ListTodo size={16} />
                    Convert to Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
             <p className="text-[12px] text-[var(--c-muted)]">
               AI summaries are generated in real-time based on thread context.
             </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
