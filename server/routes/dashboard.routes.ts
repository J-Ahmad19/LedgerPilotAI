import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken as any);

router.get("/metrics", getDashboardMetrics);

export default router;
