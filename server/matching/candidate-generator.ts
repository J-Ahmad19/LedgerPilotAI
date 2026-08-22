import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { and, eq, ne, between, sql } from "drizzle-orm";

export async function findCandidates(
  sourceTx: any,
  amountToleranceMinor: bigint = 1000n, // e.g. 10.00
  dateToleranceDays: number = 3
) {
  // Convert date tolerance to milliseconds
  const msTolerance = dateToleranceDays * 24 * 60 * 60 * 1000;
  const sourceDate = new Date(sourceTx.transactionDate).getTime();
  
  const minDate = new Date(sourceDate - msTolerance);
  const maxDate = new Date(sourceDate + msTolerance);

  const minAmount = BigInt(sourceTx.amountMinor) - amountToleranceMinor;
  const maxAmount = BigInt(sourceTx.amountMinor) + amountToleranceMinor;

  const candidates = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, sourceTx.tenantId),
        ne(transactions.id, sourceTx.id), // Don't match with self
        ne(transactions.sourceId, sourceTx.sourceId), // Must be from different source
        eq(transactions.currency, sourceTx.currency),
        between(transactions.amountMinor, minAmount, maxAmount),
        between(transactions.transactionDate, minDate, maxDate),
        // Ideally we should also filter out already fully reconciled transactions
        // For simplicity, we assume we want OPEN or REVIEW status
        sql`${transactions.status} IN ('OPEN', 'REVIEW')`
      )
    );

  return candidates;
}
