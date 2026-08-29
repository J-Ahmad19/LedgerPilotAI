import { db } from "../db/index.js";
import { transactions, exceptions, dataSources, auditLogs } from "../db/schema.js";
import { eq, and, inArray, desc } from "drizzle-orm";

export class CashService {
  async getCashPosition(tenantId: string) {
    // 1. Calculate Expected Cash (LEDGER transactions)
    const ledgerSources = await db.query.dataSources.findMany({
      where: and(eq(dataSources.tenantId, tenantId), eq(dataSources.type, 'LEDGER')),
    });
    
    let expectedClosingCashMinor = 0n;
    if (ledgerSources.length > 0) {
      const ledgerSourceIds = ledgerSources.map(s => s.id);
      const ledgerTxs = await db.query.transactions.findMany({
        where: and(
          eq(transactions.tenantId, tenantId),
          inArray(transactions.sourceId, ledgerSourceIds)
        ),
      });
      expectedClosingCashMinor = ledgerTxs.reduce((sum, tx) => sum + BigInt(tx.amountMinor), 0n);
    }

    // 2. Calculate Actual Cash (SETTLEMENTS transactions)
    const settlementSources = await db.query.dataSources.findMany({
      where: and(eq(dataSources.tenantId, tenantId), eq(dataSources.type, 'SETTLEMENTS')),
    });

    let actualBankBalanceMinor = 0n;
    if (settlementSources.length > 0) {
      const settlementSourceIds = settlementSources.map(s => s.id);
      const settlementTxs = await db.query.transactions.findMany({
        where: and(
          eq(transactions.tenantId, tenantId),
          inArray(transactions.sourceId, settlementSourceIds)
        ),
      });
      actualBankBalanceMinor = settlementTxs.reduce((sum, tx) => sum + BigInt(tx.amountMinor), 0n);
    }

    // 3. Calculate Variance
    const varianceMinor = expectedClosingCashMinor - actualBankBalanceMinor;
    
    // We will use absolute variance for calculating percentages
    const absVariance = varianceMinor < 0n ? -varianceMinor : varianceMinor;

    // 4. Calculate Variance Breakdown
    const allExceptions = await db.query.exceptions.findMany({
      with: {
        transaction: true
      }
    });

    // Filter to tenant's exceptions implicitly via transaction tenantId
    const tenantExceptions = allExceptions.filter(e => e.transaction?.tenantId === tenantId);

    const breakdownMap = new Map<string, { amount: bigint, count: number }>();
    
    for (const ex of tenantExceptions) {
      if (!ex.transaction) continue;
      
      const type = ex.type; // AMBIGUOUS_MATCH, MISSING_COUNTERPART, etc.
      let label = "Other";
      if (type === "MISSING_COUNTERPART") label = "Missing Ledger Entries";
      else if (type === "AMBIGUOUS_MATCH") label = "Unmatched Transactions";
      else label = type;

      const current = breakdownMap.get(label) || { amount: 0n, count: 0 };
      current.amount += BigInt(ex.transaction.amountMinor);
      current.count += 1;
      breakdownMap.set(label, current);
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([cause, data]) => {
      let percentage = 0;
      if (absVariance > 0n) {
        // Calculate percentage, careful with bigint division
        percentage = Number((data.amount * 10000n) / absVariance) / 100; 
        if (percentage > 100) percentage = 100; // Cap at 100% just in case of data overlap
      }
      
      return {
        cause,
        amountMinor: data.amount.toString(),
        percentage,
        transactionCount: data.count
      };
    });

    // 5. Identify Top Contributing Transactions
    // Get OPEN or REVIEW transactions, sorted by amount
    const topTxs = await db.query.transactions.findMany({
      where: and(
        eq(transactions.tenantId, tenantId),
        inArray(transactions.status, ['OPEN', 'REVIEW'])
      ),
      orderBy: [desc(transactions.amountMinor)],
      limit: 10
    });

    // Enrich with exception reasons if they exist
    const topTransactions = topTxs.map(tx => {
      const ex = tenantExceptions.find(e => e.transactionId === tx.id);
      return {
        id: tx.id,
        amountMinor: tx.amountMinor.toString(),
        source: tx.merchantName || tx.customerName || "Unknown",
        reason: ex?.reason || "Pending Reconciliation",
        status: tx.status
      };
    });

    const result = {
      expectedClosingCashMinor: expectedClosingCashMinor.toString(),
      actualBankBalanceMinor: actualBankBalanceMinor.toString(),
      varianceMinor: varianceMinor.toString(),
      breakdown,
      topTransactions
    };

    // Emit audit log for cash variance recalculated
    await db.insert(auditLogs).values({
      tenantId,
      actorType: "System",
      action: "CASH_VARIANCE_RECALCULATED",
      entityType: "Tenant",
      entityId: tenantId,
      metadata: { 
        expectedClosingCashMinor: expectedClosingCashMinor.toString(),
        actualBankBalanceMinor: actualBankBalanceMinor.toString(),
        varianceMinor: varianceMinor.toString()
      }
    });

    return result;
  }
}

export const cashService = new CashService();
