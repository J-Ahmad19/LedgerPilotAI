import { Request, Response } from "express";
import { reconciliationService } from "../services/reconciliation.service.js";

import { AuthRequest } from "../middleware/auth.js";


export async function startReconciliationRun(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    const result = await reconciliationService.runReconciliation(tenantId);

    res.json({ success: true, message: "Reconciliation run queued in the background.", runId: result.runId });
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function cancelReconciliationRun(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    const runId = req.params.id;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    const result = await reconciliationService.cancelRun(runId, tenantId);
    res.json(result);
  } catch (error: any) {
    console.error("Cancellation error:", error);
    res.status(400).json({ error: error.message || "Bad Request" });
  }
}

export async function getRuns(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }
    const runs = await reconciliationService.getRuns(tenantId);
    res.json({ runs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getRunDetails(req: Request, res: Response) {
  try {
    const runId = req.params.id;
    const run = await reconciliationService.getRunDetails(runId);
    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }
    res.json({ run });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getRunTransactions(req: Request, res: Response) {
  try {
    const runId = req.params.id;
    const status = req.query.status as string || 'ALL';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const transactions = await reconciliationService.getRunTransactions(runId, status, page, limit);
    res.json(transactions);
  } catch (error: any) {
    console.error("Error fetching run transactions:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
