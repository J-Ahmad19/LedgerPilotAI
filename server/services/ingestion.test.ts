import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestionService } from './ingestion.service';
import { db } from '../db/index';

// Mock the DB
vi.mock('../db/index', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn().mockResolvedValue({ rowCount: 1 }) // Simulate successful insert
      })),
      returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }])
    }))
  }
}));

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  const tenantId = 'tenant-123';
  const dataSourceId = 'source-123';

  beforeEach(() => {
    ingestionService = new IngestionService();
    vi.clearAllMocks();
  });

  it('should successfully parse and process valid CSV records', async () => {
    const csvContent = `externalId,amount,currency,transactionDate,merchantName
EXT-1,100.50,USD,2026-01-01,Test Merchant`;

    const result = await ingestionService.processCsv(tenantId, dataSourceId, csvContent);
    
    expect(result.total).toBe(1);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(result.duplicates).toBe(0);
  });

  it('should reject invalid records (missing externalId)', async () => {
    // Missing externalId which is required by zod schema
    const csvContent = `amount,currency,transactionDate,merchantName
100.50,USD,2026-01-01,Test Merchant`;

    const result = await ingestionService.processCsv(tenantId, dataSourceId, csvContent);
    
    expect(result.total).toBe(1);
    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
  });

  it('should normalize amounts correctly (convert to minor units)', async () => {
    const jsonRecords = [{
      externalId: 'EXT-2',
      amount: '1234.56',
      currency: 'USD',
      transactionDate: '2026-01-01'
    }];

    // Spy on the DB insert to check the payload
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue({ rowCount: 1 })
    });
    (db.insert as any).mockReturnValue({ values: mockValues });

    await ingestionService.processJson(tenantId, dataSourceId, jsonRecords);
    
    // The second insert is for the normalized transactions table
    const normalizedInsertCall = mockValues.mock.calls[1][0];
    
    // 1234.56 * 100 = 123456n (bigint)
    expect(normalizedInsertCall.amountMinor).toBe(123456n);
  });

  it('should handle duplicate records (idempotency)', async () => {
    const jsonRecords = [{
      externalId: 'EXT-3',
      amount: '100.00',
      currency: 'USD',
      transactionDate: '2026-01-01'
    }];

    // Simulate returning rowCount = 0 for duplicate
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue({ rowCount: 0 })
    });
    (db.insert as any).mockReturnValue({ values: mockValues });

    const result = await ingestionService.processJson(tenantId, dataSourceId, jsonRecords);
    
    expect(result.total).toBe(1);
    expect(result.processed).toBe(0);
    expect(result.duplicates).toBe(1);
  });
});
