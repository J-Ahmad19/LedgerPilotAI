import { Request, Response } from "express";
import { db } from "../db/index.js";
import { exceptions, transactions, reconciliationRuns } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export async function getExceptions(req: Request, res: Response) {
  try {
    const exceptionsList = await db
      .select({
        exception: exceptions,
        transaction: transactions,
      })
      .from(exceptions)
      .leftJoin(transactions, eq(exceptions.transactionId, transactions.id))
      .orderBy(desc(exceptions.createdAt));

    res.json({ exceptions: exceptionsList });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
