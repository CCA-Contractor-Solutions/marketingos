import {
  db,
  campaignsTable,
  tasksTable,
  threadsTable,
  messagesTable,
  assistantMessagesTable,
  appContentTable,
  type CampaignRow,
  type TaskRow,
  type ThreadRow,
  type MessageRow,
  type AssistantMessageRow,
} from "@workspace/db";
import { logger } from "./lib/logger";

type CampaignSeed = typeof campaignsTable.$inferInsert;
type TaskSeed = typeof tasksTable.$inferInsert;
type ThreadSeed = typeof threadsTable.$inferInsert;
type MessageSeed = typeof messagesTable.$inferInsert;
type AssistantSeed = typeof assistantMessagesTable.$inferInsert;

const campaigns: CampaignSeed[] = [
  {
    id: "summit",
    name: "Q3 Enterprise Summit Promo",
    subtitle: "Active · Q3 Field Marketing",
    ownerName: "Sarah J.",
    ownerInitials: "SJ",
    ownerColor: "#4f46e5",
    status: "On Track",
    statusColor: "var(--c-emerald)",
    progress: 75,
    budgetTotal: 45000,
    budgetSpent: 32000,
    startDate: "Jul 1, 2024",
    endDate: "Sep 30, 2024",
    sortOrder: 0,
    channels: ["Email", "LinkedIn"],
    goals: [
      "Drive 500 enterprise summit registrations",
      "Generate 120 sales-qualified leads",
      "Achieve 25% email open rate across the drop sequence",
    ],
    personas: [
      {
        name: "Enterprise Decision Makers",
        description: "VPs and directors evaluating platform migrations.",
      },
      {
        name: "Existing Customers",
        description: "Current accounts with expansion potential.",
      },
    ],
    kpis: [
      { label: "Registrations", target: "500", current: "375", progress: 75, trend: "+12%" },
      { label: "SQLs", target: "120", current: "82", progress: 68, trend: "+9%" },
      { label: "Email Open Rate", target: "25%", current: "27.4%", progress: 100, trend: "+2.4%" },
      { label: "Cost per Lead", target: "$120", current: "$108", progress: 100, trend: "-10%" },
    ],
    assets: [
      { id: "a1", name: "Summit_Invite_Email_V2.html", type: "doc", size: "82 KB", date: "2 days ago" },
      { id: "a2", name: "LinkedIn_Promo_Carousel.fig", type: "design", size: "9.4 MB", date: "4 days ago" },
    ],
    linkedTasks: [
      { id: "ct1", title: "Finalize email drop 2 schedule", assignee: "SJ", status: "in_progress" },
      { id: "ct2", title: "Confirm summit venue AV setup", assignee: "ER", status: "completed" },
    ],
    activity: [
      {
        id: "ac1",
        user: "Sarah J.",
        action: "updated",
        target: "Email Drop 2 schedule",
        time: "3 hours ago",
        avatar: "SJ",
        color: "#4f46e5",
        isAI: false,
      },
      {
        id: "ac2",
        user: "MarketingOS AI",
        action: "auto-flagged",
        target: "low LinkedIn engagement",
        time: "1 day ago",
        avatar: "AI",
        color: "#4f46e5",
        isAI: true,
      },
    ],
    insights: [
      {
        id: "ci1",
        severity: "info",
        title: "Strong email performance",
        body: "Open rates are 2.4% above target — consider an additional send to non-openers.",
        action: "Draft follow-up",
      },
    ],
  },
  {
    id: "nexus",
    name: "Product Launch: Nexus 2.0",
    subtitle: "At Risk · Q3 Product Launch",
    ownerName: "Mike T.",
    ownerInitials: "MT",
    ownerColor: "#7c3aed",
    status: "At Risk",
    statusColor: "var(--c-rose)",
    progress: 40,
    budgetTotal: 120000,
    budgetSpent: 65000,
    startDate: "Aug 1, 2024",
    endDate: "Oct 15, 2024",
    sortOrder: 1,
    channels: ["Display", "Twitter", "PR"],
    goals: [
      "Generate 2M impressions across paid display",
      "Drive 8,000 product page visits",
      "Secure 15 press placements",
    ],
    personas: [
      {
        name: "Tech Early Adopters",
        description: "Users eager to try the latest product features.",
      },
      {
        name: "Industry Analysts",
        description: "Press and analysts covering the category.",
      },
    ],
    kpis: [
      { label: "Impressions", target: "2.0M", current: "780K", progress: 39, trend: "+6%" },
      { label: "Page Visits", target: "8,000", current: "3,100", progress: 39, trend: "+4%" },
      { label: "Press Placements", target: "15", current: "5", progress: 33, trend: "+2" },
      { label: "CPA", target: "$60", current: "$74", progress: 60, trend: "+14%" },
    ],
    assets: [
      { id: "a1", name: "Nexus_Launch_Trailer.mp4", type: "video", size: "48.2 MB", date: "1 day ago" },
      { id: "a2", name: "Press_Kit_Final.zip", type: "archive", size: "120 MB", date: "3 days ago" },
    ],
    linkedTasks: [
      { id: "ct1", title: "Review display ad copy", assignee: "MT", status: "pending" },
      { id: "ct2", title: "Send press kit to tier-1 outlets", assignee: "MT", status: "in_progress" },
    ],
    activity: [
      {
        id: "ac1",
        user: "Mike T.",
        action: "changed status to",
        target: "At Risk",
        time: "5 hours ago",
        avatar: "MT",
        color: "#7c3aed",
        isAI: false,
      },
      {
        id: "ac2",
        user: "MarketingOS AI",
        action: "detected",
        target: "high CPA on Display",
        time: "1 day ago",
        avatar: "AI",
        color: "#4f46e5",
        isAI: true,
      },
    ],
    insights: [
      {
        id: "ci1",
        severity: "alert",
        title: "CPA above target",
        body: "Display CPA is 23% over target. Consider reallocating budget to Twitter.",
        action: "Reallocate budget",
      },
    ],
  },
  {
    id: "partner",
    name: "Partner Co-marketing Q3",
    subtitle: "Pacing · Q3 Partnerships",
    ownerName: "Elena R.",
    ownerInitials: "ER",
    ownerColor: "#f5a524",
    status: "Pacing",
    statusColor: "var(--c-amber)",
    progress: 60,
    budgetTotal: 25000,
    budgetSpent: 15000,
    startDate: "Jul 15, 2024",
    endDate: "Sep 15, 2024",
    sortOrder: 2,
    channels: ["Webinar", "Email"],
    goals: [
      "Co-host 3 partner webinars",
      "Generate 600 shared leads",
      "Achieve 40% attendee-to-MQL conversion",
    ],
    personas: [
      {
        name: "Partner Audiences",
        description: "Prospects from co-marketing partner lists.",
      },
      {
        name: "Mid-Market Buyers",
        description: "Growing teams evaluating new tools.",
      },
    ],
    kpis: [
      { label: "Webinars", target: "3", current: "2", progress: 67, trend: "+1" },
      { label: "Shared Leads", target: "600", current: "360", progress: 60, trend: "+8%" },
      { label: "Attendee→MQL", target: "40%", current: "38%", progress: 95, trend: "+3%" },
      { label: "Cost per Lead", target: "$40", current: "$36", progress: 100, trend: "-10%" },
    ],
    assets: [
      { id: "a1", name: "Partner_Webinar_Deck.key", type: "doc", size: "5.1 MB", date: "2 days ago" },
      { id: "a2", name: "Co-branded_Banners.fig", type: "design", size: "7.8 MB", date: "5 days ago" },
    ],
    linkedTasks: [
      { id: "ct1", title: "Schedule webinar 3 with partner", assignee: "ER", status: "in_progress" },
      { id: "ct2", title: "Finalize co-branded landing page", assignee: "ER", status: "completed" },
    ],
    activity: [
      {
        id: "ac1",
        user: "Elena R.",
        action: "scheduled",
        target: "Webinar 3",
        time: "6 hours ago",
        avatar: "ER",
        color: "#f5a524",
        isAI: false,
      },
    ],
    insights: [
      {
        id: "ci1",
        severity: "info",
        title: "On pace for goals",
        body: "Lead generation is tracking steadily toward target. Maintain current cadence.",
        action: null,
      },
    ],
  },
  {
    id: "aurora",
    name: "Summer Launch — Aurora Headphones",
    subtitle: "Active · Q3 Hardware Push",
    ownerName: "Sarah Jenkins",
    ownerInitials: "SJ",
    ownerColor: "#fb6f5a",
    status: "Pending Approval",
    statusColor: "var(--c-amber)",
    progress: 28,
    budgetTotal: 150000,
    budgetSpent: 42500,
    startDate: "Jun 1, 2024",
    endDate: "Aug 31, 2024",
    sortOrder: 3,
    channels: ["Instagram", "TikTok", "YouTube", "Email", "Paid Search"],
    goals: [
      "Achieve 5M impressions across social channels",
      "Drive 25,000 product page visits",
      "Generate $1.2M in attributed revenue",
      "Reach 50,000 new email subscribers",
    ],
    personas: [
      {
        name: "Audiophile Gen-Z",
        description: "18-24, music-first, discovers products on TikTok and Reels.",
      },
      {
        name: "Commuting Professionals",
        description: "28-40, values noise cancellation and all-day comfort.",
      },
      {
        name: "Fitness Enthusiasts",
        description: "22-35, wants secure fit and sweat resistance for workouts.",
      },
    ],
    kpis: [
      { label: "Impressions", target: "5.0M", current: "1.4M", progress: 28, trend: "+18%" },
      { label: "Page Visits", target: "25,000", current: "7,200", progress: 29, trend: "+12%" },
      { label: "Attributed Revenue", target: "$1.2M", current: "$340K", progress: 28, trend: "+9%" },
      { label: "Email Subscribers", target: "50,000", current: "13,800", progress: 28, trend: "+15%" },
    ],
    assets: [
      { id: "a1", name: "Aurora_Hero_Film_60s.mp4", type: "video", size: "212 MB", date: "Yesterday" },
      { id: "a2", name: "Aurora_Social_Kit.fig", type: "design", size: "48 MB", date: "2 days ago" },
      { id: "a3", name: "Aurora_Launch_Brief.pdf", type: "doc", size: "1.2 MB", date: "3 days ago" },
      { id: "a4", name: "Aurora_Press_Assets.zip", type: "archive", size: "640 MB", date: "5 days ago" },
    ],
    linkedTasks: [
      { id: "ct1", title: "Approve hero film final cut", assignee: "SJ", status: "pending" },
      { id: "ct2", title: "Finalize TikTok creator briefs", assignee: "MK", status: "in_progress" },
      { id: "ct3", title: "Set up paid search campaign structure", assignee: "AR", status: "in_progress" },
      { id: "ct4", title: "Build email welcome sequence", assignee: "MK", status: "completed" },
    ],
    activity: [
      {
        id: "ac1",
        user: "Sarah Jenkins",
        action: "submitted",
        target: "campaign for approval",
        time: "2 hours ago",
        avatar: "SJ",
        color: "#fb6f5a",
        isAI: false,
      },
      {
        id: "ac2",
        user: "MarketingOS AI",
        action: "generated",
        target: "3 audience personas",
        time: "4 hours ago",
        avatar: "AI",
        color: "#4f46e5",
        isAI: true,
      },
      {
        id: "ac3",
        user: "Marcus King",
        action: "uploaded",
        target: "Aurora_Social_Kit.fig",
        time: "2 days ago",
        avatar: "MK",
        color: "#18b386",
        isAI: false,
      },
    ],
    insights: [
      {
        id: "ci1",
        severity: "warning",
        title: "Budget pacing ahead of schedule",
        body: "Spend is tracking 6% faster than planned for this phase. Review paid search bids before launch ramp.",
        action: "Review bids",
      },
      {
        id: "ci2",
        severity: "info",
        title: "TikTok creatives outperforming",
        body: "Early TikTok previews are seeing 2.3x the benchmark engagement rate. Consider shifting more budget here.",
        action: "Adjust allocation",
      },
    ],
  },
];

