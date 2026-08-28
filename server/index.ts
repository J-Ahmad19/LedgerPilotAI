import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import routes from "./routes/index.js";
import "./queue/reconciliation.queue.js"; // Initialize the worker

dotenv.config();

// Fix BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
