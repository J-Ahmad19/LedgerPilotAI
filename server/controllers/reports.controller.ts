import { Request, Response } from "express";
import { db } from "../db/index.js";
import { reconciliationRuns, exceptions, cashSnapshots, transactions, reconciliationMatches } from "../db/schema.js";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

interface ReportFilters {
  tenantId: string;
  sourceId?: string;
  runId?: string;
  startDate?: string;
  endDate?: string;
}

const buildFilters = (filters: ReportFilters, dateField: any, sourceField?: any, runField?: any) => {
  const conditions = [eq(transactions.tenantId, filters.tenantId)]; // Using tenantId from any table, replaced by caller usually
  
  if (filters.startDate) {
    conditions.push(gte(dateField, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(dateField, new Date(filters.endDate)));
  }
  if (filters.sourceId && sourceField) {
    conditions.push(eq(sourceField, filters.sourceId));
  }
  if (filters.runId && runField) {
    conditions.push(eq(runField, filters.runId));
  }
  
  return conditions;
};

export const getReconciliationSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate, sourceId } = req.query;

    const conditions = [eq(reconciliationRuns.tenantId, tenantId)];
    if (startDate) conditions.push(gte(reconciliationRuns.startedAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(reconciliationRuns.startedAt, new Date(endDate as string)));
    // Note: reconciliationRuns doesn't have a direct sourceId currently, we aggregate across tenant runs.

    const runs = await db.select().from(reconciliationRuns)
      .where(and(...conditions))
      .orderBy(desc(reconciliationRuns.startedAt));

    const report = runs.map(r => ({
      runId: r.id,
      date: r.startedAt,
      status: r.status,
      totalRecords: r.totalRecords || 0,
      matchedRecords: r.matchedRecords || 0,
      unmatchedRecords: r.unmatchedRecords || 0,
      exceptions: (r.unmatchedRecords || 0) + (r.partialMatches || 0),
      matchRate: r.totalRecords ? (((r.matchedRecords || 0) / r.totalRecords) * 100).toFixed(2) : "0.00",
      totalAmount: r.totalAmountMinor ? (Number(r.totalAmountMinor) / 100).toFixed(2) : "0.00"
    }));

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getExceptionsReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate, runId } = req.query;

    const conditions = [eq(transactions.tenantId, tenantId)];
    if (startDate) conditions.push(gte(exceptions.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(exceptions.createdAt, new Date(endDate as string)));
    if (runId) conditions.push(eq(exceptions.runId, runId as string));

    const data = await db.select({
      id: exceptions.id,
      type: exceptions.type,
      severity: exceptions.severity,
      status: exceptions.status,
      reason: exceptions.reason,
      aiDecision: exceptions.aiDecision,
      aiConfidence: exceptions.aiConfidence,
      createdAt: exceptions.createdAt,
      transactionId: transactions.externalId,
      amountMinor: transactions.amountMinor,
      currency: transactions.currency,
      transactionDate: transactions.transactionDate
    })
    .from(exceptions)
    .innerJoin(transactions, eq(exceptions.transactionId, transactions.id))
    .where(and(...conditions))
    .orderBy(desc(exceptions.createdAt));

    res.json({ report: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMatchRateTrend = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate } = req.query;

    const conditions = [eq(reconciliationRuns.tenantId, tenantId)];
    if (startDate) conditions.push(gte(reconciliationRuns.startedAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(reconciliationRuns.startedAt, new Date(endDate as string)));

    const runs = await db.select({
      date: sql`date_trunc('day', ${reconciliationRuns.startedAt})`,
      totalRecords: sql`sum(${reconciliationRuns.totalRecords})`,
      matchedRecords: sql`sum(${reconciliationRuns.matchedRecords})`,
    })
    .from(reconciliationRuns)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${reconciliationRuns.startedAt})`)
    .orderBy(sql`date_trunc('day', ${reconciliationRuns.startedAt})`);

    const report = runs.map((r: any) => ({
      date: r.date,
      totalRecords: Number(r.totalRecords),
      matchedRecords: Number(r.matchedRecords),
      matchRate: r.totalRecords > 0 ? ((Number(r.matchedRecords) / Number(r.totalRecords)) * 100).toFixed(2) : "0.00"
    }));

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCashVarianceReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate } = req.query;

    const conditions = [eq(cashSnapshots.tenantId, tenantId)];
    if (startDate) conditions.push(gte(cashSnapshots.snapshotDate, new Date(startDate as string)));
    if (endDate) conditions.push(lte(cashSnapshots.snapshotDate, new Date(endDate as string)));

    const data = await db.select().from(cashSnapshots)
      .where(and(...conditions))
      .orderBy(desc(cashSnapshots.snapshotDate));

    const report = data.map(s => ({
      date: s.snapshotDate,
      openingBalance: (Number(s.openingBalanceMinor) / 100).toFixed(2),
      expectedInflows: (Number(s.expectedInflowsMinor) / 100).toFixed(2),
      expectedOutflows: (Number(s.expectedOutflowsMinor) / 100).toFixed(2),
      actualBalance: s.actualBalanceMinor ? (Number(s.actualBalanceMinor) / 100).toFixed(2) : null,
      variance: s.varianceMinor ? (Number(s.varianceMinor) / 100).toFixed(2) : null
    }));

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnmatchedTransactionsReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate, sourceId } = req.query;

    const conditions = [
      eq(transactions.tenantId, tenantId),
      eq(transactions.status, 'UNMATCHED')
    ];
    if (startDate) conditions.push(gte(transactions.transactionDate, new Date(startDate as string)));
    if (endDate) conditions.push(lte(transactions.transactionDate, new Date(endDate as string)));
    if (sourceId) conditions.push(eq(transactions.sourceId, sourceId as string));

    const data = await db.select().from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate));

    res.json({ report: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIDecisionSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate, runId } = req.query;

    // AI Matches
    const matchConditions = [eq(transactions.tenantId, tenantId), eq(reconciliationMatches.matchType, 'AI')];
    if (startDate) matchConditions.push(gte(reconciliationMatches.createdAt, new Date(startDate as string)));
    if (endDate) matchConditions.push(lte(reconciliationMatches.createdAt, new Date(endDate as string)));
    if (runId) matchConditions.push(eq(reconciliationMatches.runId, runId as string));

    const aiMatches = await db.select({
      id: reconciliationMatches.id,
      runId: reconciliationMatches.runId,
      decision: reconciliationMatches.aiDecision,
      confidence: reconciliationMatches.aiConfidence,
      date: reconciliationMatches.createdAt,
      type: sql`'MATCH'`
    })
    .from(reconciliationMatches)
    .innerJoin(transactions, eq(reconciliationMatches.sourceTransactionId, transactions.id))
    .where(and(...matchConditions));

    // AI Exceptions
    const exceptionConditions = [eq(transactions.tenantId, tenantId), gte(sql`length(${exceptions.aiDecision})`, 0)];
    if (startDate) exceptionConditions.push(gte(exceptions.createdAt, new Date(startDate as string)));
    if (endDate) exceptionConditions.push(lte(exceptions.createdAt, new Date(endDate as string)));
    if (runId) exceptionConditions.push(eq(exceptions.runId, runId as string));

    const aiExceptions = await db.select({
      id: exceptions.id,
      runId: exceptions.runId,
      decision: exceptions.aiDecision,
      confidence: exceptions.aiConfidence,
      date: exceptions.createdAt,
      type: sql`'EXCEPTION'`
    })
    .from(exceptions)
    .innerJoin(transactions, eq(exceptions.transactionId, transactions.id))
    .where(and(...exceptionConditions));

    const report = [...aiMatches, ...aiExceptions].sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRunPerformanceReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const { startDate, endDate } = req.query;

    const conditions = [eq(reconciliationRuns.tenantId, tenantId)];
    if (startDate) conditions.push(gte(reconciliationRuns.startedAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(reconciliationRuns.startedAt, new Date(endDate as string)));

    const runs = await db.select().from(reconciliationRuns)
      .where(and(...conditions))
      .orderBy(desc(reconciliationRuns.startedAt));

    const report = runs.map(r => {
      let durationMs = 0;
      if (r.startedAt && r.completedAt) {
        durationMs = r.completedAt.getTime() - r.startedAt.getTime();
      }
      return {
        runId: r.id,
        date: r.startedAt,
        status: r.status,
        totalRecords: r.totalRecords || 0,
        durationSeconds: (durationMs / 1000).toFixed(1),
        recordsPerSecond: durationMs > 0 ? (((r.totalRecords || 0) / (durationMs / 1000)).toFixed(2)) : "0.00"
      };
    });

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