// dueAt is a machine-readable ISO timestamp used by the mobile app to schedule
// "approaching due date" reminders. It is computed relative to seed time so the
// reminders are always meaningful regardless of when the database is seeded.
function inHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

// dueDate is a real, machine-readable due date stored as an ISO date string
// ("YYYY-MM-DD"). It is computed relative to seed time so the Calendar,
// Timeline, sorting, and overdue detection stay accurate as time passes
// (instead of relative labels like "Today" that never change).
function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const tasks: TaskSeed[] = [
  {
    id: "TSK-101",
    title: "Draft Q3 Performance Marketing Brief",
    status: "backlog",
    priority: "high",
    assignees: [{ init: "AR", color: "#fb6f5a" }],
    dueDate: inDays(1),
    dueAt: inHours(28),
    campaign: "Q3 Growth",
    subtasks: { completed: 1, total: 4 },
    sortOrder: 0,
  },
  {
    id: "TSK-102",
    title: "Compile competitor ad intelligence report",
    status: "backlog",
    priority: "medium",
    assignees: [{ init: "MK", color: "#18b386" }],
    aiGenerated: true,
    sortOrder: 1,
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
    dueDate: inDays(0),
    dueAt: inHours(6),
    campaign: "Winter Launch",
    comments: 3,
    blocked: true,
    dependsOn: "TSK-098",
    sortOrder: 2,
  },
  {
    id: "TSK-104",
    title: "Update landing page copy for A/B test variant",
    status: "in_progress",
    priority: "medium",
    assignees: [{ init: "MK", color: "#18b386" }],
    dueDate: inDays(2),
    dueAt: inHours(52),
    campaign: "Conversion Opt",
    subtasks: { completed: 2, total: 3 },
    dependsOn: "TSK-101",
    sortOrder: 3,
  },
  {
    id: "TSK-105",
    title: "Finalize email sequence for webinar registrants",
    status: "in_review",
    priority: "high",
    assignees: [{ init: "AR", color: "#fb6f5a" }],
    dueDate: inDays(-1),
    campaign: "Q3 Growth",
    comments: 8,
    aiGenerated: true,
    sortOrder: 4,
  },
  {
    id: "TSK-106",
    title: "Approve social assets for product announcement",
    status: "in_review",
    priority: "low",
    assignees: [{ init: "SJ", color: "#7c3aed" }],
    campaign: "Winter Launch",
    sortOrder: 5,
  },
  {
    id: "TSK-107",
    title: "Set up tracking pixels for new acquisition funnel",
    status: "done",
    priority: "high",
    assignees: [{ init: "MK", color: "#18b386" }],
    dueDate: inDays(-3),
    campaign: "Tech Debt",
    subtasks: { completed: 5, total: 5 },
    comments: 2,
    sortOrder: 6,
  },
  {
    id: "TSK-108",
    title: "Weekly marketing sync notes & action items",
    status: "done",
    priority: "medium",
    assignees: [{ init: "SJ", color: "#7c3aed" }],
    aiGenerated: true,
    sortOrder: 7,
  },
];

