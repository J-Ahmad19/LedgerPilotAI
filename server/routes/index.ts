import { Router } from "express";
import multer from "multer";
import { uploadImport, importDemoData } from "../controllers/import.controller.js";
import { startReconciliationRun, getRuns, getRunDetails, getRunTransactions, cancelReconciliationRun } from "../controllers/reconciliation.controller.js";
import { queryAgent } from "../controllers/agent.controller.js";

import { login, register, getMe } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";
import { getExceptions, getExceptionById, resolveException } from "../controllers/exceptions.controller.js";

import cashRoutes from "./cash.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import transactionRoutes from "./transaction.routes.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth Routes (unprotected)
router.post("/auth/register", register);
router.post("/auth/login", login);

// Apply auth middleware
router.use(authenticateToken as any);
router.get("/auth/me", getMe as any);

router.use("/workspace", workspaceRoutes);

// Require tenant for all subsequent routes
router.use(requireTenant as any);

router.post("/imports/demo", importDemoData as any);
router.post("/imports", upload.single("file"), uploadImport);

router.post("/agent/query", queryAgent);

router.post("/runs", startReconciliationRun as any);
router.get("/runs", getRuns as any);
router.get("/runs/:id", getRunDetails as any);
router.post("/runs/:id/cancel", cancelReconciliationRun as any);
router.get("/runs/:id/transactions", getRunTransactions as any);

router.get("/exceptions", getExceptions);
router.get("/exceptions/:id", getExceptionById as any);
router.post("/exceptions/:id/resolve", resolveException as any);

router.use("/cash-position", cashRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/transactions", transactionRoutes);

export default router;
