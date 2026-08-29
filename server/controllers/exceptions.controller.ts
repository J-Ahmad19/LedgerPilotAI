import { Request, Response } from "express";
import { db } from "../db/index.js";
import { exceptions, transactions, reconciliationMatches, auditLogs } from "../db/schema.js";
import { AuthRequest } from "../middleware/auth.js";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function getExceptions(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { status, severity } = req.query;

    let conditions = [eq(transactions.tenantId, tenantId as string)];

    if (status && status !== 'All') {
      conditions.push(eq(exceptions.status, status as string));
    }
    if (severity && severity !== 'All') {
      conditions.push(eq(exceptions.severity, severity as string));
    }

    const exceptionsList = await db
      .select({
        exception: exceptions,
        transaction: transactions,
      })
      .from(exceptions)
      .leftJoin(transactions, eq(exceptions.transactionId, transactions.id))
      .where(and(...conditions))
      .orderBy(desc(exceptions.createdAt));

    res.json({ exceptions: exceptionsList });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getExceptionById(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const exceptionRecord = await db
      .select({
        exception: exceptions,
        transaction: transactions,
      })
      .from(exceptions)
      .leftJoin(transactions, eq(exceptions.transactionId, transactions.id))
      .where(and(eq(exceptions.id, id), eq(transactions.tenantId, tenantId as string)))
      .limit(1);

    if (!exceptionRecord.length) {
      return res.status(404).json({ error: "Exception not found" });
    }

    const result = exceptionRecord[0];

    // Find candidate transactions by querying reconciliation_matches
    // where source is this exception's transaction
    const matches = await db
      .select({
        match: reconciliationMatches,
        targetTransaction: transactions,
      })
      .from(reconciliationMatches)
      .leftJoin(transactions, eq(reconciliationMatches.targetTransactionId, transactions.id))
      .where(eq(reconciliationMatches.sourceTransactionId, result.transaction!.id));

    res.json({
      exception: result.exception,
      sourceTransaction: result.transaction,
      candidates: matches.map(m => ({
        matchDetails: m.match,
        transaction: m.targetTransaction
      }))
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function resolveException(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const { id } = req.params;
    const { decision, targetTransactionId, resolutionNote } = req.body;

    // decision can be 'Approve Match', 'Reject Match', 'Keep Unmatched'

    await db.transaction(async (tx) => {
      // 1. Get exception and verify it belongs to the tenant via transactions table
      const excRecords = await tx
        .select({
          exception: exceptions,
          transaction: transactions
        })
        .from(exceptions)
        .innerJoin(transactions, eq(exceptions.transactionId, transactions.id))
        .where(and(
          eq(exceptions.id, id),
          eq(transactions.tenantId, tenantId as string)
        ))
        .limit(1);

      if (!excRecords.length) throw new Error("Exception not found or access denied");
      const exception = excRecords[0].exception;

      // 2. Determine new statuses
      let sourceTxStatus = "UNMATCHED";
      let exceptionStatus = "RESOLVED";

      if (decision === 'Approve Match' && targetTransactionId) {
        sourceTxStatus = "MATCHED";
        
        // Update target transaction status
        await tx.update(transactions)
          .set({ status: "MATCHED", updatedAt: new Date() })
          .where(eq(transactions.id, targetTransactionId));
      }

      // 3. Update source transaction
      await tx.update(transactions)
        .set({ status: sourceTxStatus, updatedAt: new Date() })
        .where(eq(transactions.id, exception.transactionId));

      // 4. Update exception
      await tx.update(exceptions)
        .set({
          status: exceptionStatus,
          resolvedBy: userId,
          resolvedAt: new Date(),
          resolutionNote: resolutionNote || null
        })
        .where(eq(exceptions.id, id));

      let actionType = "TRANSACTION_MARKED_UNMATCHED";
      if (decision === 'Approve Match') actionType = "EXCEPTION_APPROVED";
      if (decision === 'Reject Match') actionType = "EXCEPTION_REJECTED";

      // 5. Create audit log
      const auditLogEntries = [{
        tenantId: tenantId as string,
        actorType: "User",
        actorId: userId,
        action: actionType,
        entityType: "Exception",
        entityId: id,
        beforeState: exception,
        afterState: { status: exceptionStatus, decision, targetTransactionId, resolutionNote },
        metadata: { decision, sourceTxStatus }
      }];

      if (resolutionNote) {
        auditLogEntries.push({
          tenantId: tenantId as string,
          actorType: "User",
          actorId: userId,
          action: "RESOLUTION_NOTE_ADDED",
          entityType: "Exception",
          entityId: id,
          beforeState: { resolutionNote: exception.resolutionNote },
          afterState: { resolutionNote },
          metadata: { message: "Resolution note appended to exception" }
        });
      }

      await tx.insert(auditLogs).values(auditLogEntries);
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