const threads: ThreadSeed[] = [
  {
    id: "t1",
    title: "Q3 B2B Lead Gen Launch",
    campaign: "Q3 Enterprise Growth",
    lastMessage: "Let's bump LinkedIn by 15% and pull from...",
    time: "10:42 AM",
    unread: 0,
    avatars: ["SB", "MD", "EW"],
    sortOrder: 0,
    summary: {
      decisions: ["Landing page copy is locked.", "LinkedIn ad budget increased by 15%."],
      risks: ["Initial LinkedIn budget might fail to hit top-of-funnel volume targets."],
      proposedTasks: [
        { id: "task1", title: "Finalize and upload hero assets for landing page", assignee: "Elena Wei" },
        { id: "task2", title: "Review and approve email sequence draft", assignee: "Sarah Baker" },
        { id: "task3", title: "Reallocate 15% display budget to LinkedIn", assignee: "David Chen" },
      ],
    },
  },
  {
    id: "t2",
    title: "Social Media Refocus - August",
    campaign: "Brand Awareness",
    lastMessage: "The new creative looks much better.",
    time: "Yesterday",
    unread: 3,
    avatars: ["EW", "KL"],
    sortOrder: 1,
    summary: { decisions: [], risks: [], proposedTasks: [] },
  },
  {
    id: "t3",
    title: "Enterprise Summit 2024 Sponsorship",
    campaign: "Field Marketing",
    lastMessage: "Have we received the booth dimensions yet?",
    time: "Tue",
    unread: 0,
    avatars: ["SB", "RJ", "KL", "MD"],
    sortOrder: 2,
    summary: { decisions: [], risks: [], proposedTasks: [] },
  },
];

