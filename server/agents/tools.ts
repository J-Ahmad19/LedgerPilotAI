import { db } from "../db/index.js";
import { transactions, exceptions, reconciliationRuns } from "../db/schema.js";
import { eq, and, gt, desc } from "drizzle-orm";
import { findCandidates } from "../matching/candidate-generator.js";

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

export async function getCashPositionTool(args: any) {
  const { tenantId } = args;
  // In a real app this would query the cash_snapshots table
  // For now, we return a mock cash position for demonstration.
  return {
    expectedCashMinor: 1248200n.toString(), // Returning as string because BigInt is not JSON serializable directly
    actualCashMinor: 1209700n.toString(),
    varianceMinor: 38500n.toString()
  };
}

// GenAI function declarations
export const financeTools = [
  {
    name: "getTransactions",
    description: "Fetch a list of transactions for a tenant. Useful to see recent payments or ledgers.",
    parameters: {
      type: "OBJECT",
      properties: {
        tenantId: { type: "STRING" },
        status: { type: "STRING", description: "Optional. e.g. OPEN, RECONCILED, REVIEW" },
        limit: { type: "NUMBER" }
      },
      required: ["tenantId"]
    }
  },
  {
    name: "findCandidates",
    description: "Find potential matching candidates for a given transaction ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        transactionId: { type: "STRING" }
      },
      required: ["transactionId"]
    }
  },
  {
    name: "getExceptions",
    description: "Fetch a list of unresolved exceptions for a given reconciliation run.",
    parameters: {
      type: "OBJECT",
      properties: {
        runId: { type: "STRING" },
        limit: { type: "NUMBER" }
      },
      required: ["runId"]
    }
  },
  {
    name: "getCashPosition",
    description: "Get the expected vs actual cash balance for a tenant to determine cash variance.",
    parameters: {
      type: "OBJECT",
      properties: {
        tenantId: { type: "STRING" }
      },
      required: ["tenantId"]
    }
  }
];

export const toolImplementations: Record<string, Function> = {
  getTransactions: getTransactionsTool,
  findCandidates: findCandidatesTool,
  getExceptions: getExceptionsTool,
  getCashPosition: getCashPositionTool,
};
