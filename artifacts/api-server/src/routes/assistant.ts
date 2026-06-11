import { Router, type IRouter } from "express";
import { asc, sql } from "drizzle-orm";
import { db, assistantMessagesTable, type AssistantMessageRow } from "@workspace/db";
import { SendAssistantMessageBody } from "@workspace/api-zod";
import { getContent } from "../lib/content";

const router: IRouter = Router();

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

router.post("/assistant/messages", async (req, res) => {
  const parsed = SendAssistantMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid assistant query" });
    return;
  }

  const maxRow = await db
    .select({ max: sql<number>`coalesce(max(${assistantMessagesTable.sortOrder}), -1)` })
    .from(assistantMessagesTable);
  let nextOrder = (maxRow[0]?.max ?? -1) + 1;

  await db.insert(assistantMessagesTable).values({
    id: `am-${Date.now()}-u`,
    role: "user",
    content: parsed.data.content,
    sortOrder: nextOrder,
  });
  nextOrder += 1;

  const reply = {
    id: `am-${Date.now()}-a`,
    role: "assistant" as const,
    content:
      "Here's a draft based on your request. I've kept it aligned with the CCA brand guardrails — review and let me know what to refine:",
    intro:
      "Here's a draft based on your request. I've kept it aligned with the CCA brand guardrails — review and let me know what to refine:",
    variants: [
      {
        number: "1",
        platform: "LinkedIn",
        tone: "Professional",
        content:
          "Marketing teams move faster when planning, execution, and insight live in one place. See how CCA turns scattered campaigns into a single, measurable rhythm.",
        tags: "#MarketingOps #CCA",
      },
    ],
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
