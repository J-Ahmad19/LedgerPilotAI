import { db } from "../db/index.js";
import { transactions, rawTransactions } from "../db/schema.js";
import { toMinorUnits } from "../utils/money.js";
import { generateTransactionHash } from "../utils/hashing.js";
import { normalizeString, normalizeReference } from "../utils/normalization.js";
import { transactionImportSchema } from "../validation/import.schema.js";
import { parse } from "csv-parse/sync";

export class IngestionService {
  async processCsv(tenantId: string, dataSourceId: string, csvContent: string) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return this.processRecords(tenantId, dataSourceId, records);
  }

  async processJson(tenantId: string, dataSourceId: string, records: any[]) {
    return this.processRecords(tenantId, dataSourceId, records);
  }

  private async processRecords(tenantId: string, dataSourceId: string, records: any[]) {
    const rawToInsert: any[] = [];
    const txToInsert: any[] = [];
    let errorCount = 0;

    for (const record of records) {
      try {
        // Validate
        const parsed = transactionImportSchema.parse(record);

        // Normalize
        const amountMinor = toMinorUnits(parsed.amount);
        const transactionType = parsed.transactionType || "UNKNOWN";
        const transactionDate = parsed.transactionDate;
        
        const hash = generateTransactionHash(
          dataSourceId,
          parsed.externalId,
          amountMinor,
          transactionDate
        );

        rawToInsert.push({
          tenantId,
          dataSourceId,
          externalId: parsed.externalId,
          rawPayload: record,
        });

        txToInsert.push({
          tenantId,
          sourceId: dataSourceId,
          externalId: parsed.externalId,
          transactionType,
          amountMinor,
          currency: parsed.currency.toUpperCase(),
          transactionDate,
          settlementDate: parsed.settlementDate,
          merchantName: parsed.merchantName,
          customerName: parsed.customerName,
          referenceId: parsed.referenceId,
          description: parsed.description,
          normalizedReference: normalizeReference(parsed.referenceId),
          normalizedDescription: normalizeString(parsed.description),
          status: parsed.status,
          transactionHash: hash,
        });
      } catch (err) {
        console.error("Error validating/normalizing record:", record, err);
        errorCount++;
      }
    }

    let processedCount = 0;

    if (rawToInsert.length > 0) {
      try {
        // Bulk insert raw payload
        await db.insert(rawTransactions).values(rawToInsert);
        
        // Bulk insert normalized transactions
        const insertResult = await db.insert(transactions)
          .values(txToInsert)
          .onConflictDoNothing({ target: transactions.transactionHash });
          
        processedCount = insertResult.rowCount || 0;
      } catch (err) {
        console.error("Error in bulk insert:", err);
        // Fallback to erroring all if bulk fails?
        errorCount += rawToInsert.length;
      }
    }

    return {
      total: records.length,
      processed: processedCount,
      errors: errorCount,
      duplicates: rawToInsert.length - processedCount,
    };
  }
}

export const ingestionService = new IngestionService();
