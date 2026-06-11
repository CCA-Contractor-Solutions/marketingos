import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, tasksTable, type TaskRow } from "@workspace/db";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";

const router: IRouter = Router();

function toTask(row: TaskRow) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    assignees: row.assignees,
    dueDate: row.dueDate,
    dueAt: row.dueAt,
    campaign: row.campaign,
    subtasks: row.subtasks ?? null,
    comments: row.comments,
    aiGenerated: row.aiGenerated,
    blocked: row.blocked,
    dependsOn: row.dependsOn,
  };
}

router.get("/tasks", async (_req, res) => {
  const rows = await db
    .select()
    .from(tasksTable)
    .orderBy(asc(tasksTable.sortOrder));
  res.json(rows.map(toTask));
});

router.post("/tasks", async (req, res) => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task input" });
    return;
  }
  const body = parsed.data;

  const maxRow = await db
    .select({ max: sql<number>`coalesce(max(${tasksTable.sortOrder}), -1)` })
    .from(tasksTable);
  const nextOrder = (maxRow[0]?.max ?? -1) + 1;

  const countRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasksTable);
  const id = `TSK-${200 + Number(countRow[0]?.count ?? 0)}`;

  const inserted = await db
    .insert(tasksTable)
    .values({
      id,
      title: body.title,
      status: body.status,
      priority: body.priority,
      campaign: body.campaign ?? null,
      dueDate: body.dueDate ?? null,
      dueAt: body.dueAt ?? null,
      sortOrder: nextOrder,
    })
    .returning();

  res.status(201).json(toTask(inserted[0]!));
});

router.patch("/tasks/:id", async (req, res) => {
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid task update" });
    return;
  }
  const body = parsed.data;

  const update: Partial<TaskRow> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.status !== undefined) update.status = body.status;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.campaign !== undefined) update.campaign = body.campaign;
  if (body.dueDate !== undefined) update.dueDate = body.dueDate;
  if (body.dueAt !== undefined) update.dueAt = body.dueAt;
  if (body.blocked !== undefined) update.blocked = body.blocked;

  const updated = await db
    .update(tasksTable)
    .set(update)
    .where(eq(tasksTable.id, req.params.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(toTask(updated[0]!));
});

export default router;
