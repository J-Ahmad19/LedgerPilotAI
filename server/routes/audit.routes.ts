import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get("/", getAuditLogs);

export default router;
