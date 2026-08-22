import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { Bot, DollarSign, ArrowRight } from "lucide-react";

const TENANT_ID = "00000000-0000-0000-0000-000000000000";

export function CashPosition() {
  const [explanation, setExplanation] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.askAgent(TENANT_ID, "Why is my cash position different from the bank?"),
    onSuccess: (data) => {
      setExplanation(data.response);
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Cash Position Analysis
      </h1>

      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-blue-300 font-medium mb-1">Expected Closing Cash</p>
            <p className="text-4xl font-bold text-white tracking-tight">INR 12,48,200</p>
          </div>
          <div className="hidden md:flex items-center justify-center text-blue-500">
            <ArrowRight className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-center">
            <p className="text-sm text-gray-400 font-medium mb-1">Actual Bank Balance</p>
            <p className="text-4xl font-bold text-gray-300 tracking-tight">INR 12,09,700</p>
          </div>
          <div className="hidden md:flex items-center justify-center text-red-500">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <p className="text-sm text-red-400 font-medium mb-1">Variance</p>
            <p className="text-4xl font-bold text-red-400 tracking-tight">INR 38,500</p>
          </div>
        </div>
      </div>

      <div className="bg-[#15172b] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 bg-[#0f101f] flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Variance Explanation</h2>
            <p className="text-sm text-gray-400">Ask the finance assistant to explain the discrepancy.</p>
          </div>
        </div>
        <div className="p-6">
          {!explanation && !isPending && (
            <button 
              onClick={() => mutate()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full md:w-auto"
            >
              Analyze Variance
            </button>
          )}

          {isPending && (
            <div className="flex items-center space-x-3 text-indigo-400">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing records and exceptions...</span>
            </div>
          )}

          {explanation && (
            <div className="prose prose-invert max-w-none">
              <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-lg text-indigo-100 whitespace-pre-wrap">
                {explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
