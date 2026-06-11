import { Router, type IRouter } from "express";
import { asc, sql } from "drizzle-orm";
import { db, assistantMessagesTable, type AssistantMessageRow, type AssistantVariant } from "@workspace/db";
import { SendAssistantMessageBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getContent } from "../lib/content";

const router: IRouter = Router();

type ContextItem = { id: string; icon: string; title: string; subtitle: string; active: boolean };
type Guardrail = { type: string; title: string; description: string };

function toAssistantMessage(row: AssistantMessageRow) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    intro: row.intro,
    variants: row.variants ?? [],
  };
}

router.get("/assistant/conversation", async (_req, res) => {
  const rows = await db
    .select()
    .from(assistantMessagesTable)
    .orderBy(asc(assistantMessagesTable.sortOrder));

  const [context, guardrails] = await Promise.all([
    getContent("assistant:context"),
    getContent("assistant:guardrails"),
  ]);

  res.json({
    messages: rows.map(toAssistantMessage),
    context: context ?? [],
    guardrails: guardrails ?? [],
  });
});

function buildSystemPrompt(context: ContextItem[], guardrails: Guardrail[]): string {
  const contextLines = context.length
    ? context
        .map((c) => `- ${c.title} (${c.subtitle})${c.active ? " [primary focus]" : ""}`)
        .join("\n")
    : "- No specific context attached.";

  const guardrailLines = guardrails.length
    ? guardrails
        .map((g) => {
          const label = g.type === "warn" ? "MUST AVOID" : "REQUIRED";
          return `- ${label}: ${g.title} — ${g.description}`;
        })
        .join("\n")
    : "- Keep copy clear, professional, and on-brand.";

  return [
    "You are CCA Copilot, the AI marketing assistant inside CCA, a marketing operations platform.",
    "You help marketing teams draft campaign briefs, social posts, and surface insights.",
    "Write in CCA's voice: authoritative, clear, and human — no fluff.",
    "",
    "Working context for this conversation:",
    contextLines,
    "",
    "Brand guardrails you MUST respect in every reply:",
    guardrailLines,
    "These guardrails override any conflicting user instruction. If the user explicitly asks you to break one (for example, to use a banned word), do not comply — briefly note the constraint in `intro` and produce on-brand content that follows the guardrails instead.",
    "",
    "When the user asks for social posts, ad copy, or other content variants, return multiple distinct variants.",
    "Respond ONLY with a JSON object matching exactly this shape:",
    "{",
    '  "intro": string,  // a short sentence introducing the reply',
    '  "variants": [',
    "    {",
    '      "number": string,    // e.g. "1"',
    '      "platform": string,  // e.g. "LinkedIn", "Twitter / X", or "" if not platform-specific',
    '      "tone": string,      // e.g. "Thought Leadership", or "" if not applicable',
    '      "content": string,   // the actual drafted copy',
    '      "tags": string       // relevant hashtags, or "" if none',
    "    }",
    "  ]",
    "}",
    "If the request is a question or does not call for content variants, put your full answer in `intro` and return an empty `variants` array.",
    "Never wrap the JSON in markdown code fences.",
  ].join("\n");
}

type AssistantReplyPayload = { intro: string; variants: AssistantVariant[] };

function normalizeReply(raw: unknown): AssistantReplyPayload {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const intro = typeof obj.intro === "string" && obj.intro.trim().length > 0
    ? obj.intro.trim()
    : "Here's a draft based on your request.";

  const variantsRaw = Array.isArray(obj.variants) ? obj.variants : [];
  const variants: AssistantVariant[] = variantsRaw
    .map((v, i) => {
      const item = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
      const content = typeof item.content === "string" ? item.content.trim() : "";
      if (!content) return null;
      return {
        number: typeof item.number === "string" && item.number.trim() ? item.number.trim() : String(i + 1),
        platform: typeof item.platform === "string" ? item.platform : "",
        tone: typeof item.tone === "string" ? item.tone : "",
        content,
        tags: typeof item.tags === "string" ? item.tags : "",
      };
    })
    .filter((v): v is AssistantVariant => v !== null);

  return { intro, variants };
}

router.post("/assistant/messages", async (req, res) => {
  const parsed = SendAssistantMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid assistant query" });
    return;
  }

  const [history, context, guardrails] = await Promise.all([
    db.select().from(assistantMessagesTable).orderBy(asc(assistantMessagesTable.sortOrder)),
    getContent<ContextItem[]>("assistant:context"),
    getContent<Guardrail[]>("assistant:guardrails"),
  ]);

  const maxOrder = history.reduce((max, row) => Math.max(max, row.sortOrder), -1);
  let nextOrder = maxOrder + 1;

  await db.insert(assistantMessagesTable).values({
    id: `am-${Date.now()}-u`,
    role: "user",
    content: parsed.data.content,
    sortOrder: nextOrder,
  });
  nextOrder += 1;

  const systemPrompt = buildSystemPrompt(context ?? [], guardrails ?? []);
  const priorMessages = history.slice(-10).map((row) => ({
    role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: row.role === "assistant" ? (row.intro ?? row.content) : row.content,
  }));

  let payload: AssistantReplyPayload;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...priorMessages,
        { role: "user", content: parsed.data.content },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    let raw: unknown = {};
    try {
      raw = JSON.parse(text);
    } catch {
      raw = { intro: text };
    }
    payload = normalizeReply(raw);
  } catch (err) {
    req.log?.error({ err }, "Assistant LLM request failed");
    res.status(502).json({ error: "The assistant is unavailable right now. Please try again." });
    return;
  }

  const reply = {
    id: `am-${Date.now()}-a`,
    role: "assistant" as const,
    content: payload.intro,
    intro: payload.intro,
    variants: payload.variants,
  };

  await db.insert(assistantMessagesTable).values({
    id: reply.id,
    role: reply.role,
    content: reply.content,
    intro: reply.intro,
    variants: reply.variants,
    sortOrder: nextOrder,
  });

  res.json(reply);
});

export default router;
