import Groq from "groq-sdk";
import { AgentDecisionSchema, AgentDecision, agentDecisionGenAiSchema } from "./schema.js";
import { financeTools, toolImplementations } from "./tools.js";

// Ensure the API key is available
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key" });

export class FinanceAgent {
  /**
   * Evaluates an ambiguous match (REVIEW state) and decides whether to MATCH or UNMATCH.
   */
  async evaluateAmbiguousMatch(sourceTx: any, candidates: any[]): Promise<AgentDecision> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const prompt = `
    You are an expert AI Finance Controller.
    Your task is to evaluate a transaction that has ambiguous candidate matches in the ledger.
    The deterministic score for these candidates falls in the fuzzy range (0.70 - 0.89).
    
    Source Transaction:
    ${JSON.stringify(sourceTx, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
    
    Potential Candidates (including their deterministic scores):
    ${JSON.stringify(candidates, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
    
    Determine if there is a true match among these candidates.
    A true match should have very strong semantic correlation despite differences in spelling or exact timestamp.
    If you decide to MATCH, you MUST provide the 'candidateId' exactly as it appears in the Potential Candidates list.
    You must output your decision strictly conforming to the requested JSON schema.
    `;

      // Append JSON schema to prompt for better adherence in Groq
      const jsonPrompt = prompt + "\nOutput JSON Schema: " + JSON.stringify(agentDecisionGenAiSchema);

      const response = await groq.chat.completions.create({
        model: process.env.LLM_MODEL_NAME || "llama-3.1-8b-instant",
        messages: [{ role: "user", content: jsonPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.1, // Keep it deterministic
      }, { signal: controller.signal });

      clearTimeout(timeout);

      const responseText = response.choices[0]?.message?.content;
      if (!responseText) throw new Error("Empty response from AI");

      const parsed = JSON.parse(responseText);
      // Validate with Zod
      const decision = AgentDecisionSchema.parse(parsed);

      // Validate candidateId exists if MATCH
      if (decision.decision === "MATCH") {
        if (!decision.candidateId) {
          throw new Error("AI returned MATCH without a candidateId");
        }
        const candidateExists = candidates.some(c => c.id === decision.candidateId || c.candidate?.id === decision.candidateId);
        if (!candidateExists) {
          throw new Error(`AI hallucinated a candidateId that does not exist: ${decision.candidateId}`);
        }
      }

      return decision;

    } catch (error: any) {
      clearTimeout(timeout);
      console.error("AI Evaluation failed:", error);
      // Fallback
      return {
        decision: "REVIEW",
        confidence: 0,
        reason_codes: ["AI_EVALUATION_FAILED"],
        evidence: [error.message || "Unknown error"],
        explanation: "The AI agent failed to evaluate this transaction."
      };
    }
  }

  /**
   * Explains an exception using natural language.
   */
  async explainException(exceptionData: any): Promise<string> {
    try {
      const prompt = `
    You are an expert AI Finance Controller.
    Explain the following reconciliation exception in a clear, concise, and professional manner.
    Identify the root cause based on the data provided.
    
    Exception Data:
    ${JSON.stringify(exceptionData, null, 2)}
    `;

      const response = await groq.chat.completions.create({
        model: process.env.LLM_MODEL_NAME || "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      });

      return response.choices[0]?.message?.content || "Explanation could not be generated.";
    } catch (error) {
      console.error("AI Explanation failed:", error);
      return "An error occurred while generating the explanation.";
    }
  }

  /**
   * Natural Language Assistant for querying financial data using tools.
   */
  async queryAssistant(query: string, tenantId: string): Promise<string> {
    try {
      const systemInstruction = `You are a helpful AI Finance Assistant. 
      You help finance operators understand their reconciliation runs, cash position, and exceptions.
      Always try to use the provided tools to gather data before answering. The tenantId is ${tenantId}.

      CRITICAL RULES:
      - Do NOT invent transaction IDs, balances, dates, amounts, or reasons.
      - If the system cannot establish an answer with the provided tools, explicitly state that the available financial data is insufficient.
      - The LLM may only reason over data returned from validated backend tools.

      RESPONSE STRUCTURE (Format strictly in Markdown):
      **Answer:** [Direct answer to the user's question]
      
      **Evidence:** [Bullet points of data supporting the answer]
      
      **Confidence:** [High/Medium/Low, based on data availability]
      
      **Affected records:** [List of transaction IDs or run IDs]
      
      **Links:** [Provide conceptual links like '[View transactions](/transactions)' or '[View exceptions](/exceptions)']`;
      
      const messages: any[] = [
        { role: "system", content: systemInstruction },
        { role: "user", content: query }
      ];

      const tools = financeTools.map(t => ({
        type: "function",
        function: t
      }));

      let response = await groq.chat.completions.create({
        model: process.env.LLM_MODEL_NAME || "llama-3.1-8b-instant",
        messages,
        tools: tools as any,
        tool_choice: "auto"
      });

      let responseMessage = response.choices[0].message;

      // Handle tool calls
      while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage);
        
        for (const call of responseMessage.tool_calls) {
          const functionName = call.function.name;
          const args = JSON.parse(call.function.arguments);
          
          if (toolImplementations[functionName]) {
            try {
              const apiResponse = await toolImplementations[functionName](args);
              messages.push({
                role: "tool",
                name: functionName,
                tool_call_id: call.id,
                content: JSON.stringify(apiResponse)
              });
            } catch (err: any) {
              messages.push({
                role: "tool",
                name: functionName,
                tool_call_id: call.id,
                content: JSON.stringify({ error: err.message })
              });
            }
          }
        }

        response = await groq.chat.completions.create({
          model: process.env.LLM_MODEL_NAME || "llama-3.1-8b-instant",
          messages,
          tools: tools as any,
          tool_choice: "auto"
        });
        responseMessage = response.choices[0].message;
      }

      return responseMessage.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Assistant Query failed:", error);
      return "An error occurred while processing your request.";
    }
  }
}

export const financeAgent = new FinanceAgent();
