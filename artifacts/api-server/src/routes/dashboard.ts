import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import { getContent, toCampaignSummary } from "../lib/content";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const campaignRows = await db
    .select()
    .from(campaignsTable)
    .orderBy(asc(campaignsTable.sortOrder))
    .limit(3);

  const [kpis, milestones, insights, taskRollup, attention] = await Promise.all([
    getContent("dashboard:kpis"),
    getContent("dashboard:milestones"),
    getContent("dashboard:insights"),
    getContent("dashboard:taskRollup"),
    getContent("dashboard:attention"),
  ]);

  res.json({
    kpis: kpis ?? [],
    campaigns: campaignRows.map(toCampaignSummary),
    milestones: milestones ?? [],
    insights: insights ?? [],
    taskRollup: taskRollup ?? {
      todo: 0,
      inProgress: 0,
      inReview: 0,
      done: 0,
      overdue: 0,
      blocked: 0,
    },
    attention: attention ?? [],
  });
});

export default router;
