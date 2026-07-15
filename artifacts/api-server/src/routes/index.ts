import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import campaignsRouter from "./campaigns";
import tasksRouter from "./tasks";
import threadsRouter from "./threads";
import assistantRouter from "./assistant";
import analyticsRouter from "./analytics";
import eventsRouter from "./events";
import leadsRouter from "./leads";
import attributionRouter from "./attribution";
import channelsRouter from "./channels";
import campaignIntelligenceRouter from "./campaign-intelligence";
import recommendationsRouter from "./recommendations";
import integrationsRouter from "./integrations";
import intelligenceSummaryRouter from "./intelligence-summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(campaignsRouter);
router.use(tasksRouter);
router.use(threadsRouter);
router.use(assistantRouter);
router.use(analyticsRouter);
router.use(eventsRouter);
router.use(leadsRouter);
router.use(attributionRouter);
router.use(channelsRouter);
router.use(campaignIntelligenceRouter);
router.use(recommendationsRouter);
router.use(integrationsRouter);
router.use(intelligenceSummaryRouter);

export default router;
