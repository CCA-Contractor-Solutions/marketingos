import { pgTable, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export type Persona = { name: string; description: string };
export type CampaignKpi = {
  label: string;
  target: string;
  current: string;
  progress: number;
  trend: string;
};
export type CampaignAsset = {
  id: string;
  name: string;
  type: "video" | "design" | "doc" | "archive";
  size: string;
  date: string;
};
export type CampaignTaskRef = {
  id: string;
  title: string;
  assignee: string;
  status: "completed" | "in_progress" | "pending";
};
export type ActivityItem = {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
  color: string;
  isAI: boolean;
};
export type CampaignInsight = {
  id: string;
  severity: "warning" | "alert" | "info";
  title: string;
  body: string;
  action?: string | null;
};

export const campaignsTable = pgTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  ownerName: text("owner_name").notNull(),
  ownerInitials: text("owner_initials").notNull(),
  ownerColor: text("owner_color").notNull(),
  status: text("status").notNull(),
  statusColor: text("status_color").notNull(),
  progress: integer("progress").notNull().default(0),
  budgetTotal: integer("budget_total").notNull().default(0),
  budgetSpent: integer("budget_spent").notNull().default(0),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  channels: jsonb("channels").$type<string[]>().notNull().default([]),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  personas: jsonb("personas").$type<Persona[]>().notNull().default([]),
  kpis: jsonb("kpis").$type<CampaignKpi[]>().notNull().default([]),
  assets: jsonb("assets").$type<CampaignAsset[]>().notNull().default([]),
  linkedTasks: jsonb("linked_tasks").$type<CampaignTaskRef[]>().notNull().default([]),
  activity: jsonb("activity").$type<ActivityItem[]>().notNull().default([]),
  insights: jsonb("insights").$type<CampaignInsight[]>().notNull().default([]),
});

export type CampaignRow = typeof campaignsTable.$inferSelect;

export type Assignee = { init: string; color: string };
export type Subtasks = { completed: number; total: number };

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("backlog"),
  priority: text("priority").notNull().default("medium"),
  assignees: jsonb("assignees").$type<Assignee[]>().notNull().default([]),
  dueDate: text("due_date"),
  dueAt: text("due_at"),
  campaign: text("campaign"),
  subtasks: jsonb("subtasks").$type<Subtasks | null>(),
  comments: integer("comments"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  blocked: boolean("blocked").notNull().default(false),
  dependsOn: text("depends_on"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type TaskRow = typeof tasksTable.$inferSelect;

export type ProposedTask = { id: string; title: string; assignee: string };
export type ThreadSummaryData = {
  decisions: string[];
  risks: string[];
  proposedTasks: ProposedTask[];
};

export const threadsTable = pgTable("threads", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  campaign: text("campaign").notNull().default(""),
  lastMessage: text("last_message").notNull().default(""),
  time: text("time").notNull().default(""),
  unread: integer("unread").notNull().default(0),
  avatars: jsonb("avatars").$type<string[]>().notNull().default([]),
  summary: jsonb("summary")
    .$type<ThreadSummaryData>()
    .notNull()
    .default({ decisions: [], risks: [], proposedTasks: [] }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type ThreadRow = typeof threadsTable.$inferSelect;

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  sender: text("sender").notNull(),
  initials: text("initials").notNull(),
  role: text("role").notNull().default(""),
  time: text("time").notNull().default(""),
  content: text("content").notNull(),
  isRisk: boolean("is_risk").notNull().default(false),
  isDecision: boolean("is_decision").notNull().default(false),
  color: text("color").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type MessageRow = typeof messagesTable.$inferSelect;

export type AssistantVariant = {
  number: string;
  platform: string;
  tone: string;
  content: string;
  tags: string;
};

export const assistantMessagesTable = pgTable("assistant_messages", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  intro: text("intro"),
  variants: jsonb("variants").$type<AssistantVariant[] | null>(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type AssistantMessageRow = typeof assistantMessagesTable.$inferSelect;

export const appContentTable = pgTable("app_content", {
  key: text("key").primaryKey(),
  data: jsonb("data").$type<unknown>().notNull(),
});

export type AppContentRow = typeof appContentTable.$inferSelect;
