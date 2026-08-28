import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cashService } from '../services/cash.service.js';
import { db } from '../db/index.js';

vi.mock('../db/index.js', () => {
  return {
    db: {
      query: {
        dataSources: {
          findMany: vi.fn(),
        },
        transactions: {
          findMany: vi.fn(),
        },
        exceptions: {
          findMany: vi.fn(),
        }
      }
    }
  };
});

describe('CashService', () => {
  const tenantId = 'test-tenant-id';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should calculate deterministic expected and actual cash, variance, and breakdown', async () => {
    // 1st call to dataSources is for LEDGER
    // 2nd call to dataSources is for SETTLEMENTS
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([{ id: 'ledger-source-id', tenantId, type: 'LEDGER' } as any])
      .mockResolvedValueOnce([{ id: 'settlement-source-id', tenantId, type: 'SETTLEMENTS' } as any]);

    // 1st call to transactions is for Expected Cash (LEDGER)
    // 2nd call to transactions is for Actual Cash (SETTLEMENTS)
    // 3rd call to transactions is for Top Transactions
    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([
        { id: 'tx-1', amountMinor: 500000n },
        { id: 'tx-2', amountMinor: 700000n },
      ] as any)
      .mockResolvedValueOnce([
        { id: 'tx-3', amountMinor: 500000n },
      ] as any)
      .mockResolvedValueOnce([
        { id: 'tx-2', amountMinor: 700000n, status: 'OPEN', merchantName: 'Test Merchant' }
      ] as any);

    // Mock Exceptions
    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([
      {
        id: 'ex-1',
        transactionId: 'tx-2',
        type: 'MISSING_COUNTERPART',
        reason: 'No suitable counterpart found',
        transaction: {
          tenantId,
          amountMinor: 700000n
        }
      }
    ] as any);

    const result = await cashService.getCashPosition(tenantId);

    expect(result.expectedClosingCashMinor).toBe('1200000');
    expect(result.actualBankBalanceMinor).toBe('500000');
    expect(result.varianceMinor).toBe('700000');

    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].cause).toBe('Missing Ledger Entries');
    expect(result.breakdown[0].amountMinor).toBe('700000');
    expect(result.breakdown[0].percentage).toBe(100);
    expect(result.breakdown[0].transactionCount).toBe(1);

    expect(result.topTransactions).toHaveLength(1);
    expect(result.topTransactions[0].id).toBe('tx-2');
    expect(result.topTransactions[0].amountMinor).toBe('700000');
    expect(result.topTransactions[0].reason).toBe('No suitable counterpart found');
  });
});
