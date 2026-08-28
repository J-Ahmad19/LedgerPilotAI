import { z } from "zod";

export const AgentDecisionSchema = z.object({
  decision: z.enum(["MATCH", "REVIEW", "UNMATCHED"]),
  confidence: z.number().min(0).max(1),
  reason_codes: z.array(z.string()),
  evidence: z.array(z.string()),
  explanation: z.string(),
  candidateId: z.string().optional(),
});

export type AgentDecision = z.infer<typeof AgentDecisionSchema>;

// Standard structured output JSON schema format
export const agentDecisionGenAiSchema = {
  type: "object",
  properties: {
    decision: {
      type: "string",
      enum: ["MATCH", "REVIEW", "UNMATCHED"]
    },
    confidence: {
      type: "number",
    },
    reason_codes: {
      type: "array",
      items: {
        type: "string"
      }
    },
    evidence: {
      type: "array",
      items: {
        type: "string"
      }
    },
    explanation: {
      type: "string"
    },
    candidateId: {
      type: "string",
      nullable: true
    }
  },
  required: ["decision", "confidence", "reason_codes", "evidence", "explanation"]
};
