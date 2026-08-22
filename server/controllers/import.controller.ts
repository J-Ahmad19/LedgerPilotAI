import { Request, Response } from "express";
import { ingestionService } from "../services/ingestion.service.js";

export async function uploadImport(req: Request, res: Response) {
  try {
    const tenantId = req.body.tenantId; // In production this comes from auth context
    const dataSourceId = req.body.dataSourceId;

    if (!tenantId || !dataSourceId) {
      return res.status(400).json({ error: "Missing tenantId or dataSourceId" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer.toString("utf-8");
    const mimeType = req.file.mimetype;
    
    let result;
    if (mimeType === "text/csv" || req.file.originalname.endsWith('.csv')) {
      result = await ingestionService.processCsv(tenantId, dataSourceId, fileBuffer);
    } else if (mimeType === "application/json" || req.file.originalname.endsWith('.json')) {
      const jsonRecords = JSON.parse(fileBuffer);
      result = await ingestionService.processJson(tenantId, dataSourceId, jsonRecords);
    } else {
      return res.status(400).json({ error: "Unsupported file format. Please upload CSV or JSON." });
    }

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
