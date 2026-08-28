import { db } from "../db/index.js";
import { transactions, reconciliationRuns, reconciliationMatches, exceptions, auditLogs } from "../db/schema.js";
import { and, eq, sql, inArray } from "drizzle-orm";
import { isExactMatch } from "../matching/exact-matcher.js";
import { findCandidates } from "../matching/candidate-generator.js";
import { calculateCompositeScore } from "../matching/scoring.js";

import { reconciliationQueue } from "../queue/reconciliation.queue.js";

export class ReconciliationService {
  async runReconciliation(tenantId: string) {
    // 1. Create a new reconciliation run
    const [run] = await db.insert(reconciliationRuns).values({
      tenantId,
      status: "QUEUED",
      currentStep: "Queued",
      progressPercentage: 0,
      startedAt: new Date(),
    }).returning();

    // 2. Enqueue the job
    await reconciliationQueue.add('reconciliationJob', {
      runId: run.id,
      tenantId
    });

    return {
      runId: run.id,
      status: "QUEUED",
    };
  }

  async getRuns(tenantId: string) {
    return db.query.reconciliationRuns.findMany({
      where: eq(reconciliationRuns.tenantId, tenantId),
      orderBy: (runs, { desc }) => [desc(runs.startedAt)],
    });
  }

  async getRunDetails(runId: string) {
    const [run] = await db.query.reconciliationRuns.findMany({
      where: eq(reconciliationRuns.id, runId)
    });
    return run;
  }

  async cancelRun(runId: string, tenantId: string) {
    // Only allow cancelling if it's QUEUED or PROCESSING
    const run = await this.getRunDetails(runId);
    if (!run || run.tenantId !== tenantId) {
      throw new Error("Run not found or unauthorized");
    }
    
    if (run.status !== "QUEUED" && run.status !== "PROCESSING") {
      throw new Error("Run cannot be cancelled in its current state");
    }

    await db.update(reconciliationRuns).set({
      status: "CANCELLED",
      currentStep: "Cancelled by User",
      completedAt: new Date()
    }).where(eq(reconciliationRuns.id, runId));

    return { success: true, message: "Run cancelled successfully" };
  }
  async getRunTransactions(runId: string, statusFilter: string = 'ALL', page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    
    let result: any[] = [];
    
    // Matched Transactions
    if (statusFilter === 'ALL' || statusFilter === 'MATCHED') {
      const matches = await db.select().from(reconciliationMatches).where(eq(reconciliationMatches.runId, runId));
      if (matches.length > 0) {
        const sourceIds = matches.map(m => m.sourceTransactionId);
        const targetIds = matches.map(m => m.targetTransactionId);
        const allIds = [...new Set([...sourceIds, ...targetIds])];
        
        const matchedTxs = await db.select().from(transactions).where(inArray(transactions.id, allIds));
        
        // Group them by match
        for (const match of matches) {
          const source = matchedTxs.find(t => t.id === match.sourceTransactionId);
          const target = matchedTxs.find(t => t.id === match.targetTransactionId);
          if (source && target) {
            result.push({
              type: 'MATCH',
              matchDetails: match,
              source,
              target
            });
          }
        }
      }
    }
    
    // Exception Transactions (Review / Unmatched)
    if (statusFilter === 'ALL' || statusFilter === 'REVIEW' || statusFilter === 'UNMATCHED') {
      let conditions = [eq(exceptions.runId, runId)];
      if (statusFilter === 'REVIEW') {
        conditions.push(eq(exceptions.type, 'AMBIGUOUS_MATCH'));
      } else if (statusFilter === 'UNMATCHED') {
        conditions.push(eq(exceptions.type, 'MISSING_COUNTERPART'));
      }
      
      const exps = await db.select().from(exceptions).where(and(...conditions));
      if (exps.length > 0) {
        const txIds = exps.map(e => e.transactionId);
        const exceptionTxs = await db.select().from(transactions).where(inArray(transactions.id, txIds));
        
        for (const ex of exps) {
          const tx = exceptionTxs.find(t => t.id === ex.transactionId);
          if (tx) {
            result.push({
              type: 'EXCEPTION',
              exceptionDetails: ex,
              transaction: tx
            });
          }
        }
      }
    }
    
    // Simple in-memory pagination for now
    const total = result.length;
    const paginatedResult = result.slice(offset, offset + limit);
    
    return {
      data: paginatedResult,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const reconciliationService = new ReconciliationService();
