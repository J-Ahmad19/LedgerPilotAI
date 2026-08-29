import { Router } from "express";
import {
  getReconciliationSummary,
  getExceptionsReport,
  getMatchRateTrend,
  getCashVarianceReport,
  getUnmatchedTransactionsReport,
  getAIDecisionSummary,
  getRunPerformanceReport
} from "../controllers/reports.controller.js";

const router = Router();

router.get("/reconciliation-summary", getReconciliationSummary as any);
router.get("/exceptions", getExceptionsReport as any);
router.get("/match-rate-trend", getMatchRateTrend as any);
router.get("/cash-variance", getCashVarianceReport as any);
router.get("/unmatched-transactions", getUnmatchedTransactionsReport as any);
router.get("/ai-decisions", getAIDecisionSummary as any);
router.get("/run-performance", getRunPerformanceReport as any);

export default router;
