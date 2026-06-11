import { Router, type IRouter } from "express";
import { getContent } from "../lib/content";

const router: IRouter = Router();

router.get("/analytics", async (_req, res) => {
  const analytics = await getContent("analytics");
  if (!analytics) {
    res.status(404).json({ error: "Analytics data not found" });
    return;
  }
  res.json(analytics);
});

export default router;
