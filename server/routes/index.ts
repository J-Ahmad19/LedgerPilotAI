import { Router } from "express";
import multer from "multer";
import { uploadImport, importDemoData } from "../controllers/import.controller.js";
import { startReconciliationRun, getRuns, getRunDetails, getRunTransactions, cancelReconciliationRun } from "../controllers/reconciliation.controller.js";
import { queryAgent } from "../controllers/agent.controller.js";

import { login, register, getMe } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";
import { requireRole } from "../middleware/rbac.js";
import { getExceptions, getExceptionById, resolveException } from "../controllers/exceptions.controller.js";

import cashRoutes from "./cash.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import transactionRoutes from "./transaction.routes.js";
import auditRoutes from "./audit.routes.js";
import reportsRoutes from "./reports.routes.js";

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});

// Auth Routes (unprotected)
router.post("/auth/register", register);
router.post("/auth/login", login);

// Apply auth middleware
router.use(authenticateToken as any);
router.get("/auth/me", getMe as any);

// Allow PENDING users (newly registered) to create a workspace
router.use("/workspace", requireRole(["ADMIN", "PENDING"]), workspaceRoutes);

// Require tenant for all subsequent routes
router.use(requireTenant as any);

// Imports (FINANCE_MANAGER, ADMIN)
router.post("/imports/demo", requireRole(["ADMIN", "FINANCE_MANAGER"]), importDemoData as any);
router.post("/imports", requireRole(["ADMIN", "FINANCE_MANAGER"]), upload.single("file"), uploadImport);

// AI Agent (FINANCE_MANAGER, ADMIN)
router.post("/agent/query", requireRole(["ADMIN", "FINANCE_MANAGER"]), queryAgent);

// Reconciliation Runs (FINANCE_MANAGER, ADMIN)
const runRoles = ["ADMIN", "FINANCE_MANAGER"];
router.post("/runs", requireRole(runRoles), startReconciliationRun as any);
router.get("/runs", requireRole(runRoles), getRuns as any);
router.get("/runs/:id", requireRole(runRoles), getRunDetails as any);
router.post("/runs/:id/cancel", requireRole(runRoles), cancelReconciliationRun as any);
router.get("/runs/:id/transactions", requireRole(runRoles), getRunTransactions as any);

// Exceptions (REVIEWER, FINANCE_MANAGER, ADMIN)
const exceptionRoles = ["ADMIN", "FINANCE_MANAGER", "REVIEWER"];
router.get("/exceptions", requireRole(exceptionRoles), getExceptions);
router.get("/exceptions/:id", requireRole(exceptionRoles), getExceptionById as any);
router.post("/exceptions/:id/resolve", requireRole(["ADMIN", "REVIEWER"]), resolveException as any);

// Shared Insights & Reports (VIEWER, FINANCE_MANAGER, ADMIN)
const viewerRoles = ["ADMIN", "FINANCE_MANAGER", "VIEWER"];
router.use("/cash-position", requireRole(viewerRoles), cashRoutes);
router.use("/dashboard", requireRole(viewerRoles), dashboardRoutes);
router.use("/reports", requireRole(viewerRoles), reportsRoutes);

// Core Data (FINANCE_MANAGER, ADMIN)
router.use("/transactions", requireRole(["ADMIN", "FINANCE_MANAGER"]), transactionRoutes);
router.use("/audit-logs", requireRole(["ADMIN", "FINANCE_MANAGER"]), auditRoutes);

export default router;
