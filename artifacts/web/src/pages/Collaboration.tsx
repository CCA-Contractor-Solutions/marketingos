import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListThreads,
  useGetThread,
  useCreateThreadMessage,
  getGetThreadQueryKey,
  getListThreadsQueryKey,
} from "@workspace/api-client-react";
import type { Thread, Message } from "@workspace/api-client-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Send,
  Hash,
} from "lucide-react";

function ThreadButton({
  thread,
  isActive,
  onClick,
}: {
  thread: Thread;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
}

function MessageRow({ msg }: { msg: Message }) {
  return (
    <div className="flex gap-4 group">
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
              <div className="text-[13px] text-rose-600/90 leading-snug">{msg.content}</div>
            </div>
          </div>
        )}

        {msg.isDecision && (
          <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
            <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[12px] font-bold text-indigo-700 mb-0.5">Decision Recorded</div>
              <div className="text-[13px] text-indigo-600/90 leading-snug">{msg.content}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Collaboration() {
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  const { data: threads, isLoading: threadsLoading, isError: threadsError } =
    useListThreads();

  useEffect(() => {
    if (!activeThread && threads && threads.length > 0) {
      setActiveThread(threads[0].id);
    }
  }, [threads, activeThread]);

  const threadId = activeThread ?? "";
  const { data: detail, isLoading: detailLoading } = useGetThread(threadId, {
    query: {
      enabled: !!activeThread,
      queryKey: getGetThreadQueryKey(threadId),
    },
  });

  const createMessage = useCreateThreadMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetThreadQueryKey(threadId) });
        queryClient.invalidateQueries({ queryKey: getListThreadsQueryKey() });
      },
    },
  });

  const submit = () => {
    const content = messageText.trim();
    if (!content || !activeThread || createMessage.isPending) return;
    setMessageText("");
    createMessage.mutate({ id: threadId, data: { content } });
  };

  const currentThread =
    detail?.thread ?? threads?.find((t) => t.id === activeThread);

  return (
    <AppLayout
      active="collaboration"
      title="Collaboration"
      subtitle={currentThread?.campaign ?? "Team threads"}
    >
      {threadsLoading ? (
        <PageLoading />
      ) : threadsError ? (
        <PageError />
      ) : (
        <div className="flex h-full w-full overflow-hidden cadence-rise">
          {/* Thread list */}
          <div
            className="hidden w-[300px] shrink-0 flex-col md:flex"
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
              {(threads ?? []).map((thread) => (
                <ThreadButton
                  key={thread.id}
                  thread={thread}
                  isActive={activeThread === thread.id}
                  onClick={() => setActiveThread(thread.id)}
                />
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--c-surface)" }}>
            <div className="h-14 px-6 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <div className="flex items-center gap-3">
                <Hash size={18} style={{ color: "var(--c-brand)" }} />
                <div>
                  <div className="font-semibold text-[14px]">{currentThread?.title ?? "—"}</div>
                  <div className="text-[11px]" style={{ color: "var(--c-muted)" }}>
                    {currentThread?.avatars.length ?? 0} participants
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 cadence-scroll">
              {detailLoading && !detail ? (
                <PageLoading />
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: "var(--c-surface-2)", color: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                      Today
                    </span>
                  </div>
                  {(detail?.messages ?? []).map((msg) => (
                    <MessageRow key={msg.id} msg={msg} />
                  ))}
                </>
              )}
            </div>

            <div className="p-4" style={{ background: "var(--c-surface)", borderTop: "1px solid var(--c-border)" }}>
              <div
                className="relative rounded-2xl flex flex-col overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-[var(--c-brand)] focus-within:ring-opacity-20"
                style={{ border: "1px solid var(--c-border)", background: "var(--c-surface-2)" }}
              >
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Reply to thread..."
                  className="w-full bg-transparent p-4 text-[14px] outline-none resize-none min-h-[80px]"
                />
                <div className="flex items-center justify-end p-2 pt-0">
                  <button
                    onClick={submit}
                    disabled={!messageText.trim() || createMessage.isPending}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-white transition-transform hover:scale-105 active:scale-95"
                    style={{ background: "var(--c-brand)", opacity: messageText.trim() ? 1 : 0.5 }}
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div
            className="hidden w-[340px] shrink-0 overflow-y-auto cadence-scroll p-6 xl:block"
            style={{ borderLeft: "1px solid var(--c-border)", background: "var(--c-bg)" }}
          >
            <div
              className="rounded-2xl p-5 relative overflow-hidden shadow-sm"
              style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))", color: "white" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-display font-bold text-[15px]">
                    <Sparkles size={18} className="text-indigo-200" />
                    CCA AI Summary
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-3.5 backdrop-blur-sm border border-white/10">
                    <div className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Key Decisions
                    </div>
                    <ul className="text-[13px] space-y-1.5 text-white/90 font-medium">
                      {(detail?.summary.decisions ?? []).map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-500/20 rounded-xl p-3.5 backdrop-blur-sm border border-rose-500/30">
                    <div className="text-[11px] font-bold text-rose-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Flagged Risks
                    </div>
                    <div className="text-[13px] text-white/90 font-medium space-y-1.5">
                      {(detail?.summary.risks ?? []).map((r, i) => (
                        <div key={i}>{r}</div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[12px] font-bold text-indigo-100 mb-3 flex items-center justify-between">
                      <span>Proposed Action Items</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                        {detail?.summary.proposedTasks.length ?? 0} Tasks
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(detail?.summary.proposedTasks ?? []).map((task) => (
                        <div key={task.id} className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                          <div className="text-[12px] font-medium leading-snug mb-2 text-white">{task.title}</div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-indigo-400 flex items-center justify-center text-[8px] font-bold text-white">
                              {task.assignee.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="text-[10px] text-indigo-100">{task.assignee}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
      )}
    </AppLayout>
  );
}