const messages: MessageSeed[] = [
  {
    id: "m1",
    threadId: "t1",
    sender: "Sarah Baker",
    initials: "SB",
    role: "Marketing Director",
    time: "09:15 AM",
    content:
      "Hey team, the landing page copy is locked. Elena, how are the hero assets coming along? We need them by EOD tomorrow to stay on schedule.",
    color: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
    sortOrder: 0,
  },
  {
    id: "m2",
    threadId: "t1",
    sender: "Elena Wei",
    initials: "EW",
    role: "Lead Designer",
    time: "09:32 AM",
    content:
      "Assets are 90% there. Just tweaking the contrast for mobile layouts. I'll drop the Figma link in the main campaign channel once done.",
    color: "linear-gradient(135deg, var(--c-emerald), var(--c-sky))",
    sortOrder: 1,
  },
  {
    id: "m3",
    threadId: "t1",
    sender: "Mike Davis",
    initials: "MD",
    role: "Content Manager",
    time: "10:05 AM",
    content:
      "I've drafted the email sequence. Review link is in the campaign folder. Needs approval before we can load it into Marketo.",
    color: "linear-gradient(135deg, var(--c-amber), var(--c-coral))",
    sortOrder: 2,
  },
  {
    id: "m4",
    threadId: "t1",
    sender: "David Chen",
    initials: "DC",
    role: "Performance Marketing",
    time: "10:28 AM",
    content:
      "Flagging a risk here: The ad budget allocation for LinkedIn seems too low given the new target CPA we discussed yesterday. At the current daily cap, we might not hit the volume targets for the top-of-funnel phase.",
    isRisk: true,
    color: "linear-gradient(135deg, var(--c-rose), var(--c-coral))",
    sortOrder: 3,
  },
  {
    id: "m5",
    threadId: "t1",
    sender: "Sarah Baker",
    initials: "SB",
    role: "Marketing Director",
    time: "10:42 AM",
    content:
      "Good catch David. Let's bump LinkedIn by 15% and pull from the display network budget. Make the adjustment today.",
    isDecision: true,
    color: "linear-gradient(135deg, var(--c-brand), var(--c-violet))",
    sortOrder: 4,
  },
];

