/**
 * AI Tests: FinanceAgent – evaluateAmbiguousMatch
 * Tests all AI response paths: MATCH, REVIEW, UNMATCHED, invalid JSON,
 * hallucinated candidate IDs, AI timeout, and AI service failure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceAgent } from '../../agents/finance-agent';

vi.mock('../../utils/metrics', () => ({
  metrics: { event: vi.fn(), log: vi.fn(), error: vi.fn() },
}));

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('groq-sdk', () => ({
  default: class Groq {
    chat = { completions: { create: mockCreate } };
  },
}));

// ─── Realistic test fixtures ──────────────────────────────────────────────────
const sourceTx = {
  id: 'src-recon-01',
  tenantId: 'tenant-fintech-1',
  amountMinor: 250000n, // $2,500.00
  description: 'STRIPE PAYMENT ACME CORPORATION Q3',
  normalizedDescription: 'STRIPE PAYMENT ACME CORPORATION Q3',
  normalizedReference: null,
  transactionDate: new Date('2026-08-15T00:00:00Z'),
};

const candidates = [
  {
    id: 'cand-bank-01',
    candidate: { id: 'cand-bank-01' },
    amountMinor: 250050n,
    description: 'STRIPE ACME CORP',
    normalizedDescription: 'STRIPE ACME CORP',
    normalizedReference: null,
    scoreDetails: { compositeScore: 0.82 },
  },
  {
    id: 'cand-bank-02',
    candidate: { id: 'cand-bank-02' },
    amountMinor: 249000n,
    description: 'STRIPE PAYMENT',
    normalizedDescription: 'STRIPE PAYMENT',
    normalizedReference: null,
    scoreDetails: { compositeScore: 0.74 },
  },
];

const validMatch = (candidateId = 'cand-bank-01') =>
  JSON.stringify({
    decision: 'MATCH',
    confidence: 0.93,
    candidateId,
    reason_codes: ['SEMANTIC_MERCHANT_MATCH', 'AMOUNT_WITHIN_TOLERANCE'],
    evidence: [
      'STRIPE PAYMENT ACME CORPORATION Q3 matches STRIPE ACME CORP',
      'Amount difference is only $0.50',
    ],
    explanation: 'Strong semantic match between source and candidate despite abbreviated merchant name.',
  });

const validReview = () =>
  JSON.stringify({
    decision: 'REVIEW',
    confidence: 0.42,
    candidateId: null,
    reason_codes: ['AMBIGUOUS_PARTIES', 'LOW_DESCRIPTION_SIMILARITY'],
    evidence: ['Two plausible candidates with similar scores', 'No reference ID to disambiguate'],
    explanation: 'Cannot confidently assign match without additional reference data.',
  });

const validUnmatched = () =>
  JSON.stringify({
    decision: 'UNMATCHED',
    confidence: 0.85,
    candidateId: null,
    reason_codes: ['NO_SEMANTIC_LINK', 'DIFFERENT_COUNTERPARTY'],
    evidence: ['Source is Stripe payment; candidates are utility bills'],
    explanation: 'No candidate represents the same financial transaction.',
  });

describe('FinanceAgent – evaluateAmbiguousMatch', () => {
  let agent: FinanceAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new FinanceAgent();
  });

  // ─── Happy paths ──────────────────────────────────────────────────────────
  describe('valid AI responses', () => {
    it('parses a valid MATCH response with real candidate ID', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: validMatch() } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('MATCH');
      expect(result.confidence).toBe(0.93);
      expect(result.candidateId).toBe('cand-bank-01');
      expect(result.reason_codes).toContain('SEMANTIC_MERCHANT_MATCH');
    });

    it('parses a valid REVIEW response (no candidate ID)', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: validReview() } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.confidence).toBe(0.42);
      expect(result.candidateId).toBeUndefined();
    });

    it('parses a valid UNMATCHED response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: validUnmatched() } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('UNMATCHED');
      expect(result.confidence).toBe(0.85);
      expect(result.reason_codes).toContain('NO_SEMANTIC_LINK');
    });

    it('MATCH response includes non-empty evidence and explanation', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: validMatch() } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.explanation.length).toBeGreaterThan(0);
    });
  });

  // ─── Failure paths ────────────────────────────────────────────────────────
  describe('hallucinated candidate ID', () => {
    it('falls back to REVIEW when AI returns a non-existent candidateId', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: validMatch('FAKE-CANDIDATE-99999') } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
      expect(result.evidence[0]).toMatch(/hallucinated/i);
    });

    it('falls back to REVIEW when MATCH decision has no candidateId at all', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              decision: 'MATCH',
              confidence: 0.95,
              // candidateId deliberately omitted
              reason_codes: ['MATCH'],
              evidence: ['Looks right'],
              explanation: 'Good match.',
            }),
          },
        }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
    });
  });

  describe('invalid JSON from AI', () => {
    it('falls back to REVIEW on completely malformed JSON', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'not-json-at-all' } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
    });

    it('falls back to REVIEW on JSON missing required Zod fields', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              decision: 'MATCH',
              // missing: confidence, reason_codes, evidence, explanation
            }),
          },
        }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
    });

    it('falls back to REVIEW on invalid enum value in decision field', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              decision: 'MAYBE', // Invalid enum
              confidence: 0.5,
              reason_codes: [],
              evidence: [],
              explanation: 'Hmm',
            }),
          },
        }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
    });

    it('falls back to REVIEW when confidence is out of 0–1 range', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              decision: 'REVIEW',
              confidence: 150, // Invalid: > 1
              reason_codes: [],
              evidence: [],
              explanation: 'Overconfident.',
            }),
          },
        }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
    });

    it('falls back to REVIEW when AI returns empty response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '' } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
    });
  });

  describe('AI timeout', () => {
    it('falls back to REVIEW when AI request times out (AbortError)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockCreate.mockRejectedValueOnce(abortError);

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
      expect(result.confidence).toBe(0);
    });
  });

  describe('AI service failure', () => {
    it('falls back to REVIEW on network-level 503 Service Unavailable', async () => {
      const networkError = new Error('503 Service Unavailable');
      mockCreate.mockRejectedValueOnce(networkError);

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
      expect(result.evidence[0]).toContain('503');
    });

    it('falls back to REVIEW on rate limit error (429)', async () => {
      const rateLimitError = new Error('429 Too Many Requests');
      mockCreate.mockRejectedValueOnce(rateLimitError);

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.confidence).toBe(0);
    });

    it('falls back to REVIEW when Groq returns null message content', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
      expect(result.decision).toBe('REVIEW');
      expect(result.reason_codes).toContain('AI_EVALUATION_FAILED');
    });
  });

  describe('fallback response contract', () => {
    it('fallback always contains all required AgentDecision fields', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Upstream failure'));
      const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);

      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reason_codes');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('explanation');
    });
  });
});
