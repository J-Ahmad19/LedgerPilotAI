import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import routes from "./routes/index.js";
import { reconciliationQueue } from "./queue/reconciliation.queue.js"; // Initialize the worker
import { logger } from "./utils/logger.js";
import { metrics, prometheusMetrics } from "./utils/metrics.js";
import pinoHttp from "pino-http";
import crypto from "crypto";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

dotenv.config();

// Fix BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Set up structured logging with context
app.use(pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID(),
  customProps: (req: any, res) => {
    return {
      tenantId: req.tenantId || req.user?.tenantId,
      userId: req.user?.id
    };
  }
}));

// API Latency tracking middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    // Don't track metrics for health/ready/metrics endpoints to avoid spam
    if (!req.path.match(/^\/api\/(health|ready|metrics)/)) {
      prometheusMetrics.apiLatency.observe({
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      }, durationSeconds);
    }
  });
  next();
});

app.use("/api", routes);

// Extended Health & Readiness
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/ready", async (req, res) => {
  try {
    // Check DB
    await db.execute(sql`SELECT 1`);
    // Check Redis Queue (Worker)
    const client = await reconciliationQueue.client;
    const redisStatus = client.status;
    
    if (redisStatus !== 'ready') {
      throw new Error(`Redis not ready. Status: ${redisStatus}`);
    }

    res.json({ 
      status: "ready", 
      database: "connected",
      redis: redisStatus
    });
  } catch (error: any) {
    logger.error({ err: error }, "Readiness check failed");
    res.status(503).json({ status: "unavailable", error: error.message });
  }
});

app.get("/api/metrics", async (req, res) => {
  try {
    res.set('Content-Type', metrics.getRegistry().contentType);
    res.end(await metrics.getRegistry().metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, reqId: (req as any).id }, "Unhandled Error");
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