const assistantMessages: AssistantSeed[] = [
  {
    id: "am1",
    role: "user",
    content:
      "Generate 3 social post variants for the Q3 Enterprise Launch. Focus on the new predictive analytics feature. Our audience is CMOs.",
    sortOrder: 0,
  },
  {
    id: "am2",
    role: "assistant",
    content:
      "Here are 3 tailored social post variants for the Q3 Enterprise Launch, highlighting predictive analytics for CMOs:",
    intro:
      "Here are 3 tailored social post variants for the Q3 Enterprise Launch, highlighting predictive analytics for CMOs:",
    variants: [
      {
        number: "1",
        platform: "LinkedIn",
        tone: "Thought Leadership",
        content:
          "Stop guessing. Start predicting. Our Q3 Enterprise update introduces AI-driven predictive analytics that helps CMOs forecast campaign ROI before spending a dime. See how top marketing teams are staying ahead of the curve.",
        tags: "#MarketingAnalytics #CMO #PredictiveAI",
      },
      {
        number: "2",
        platform: "Twitter / X",
        tone: "Punchy & Direct",
        content:
          "What if you knew your campaign's ROI before launching? The new MarketingOS Predictive Analytics engine for Enterprise is here. Built for marketing leaders who demand precision.",
        tags: "#MarketingStrategy #Martech",
      },
      {
        number: "3",
        platform: "LinkedIn",
        tone: "Data-Driven Story",
        content:
          "Last quarter, marketing leaders wasted an average of 14% of their budget on low-performing channels. With our new predictive analytics feature, you can allocate spend with 92% confidence based on historical modeling. Ready to transform your marketing ops?",
        tags: "#DataDriven #MarketingOps #Leadership",
      },
    ],
    sortOrder: 1,
  },
];

