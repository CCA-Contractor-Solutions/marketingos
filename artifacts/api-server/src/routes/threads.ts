import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, threadsTable, messagesTable, type ThreadRow, type MessageRow } from "@workspace/db";
import { CreateThreadMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

function toThread(row: ThreadRow) {
  return {
    id: row.id,
    title: row.title,
    campaign: row.campaign,
    lastMessage: row.lastMessage,
    time: row.time,
    unread: row.unread,
    avatars: row.avatars,
  };
}

function toMessage(row: MessageRow) {
  return {
    id: row.id,
    threadId: row.threadId,
    sender: row.sender,
    initials: row.initials,
    role: row.role,
    time: row.time,
    content: row.content,
    isRisk: row.isRisk,
    isDecision: row.isDecision,
    color: row.color,
  };
}

router.get("/threads", async (_req, res) => {
  const rows = await db
    .select()
    .from(threadsTable)
    .orderBy(asc(threadsTable.sortOrder));
  res.json(rows.map(toThread));
});

router.get("/threads/:id", async (req, res) => {
  const threadRows = await db
    .select()
    .from(threadsTable)
    .where(eq(threadsTable.id, req.params.id))
    .limit(1);
  if (threadRows.length === 0) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }
  const thread = threadRows[0]!;
  const messageRows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.threadId, thread.id))
    .orderBy(asc(messagesTable.sortOrder));

  res.json({
    thread: toThread(thread),
    messages: messageRows.map(toMessage),
    summary: thread.summary,
  });
});

router.post("/threads/:id/messages", async (req, res) => {
  const threadRows = await db
    .select()
    .from(threadsTable)
    .where(eq(threadsTable.id, req.params.id))
    .limit(1);
  if (threadRows.length === 0) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const parsed = CreateThreadMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message input" });
    return;
  }

  const maxRow = await db
    .select({ max: sql<number>`coalesce(max(${messagesTable.sortOrder}), -1)` })
    .from(messagesTable)
    .where(eq(messagesTable.threadId, req.params.id));
  const nextOrder = (maxRow[0]?.max ?? -1) + 1;
  const id = `msg-${Date.now()}`;

  const inserted = await db
    .insert(messagesTable)
    .values({
      id,
      threadId: req.params.id,
      sender: "You",
      initials: "YO",
      role: "Marketing Manager",
      time: "Now",
      content: parsed.data.content,
      color: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
      sortOrder: nextOrder,
    })
    .returning();

  await db
    .update(threadsTable)
    .set({ lastMessage: parsed.data.content })
    .where(eq(threadsTable.id, req.params.id));

  res.status(201).json(toMessage(inserted[0]!));
});

export default router;
