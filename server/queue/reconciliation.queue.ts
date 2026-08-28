import { Queue, Worker, Job } from 'bullmq';
import { db } from '../db/index.js';
import { reconciliationRuns, transactions, reconciliationMatches, exceptions, auditLogs } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { isExactMatch } from '../matching/exact-matcher.js';
import { findCandidates } from '../matching/candidate-generator.js';
import { calculateCompositeScore } from '../matching/scoring.js';
import { financeAgent } from '../agents/finance-agent.js';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

export const reconciliationQueue = new Queue('ReconciliationQueue', { connection });

async function processReconciliationJob(job: Job) {
  const { runId, tenantId } = job.data;

  try {
    await db.update(reconciliationRuns).set({
      status: 'PROCESSING',
      currentStep: 'Validating Records',
      progressPercentage: 5,
    }).where(eq(reconciliationRuns.id, runId));

    // Wait a brief moment to simulate processing steps for the UI
    await new Promise(resolve => setTimeout(resolve, 500));

    await db.update(reconciliationRuns).set({
      currentStep: 'Normalizing Transactions',
      progressPercentage: 10,
    }).where(eq(reconciliationRuns.id, runId));

    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch eligible OPEN transactions
    const openTransactions = await db.query.transactions.findMany({
      where: and(eq(transactions.tenantId, tenantId), eq(transactions.status, 'OPEN'))
    });

    const totalRecords = openTransactions.length;

    await db.update(reconciliationRuns).set({
      totalRecords,
      currentStep: 'Deterministic Matching',
      progressPercentage: 15,
    }).where(eq(reconciliationRuns.id, runId));

    if (totalRecords === 0) {
      await db.update(reconciliationRuns).set({
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPercentage: 100,
        currentStep: 'Completed',
        matchRate: "0.00",
      }).where(eq(reconciliationRuns.id, runId));
      return { success: true, message: 'No open transactions to process.' };
    }

    let matchedRecords = 0;
    let reviewRecords = 0;
    let unmatchedRecords = 0;
    let processedRecords = 0;
    
    let totalAmount = 0n;
    let matchedAmount = 0n;
    let unmatchedAmount = 0n;

    const processedIds = new Set<string>();

    for (let i = 0; i < openTransactions.length; i++) {
      const sourceTx = openTransactions[i];
      
      // Update progress every 10 records or so to avoid spamming the DB too heavily, 
      // but keep it granular enough for the UI progress bar.
      if (i % 10 === 0) {
        const progressPercentage = Math.floor(15 + (i / totalRecords) * 80);
        
        // Check if user cancelled the run
        const [currentRunState] = await db.select({ status: reconciliationRuns.status })
          .from(reconciliationRuns).where(eq(reconciliationRuns.id, runId));
        
        if (currentRunState?.status === 'CANCELLED') {
          console.log(`Run ${runId} was cancelled by user. Aborting gracefully.`);
          return { success: false, message: 'Run cancelled by user' };
        }

        await db.update(reconciliationRuns).set({
          progressPercentage,
          processedRecords,
        }).where(eq(reconciliationRuns.id, runId));
      }

      if (processedIds.has(sourceTx.id)) continue;
      
      totalAmount += sourceTx.amountMinor;

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

      if (bestMatch && highestScore >= 0.90) {
        // AUTO_MATCH
        await db.insert(reconciliationMatches).values({
          runId,
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
        processedRecords += 2; // Processed source + match

      } else if (bestMatch && highestScore >= 0.70) {
        // AI-Assisted Match (Fuzzy Range 0.70 - 0.89)
        const candidatesWithScores = candidates.map(c => ({
          candidate: c,
          scoreDetails: calculateCompositeScore(sourceTx, c)
        }));

        const aiResult = await financeAgent.evaluateAmbiguousMatch(sourceTx, candidatesWithScores);

        if (aiResult.decision === "MATCH" && aiResult.candidateId && aiResult.confidence >= 0.90) {
          const matchedTarget = candidates.find(c => c.id === aiResult.candidateId);
          if (matchedTarget) {
            await db.insert(reconciliationMatches).values({
              runId,
              sourceTransactionId: sourceTx.id,
              targetTransactionId: matchedTarget.id,
              matchType: "AI",
              confidenceScore: aiResult.confidence.toFixed(4),
              amountScore: scoreDetails.amountScore.toFixed(4),
              dateScore: scoreDetails.dateScore.toFixed(4),
              referenceScore: scoreDetails.referenceScore.toFixed(4),
              descriptionScore: scoreDetails.descriptionScore.toFixed(4),
              reason: aiResult.explanation,
              aiDecision: aiResult.decision,
              aiConfidence: aiResult.confidence.toFixed(4),
              aiEvidence: aiResult.evidence,
              aiReasonCodes: aiResult.reason_codes,
              aiModel: process.env.LLM_MODEL_NAME || "llama-3.1-8b-instant",
              aiTimestamp: new Date(),
            });

            await db.update(transactions)
              .set({ status: "RECONCILED", updatedAt: new Date() })
              .where(sql`${transactions.id} IN (${sourceTx.id}, ${matchedTarget.id})`);

            await db.insert(auditLogs).values({
              tenantId,
              actorType: "Agent",
              action: "AI_MATCH",
              entityType: "Transaction",
              entityId: sourceTx.id,
              metadata: { targetId: matchedTarget.id, aiResult },
            });

            matchedRecords++;
            matchedAmount += sourceTx.amountMinor;
            processedIds.add(sourceTx.id);
            processedIds.add(matchedTarget.id);
            processedRecords += 2;
          }
        } else {
          // REVIEW or UNMATCHED fallback from AI
          await db.insert(exceptions).values({
            runId,
            transactionId: sourceTx.id,
            type: "AMBIGUOUS_MATCH",
            severity: "MEDIUM",
            confidence: aiResult.confidence.toFixed(4),
            reason: aiResult.explanation,
            status: "REVIEWING",
            suggestedAction: "Review potential matches.",
            aiDecision: aiResult.decision,
            aiConfidence: aiResult.confidence.toFixed(4),
            aiEvidence: aiResult.evidence,
            aiReasonCodes: aiResult.reason_codes,
            aiModel: process.env.LLM_MODEL_NAME || "llama-3.1-8b-instant",
            aiTimestamp: new Date(),
          });
    
          await db.update(transactions)
            .set({ status: "REVIEW", updatedAt: new Date() })
            .where(eq(transactions.id, sourceTx.id));
    
          reviewRecords++;
          unmatchedAmount += sourceTx.amountMinor;
          processedIds.add(sourceTx.id);
          processedRecords++;
        }

      } else {
        // UNMATCHED (Exception)
        await db.insert(exceptions).values({
          runId,
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
        processedRecords++;
      }
    }

    const matchRate = totalRecords > 0 
      ? ((matchedRecords / totalRecords) * 100).toFixed(2) 
      : "0.00";

    await db.update(reconciliationRuns).set({
      status: 'COMPLETED',
      completedAt: new Date(),
      progressPercentage: 100,
      currentStep: 'Completed',
      processedRecords,
      matchedRecords,
      partialMatches: reviewRecords,
      unmatchedRecords,
      matchRate,
      totalAmountMinor: totalAmount,
      matchedAmountMinor: matchedAmount,
      unmatchedAmountMinor: unmatchedAmount,
    }).where(eq(reconciliationRuns.id, runId));

    return { success: true };

  } catch (error: any) {
    console.error(`Reconciliation Worker Error (Run: ${runId}):`, error);
    await db.update(reconciliationRuns).set({
      status: 'FAILED',
      currentStep: 'Failed',
      errorInformation: error.message || 'Unknown error occurred during processing.',
    }).where(eq(reconciliationRuns.id, runId));
    throw error;
  }
}

export const reconciliationWorker = new Worker('ReconciliationQueue', processReconciliationJob, { 
  connection,
  concurrency: 1 
});

reconciliationWorker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

reconciliationWorker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
