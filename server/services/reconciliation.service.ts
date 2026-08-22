import { db } from "../db/index.js";
import { transactions, reconciliationRuns, reconciliationMatches, exceptions, auditLogs } from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { isExactMatch } from "../matching/exact-matcher.js";
import { findCandidates } from "../matching/candidate-generator.js";
import { calculateCompositeScore } from "../matching/scoring.js";
import { financeAgent } from "../agents/finance-agent.js";

export class ReconciliationService {
  async runReconciliation(tenantId: string) {
    // 1. Create a new reconciliation run
    const [run] = await db.insert(reconciliationRuns).values({
      tenantId,
      status: "PROCESSING",
      startedAt: new Date(),
    }).returning();

    // 2. Fetch eligible OPEN transactions
    const openTransactions = await db.query.transactions.findMany({
      where: and(eq(transactions.tenantId, tenantId), eq(transactions.status, "OPEN"))
    });

    let matchedRecords = 0;
    let reviewRecords = 0;
    let unmatchedRecords = 0;
    
    let totalAmount = 0n;
    let matchedAmount = 0n;
    let unmatchedAmount = 0n;

    // Track processed IDs to avoid double-processing in the same run
    const processedIds = new Set<string>();

    for (const sourceTx of openTransactions) {
      if (processedIds.has(sourceTx.id)) continue;
      
      totalAmount += sourceTx.amountMinor;

      // Find candidates
      const candidates = await findCandidates(sourceTx);
      let bestMatch: any = null;
      let highestScore = -1;
      let scoreDetails: any = null;
      let matchType = "NONE";

      // Try exact match first
      for (const candidate of candidates) {
        if (processedIds.has(candidate.id)) continue;

        if (isExactMatch(sourceTx, candidate)) {
          bestMatch = candidate;
          highestScore = 1.0;
          matchType = "EXACT";
          scoreDetails = {
            amountScore: 1.0,
            dateScore: 1.0,
            referenceScore: 1.0,
            descriptionScore: 1.0,
            compositeScore: 1.0
          };
          break;
        }
      }

      // If no exact match, try scoring candidates
      if (!bestMatch) {
        for (const candidate of candidates) {
          if (processedIds.has(candidate.id)) continue;
          
          const scores = calculateCompositeScore(sourceTx, candidate);
          if (scores.compositeScore > highestScore) {
            highestScore = scores.compositeScore;
            bestMatch = candidate;
            scoreDetails = scores;
            matchType = "FUZZY";
          }
        }
      }

      // Evaluate the best match against thresholds
      if (bestMatch && highestScore >= 0.90) {
        // AUTO_MATCH
        await db.insert(reconciliationMatches).values({
          runId: run.id,
          sourceTransactionId: sourceTx.id,
          targetTransactionId: bestMatch.id,
          matchType,
          confidenceScore: highestScore.toFixed(4),
          amountScore: scoreDetails.amountScore.toFixed(4),
          dateScore: scoreDetails.dateScore.toFixed(4),
          referenceScore: scoreDetails.referenceScore.toFixed(4),
          descriptionScore: scoreDetails.descriptionScore.toFixed(4),
          reason: "High confidence match",
        });

        await db.update(transactions)
          .set({ status: "RECONCILED", updatedAt: new Date() })
          .where(sql`${transactions.id} IN (${sourceTx.id}, ${bestMatch.id})`);

        await db.insert(auditLogs).values({
          tenantId,
          actorType: "System",
          action: "AUTO_MATCH",
          entityType: "Transaction",
          entityId: sourceTx.id,
          metadata: { targetId: bestMatch.id, score: highestScore },
        });

        matchedRecords++;
        matchedAmount += sourceTx.amountMinor;
        processedIds.add(sourceTx.id);
        processedIds.add(bestMatch.id);

      } else if (bestMatch && highestScore >= 0.70) {
        // REVIEW (Exception) - Try AI Evaluation first
        const aiDecision = await financeAgent.evaluateAmbiguousMatch(sourceTx, candidates);

        if (aiDecision.decision === "MATCH" && aiDecision.confidence >= 0.90 && aiDecision.candidateId) {
           // AI confident match override
           await db.insert(reconciliationMatches).values({
            runId: run.id,
            sourceTransactionId: sourceTx.id,
            targetTransactionId: aiDecision.candidateId,
            matchType: "AI",
            confidenceScore: aiDecision.confidence.toFixed(4),
            amountScore: scoreDetails.amountScore.toFixed(4),
            dateScore: scoreDetails.dateScore.toFixed(4),
            referenceScore: scoreDetails.referenceScore.toFixed(4),
            descriptionScore: scoreDetails.descriptionScore.toFixed(4),
            reason: `AI Match: ${aiDecision.explanation}`,
          });
  
          await db.update(transactions)
            .set({ status: "RECONCILED", updatedAt: new Date() })
            .where(sql`${transactions.id} IN (${sourceTx.id}, ${aiDecision.candidateId})`);
  
          await db.insert(auditLogs).values({
            tenantId,
            actorType: "Agent",
            action: "AGENT_MATCHED_TRANSACTION",
            entityType: "Transaction",
            entityId: sourceTx.id,
            metadata: { targetId: aiDecision.candidateId, score: aiDecision.confidence, reasonCodes: aiDecision.reasonCodes },
          });
  
          matchedRecords++;
          matchedAmount += sourceTx.amountMinor;
          processedIds.add(sourceTx.id);
          processedIds.add(aiDecision.candidateId);
        } else {
           // Still needs review
           await db.insert(exceptions).values({
            runId: run.id,
            transactionId: sourceTx.id,
            type: "MULTIPLE_CANDIDATES", // Or ambiguous
            severity: "MEDIUM",
            confidence: highestScore.toFixed(4),
            reason: `AI Evaluation: ${aiDecision.explanation}`,
            status: "REVIEWING",
            suggestedAction: `Review potential matches. AI Decision: ${aiDecision.decision}`,
          });
  
          await db.update(transactions)
            .set({ status: "REVIEW", updatedAt: new Date() })
            .where(eq(transactions.id, sourceTx.id));
  
          reviewRecords++;
          unmatchedAmount += sourceTx.amountMinor;
          processedIds.add(sourceTx.id);
        }

      } else {
        // UNMATCHED (Exception)
        await db.insert(exceptions).values({
          runId: run.id,
          transactionId: sourceTx.id,
          type: "MISSING_COUNTERPART",
          severity: "HIGH",
          confidence: highestScore > 0 ? highestScore.toFixed(4) : "0.0000",
          reason: "No suitable counterpart found",
          status: "OPEN",
          suggestedAction: "Manual investigation required",
        });

        unmatchedRecords++;
        unmatchedAmount += sourceTx.amountMinor;
        processedIds.add(sourceTx.id);
      }
    }

    const matchRate = openTransactions.length > 0 
      ? ((matchedRecords / openTransactions.length) * 100).toFixed(2) 
      : "0.00";

    // Update run completion metrics
    await db.update(reconciliationRuns).set({
      status: "COMPLETED",
      completedAt: new Date(),
      totalRecords: openTransactions.length,
      matchedRecords,
      partialMatches: reviewRecords,
      unmatchedRecords,
      matchRate,
      totalAmountMinor: totalAmount,
      matchedAmountMinor: matchedAmount,
      unmatchedAmountMinor: unmatchedAmount,
    }).where(eq(reconciliationRuns.id, run.id));

    return {
      runId: run.id,
      totalRecords: openTransactions.length,
      matchedRecords,
      reviewRecords,
      unmatchedRecords,
      matchRate,
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
}

export const reconciliationService = new ReconciliationService();
