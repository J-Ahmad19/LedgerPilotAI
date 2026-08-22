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
    let validCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

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

        // Insert Raw Payload
        await db.insert(rawTransactions).values({
          tenantId,
          dataSourceId,
          externalId: parsed.externalId,
          rawPayload: record,
        });

        // Insert Normalized Transaction
        const insertResult = await db.insert(transactions).values({
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
        }).onConflictDoNothing({ target: transactions.transactionHash });

        if (insertResult.rowCount === 0) {
          duplicateCount++;
        } else {
          validCount++;
        }
      } catch (err) {
        console.error("Error processing record:", record, err);
        errorCount++;
      }
    }

    return {
      total: records.length,
      processed: validCount,
      errors: errorCount,
      duplicates: duplicateCount,
    };
  }
}

export const ingestionService = new IngestionService();
