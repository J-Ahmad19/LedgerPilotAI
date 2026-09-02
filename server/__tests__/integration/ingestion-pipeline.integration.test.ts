/**
 * Integration Tests: Import → Validation → Normalization Pipeline
 * Tests realistic imperfect CSV/JSON input including bad data, duplicates,
 * mixed currencies, edge cases in amounts, and audit log generation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestionService } from '../../services/ingestion.service';
import { db } from '../../db/index';

// ─── Capture what gets inserted so we can assert on it ───────────────────────
let insertedRawTxs: any[] = [];
let insertedNormalizedTxs: any[] = [];
let insertedAuditLogs: any[] = [];

vi.mock('../../db/index', () => {
  const buildInsertMock = () =>
    vi.fn((table: any) => {
      return {
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          // Route to correct capture array by inspecting first row shape
          if (rows[0]?.rawPayload !== undefined) {
            insertedRawTxs.push(...rows);
            return { onConflictDoNothing: vi.fn().mockResolvedValue(undefined) };
          }
          if (rows[0]?.transactionHash !== undefined) {
            insertedNormalizedTxs.push(...rows);
            return {
              onConflictDoNothing: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue(rows),
              })),
            };
          }
          // Audit logs
          insertedAuditLogs.push(...rows);
          return Promise.resolve([]);
        }),
      };
    });

  return {
    db: {
      insert: buildInsertMock(),
    },
  };
});

describe('IngestionService – Import → Validation → Normalization', () => {
  let service: IngestionService;

  beforeEach(() => {
    service = new IngestionService();
    insertedRawTxs = [];
    insertedNormalizedTxs = [];
    insertedAuditLogs = [];
    vi.clearAllMocks();
    // Re-wire insert after clearAllMocks
    (db.insert as any) = vi.fn((table: any) => ({
      values: vi.fn((vals: any) => {
        const rows = Array.isArray(vals) ? vals : [vals];
        if (rows[0]?.rawPayload !== undefined) {
          insertedRawTxs.push(...rows);
          return { onConflictDoNothing: vi.fn().mockResolvedValue(undefined) };
        }
        if (rows[0]?.transactionHash !== undefined) {
          insertedNormalizedTxs.push(...rows);
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows),
            })),
          };
        }
        insertedAuditLogs.push(...rows);
        return Promise.resolve([]);
      }),
    }));
  });

  // ─── Valid CSV import ─────────────────────────────────────────────────────
  describe('CSV import → validation', () => {
    it('processes a valid single-row CSV', async () => {
      const csv = `externalId,amount,currency,transactionDate,merchantName
TXN-001,250.00,USD,2026-08-01,Acme Corp`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.total).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('processes multiple valid rows', async () => {
      const csv = `externalId,amount,currency,transactionDate
TXN-001,100.00,USD,2026-08-01
TXN-002,200.50,GBP,2026-08-02
TXN-003,50.00,EUR,2026-08-03`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.total).toBe(3);
      expect(result.errors).toBe(0);
    });

    it('rejects a row with missing externalId (required field)', async () => {
      const csv = `amount,currency,transactionDate
100.00,USD,2026-08-01`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.errors).toBe(1);
      expect(result.processed).toBe(0);
    });

    it('rejects a row with invalid amount format', async () => {
      const csv = `externalId,amount,currency,transactionDate
TXN-BAD,not-a-number,USD,2026-08-01`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.errors).toBe(1);
    });

    it('rejects a row with invalid date', async () => {
      const csv = `externalId,amount,currency,transactionDate
TXN-BADDATE,100.00,USD,not-a-date`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.errors).toBe(1);
    });

    it('rejects a row with wrong currency length', async () => {
      const csv = `externalId,amount,currency,transactionDate
TXN-CURR,100.00,US,2026-08-01`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.errors).toBe(1);
    });

    it('accepts optional fields when absent', async () => {
      const csv = `externalId,amount,currency,transactionDate
TXN-MIN,50.00,USD,2026-08-01`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.errors).toBe(0);
    });

    it('processes mixed valid + invalid rows and reports independently', async () => {
      const csv = `externalId,amount,currency,transactionDate
TXN-GOOD,100.00,USD,2026-08-01
,200.00,USD,2026-08-02
TXN-ALSO-GOOD,300.00,EUR,2026-08-03`;

      const result = await service.processCsv('tenant-1', 'src-1', csv);
      expect(result.total).toBe(3);
      expect(result.errors).toBe(1);
    });
  });

  // ─── Normalization ────────────────────────────────────────────────────────
  describe('import → normalization', () => {
    it('converts amount to minor units (cents)', async () => {
      const records = [{
        externalId: 'TXN-NORM-1',
        amount: '1234.56',
        currency: 'USD',
        transactionDate: '2026-08-01',
      }];

      let capturedTx: any;
      (db.insert as any) = vi.fn(() => ({
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          if (rows[0]?.amountMinor !== undefined) capturedTx = rows[0];
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows),
            })),
          };
        }),
      }));

      await service.processJson('tenant-1', 'src-1', records);
      expect(capturedTx?.amountMinor).toBe(123456n);
    });

    it('uppercases the currency code', async () => {
      const records = [{
        externalId: 'TXN-CUR',
        amount: '50.00',
        currency: 'usd',
        transactionDate: '2026-08-01',
      }];

      let capturedTx: any;
      (db.insert as any) = vi.fn(() => ({
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          if (rows[0]?.currency) capturedTx = rows[0];
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows),
            })),
          };
        }),
      }));

      await service.processJson('tenant-1', 'src-1', records);
      expect(capturedTx?.currency).toBe('USD');
    });

    it('normalizes description to uppercase trimmed string', async () => {
      const records = [{
        externalId: 'TXN-DESC',
        amount: '100.00',
        currency: 'USD',
        transactionDate: '2026-08-01',
        description: '  acme corp payment  ',
      }];

      let capturedTx: any;
      (db.insert as any) = vi.fn(() => ({
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          if (rows[0]?.normalizedDescription !== undefined) capturedTx = rows[0];
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows),
            })),
          };
        }),
      }));

      await service.processJson('tenant-1', 'src-1', records);
      expect(capturedTx?.normalizedDescription).toBe('ACME CORP PAYMENT');
    });

    it('strips hyphens from referenceId during normalization', async () => {
      const records = [{
        externalId: 'TXN-REF',
        amount: '100.00',
        currency: 'USD',
        transactionDate: '2026-08-01',
        referenceId: 'INV-2026-001',
      }];

      let capturedTx: any;
      (db.insert as any) = vi.fn(() => ({
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          if (rows[0]?.normalizedReference !== undefined) capturedTx = rows[0];
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows),
            })),
          };
        }),
      }));

      await service.processJson('tenant-1', 'src-1', records);
      expect(capturedTx?.normalizedReference).toBe('INV2026001');
    });

    it('generates a deterministic transactionHash', async () => {
      const records = [{
        externalId: 'TXN-HASH',
        amount: '100.00',
        currency: 'USD',
        transactionDate: '2026-08-01',
      }];

      const hashes: string[] = [];
      (db.insert as any) = vi.fn(() => ({
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          if (rows[0]?.transactionHash) hashes.push(rows[0].transactionHash);
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows),
            })),
          };
        }),
      }));

      await service.processJson('tenant-1', 'src-1', records);
      await service.processJson('tenant-1', 'src-1', records);

      expect(hashes[0]).toBe(hashes[1]);
      expect(hashes[0]).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ─── Duplicate handling ───────────────────────────────────────────────────
  describe('duplicate fingerprinting via onConflictDoNothing', () => {
    it('reports a duplicate when same hash conflicts', async () => {
      const records = [{
        externalId: 'TXN-DUP',
        amount: '100.00',
        currency: 'USD',
        transactionDate: '2026-08-01',
      }];

      (db.insert as any) = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(() => ({
            // returning empty array simulates conflict → nothing inserted
            returning: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));

      const result = await service.processJson('tenant-1', 'src-1', records);
      expect(result.duplicates).toBe(1);
      expect(result.processed).toBe(0);
    });

    it('processes 3 records where 1 is a duplicate', async () => {
      const records = [
        { externalId: 'TXN-A', amount: '100.00', currency: 'USD', transactionDate: '2026-08-01' },
        { externalId: 'TXN-B', amount: '200.00', currency: 'USD', transactionDate: '2026-08-01' },
        { externalId: 'TXN-A', amount: '100.00', currency: 'USD', transactionDate: '2026-08-01' }, // dup
      ];

      // Return only 2 inserted (one conflict)
      (db.insert as any) = vi.fn(() => ({
        values: vi.fn((vals: any) => {
          const rows = Array.isArray(vals) ? vals : [vals];
          return {
            onConflictDoNothing: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue(rows.slice(0, 2)),
            })),
          };
        }),
      }));

      const result = await service.processJson('tenant-1', 'src-1', records);
      expect(result.total).toBe(3);
      expect(result.processed).toBe(2);
      expect(result.duplicates).toBe(1);
    });
  });
});
