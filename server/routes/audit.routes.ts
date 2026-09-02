import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";

const router = Router();

router.use(authenticateToken as any);
router.use(requireTenant);

router.get("/", getAuditLogs);

export default router;
