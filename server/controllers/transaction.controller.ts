import { Request, Response } from "express";
import { transactionService } from "../services/transaction.service.js";
import { AuthRequest } from "../middleware/auth.js";

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: "Tenant ID required" });
    }

    const { 
      page = "1", 
      limit = "50", 
      status = "ALL", 
      search = "", 
      currency = "",
      source = "",
      dateFrom = "",
      dateTo = "",
      minAmount = "",
      maxAmount = "",
      runId = "",
      confidence = "",
      exceptionStatus = ""
    } = req.query;

    const filters: any = {
      status: status as string,
      search: search as string,
      currency: currency as string,
    };

    if (source) filters.source = source as string;
    if (dateFrom && dateTo) {
      filters.dateRange = { from: dateFrom as string, to: dateTo as string };
    }
    if (minAmount || maxAmount) {
      filters.amountRange = {};
      if (minAmount) filters.amountRange.min = parseInt(minAmount as string, 10);
      if (maxAmount) filters.amountRange.max = parseInt(maxAmount as string, 10);
    }
    if (runId) filters.runId = runId as string;
    if (confidence) filters.confidence = confidence as string;
    if (exceptionStatus) filters.exceptionStatus = exceptionStatus as string;

    const result = await transactionService.getTransactions(
      tenantId,
      filters,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTransactionDetails(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: "Tenant ID required" });
    }

    const { id } = req.params;
    const details = await transactionService.getTransactionDetails(tenantId, id);

    if (!details) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(details);
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
