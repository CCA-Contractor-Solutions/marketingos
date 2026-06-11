import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import campaignsRouter from "./campaigns";
import tasksRouter from "./tasks";
import threadsRouter from "./threads";
import assistantRouter from "./assistant";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(campaignsRouter);
router.use(tasksRouter);
router.use(threadsRouter);
router.use(assistantRouter);
router.use(analyticsRouter);

export default router;
