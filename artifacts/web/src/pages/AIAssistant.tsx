import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAssistantConversation,
  useSendAssistantMessage,
  getGetAssistantConversationQueryKey,
} from "@workspace/api-client-react";
import type {
  AssistantMessage,
  AssistantVariant,
  AssistantContext,
  Guardrail,
} from "@workspace/api-client-react";
import { AppLayout, PageLoading, PageError } from "@/components/AppLayout";
import {
  Sparkles,
  Send,
  PenTool,
  MessageSquare,
  Mail,
  FileText,
  Target,
  LayoutTemplate,
  BarChart2,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Hash,
  Activity,
  Layers,
} from "lucide-react";

const QUICK_ACTIONS: { icon: ReactNode; label: string }[] = [
  { icon: <PenTool size={13} />, label: "Generate campaign brief" },
  { icon: <MessageSquare size={13} />, label: "Social posts" },
  { icon: <Mail size={13} />, label: "Email sequence" },
  { icon: <Target size={13} />, label: "Ad copy" },
  { icon: <LayoutTemplate size={13} />, label: "Landing page copy" },
  { icon: <FileText size={13} />, label: "Blog outline" },
  { icon: <FileSearch size={13} />, label: "Summarize thread" },
  { icon: <BarChart2 size={13} />, label: "Performance insight" },
];

function contextIcon(icon: AssistantContext["icon"]) {
  switch (icon) {
    case "campaign":
      return <Layers size={16} className="text-[var(--c-brand)]" />;
    case "audience":
      return <Hash size={16} className="text-[var(--c-sky)]" />;
    case "data":
      return <Activity size={16} className="text-[var(--c-emerald)]" />;
  }
}

function VariantCard({ v }: { v: AssistantVariant }) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-4 transition-all hover:border-[var(--c-brand-600)]"
      style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--c-surface-2)] text-[11px] font-bold text-[var(--c-ink-soft)]">
            {v.number}
          </div>
          <span className="text-[12px] font-semibold text-[var(--c-ink)]">{v.platform}</span>
          <span className="text-[10px] text-[var(--c-muted)]">•</span>
          <span className="text-[12px] font-medium text-[var(--c-muted)]">{v.tone}</span>
        </div>
      </div>
      <p className="text-[13.5px] leading-relaxed text-[var(--c-ink)] mb-2">{v.content}</p>
      <p className="text-[12px] font-medium text-[var(--c-brand)]">{v.tags}</p>
    </div>
  );
}

function MessageBubble({ msg }: { msg: AssistantMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex w-full justify-end cadence-rise">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] leading-relaxed text-white shadow-sm"
          style={{ background: "var(--c-ink)" }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start gap-4 cadence-rise">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
      >
        <Sparkles size={16} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="text-[14px] leading-relaxed" style={{ color: "var(--c-ink)" }}>
          {msg.intro ?? msg.content}
        </div>
        {msg.variants && msg.variants.length > 0 && (
          <div className="flex flex-col gap-3 max-w-[90%]">
            {msg.variants.map((v, i) => (
              <VariantCard key={i} v={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextCard({ ctx }: { ctx: AssistantContext }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border p-3 transition-colors"
      style={{
        background: ctx.active ? "var(--c-brand-50)" : "var(--c-surface)",
        borderColor: ctx.active ? "var(--c-brand)" : "var(--c-border)",
      }}
    >
      <div className="mt-0.5 rounded-lg bg-white p-1.5 shadow-sm">{contextIcon(ctx.icon)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[var(--c-ink)]">{ctx.title}</div>
        <div className="truncate text-[11.5px] text-[var(--c-muted)] mt-0.5">{ctx.subtitle}</div>
      </div>
      {ctx.active && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--c-brand)] text-white">
          <CheckCircle2 size={10} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

function GuardrailRow({ g }: { g: Guardrail }) {
  return (
    <div className="flex items-start gap-2.5">
      {g.type === "ok" ? (
        <CheckCircle2 size={16} className="mt-0.5 text-[var(--c-emerald)]" />
      ) : (
        <AlertCircle size={16} className="mt-0.5 text-[var(--c-amber)]" />
      )}
      <div>
        <div className="text-[13px] font-semibold">{g.title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: "var(--c-muted)" }}>
          {g.description}
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useGetAssistantConversation();
  const send = useSendAssistantMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAssistantConversationQueryKey(),
        });
      },
    },
  });

  const submit = () => {
    const content = input.trim();
    if (!content || send.isPending) return;
    setInput("");
    send.mutate({ data: { content } });
  };

  return (
    <AppLayout
      active="assistant"
      title="MarketingOS AI Assistant"
      subtitle="Your marketing copilot"
    >
      <div className="flex h-full w-full">
        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="cadence-scroll flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <PageLoading />
            ) : isError ? (
              <PageError />
            ) : (
              <>
                {(data?.messages ?? []).map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
                {send.isPending && (
                  <div className="flex w-full justify-start gap-4">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
                    >
                      <Sparkles size={16} className="cadence-ai-glow" />
                    </div>
                    <div className="text-[14px] text-[var(--c-muted)] pt-1">Thinking…</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 p-6 pt-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => setInput(qa.label)}
                  className="flex items-center gap-1.5 rounded-full border bg-[var(--c-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--c-ink-soft)] shadow-sm transition-all hover:border-[var(--c-brand)] hover:text-[var(--c-brand)]"
                  style={{ borderColor: "var(--c-border)" }}
                >
                  {qa.icon} {qa.label}
                </button>
              ))}
            </div>

            <div
              className="relative rounded-2xl shadow-sm transition-shadow focus-within:shadow-md"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-[14px] outline-none placeholder:text-[var(--c-muted)]"
                placeholder="Ask MarketingOS AI to write, analyze, or plan..."
                rows={2}
              />
              <button
                onClick={submit}
                disabled={send.isPending || !input.trim()}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--c-brand), var(--c-violet))" }}
              >
                <Send size={15} />
              </button>
            </div>
            <div className="mt-2 text-center text-[11px]" style={{ color: "var(--c-muted)" }}>
              MarketingOS AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>

        {/* Context rail */}
        <div
          className="hidden w-[320px] shrink-0 overflow-y-auto border-l lg:block"
          style={{ background: "var(--c-surface-2)", borderColor: "var(--c-border)" }}
        >
          <div className="p-5 space-y-6">
            <div>
              <h3 className="font-display text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-ink-soft)" }}>
                Active Context
              </h3>
              <div className="space-y-3">
                {(data?.context ?? []).map((ctx) => (
                  <ContextCard key={ctx.id} ctx={ctx} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-[13px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--c-ink-soft)" }}>
                Brand Guardrails
              </h3>
              <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                {(data?.guardrails ?? []).map((g, i) => (
                  <GuardrailRow key={i} g={g} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
