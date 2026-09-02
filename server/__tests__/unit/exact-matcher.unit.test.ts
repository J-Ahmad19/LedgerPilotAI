/**
 * Unit Tests: Exact Matcher + Candidate Ranking
 */
import { describe, it, expect, vi } from 'vitest';
import { isExactMatch } from '../../matching/exact-matcher';
import { calculateCompositeScore } from '../../matching/scoring';

// ---------------------------------------------------------------------------
// Exact Matcher
// ---------------------------------------------------------------------------
describe('isExactMatch', () => {
  const base = {
    id: 'src-1',
    tenantId: 'tenant-1',
    sourceId: 'source-A',
    currency: 'USD',
    amountMinor: 10000n,
    normalizedReference: 'INV1001',
    externalId: 'EXT-SRC-1',
  };

  it('matches identical records on normalizedReference', () => {
    const target = { ...base, id: 'tgt-1', sourceId: 'source-B', externalId: 'EXT-TGT-1' };
    expect(isExactMatch(base, target)).toBe(true);
  });

  it('matches when references are absent but externalIds match', () => {
    const source = { ...base, normalizedReference: null };
    const target = { ...base, id: 'tgt-1', normalizedReference: null };
    expect(isExactMatch(source, target)).toBe(true);
  });

  it('rejects match if amountMinor differs (even by 1 cent)', () => {
    const target = { ...base, id: 'tgt-1', amountMinor: 10001n };
    expect(isExactMatch(base, target)).toBe(false);
  });

  it('rejects match if currency differs', () => {
    const target = { ...base, id: 'tgt-1', currency: 'EUR' };
    expect(isExactMatch(base, target)).toBe(false);
  });

  it('rejects match if neither reference nor externalId aligns', () => {
    const target = {
      ...base,
      id: 'tgt-1',
      normalizedReference: 'OTHER-REF',
      externalId: 'EXT-OTHER',
    };
    expect(isExactMatch(base, target)).toBe(false);
  });

  it('rejects match if one reference is null and externalId differs', () => {
    const source = { ...base, normalizedReference: null };
    const target = { ...base, id: 'tgt-1', normalizedReference: null, externalId: 'TOTALLY-DIFFERENT' };
    expect(isExactMatch(source, target)).toBe(false);
  });

  it('does not match on reference alone if amounts differ', () => {
    const target = { ...base, id: 'tgt-1', amountMinor: 20000n };
    expect(isExactMatch(base, target)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Candidate Ranking
// ---------------------------------------------------------------------------
describe('Candidate Ranking via composite scores', () => {
  const source = {
    amountMinor: 100000n,
    transactionDate: new Date('2026-08-10T10:00:00Z'),
    normalizedReference: 'PO2026500',
    normalizedDescription: 'VENDOR PAYMENT ACME',
    merchantName: null,
  };

  it('ranks a perfect candidate above a fuzzy candidate', () => {
    const perfect = {
      amountMinor: 100000n,
      transactionDate: new Date('2026-08-10T10:00:00Z'),
      normalizedReference: 'PO2026500',
      normalizedDescription: 'VENDOR PAYMENT ACME',
      merchantName: null,
    };
    const fuzzy = {
      amountMinor: 100500n,
      transactionDate: new Date('2026-08-11T10:00:00Z'),
      normalizedReference: null,
      normalizedDescription: 'ACME PMT',
      merchantName: null,
    };

    const perfectScore = calculateCompositeScore(source, perfect).compositeScore;
    const fuzzyScore = calculateCompositeScore(source, fuzzy).compositeScore;
    expect(perfectScore).toBeGreaterThan(fuzzyScore);
  });

  it('ranks the closest amount candidate higher among equal descriptions', () => {
    const closer = {
      amountMinor: 100050n, // $0.50 diff
      transactionDate: new Date('2026-08-10T10:00:00Z'),
      normalizedReference: null,
      normalizedDescription: 'VENDOR PAYMENT ACME',
      merchantName: null,
    };
    const farther = {
      amountMinor: 100900n, // $9 diff
      transactionDate: new Date('2026-08-10T10:00:00Z'),
      normalizedReference: null,
      normalizedDescription: 'VENDOR PAYMENT ACME',
      merchantName: null,
    };

    const closerScore = calculateCompositeScore(source, closer).compositeScore;
    const fartherScore = calculateCompositeScore(source, farther).compositeScore;
    expect(closerScore).toBeGreaterThan(fartherScore);
  });

  it('an unrelated candidate scores below 0.70', () => {
    const unrelated = {
      amountMinor: 500000n,
      transactionDate: new Date('2025-01-01T00:00:00Z'),
      normalizedReference: 'UNRELATED',
      normalizedDescription: 'TOTALLY DIFFERENT',
      merchantName: null,
    };
    const score = calculateCompositeScore(source, unrelated).compositeScore;
    expect(score).toBeLessThan(0.70);
  });
});
