import { Request, Response } from "express";
import { reconciliationService } from "../services/reconciliation.service.js";

export async function startReconciliationRun(req: Request, res: Response) {
  try {
    const tenantId = req.body.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    // PDF 23: Large reconciliation jobs should not block HTTP request.
    // For buildathon, an in-process worker is acceptable.
    // We return immediately or await if it's fast enough. Let's run asynchronously and return runId immediately.
    
    // In a real app we'd dispatch to a queue (like BullMQ).
    // Here we'll just run it asynchronously in the background.
    reconciliationService.runReconciliation(tenantId).catch(console.error);

    res.json({ success: true, message: "Reconciliation run started in the background." });
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getRuns(req: Request, res: Response) {
  try {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId query param" });
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
