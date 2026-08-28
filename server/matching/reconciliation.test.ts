import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isExactMatch } from './exact-matcher';
import { calculateAmountScore, calculateDateScore, calculateReferenceScore, calculateDescriptionScore, calculateCompositeScore } from './scoring';
import { findCandidates } from './candidate-generator';
import { db } from '../db/index';

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([])
  }
}));

describe('Deterministic Matching Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseSource = {
    id: 'src-1',
    tenantId: 'tenant-1',
    sourceId: 'source-1',
    currency: 'USD',
    amountMinor: 10000n, // $100.00
    transactionDate: new Date('2026-08-01T12:00:00Z'),
    normalizedReference: 'INV-1001',
    normalizedDescription: 'TEST MERCHANT LLC',
    externalId: 'EXT-SRC-1'
  };

  describe('exact-matcher', () => {
    it('should match identical records exactly based on reference', () => {
      const target = { ...baseSource, id: 'tgt-1', externalId: 'EXT-TGT-1' };
      expect(isExactMatch(baseSource, target)).toBe(true);
    });

    it('should match identical records exactly based on externalId if reference is missing', () => {
      const source = { ...baseSource, normalizedReference: null };
      const target = { ...baseSource, id: 'tgt-1', normalizedReference: null, externalId: 'EXT-SRC-1' };
      expect(isExactMatch(source, target)).toBe(true);
    });

    it('should fail exact match if amount differs', () => {
      const target = { ...baseSource, id: 'tgt-1', amountMinor: 10001n }; // 1 cent difference
      expect(isExactMatch(baseSource, target)).toBe(false);
    });

    it('should fail exact match if currency differs', () => {
      const target = { ...baseSource, id: 'tgt-1', currency: 'EUR' };
      expect(isExactMatch(baseSource, target)).toBe(false);
    });
  });

  describe('scoring logic', () => {
    it('should score amount mismatch predictably', () => {
      // 0 diff -> 1.0
      expect(calculateAmountScore(10000n, 10000n)).toBe(1.0);
      
      // <= 100 diff (1 unit minor) -> 0.95
      expect(calculateAmountScore(10000n, 10050n)).toBe(0.95);
      
      // <= 1000 diff (10 units minor) -> 0.80
      expect(calculateAmountScore(10000n, 10500n)).toBe(0.80);
      
      // > 1000 diff -> 0.0
      expect(calculateAmountScore(10000n, 11500n)).toBe(0.0);
    });

    it('should score date tolerance predictably', () => {
      const base = new Date('2026-08-01T12:00:00Z');
      
      // Exact same day -> 1.0
      expect(calculateDateScore(base, new Date('2026-08-01T14:00:00Z'))).toBe(1.0);
      
      // Next day -> 0.90
      expect(calculateDateScore(base, new Date('2026-08-02T12:00:00Z'))).toBe(0.90);
      
      // 2 days -> 0.70
      expect(calculateDateScore(base, new Date('2026-08-03T12:00:00Z'))).toBe(0.70);
      
      // > 2 days -> 0.0
      expect(calculateDateScore(base, new Date('2026-08-04T12:00:00Z'))).toBe(0.0);
    });

    it('should score reference similarities predictably', () => {
      // Exact reference match -> 1.0
      const targetExact = { ...baseSource, normalizedReference: 'INV-1001' };
      expect(calculateReferenceScore(baseSource, targetExact)).toBe(1.0);

      // Reference inside description -> 0.95
      const targetInside = { ...baseSource, normalizedReference: null, normalizedDescription: 'PAYMENT FOR INV-1001' };
      expect(calculateReferenceScore(baseSource, targetInside)).toBe(0.95);

      // Missing reference -> 0.0
      const targetMissing = { ...baseSource, normalizedReference: null, normalizedDescription: 'PAYMENT FOR SOMETHING ELSE' };
      expect(calculateReferenceScore(baseSource, targetMissing)).toBe(0.0);
    });

    it('should compute weighted composite score correctly', () => {
      const target = {
        ...baseSource,
        amountMinor: 10050n, // diff <= 100n -> 0.95 amount score
        transactionDate: new Date('2026-08-02T12:00:00Z'), // diff 1 day -> 0.90 date score
        normalizedReference: null, // missing ref, but description will match somewhat
        normalizedDescription: 'TEST MERCHANT'
      };

      const result = calculateCompositeScore(baseSource, target);
      
      // amount: 0.95
      expect(result.amountScore).toBe(0.95);
      
      // date: 0.90
      expect(result.dateScore).toBe(0.90);
      
      // reference: 0.0
      expect(result.referenceScore).toBe(0.0);
      
      // description: string similarity between "TEST MERCHANT LLC" and "TEST MERCHANT"
      expect(result.descriptionScore).toBeGreaterThan(0.7);
      
      // composite = (0.40 * 0.95) + (0.30 * 0.0) + (0.15 * 0.90) + (0.15 * desc)
      const expectedComposite = (0.40 * 0.95) + (0.30 * 0.0) + (0.15 * 0.90) + (0.15 * result.descriptionScore);
      
      expect(result.compositeScore).toBeCloseTo(expectedComposite, 4);
    });
  });

  describe('candidate-generator', () => {
    it('should query database with bounds for unmatched records', async () => {
      const mockDbResult = [{ id: 'candidate-1' }];
      (db.where as any).mockResolvedValue(mockDbResult);
      
      const candidates = await findCandidates(baseSource, 1000n, 3);
      
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(candidates.length).toBe(1);
    });
  });
});
