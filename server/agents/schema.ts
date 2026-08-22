import { z } from "zod";

export const AgentDecisionSchema = z.object({
  decision: z.enum(["MATCH", "REVIEW", "UNMATCHED"]),
  confidence: z.number().min(0).max(1),
  reasonCodes: z.array(z.string()),
  explanation: z.string(),
  candidateId: z.string().optional(),
});

export type AgentDecision = z.infer<typeof AgentDecisionSchema>;

// GenAI structured output schema format
export const agentDecisionGenAiSchema = {
  type: "OBJECT",
  properties: {
    decision: {
      type: "STRING",
      enum: ["MATCH", "REVIEW", "UNMATCHED"]
    },
    confidence: {
      type: "NUMBER",
    },
    reasonCodes: {
      type: "ARRAY",
      items: {
        type: "STRING"
      }
    },
    explanation: {
      type: "STRING"
    },
    candidateId: {
      type: "STRING",
      nullable: true
    }
  },
  required: ["decision", "confidence", "reasonCodes", "explanation"]
};
