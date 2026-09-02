/**
 * Integration Tests: Cash Variance Calculation
 * Tests expected vs actual cash, variance breakdown, and top transaction reporting.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashService } from '../../services/cash.service';
import { db } from '../../db/index';

vi.mock('../../db/index', () => ({
  db: {
    query: {
      dataSources: { findMany: vi.fn() },
      transactions: { findMany: vi.fn() },
      exceptions: { findMany: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue([]),
    })),
  },
}));

const LEDGER_SOURCE = { id: 'ledger-src', tenantId: 'tenant-1', type: 'LEDGER' };
const BANK_SOURCE = { id: 'bank-src', tenantId: 'tenant-1', type: 'SETTLEMENTS' };

describe('CashService – Cash Variance Calculation', () => {
  let service: CashService;

  beforeEach(() => {
    service = new CashService();
    vi.resetAllMocks();
    // Reset insert mock
    (db.insert as any) = vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) }));
  });

  it('calculates zero variance when ledger and bank are perfectly balanced', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 500000n }] as any) // ledger
      .mockResolvedValueOnce([{ id: 'tx-2', amountMinor: 500000n }] as any) // bank
      .mockResolvedValueOnce([] as any); // top txs

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([] as any);

    const result = await service.getCashPosition('tenant-1');
    expect(result.varianceMinor).toBe('0');
    expect(result.expectedClosingCashMinor).toBe('500000');
    expect(result.actualBankBalanceMinor).toBe('500000');
  });

  it('calculates positive variance when ledger > bank (missing bank postings)', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([
        { id: 'tx-1', amountMinor: 500000n },
        { id: 'tx-2', amountMinor: 700000n },
      ] as any)
      .mockResolvedValueOnce([{ id: 'tx-3', amountMinor: 500000n }] as any)
      .mockResolvedValueOnce([
        { id: 'tx-2', amountMinor: 700000n, status: 'OPEN', merchantName: 'Acme Corp' },
      ] as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([
      {
        id: 'ex-1',
        transactionId: 'tx-2',
        type: 'MISSING_COUNTERPART',
        reason: 'No bank entry found',
        transaction: { tenantId: 'tenant-1', amountMinor: 700000n },
      },
    ] as any);

    const result = await service.getCashPosition('tenant-1');
    expect(result.expectedClosingCashMinor).toBe('1200000');
    expect(result.actualBankBalanceMinor).toBe('500000');
    expect(result.varianceMinor).toBe('700000');
  });

  it('calculates negative variance when bank > ledger (unbooked bank entries)', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 300000n }] as any) // ledger $3,000
      .mockResolvedValueOnce([{ id: 'tx-2', amountMinor: 500000n }] as any) // bank $5,000
      .mockResolvedValueOnce([] as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([] as any);

    const result = await service.getCashPosition('tenant-1');
    expect(result.varianceMinor).toBe('-200000'); // ledger - bank = -$2,000
  });

  it('returns an empty breakdown when no exceptions exist', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 100000n }] as any)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 100000n }] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([] as any);

    const result = await service.getCashPosition('tenant-1');
    expect(result.breakdown).toHaveLength(0);
  });

  it('correctly categorizes MISSING_COUNTERPART as "Missing Ledger Entries"', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 1000000n }] as any)
      .mockResolvedValueOnce([{ id: 'tx-2', amountMinor: 500000n }] as any)
      .mockResolvedValueOnce([
        { id: 'tx-1', amountMinor: 1000000n, status: 'OPEN', merchantName: 'BigCo' },
      ] as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([
      {
        id: 'ex-1',
        transactionId: 'tx-1',
        type: 'MISSING_COUNTERPART',
        reason: 'No bank entry',
        transaction: { tenantId: 'tenant-1', amountMinor: 500000n },
      },
    ] as any);

    const result = await service.getCashPosition('tenant-1');
    const missingEntry = result.breakdown.find(b => b.cause === 'Missing Ledger Entries');
    expect(missingEntry).toBeDefined();
    expect(missingEntry!.transactionCount).toBe(1);
  });

  it('categorizes AMBIGUOUS_MATCH as "Unmatched Transactions"', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 800000n }] as any)
      .mockResolvedValueOnce([{ id: 'tx-2', amountMinor: 500000n }] as any)
      .mockResolvedValueOnce([
        { id: 'tx-1', amountMinor: 800000n, status: 'REVIEW', merchantName: null, customerName: 'Vendor A' },
      ] as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([
      {
        id: 'ex-2',
        transactionId: 'tx-1',
        type: 'AMBIGUOUS_MATCH',
        reason: 'Multiple possible matches',
        transaction: { tenantId: 'tenant-1', amountMinor: 800000n },
      },
    ] as any);

    const result = await service.getCashPosition('tenant-1');
    const ambigEntry = result.breakdown.find(b => b.cause === 'Unmatched Transactions');
    expect(ambigEntry).toBeDefined();
  });

  it('returns up to 10 top contributing transactions', async () => {
    const manyTxs = Array.from({ length: 10 }, (_, i) => ({
      id: `tx-${i}`,
      amountMinor: BigInt((10 - i) * 100000),
      status: 'OPEN',
      merchantName: `Vendor ${i}`,
      customerName: null,
    }));

    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-base', amountMinor: 500000n }] as any)
      .mockResolvedValueOnce([{ id: 'tx-bank', amountMinor: 100000n }] as any)
      .mockResolvedValueOnce(manyTxs as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([] as any);

    const result = await service.getCashPosition('tenant-1');
    expect(result.topTransactions.length).toBeLessThanOrEqual(10);
  });

  it('emits a CASH_VARIANCE_RECALCULATED audit log event', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([LEDGER_SOURCE] as any)
      .mockResolvedValueOnce([BANK_SOURCE] as any);

    vi.mocked(db.query.transactions.findMany)
      .mockResolvedValueOnce([{ id: 'tx-1', amountMinor: 100000n }] as any)
      .mockResolvedValueOnce([{ id: 'tx-2', amountMinor: 100000n }] as any)
      .mockResolvedValueOnce([] as any);

    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([] as any);

    const auditCapture: any[] = [];
    (db.insert as any) = vi.fn(() => ({
      values: vi.fn((vals: any) => {
        const entries = Array.isArray(vals) ? vals : [vals];
        auditCapture.push(...entries);
        return Promise.resolve([]);
      }),
    }));

    await service.getCashPosition('tenant-1');

    const auditEntry = auditCapture.find(e => e.action === 'CASH_VARIANCE_RECALCULATED');
    expect(auditEntry).toBeDefined();
    expect(auditEntry.entityType).toBe('Tenant');
    expect(auditEntry.metadata.expectedClosingCashMinor).toBeDefined();
  });

  it('returns zero variance when no data sources exist', async () => {
    vi.mocked(db.query.dataSources.findMany)
      .mockResolvedValueOnce([] as any) // No ledger sources
      .mockResolvedValueOnce([] as any); // No bank sources

    vi.mocked(db.query.transactions.findMany).mockResolvedValue([] as any);
    vi.mocked(db.query.exceptions.findMany).mockResolvedValue([] as any);

    const result = await service.getCashPosition('tenant-1');
    expect(result.expectedClosingCashMinor).toBe('0');
    expect(result.actualBankBalanceMinor).toBe('0');
    expect(result.varianceMinor).toBe('0');
  });
});
