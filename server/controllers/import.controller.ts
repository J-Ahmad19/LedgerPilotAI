import { Request, Response } from "express";
import { ingestionService } from "../services/ingestion.service.js";
import { AuthRequest } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { dataSources } from "../db/schema.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function uploadImport(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    const sourceType = req.body.sourceType;
    let dataSourceId = req.body.dataSourceId;

    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileName = req.file.originalname;

    if (!dataSourceId) {
      if (!sourceType) {
        return res.status(400).json({ error: "Must provide sourceType if creating a new data source." });
      }
      // Create new data source
      const [newSource] = await db.insert(dataSources).values({
        tenantId,
        name: fileName,
        type: sourceType
      }).returning({ id: dataSources.id });
      
      dataSourceId = newSource.id;
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

    res.json({ success: true, dataSourceId, result });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function importDemoData(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId" });
    }

    const dataDir = path.join(__dirname, "../../data");
    const files = [
      { name: "payments.csv", type: "PAYMENTS" },
      { name: "settlements.csv", type: "SETTLEMENTS" },
      { name: "bank.csv", type: "BANK" },
      { name: "ledger.csv", type: "LEDGER" }
    ];

    const results = [];

    for (const file of files) {
      const filePath = path.join(dataDir, file.name);
      if (!fs.existsSync(filePath)) {
        console.warn(`Demo file missing: ${filePath}`);
        continue;
      }

      const fileBuffer = fs.readFileSync(filePath, "utf-8");
      
      const [newSource] = await db.insert(dataSources).values({
        tenantId,
        name: file.name,
        type: file.type
      }).returning({ id: dataSources.id });

      const result = await ingestionService.processCsv(tenantId, newSource.id, fileBuffer);
      results.push({
        sourceId: newSource.id,
        name: file.name,
        type: file.type,
        ...result
      });
    }

    if (results.length === 0) {
      return res.status(500).json({ error: "Demo data files not found. Ensure python script is run first." });
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error("Demo import error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
