import { db, appContentTable, campaignsTable, type CampaignRow } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getContent<T>(key: string): Promise<T | null> {
  const rows = await db
    .select({ data: appContentTable.data })
    .from(appContentTable)
    .where(eq(appContentTable.key, key))
    .limit(1);
  if (rows.length === 0) return null;
  return rows[0]!.data as T;
}

export function toCampaignSummary(row: CampaignRow) {
  return {
    id: row.id,
    name: row.name,
    owner: row.ownerName,
    ownerColor: row.ownerColor,
    status: row.status,
    statusColor: row.statusColor,
    progress: row.progress,
    budgetTotal: row.budgetTotal,
    budgetSpent: row.budgetSpent,
    channels: row.channels,
  };
}

export function toCampaignDetail(row: CampaignRow) {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    ownerName: row.ownerName,
    ownerInitials: row.ownerInitials,
    ownerColor: row.ownerColor,
    status: row.status,
    budgetTotal: row.budgetTotal,
    budgetSpent: row.budgetSpent,
    startDate: row.startDate,
    endDate: row.endDate,
    goals: row.goals,
    personas: row.personas,
    channels: row.channels,
    kpis: row.kpis,
    assets: row.assets,
    tasks: row.linkedTasks,
    activity: row.activity,
    insights: row.insights,
  };
}
