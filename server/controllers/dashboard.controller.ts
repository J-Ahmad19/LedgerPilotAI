import { Request, Response } from "express";
import { db } from "../db/index.js";
import { reconciliationRuns, exceptions, cashSnapshots } from "../db/schema.js";
import { eq, desc, and, ne } from "drizzle-orm";

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch runs for the tenant to determine if workspace is empty
    const allRuns = await db.select().from(reconciliationRuns)
      .where(eq(reconciliationRuns.tenantId, tenantId))
      .orderBy(desc(reconciliationRuns.startedAt));

    if (allRuns.length === 0) {
      return res.json({ isEmpty: true });
    }

    // 1. KPI Aggregations
    let totalProcessed = 0;
    let totalMatched = 0;
    let totalExceptionsCount = 0;
    let totalAmountMinor = 0n;
    let matchedAmountMinor = 0n;
    let unresolvedAmountMinor = 0n;

    let totalDurationMs = 0;
    let completedRunsCount = 0;

    for (const run of allRuns) {
      totalProcessed += run.totalRecords || 0;
      totalMatched += run.matchedRecords || 0;
      
      const un = run.unmatchedRecords || 0;
      const partial = run.partialMatches || 0;
      totalExceptionsCount += (un + partial);

      totalAmountMinor += BigInt(run.totalAmountMinor || 0);
      matchedAmountMinor += BigInt(run.matchedAmountMinor || 0);
      unresolvedAmountMinor += BigInt(run.unmatchedAmountMinor || 0);

      if (run.status === "COMPLETED" && run.startedAt && run.completedAt) {
        completedRunsCount++;
        totalDurationMs += (run.completedAt.getTime() - run.startedAt.getTime());
      }
    }

    const matchRate = totalProcessed > 0 ? ((totalMatched / totalProcessed) * 100).toFixed(1) : "0.0";
    const amountMatchRate = totalAmountMinor > 0n 
      ? ((Number(matchedAmountMinor) / Number(totalAmountMinor)) * 100).toFixed(1) 
      : "0.0";

    const averageRunDuration = completedRunsCount > 0 
      ? Math.round(totalDurationMs / completedRunsCount / 1000) // in seconds
      : 0;

    // Active Exceptions
    // We get run IDs for the tenant
    const runIds = allRuns.map(r => r.id);
    let activeExceptions = 0;
    if (runIds.length > 0) {
      // It's a bit manual, but we can do a quick check, or just query active exceptions
      const openExceptions = await db.select().from(exceptions)
        .where(
          and(
            ne(exceptions.status, "RESOLVED"),
            // need to filter by tenant somehow, or by runIds.
            // drizzle inArray has a limit, but typically for dashboard we might join
          )
        );
      
      // Filter in memory for simplicity to ensure tenant boundary if runIds is large
      const openForTenant = openExceptions.filter(e => e.runId && runIds.includes(e.runId));
      activeExceptions = openForTenant.length;
    }

    // 2. Cash Variance
    const latestCash = await db.select().from(cashSnapshots)
      .where(eq(cashSnapshots.tenantId, tenantId))
      .orderBy(desc(cashSnapshots.snapshotDate))
      .limit(1);
    
    let cashVariance = 0n;
    let expectedCash = 0n;
    let actualCash = 0n;
    
    if (latestCash.length > 0) {
      cashVariance = BigInt(latestCash[0].varianceMinor || 0);
      expectedCash = BigInt(latestCash[0].openingBalanceMinor || 0) + BigInt(latestCash[0].expectedInflowsMinor || 0) - BigInt(latestCash[0].expectedOutflowsMinor || 0);
      actualCash = BigInt(latestCash[0].actualBalanceMinor || 0);
    }

    // Auto Resolution Rate - For now, we define this as AI matched / total matched
    // We don't have this explicitly tracked at the top level yet, so we will stub it or calculate it if possible.
    // Let's set it to a placeholder or derived metric based on AI stats if we had them.
    const autoResolutionRate = "0.0"; // To be updated if AI tracking is aggregated.

    // 3. Reconciliation Trend (Last 10 runs)
    const reconciliationTrend = allRuns.slice(0, 10).reverse().map((run, idx) => ({
      name: `Run ${allRuns.length - (allRuns.length - 1 - idx)}`, // roughly ordering
      matched: run.matchedRecords || 0,
      exceptions: (run.unmatchedRecords || 0) + (run.partialMatches || 0)
    }));

    // 4. Needs Your Attention (Top 5 active exceptions)
    let topExceptions: any[] = [];
    if (runIds.length > 0) {
       topExceptions = await db.query.exceptions.findMany({
         where: (ex, { and, inArray, ne }) => and(
           inArray(ex.runId, runIds),
           ne(ex.status, "RESOLVED")
         ),
         limit: 5,
         with: {
           transaction: true
         }
       });
    }

    // 5. Recent Runs (Top 5)
    const recentRuns = allRuns.slice(0, 5).map(r => ({
      runId: r.id,
      records: r.totalRecords || 0,
      matchRate: r.totalRecords ? (((r.matchedRecords || 0) / r.totalRecords) * 100).toFixed(1) : "0.0",
      exceptions: (r.unmatchedRecords || 0) + (r.partialMatches || 0),
      status: r.status,
      startedAt: r.startedAt,
      completedAt: r.completedAt
    }));

    res.json({
      isEmpty: false,
      kpis: {
        transactionsProcessed: totalProcessed,
        matchRate,
        activeExceptions,
        cashVariance: cashVariance.toString(),
        amountMatchRate,
        autoResolutionRate,
        unresolvedAmount: unresolvedAmountMinor.toString(),
        averageRunDuration, // in seconds
        expectedCash: expectedCash.toString(),
        actualCash: actualCash.toString()
      },
      reconciliationTrend,
      needsAttention: topExceptions.map(e => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        reason: e.reason,
        amount: e.transaction?.amountMinor ? e.transaction.amountMinor.toString() : "0",
        currency: e.transaction?.currency || "USD"
      })),
      recentRuns
    });

  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: error.message || "Failed to fetch dashboard metrics" });
  }
};
