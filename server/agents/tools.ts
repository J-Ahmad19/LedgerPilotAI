import { db } from "../db/index.js";
import { transactions, exceptions, reconciliationRuns, auditLogs } from "../db/schema.js";
import { eq, and, gt, desc } from "drizzle-orm";
import { findCandidates } from "../matching/candidate-generator.js";
import { cashService } from "../services/cash.service.js";

// Implement the actual functions
export async function getTransactionsTool(args: any) {
  const { tenantId, limit = 10, status } = args;
  const conditions = [eq(transactions.tenantId, tenantId)];
  if (status) {
    conditions.push(eq(transactions.status, status));
  }
  return await db.query.transactions.findMany({
    where: and(...conditions),
    limit,
    orderBy: [desc(transactions.createdAt)]
  });
}

export async function findCandidatesTool(args: any) {
  const { transactionId } = args;
  // Get the transaction first
  const [tx] = await db.query.transactions.findMany({
    where: eq(transactions.id, transactionId)
  });
  if (!tx) return { error: "Transaction not found" };

  const candidates = await findCandidates(tx);
  return candidates;
}

export async function getExceptionsTool(args: any) {
  const { runId, limit = 10 } = args;
  return await db.query.exceptions.findMany({
    where: eq(exceptions.runId, runId),
    limit
  });
}

export async function getCashVarianceTool(args: any) {
  const { tenantId } = args;
  const cashPosition = await cashService.getCashPosition(tenantId);
  return {
    expectedCashMinor: cashPosition.expectedClosingCashMinor,
    actualCashMinor: cashPosition.actualBankBalanceMinor,
    varianceMinor: cashPosition.varianceMinor,
    breakdown: cashPosition.breakdown,
    topTransactions: cashPosition.topTransactions
  };
}

export async function getReconciliationRunTool(args: any) {
  const { tenantId, limit = 1 } = args;
  return await db.query.reconciliationRuns.findMany({
    where: eq(reconciliationRuns.tenantId, tenantId),
    limit,
    orderBy: [desc(reconciliationRuns.startedAt)]
  });
}

export async function getAuditHistoryTool(args: any) {
  const { tenantId, entityId, limit = 10 } = args;
  const conditions = [eq(auditLogs.tenantId, tenantId)];
  if (entityId) {
    conditions.push(eq(auditLogs.entityId, entityId));
  }
  return await db.query.auditLogs.findMany({
    where: and(...conditions),
    limit,
    orderBy: [desc(auditLogs.createdAt)]
  });
}

// GenAI function declarations
export const financeTools = [
  {
    name: "getTransactions",
    description: "Fetch a list of transactions for a tenant. Useful to see recent payments or ledgers.",
    parameters: {
      type: "object",
      properties: {
        tenantId: { type: "string" },
        status: { type: "string", description: "Optional. e.g. OPEN, RECONCILED, REVIEW" },
        limit: { type: "number" }
      },
      required: ["tenantId"]
    }
  },
  {
    name: "findCandidates",
    description: "Find potential matching candidates for a given transaction ID.",
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string" }
      },
      required: ["transactionId"]
    }
  },
  {
    name: "getExceptions",
    description: "Fetch a list of unresolved exceptions for a given reconciliation run.",
    parameters: {
      type: "object",
      properties: {
        runId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["runId"]
    }
  },
  {
    name: "getCashVariance",
    description: "Get the expected vs actual cash balance for a tenant to determine cash variance.",
    parameters: {
      type: "object",
      properties: {
        tenantId: { type: "string" }
      },
      required: ["tenantId"]
    }
  },
  {
    name: "getReconciliationRun",
    description: "Fetch the most recent reconciliation run details and metrics for a tenant.",
    parameters: {
      type: "object",
      properties: {
        tenantId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["tenantId"]
    }
  },
  {
    name: "getAuditHistory",
    description: "Fetch audit logs to trace historical changes of entities.",
    parameters: {
      type: "object",
      properties: {
        tenantId: { type: "string" },
        entityId: { type: "string", description: "Optional entity ID (e.g. transaction ID) to filter history" },
        limit: { type: "number" }
      },
      required: ["tenantId"]
    }
  }
];

export const toolImplementations: Record<string, Function> = {
  getTransactions: getTransactionsTool,
  findCandidates: findCandidatesTool,
  getExceptions: getExceptionsTool,
  getCashVariance: getCashVarianceTool,
  getReconciliationRun: getReconciliationRunTool,
  getAuditHistory: getAuditHistoryTool,
};
