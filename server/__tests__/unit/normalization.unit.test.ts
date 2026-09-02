/**
 * Unit Tests: Normalization + Hashing (Duplicate Fingerprinting)
 */
import { describe, it, expect } from 'vitest';
import { normalizeString, normalizeReference } from '../../utils/normalization';
import { generateTransactionHash } from '../../utils/hashing';
import { toMinorUnits } from '../../utils/money';

// ---------------------------------------------------------------------------
// normalizeString
// ---------------------------------------------------------------------------
describe('normalizeString', () => {
  it('uppercases and trims a string', () => {
    expect(normalizeString('  acme corp  ')).toBe('ACME CORP');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalizeString('ACME   CORP   LTD')).toBe('ACME CORP LTD');
  });

  it('returns null for null input', () => {
    expect(normalizeString(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeString(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    // empty string is falsy
    expect(normalizeString('')).toBeNull();
  });

  it('handles descriptions with special characters (preserves them)', () => {
    expect(normalizeString('visa payment @ 3.5%')).toBe('VISA PAYMENT @ 3.5%');
  });

  it('is idempotent (normalizing twice gives same result)', () => {
    const once = normalizeString('stripe inc.');
    const twice = normalizeString(once!);
    expect(once).toBe(twice);
  });
});

// ---------------------------------------------------------------------------
// normalizeReference
// ---------------------------------------------------------------------------
describe('normalizeReference', () => {
  it('uppercases and strips non-alphanumeric characters', () => {
    expect(normalizeReference('INV-2026-001')).toBe('INV2026001');
  });

  it('strips slashes and dots', () => {
    expect(normalizeReference('PO/2026.500')).toBe('PO2026500');
  });

  it('handles reference with spaces', () => {
    expect(normalizeReference('REF 1001')).toBe('REF1001');
  });

  it('returns null for null input', () => {
    expect(normalizeReference(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeReference(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeReference('')).toBeNull();
  });

  it('is idempotent', () => {
    const once = normalizeReference('INV-2026-001');
    const twice = normalizeReference(once!);
    expect(once).toBe(twice);
  });

  it('handles mixed case correctly', () => {
    expect(normalizeReference('inv2026001')).toBe('INV2026001');
  });
});

// ---------------------------------------------------------------------------
// toMinorUnits (money conversion)
// ---------------------------------------------------------------------------
describe('toMinorUnits', () => {
  it('converts a simple dollar amount', () => {
    expect(toMinorUnits('100.00')).toBe(10000n);
  });

  it('converts with one decimal place', () => {
    expect(toMinorUnits('100.5')).toBe(10050n);
  });

  it('converts whole number (no decimal)', () => {
    expect(toMinorUnits('250')).toBe(25000n);
  });

  it('handles large amounts (wire transfer)', () => {
    expect(toMinorUnits('12500.00')).toBe(1250000n);
  });

  it('handles zero amount', () => {
    expect(toMinorUnits('0.00')).toBe(0n);
  });

  it('correctly converts $1234.56', () => {
    expect(toMinorUnits('1234.56')).toBe(123456n);
  });

  it('correctly converts $0.01 (one cent)', () => {
    expect(toMinorUnits('0.01')).toBe(1n);
  });
});

// ---------------------------------------------------------------------------
// generateTransactionHash (Duplicate Fingerprinting)
// ---------------------------------------------------------------------------
describe('generateTransactionHash (duplicate fingerprinting)', () => {
  const sourceId = 'source-001';
  const externalId = 'EXT-001';
  const amount = 10000n;
  const date = new Date('2026-08-01T10:00:00Z');

  it('generates a deterministic hash for the same inputs', () => {
    const hash1 = generateTransactionHash(sourceId, externalId, amount, date);
    const hash2 = generateTransactionHash(sourceId, externalId, amount, date);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different externalIds', () => {
    const hash1 = generateTransactionHash(sourceId, 'EXT-001', amount, date);
    const hash2 = generateTransactionHash(sourceId, 'EXT-002', amount, date);
    expect(hash1).not.toBe(hash2);
  });

  it('generates different hashes for different amounts', () => {
    const hash1 = generateTransactionHash(sourceId, externalId, 10000n, date);
    const hash2 = generateTransactionHash(sourceId, externalId, 10001n, date);
    expect(hash1).not.toBe(hash2);
  });

  it('generates different hashes for different dates', () => {
    const hash1 = generateTransactionHash(sourceId, externalId, amount, new Date('2026-08-01'));
    const hash2 = generateTransactionHash(sourceId, externalId, amount, new Date('2026-08-02'));
    expect(hash1).not.toBe(hash2);
  });

  it('generates different hashes for different sourceIds (different data sources)', () => {
    const hash1 = generateTransactionHash('source-A', externalId, amount, date);
    const hash2 = generateTransactionHash('source-B', externalId, amount, date);
    expect(hash1).not.toBe(hash2);
  });

  it('returns a sha256 hex string (64 chars)', () => {
    const hash = generateTransactionHash(sourceId, externalId, amount, date);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces same hash regardless of date time (only date part matters)', () => {
    const date1 = new Date('2026-08-01T00:00:00Z');
    const date2 = new Date('2026-08-01T23:59:59Z');
    const hash1 = generateTransactionHash(sourceId, externalId, amount, date1);
    const hash2 = generateTransactionHash(sourceId, externalId, amount, date2);
    // Both should yield same hash since only the date portion is used
    expect(hash1).toBe(hash2);
  });
});
