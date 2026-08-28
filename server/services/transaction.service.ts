import { db } from "../db/index.js";
import { transactions, dataSources, reconciliationMatches, exceptions, auditLogs } from "../db/schema.js";
import { eq, and, or, inArray, desc, sql, ilike } from "drizzle-orm";

export class TransactionService {
  
  async getTransactions(tenantId: string, filters: any, page: number, limit: number) {
    const offset = (page - 1) * limit;
    
    // We start with a base query on transactions
    let conditions = [eq(transactions.tenantId, tenantId)];
    
    if (filters.status && filters.status !== 'ALL') {
      conditions.push(eq(transactions.status, filters.status));
    }
    
    if (filters.search) {
      conditions.push(or(
        ilike(transactions.description, `%${filters.search}%`),
        ilike(transactions.referenceId, `%${filters.search}%`)
      ));
    }

    if (filters.currency) {
      conditions.push(eq(transactions.currency, filters.currency));
    }

    if (filters.source) {
      conditions.push(eq(transactions.sourceId, filters.source));
    }

    if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
      const from = new Date(filters.dateRange.from);
      const to = new Date(filters.dateRange.to);
      conditions.push(
        and(
          sql`${transactions.transactionDate} >= ${from.toISOString()}::timestamp`,
          sql`${transactions.transactionDate} <= ${to.toISOString()}::timestamp`
        )
      );
    }

    if (filters.amountRange && filters.amountRange.min !== undefined && filters.amountRange.max !== undefined) {
      conditions.push(
        and(
          sql`${transactions.amountMinor} >= ${filters.amountRange.min}`,
          sql`${transactions.amountMinor} <= ${filters.amountRange.max}`
        )
      );
    }
    
    let baseQuery = db.select({
      id: transactions.id,
      transactionDate: transactions.transactionDate,
      referenceId: transactions.referenceId,
      description: transactions.description,
      amountMinor: transactions.amountMinor,
      currency: transactions.currency,
      status: transactions.status,
      sourceId: transactions.sourceId,
      sourceName: dataSources.name,
    })
    .from(transactions)
    .leftJoin(dataSources, eq(transactions.sourceId, dataSources.id));

    let needMatchesJoin = false;
    let needExceptionsJoin = false;

    if (filters.runId || filters.confidence) {
      needMatchesJoin = true;
    }
    if (filters.exceptionStatus) {
      needExceptionsJoin = true;
    }

    if (needMatchesJoin) {
      baseQuery = baseQuery.leftJoin(reconciliationMatches, or(
        eq(reconciliationMatches.sourceTransactionId, transactions.id),
        eq(reconciliationMatches.targetTransactionId, transactions.id)
      )) as any;
      if (filters.runId) {
        conditions.push(eq(reconciliationMatches.runId, filters.runId));
      }
      if (filters.confidence) {
        // Assume filters.confidence is a string like "0.9" and we want >= 
        conditions.push(sql`${reconciliationMatches.confidenceScore} >= ${filters.confidence}`);
      }
    }

    if (needExceptionsJoin) {
      baseQuery = baseQuery.leftJoin(exceptions, eq(exceptions.transactionId, transactions.id)) as any;
      if (filters.exceptionStatus !== 'ALL') {
        conditions.push(eq(exceptions.status, filters.exceptionStatus));
      }
    }

    // Since we are adding left joins that could cause duplicates if multiple matches/exceptions exist, 
    // we should group by transaction ID, or we can just fetch and deduplicate. Let's rely on limit/offset on distinct items.
    // Drizzle doesn't have a clean DISTINCT ON for all dialects, so we will use group by if we joined.
    const query = baseQuery.where(and(...conditions));

    if (needMatchesJoin || needExceptionsJoin) {
      query.groupBy(transactions.id, dataSources.name);
    }
    
    const data = await query.limit(limit).offset(offset).orderBy(desc(transactions.transactionDate));
    
    // For counting, we can do a simpler count without the joins if not needed, but if needed, we join
    let countBase = db.select({ count: sql`count(distinct ${transactions.id})` }).from(transactions);
    if (needMatchesJoin) {
      countBase = countBase.leftJoin(reconciliationMatches, or(
        eq(reconciliationMatches.sourceTransactionId, transactions.id),
        eq(reconciliationMatches.targetTransactionId, transactions.id)
      )) as any;
    }
    if (needExceptionsJoin) {
      countBase = countBase.leftJoin(exceptions, eq(exceptions.transactionId, transactions.id)) as any;
    }

    const countQuery = await countBase.where(and(...conditions));
      
    const total = Number(countQuery[0].count);
    
    const ids = data.map(d => d.id);
    
    let matches: any[] = [];
    let txExceptions: any[] = [];
    
    if (ids.length > 0) {
      matches = await db.select().from(reconciliationMatches)
        .where(or(
          inArray(reconciliationMatches.sourceTransactionId, ids),
          inArray(reconciliationMatches.targetTransactionId, ids)
        ));
        
      txExceptions = await db.select().from(exceptions)
        .where(inArray(exceptions.transactionId, ids));
    }
    
    const enrichedData = data.map(tx => {
      const match = matches.find(m => m.sourceTransactionId === tx.id || m.targetTransactionId === tx.id);
      const exception = txExceptions.find(e => e.transactionId === tx.id);
      
      return {
        ...tx,
        matchDetails: match || null,
        exceptionDetails: exception || null,
      };
    });
    
    return {
      data: enrichedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  async getTransactionDetails(tenantId: string, transactionId: string) {
    const tx = await db.select().from(transactions).where(
      and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId))
    ).limit(1);
    
    if (!tx.length) {
      return null;
    }
    
    const transaction = tx[0];
    
    // Fetch source
    const source = await db.select().from(dataSources).where(eq(dataSources.id, transaction.sourceId)).limit(1);
    
    // Fetch related matches
    const matches = await db.select().from(reconciliationMatches)
      .where(or(
        eq(reconciliationMatches.sourceTransactionId, transactionId),
        eq(reconciliationMatches.targetTransactionId, transactionId)
      ));
      
    // For matches, fetch counterparty transactions
    let counterpartyIds = matches.map(m => m.sourceTransactionId === transactionId ? m.targetTransactionId : m.sourceTransactionId);
    let counterparties: any[] = [];
    if (counterpartyIds.length > 0) {
      counterparties = await db.select().from(transactions).where(inArray(transactions.id, counterpartyIds));
    }
    
    // Fetch exceptions
    const txExceptions = await db.select().from(exceptions)
      .where(eq(exceptions.transactionId, transactionId));
      
    // Fetch audit history
    const history = await db.select().from(auditLogs)
      .where(eq(auditLogs.entityId, transactionId))
      .orderBy(desc(auditLogs.createdAt));
      
    return {
      transaction: {
        ...transaction,
        sourceName: source[0]?.name || 'Unknown',
      },
      matches: matches.map(m => {
        const counterpartyId = m.sourceTransactionId === transactionId ? m.targetTransactionId : m.sourceTransactionId;
        const counterparty = counterparties.find(c => c.id === counterpartyId);
        return {
          ...m,
          counterparty
        };
      }),
      exceptions: txExceptions,
      auditHistory: history
    };
  }
}

export const transactionService = new TransactionService();
