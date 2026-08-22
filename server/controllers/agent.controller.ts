import { Request, Response } from "express";
import { financeAgent } from "../agents/finance-agent.js";

export async function queryAgent(req: Request, res: Response) {
  try {
    const { query, tenantId } = req.body;

    if (!query || !tenantId) {
      return res.status(400).json({ error: "Missing query or tenantId" });
    }

    const response = await financeAgent.queryAssistant(query, tenantId);
    res.json({ response });
  } catch (error: any) {
    console.error("Agent query error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
