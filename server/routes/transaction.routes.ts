import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";
import { getTransactions, getTransactionDetails } from "../controllers/transaction.controller.js";

const router = Router();

router.use(authenticateToken as any);
router.use(requireTenant as any);

router.get("/", getTransactions as any);
router.get("/:id", getTransactionDetails as any);

export default router;
