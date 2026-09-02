/**
 * Unit Tests: Scoring Engine
 * Covers amount, date, reference, description, and composite weighted score.
 * Includes realistic imperfect financial data edge cases.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateAmountScore,
  calculateDateScore,
  calculateReferenceScore,
  calculateDescriptionScore,
  calculateCompositeScore,
} from '../../matching/scoring';

// ---------------------------------------------------------------------------
// Amount Scoring
// ---------------------------------------------------------------------------
describe('calculateAmountScore', () => {
  it('returns 1.0 for identical amounts', () => {
    expect(calculateAmountScore(250000n, 250000n)).toBe(1.0);
  });

  it('returns 1.0 when both amounts are zero', () => {
    expect(calculateAmountScore(0n, 0n)).toBe(1.0);
  });

  it('returns 0.95 for 1-cent difference (≤100 minor boundary)', () => {
    expect(calculateAmountScore(10000n, 10001n)).toBe(0.95);
  });

  it('returns 0.95 for exactly 100 minor difference (boundary inclusive)', () => {
    expect(calculateAmountScore(10000n, 10100n)).toBe(0.95);
  });

  it('returns 0.80 for 101-1000 minor difference (bank fee / FX rounding range)', () => {
    expect(calculateAmountScore(50000n, 50500n)).toBe(0.80);
  });

  it('returns 0.80 for exactly 1000 minor difference (boundary inclusive)', () => {
    expect(calculateAmountScore(50000n, 51000n)).toBe(0.80);
  });

  it('returns 0.0 for 1001+ minor difference (beyond tolerance)', () => {
    expect(calculateAmountScore(50000n, 51001n)).toBe(0.0);
  });

  it('is symmetric (source > target equals target > source)', () => {
    expect(calculateAmountScore(10500n, 10000n)).toBe(calculateAmountScore(10000n, 10500n));
  });

  it('returns 0.0 for large international wire with $15 difference', () => {
    expect(calculateAmountScore(1000000n, 998500n)).toBe(0.0);
  });

  it('returns 1.0 for large matching amounts ($1.25M wire)', () => {
    expect(calculateAmountScore(125000000n, 125000000n)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Date Scoring
// ---------------------------------------------------------------------------
describe('calculateDateScore', () => {
  const base = new Date('2026-08-15T10:00:00Z');

  it('returns 1.0 for identical timestamps', () => {
    expect(calculateDateScore(base, base)).toBe(1.0);
  });

  it('returns 1.0 when dates differ by hours within same calendar day', () => {
    const later = new Date('2026-08-15T23:59:00Z');
    expect(calculateDateScore(base, later)).toBe(1.0);
  });

  it('returns 0.90 for 1-day difference (T+1 bank posting)', () => {
    const nextDay = new Date('2026-08-16T10:00:00Z');
    expect(calculateDateScore(base, nextDay)).toBe(0.90);
  });

  it('returns 0.70 for 2-day difference (T+2 settlement)', () => {
    const twoDays = new Date('2026-08-17T10:00:00Z');
    expect(calculateDateScore(base, twoDays)).toBe(0.70);
  });

  it('returns 0.0 for 3-day difference', () => {
    const threeDays = new Date('2026-08-18T10:00:00Z');
    expect(calculateDateScore(base, threeDays)).toBe(0.0);
  });

  it('returns 0.0 for dates 30 days apart (clearly different period)', () => {
    const monthLater = new Date('2026-09-15T10:00:00Z');
    expect(calculateDateScore(base, monthLater)).toBe(0.0);
  });

  it('is symmetric', () => {
    const twoDays = new Date('2026-08-17T10:00:00Z');
    expect(calculateDateScore(base, twoDays)).toBe(calculateDateScore(twoDays, base));
  });

  it('handles cross-month boundary (Aug 31 vs Sep 1)', () => {
    const aug31 = new Date('2026-08-31T10:00:00Z');
    const sep1 = new Date('2026-09-01T10:00:00Z');
    expect(calculateDateScore(aug31, sep1)).toBe(0.90);
  });

  it('handles year-end boundary (Dec 31 vs Jan 1)', () => {
    const dec31 = new Date('2026-12-31T10:00:00Z');
    const jan1 = new Date('2027-01-01T10:00:00Z');
    expect(calculateDateScore(dec31, jan1)).toBe(0.90);
  });
});

// ---------------------------------------------------------------------------
// Reference Scoring
// ---------------------------------------------------------------------------
describe('calculateReferenceScore', () => {
  const baseSource = {
    normalizedReference: 'INV2026001',
    normalizedDescription: 'PAYMENT FOR INVOICE INV2026001',
  };

  it('returns 1.0 for exact normalizedReference match', () => {
    const target = { normalizedReference: 'INV2026001', normalizedDescription: '' };
    expect(calculateReferenceScore(baseSource, target)).toBe(1.0);
  });

  it('returns 0.95 when source reference appears in target description', () => {
    const target = { normalizedReference: null, normalizedDescription: 'BANK TRANSFER FOR INV2026001' };
    expect(calculateReferenceScore(baseSource, target)).toBe(0.95);
  });

  it('returns 0.95 when target reference appears in source description', () => {
    const source = { normalizedReference: null, normalizedDescription: 'SETTLEMENT PO9987' };
    const target = { normalizedReference: 'PO9987', normalizedDescription: '' };
    expect(calculateReferenceScore(source, target)).toBe(0.95);
  });

  it('returns 0.60 for highly similar references (typo/suffix variant)', () => {
    const target = { normalizedReference: 'INV2026001A', normalizedDescription: '' };
    const score = calculateReferenceScore(baseSource, target);
    expect(score).toBe(0.60);
  });

  it('returns 0.0 when both references are null', () => {
    const source = { normalizedReference: null, normalizedDescription: 'SOME PAYMENT' };
    const target = { normalizedReference: null, normalizedDescription: 'SOME PAYMENT' };
    expect(calculateReferenceScore(source, target)).toBe(0.0);
  });

  it('returns 0.0 for completely unrelated references', () => {
    const target = { normalizedReference: 'PO99999', normalizedDescription: 'UNRELATED' };
    const score = calculateReferenceScore(baseSource, target);
    expect(score).toBe(0.0);
  });

  it('returns 0.0 when source has no ref and target ref not in source description', () => {
    const source = { normalizedReference: null, normalizedDescription: 'MISC EXPENSE' };
    const target = { normalizedReference: 'INV9999', normalizedDescription: '' };
    expect(calculateReferenceScore(source, target)).toBe(0.0);
  });

  it('handles empty string references gracefully (falsy)', () => {
    const source = { normalizedReference: '', normalizedDescription: 'PAYMENT' };
    const target = { normalizedReference: '', normalizedDescription: 'PAYMENT' };
    expect(calculateReferenceScore(source, target)).toBe(0.0);
  });
});

// ---------------------------------------------------------------------------
// Description Scoring
// ---------------------------------------------------------------------------
describe('calculateDescriptionScore', () => {
  it('returns 1.0 for identical descriptions', () => {
    const tx = { normalizedDescription: 'AMAZON WEB SERVICES', merchantName: null };
    expect(calculateDescriptionScore(tx, tx)).toBe(1.0);
  });

  it('returns > 0.85 for same merchant with minor variation (punctuation)', () => {
    const source = { normalizedDescription: 'STRIPE INC', merchantName: null };
    const target = { normalizedDescription: 'STRIPE INC.', merchantName: null };
    expect(calculateDescriptionScore(source, target)).toBeGreaterThan(0.85);
  });

  it('returns 0.0 when both descriptions are null', () => {
    const tx = { normalizedDescription: null, merchantName: null };
    expect(calculateDescriptionScore(tx, tx)).toBe(0.0);
  });

  it('falls back to merchantName when normalizedDescription is absent', () => {
    const source = { normalizedDescription: null, merchantName: 'STRIPE INC' };
    const target = { normalizedDescription: null, merchantName: 'STRIPE INC' };
    expect(calculateDescriptionScore(source, target)).toBe(1.0);
  });

  it('returns 0.0 when one side has no description or merchantName', () => {
    const source = { normalizedDescription: 'PAYPAL', merchantName: null };
    const target = { normalizedDescription: null, merchantName: null };
    expect(calculateDescriptionScore(source, target)).toBe(0.0);
  });

  it('returns low score for completely unrelated descriptions', () => {
    const source = { normalizedDescription: 'VISA PAYMENT Q3', merchantName: null };
    const target = { normalizedDescription: 'OFFICE SUPPLIES PURCHASE', merchantName: null };
    expect(calculateDescriptionScore(source, target)).toBeLessThan(0.4);
  });
});

// ---------------------------------------------------------------------------
// Composite / Weighted Score
// ---------------------------------------------------------------------------
describe('calculateCompositeScore', () => {
  const perfectSource = {
    amountMinor: 100000n,
    transactionDate: new Date('2026-08-01T10:00:00Z'),
    normalizedReference: 'INV2026100',
    normalizedDescription: 'ACME CORP PAYMENT',
    merchantName: null,
  };

  it('returns composite 1.0 for a perfect match', () => {
    const result = calculateCompositeScore(perfectSource, { ...perfectSource });
    expect(result.compositeScore).toBeCloseTo(1.0, 4);
    expect(result.amountScore).toBe(1.0);
    expect(result.dateScore).toBe(1.0);
    expect(result.referenceScore).toBe(1.0);
    expect(result.descriptionScore).toBe(1.0);
  });

  it('correctly applies weights: 40% amount, 30% reference, 15% date, 15% description', () => {
    const target = {
      ...perfectSource,
      transactionDate: new Date('2026-08-02T10:00:00Z'), // 1 day → 0.90
      normalizedDescription: null,
      merchantName: null,
    };
    const result = calculateCompositeScore(perfectSource, target);
    const expected = 0.40 * 1.0 + 0.30 * 1.0 + 0.15 * 0.90 + 0.15 * 0.0;
    expect(result.compositeScore).toBeCloseTo(expected, 4);
  });

  it('scores a realistic fuzzy match (bank fee rounding + T+1 + no ref) correctly', () => {
    const target = {
      amountMinor: 100050n,           // $0.50 rounding → amountScore 0.95
      transactionDate: new Date('2026-08-02T10:00:00Z'), // 1 day → 0.90
      normalizedReference: null,       // bank has no ref → 0.0
      normalizedDescription: 'ACME CORP',
      merchantName: null,
    };
    const result = calculateCompositeScore(perfectSource, target);
    expect(result.amountScore).toBe(0.95);
    expect(result.dateScore).toBe(0.90);
    expect(result.referenceScore).toBe(0.0);
    expect(result.descriptionScore).toBeGreaterThan(0.6);
    const expectedMin = 0.40 * 0.95 + 0.30 * 0.0 + 0.15 * 0.90 + 0.15 * 0.6;
    expect(result.compositeScore).toBeGreaterThan(expectedMin);
  });

  it('returns score < 0.70 for a clearly unrelated transaction', () => {
    const unrelated = {
      amountMinor: 999999n,
      transactionDate: new Date('2025-01-01T00:00:00Z'),
      normalizedReference: 'UNRELATED-REF',
      normalizedDescription: 'COMPLETELY DIFFERENT VENDOR',
      merchantName: null,
    };
    const result = calculateCompositeScore(perfectSource, unrelated);
    expect(result.compositeScore).toBeLessThan(0.70);
  });
});
