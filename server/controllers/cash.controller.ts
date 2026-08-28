import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { cashService } from "../services/cash.service.js";

export async function getCashPosition(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    const cashPosition = await cashService.getCashPosition(tenantId);
    res.json({ cashPosition });
  } catch (error: any) {
    console.error("Cash Position Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
