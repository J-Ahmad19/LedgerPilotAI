import { Request, Response } from "express";
import { financeAgent } from "../agents/finance-agent.js";
import { AuthRequest } from "../middleware/auth.js";

export async function queryAgent(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { query } = req.body;

    if (!tenantId || !query) {
      return res.status(400).json({ error: "Missing tenantId or query" });
    }

    const response = await financeAgent.queryAssistant(query, tenantId);
    res.json({ response });
  } catch (error: any) {
    console.error("Agent query error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