const appContent: { key: string; data: unknown }[] = [
  {
    key: "dashboard:kpis",
    data: [
      { title: "Revenue Pipeline", value: "$2.4M", delta: "+14.2%", isPositive: true, sparkline: [30, 40, 35, 50, 45, 60, 75] },
      { title: "Marketing Qualified Leads", value: "1,248", delta: "+8.4%", isPositive: true, sparkline: [10, 15, 12, 18, 22, 19, 25] },
      { title: "Return on Ad Spend", value: "3.8x", delta: "-0.2x", isPositive: false, sparkline: [42, 40, 41, 39, 37, 36, 38] },
      { title: "Conversion Rate", value: "4.6%", delta: "+1.1%", isPositive: true, sparkline: [25, 30, 32, 35, 40, 42, 46] },
      { title: "Website Traffic", value: "184K", delta: "+22%", isPositive: true, sparkline: [120, 130, 125, 140, 150, 160, 184] },
      { title: "Social Engagement", value: "8.2%", delta: "-1.5%", isPositive: false, sparkline: [95, 92, 90, 88, 85, 80, 82] },
    ],
  },
  {
    key: "dashboard:milestones",
    data: [
      { id: "ms1", date: "Today, 10:00 AM", title: "Final review: Nexus 2.0 Launch Assets", type: "review" },
      { id: "ms2", date: "Tomorrow, 2:00 PM", title: "Q3 Enterprise Summit Email Drop 2", type: "launch" },
      { id: "ms3", date: "Thursday, 9:00 AM", title: "Weekly Performance Sync", type: "meeting" },
      { id: "ms4", date: "Friday, EOD", title: "Budget Reallocation Deadline", type: "deadline" },
    ],
  },
  {
    key: "dashboard:insights",
    data: [
      {
        id: "ins1",
        severity: "warning",
        title: "Reallocate LinkedIn Budget",
        body: '"Product Launch" campaign is seeing high CPA on LinkedIn. Reallocating $10K to Twitter could improve overall ROI by 12%.',
        action: "Apply Recommendation",
      },
      {
        id: "ins2",
        severity: "alert",
        title: "Missing Assets Detected",
        body: '2 video assets for tomorrow\'s "Email Drop 2" are still marked as in-progress.',
        action: null,
      },
    ],
  },
  {
    key: "dashboard:taskRollup",
    data: { todo: 31, inProgress: 24, inReview: 12, done: 86, overdue: 3, blocked: 1 },
  },
  {
    key: "dashboard:attention",
    data: [
      { id: "at1", title: "Approve Q3 Budget Report", time: "Yesterday", severity: "high" },
      { id: "at2", title: "Review display ad copy", time: "Yesterday", severity: "high" },
      { id: "at3", title: "Video assets blocked by Legal", time: "Today", severity: "medium" },
    ],
  },
  {
    key: "assistant:context",
    data: [
      { id: "ctx1", icon: "campaign", title: "Q3 Enterprise Launch", subtitle: "Campaign • 3 days until launch", active: true },
      { id: "ctx2", icon: "audience", title: "Enterprise personas", subtitle: "Audience segment • CMO focus", active: false },
      { id: "ctx3", icon: "data", title: "Q2 Conversion Data", subtitle: "Data source • Connected 2h ago", active: false },
    ],
  },
  {
    key: "assistant:guardrails",
    data: [
      { type: "ok", title: "Authoritative & Clear", description: "Use active voice. Avoid jargon unless industry standard." },
      { type: "warn", title: "No hyperbolic claims", description: 'Do not use "revolutionary", "disruptive", or "magic".' },
    ],
  },
  {
    key: "analytics",
    data: {
      kpis: [
        { label: "Total Revenue", value: "$482.4K", change: "+14.2%", trend: "up" },
        { label: "Marketing Qualified Leads", value: "2,845", change: "+8.1%", trend: "up" },
        { label: "Average ROAS", value: "3.4x", change: "-2.1%", trend: "down" },
        { label: "Website Traffic", value: "145.2K", change: "+24.5%", trend: "up" },
      ],
      revenue: [
        { name: "Week 1", revenue: 85000, target: 80000 },
        { name: "Week 2", revenue: 92000, target: 82000 },
        { name: "Week 3", revenue: 115000, target: 85000 },
        { name: "Week 4", revenue: 135000, target: 88000 },
        { name: "Week 5", revenue: 154000, target: 90000 },
      ],
      channelRoas: [
        { name: "Paid Search", roas: 4.2 },
        { name: "Paid Social", roas: 3.1 },
        { name: "Email", roas: 5.4 },
        { name: "Display", roas: 1.8 },
        { name: "Affiliate", roas: 2.5 },
      ],
      traffic: [
        { name: "Organic", value: 45, color: "var(--c-brand)" },
        { name: "Direct", value: 25, color: "var(--c-violet)" },
        { name: "Paid", value: 20, color: "var(--c-sky)" },
        { name: "Social", value: 10, color: "var(--c-amber)" },
      ],
      funnel: [
        { stage: "Impressions", count: "1.2M", percent: 100 },
        { stage: "Website Visits", count: "145K", percent: 12 },
        { stage: "Leads Generated", count: "12.4K", percent: 1.03 },
        { stage: "MQLs", count: "2.8K", percent: 0.23 },
        { stage: "Closed Won", count: "482", percent: 0.04 },
      ],
      insight: {
        headline: "Paid Search ROAS is underperforming, while Email drives highest LTV.",
        observation:
          '"Q3 Enterprise Webinar" campaign on LinkedIn is consuming 40% of social budget with a 0.8x ROAS.',
        recommendation:
          "Reallocate $15k from LinkedIn to Email Nurture Sequence B, which has a 5.4x ROAS this month.",
      },
      reports: [
        { id: "r1", name: "Weekly Executive Summary", schedule: "Every Monday, 8AM" },
        { id: "r2", name: "Paid Performance Deep Dive", schedule: "Every 1st of Month" },
      ],
    },
  },
];

export async function seedDatabase(): Promise<void> {
  const existing: Pick<CampaignRow, "id">[] = await db
    .select({ id: campaignsTable.id })
    .from(campaignsTable)
    .limit(1);

  if (existing.length > 0) {
    logger.info("Seed skipped: data already present");
    return;
  }

  logger.info("Seeding database with MarketingOS marketing data");

  await db.insert(campaignsTable).values(campaigns);
  await db.insert(tasksTable).values(tasks);
  await db.insert(threadsTable).values(threads);
  await db.insert(messagesTable).values(messages);
  await db.insert(assistantMessagesTable).values(assistantMessages);
  await db.insert(appContentTable).values(appContent);

  logger.info("Seed complete");
}
