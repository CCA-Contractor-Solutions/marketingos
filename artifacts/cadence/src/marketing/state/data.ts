export type Priority = "high" | "medium" | "low";
export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";

export interface Assignee {
  init: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignees: Assignee[];
  dueDate?: string;
  campaign?: string;
  subtasks?: { completed: number; total: number };
  comments?: number;
  aiGenerated?: boolean;
  blocked?: boolean;
  dependsOn?: string;
}

export interface Campaign {
  id: string;
  name: string;
  owner: string;
  ownerColor: string;
  status: string;
  statusColor: string;
  progress: number;
  budget: string;
  spent: string;
  channels: string[];
}

export interface Thread {
  id: string;
  title: string;
  campaign: string;
  lastMessage: string;
  time: string;
  unread: number;
  active: boolean;
  avatars: string[];
}

export function nextTaskId(tasks: Task[]): string {
  const nums = tasks
    .map((t) => parseInt(t.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 100;
  return `TSK-${max + 1}`;
}

export const seedTasks: Task[] = [
  {
    id: "TSK-101",
    title: "Draft Q3 Performance Marketing Brief",
    status: "backlog",
    priority: "high",
    assignees: [{ init: "AR", color: "#fb6f5a" }],
    dueDate: "Tomorrow",
    campaign: "Q3 Growth",
    subtasks: { completed: 1, total: 4 },
  },
  {
    id: "TSK-102",
    title: "Compile competitor ad intelligence report",
    status: "backlog",
    priority: "medium",
    assignees: [{ init: "MK", color: "#18b386" }],
    aiGenerated: true,
  },
  {
    id: "TSK-103",
    title: "Review influencer contract terms for Winter Launch",
    status: "in_progress",
    priority: "high",
    assignees: [
      { init: "SJ", color: "#7c3aed" },
      { init: "AR", color: "#fb6f5a" },
    ],
    dueDate: "Today",
    campaign: "Winter Launch",
    comments: 3,
    blocked: true,
    dependsOn: "TSK-098",
  },
  {
    id: "TSK-104",
    title: "Update landing page copy for A/B test variant",
    status: "in_progress",
    priority: "medium",
    assignees: [{ init: "MK", color: "#18b386" }],
    dueDate: "Oct 12",
    campaign: "Conversion Opt",
    subtasks: { completed: 2, total: 3 },
    dependsOn: "TSK-101",
  },
  {
    id: "TSK-105",
    title: "Finalize email sequence for webinar registrants",
    status: "in_review",
    priority: "high",
    assignees: [{ init: "AR", color: "#fb6f5a" }],
    dueDate: "Yesterday",
    campaign: "Q3 Growth",
    comments: 8,
    aiGenerated: true,
  },
  {
    id: "TSK-106",
    title: "Approve social assets for product announcement",
    status: "in_review",
    priority: "low",
    assignees: [{ init: "SJ", color: "#7c3aed" }],
    campaign: "Winter Launch",
  },
  {
    id: "TSK-107",
    title: "Set up tracking pixels for new acquisition funnel",
    status: "done",
    priority: "high",
    assignees: [{ init: "MK", color: "#18b386" }],
    dueDate: "Oct 8",
    campaign: "Tech Debt",
    subtasks: { completed: 5, total: 5 },
    comments: 2,
  },
  {
    id: "TSK-108",
    title: "Weekly marketing sync notes & action items",
    status: "done",
    priority: "medium",
    assignees: [{ init: "SJ", color: "#7c3aed" }],
    aiGenerated: true,
  },
];

export const seedCampaigns: Campaign[] = [
  {
    id: "cmp-1",
    name: "Q3 Enterprise Summit Promo",
    owner: "Sarah J.",
    ownerColor: "#4f46e5",
    status: "On Track",
    statusColor: "var(--c-emerald)",
    progress: 75,
    budget: "$45K",
    spent: "$32K",
    channels: ["Email", "LinkedIn"],
  },
  {
    id: "cmp-2",
    name: "Product Launch: Nexus 2.0",
    owner: "Mike T.",
    ownerColor: "#7c3aed",
    status: "At Risk",
    statusColor: "var(--c-rose)",
    progress: 40,
    budget: "$120K",
    spent: "$65K",
    channels: ["Display", "Twitter", "PR"],
  },
  {
    id: "cmp-3",
    name: "Partner Co-marketing Q3",
    owner: "Elena R.",
    ownerColor: "#f5a524",
    status: "Pacing",
    statusColor: "var(--c-amber)",
    progress: 60,
    budget: "$25K",
    spent: "$15K",
    channels: ["Webinar", "Email"],
  },
];

export const seedThreads: Thread[] = [
  {
    id: "t1",
    title: "Q3 B2B Lead Gen Launch",
    campaign: "Q3 Enterprise Growth",
    lastMessage: "Let's bump LinkedIn by 15% and pull from...",
    time: "10:42 AM",
    unread: 0,
    active: true,
    avatars: ["SB", "MD", "EW"],
  },
  {
    id: "t2",
    title: "Social Media Refocus - August",
    campaign: "Brand Awareness",
    lastMessage: "The new creative looks much better.",
    time: "Yesterday",
    unread: 3,
    active: false,
    avatars: ["EW", "KL"],
  },
  {
    id: "t3",
    title: "Enterprise Summit 2024 Sponsorship",
    campaign: "Field Marketing",
    lastMessage: "Have we received the booth dimensions yet?",
    time: "Tue",
    unread: 0,
    active: false,
    avatars: ["SB", "RJ", "KL", "MD"],
  },
];
