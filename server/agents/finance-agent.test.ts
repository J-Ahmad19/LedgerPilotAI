import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceAgent } from './finance-agent';

const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

vi.mock('groq-sdk', () => {
  return {
    default: class Groq {
      chat = {
        completions: {
          create: mockCreate
        }
      };
    }
  };
});

describe('FinanceAgent - AI Assisted Matching Layer', () => {
  let agent: FinanceAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new FinanceAgent();
  });

  const sourceTx = { id: 'src-1', amountMinor: 10000n, description: 'Amazon Web Services' };
  const candidates = [{ id: 'cand-1', candidate: { id: 'cand-1' }, amountMinor: 10000n, description: 'AWS EMEA' }];

  it('should successfully parse a valid MATCH decision', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            decision: "MATCH",
            confidence: 0.95,
            candidateId: "cand-1",
            reason_codes: ["SEMANTIC_MATCH"],
            evidence: ["Both refer to AWS"],
            explanation: "Amazon Web Services and AWS EMEA are semantically identical."
          })
        }
      }]
    });

    const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
    
    expect(result.decision).toBe("MATCH");
    expect(result.confidence).toBe(0.95);
    expect(result.candidateId).toBe("cand-1");
  });

  it('should fallback to REVIEW if AI hallucinates candidateId', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            decision: "MATCH",
            confidence: 0.95,
            candidateId: "cand-fake-id",
            reason_codes: ["SEMANTIC_MATCH"],
            evidence: ["Both refer to AWS"],
            explanation: "Looks good."
          })
        }
      }]
    });

    const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
    
    expect(result.decision).toBe("REVIEW");
    expect(result.reason_codes).toContain("AI_EVALUATION_FAILED");
    expect(result.evidence[0]).toContain("AI hallucinated a candidateId that does not exist");
  });

  it('should fallback to REVIEW on malformed JSON schema', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          // Missing required fields
          content: JSON.stringify({
            decision: "MATCH"
          })
        }
      }]
    });

    const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
    
    expect(result.decision).toBe("REVIEW");
    expect(result.reason_codes).toContain("AI_EVALUATION_FAILED");
  });

  it('should correctly return UNMATCHED decision', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            decision: "UNMATCHED",
            confidence: 0.8,
            reason_codes: ["NO_SEMANTIC_LINK"],
            evidence: ["AWS is not Azure"],
            explanation: "Source is AWS, candidate is Azure."
          })
        }
      }]
    });

    const result = await agent.evaluateAmbiguousMatch(sourceTx, candidates);
    
    expect(result.decision).toBe("UNMATCHED");
    expect(result.confidence).toBe(0.8);
  });
});
