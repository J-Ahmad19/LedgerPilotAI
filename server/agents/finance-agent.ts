import { GoogleGenAI } from "@google/genai";
import { AgentDecisionSchema, AgentDecision, agentDecisionGenAiSchema } from "./schema.js";
import { financeTools, toolImplementations } from "./tools.js";

// Ensure the API key is available
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });

export class FinanceAgent {
  /**
   * Evaluates an ambiguous match (REVIEW state) and decides whether to MATCH or UNMATCH.
   */
  async evaluateAmbiguousMatch(sourceTx: any, candidates: any[]): Promise<AgentDecision> {
    const prompt = `
    You are an expert AI Finance Controller.
    Your task is to evaluate a transaction that has ambiguous candidate matches in the ledger.
    
    Source Transaction:
    ${JSON.stringify(sourceTx, null, 2)}
    
    Potential Candidates:
    ${JSON.stringify(candidates, null, 2)}
    
    Determine if there is a true match among these candidates.
    A true match should have very strong semantic correlation despite differences in spelling or exact timestamp.
    You must output your decision strictly conforming to the requested JSON schema.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: agentDecisionGenAiSchema as any,
          temperature: 0.1, // Keep it deterministic
        }
      });

      const responseText = response.text();
      if (!responseText) throw new Error("Empty response from AI");

      const parsed = JSON.parse(responseText);
      // Validate with Zod
      return AgentDecisionSchema.parse(parsed);

    } catch (error) {
      console.error("AI Evaluation failed:", error);
      // Fallback
      return {
        decision: "REVIEW",
        confidence: 0,
        reasonCodes: ["AI_EVALUATION_FAILED"],
        explanation: "The AI agent failed to evaluate this transaction."
      };
    }
  }

  /**
   * Explains an exception using natural language.
   */
  async explainException(exceptionData: any): Promise<string> {
    const prompt = `
    You are an expert AI Finance Controller.
    Explain the following reconciliation exception in a clear, concise, and professional manner.
    Identify the root cause based on the data provided.
    
    Exception Data:
    ${JSON.stringify(exceptionData, null, 2)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text() || "Explanation could not be generated.";
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
      Always try to use the provided tools to gather data before answering. The tenantId is ${tenantId}.`;
      
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: financeTools as any[] }],
        }
      });

      let response = await chat.sendMessage({ message: query });

      // Handle tool calls
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const call of response.functionCalls) {
          const functionName = call.name;
          const args = call.args as Record<string, any>;
          
          if (toolImplementations[functionName]) {
            try {
              const apiResponse = await toolImplementations[functionName](args);
              functionResponses.push({
                name: functionName,
                response: apiResponse
              });
            } catch (err: any) {
              functionResponses.push({
                name: functionName,
                response: { error: err.message }
              });
            }
          }
        }

        // Send the tool results back to the model
        response = await chat.sendMessage(functionResponses);
      }

      return response.text() || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Assistant Query failed:", error);
      return "An error occurred while processing your request.";
    }
  }
}

export const financeAgent = new FinanceAgent();
