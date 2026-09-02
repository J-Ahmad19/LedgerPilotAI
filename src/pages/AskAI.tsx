import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTED_QUESTIONS = [
  "Why is my cash off?",
  "Why did the match rate fall?",
  "What are today's largest exceptions?",
  "Which transactions caused the cash variance?",
  "Why are there unresolved transactions?",
  "Which sources have the most mismatches?",
];

export function AskAI() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: (q: string) => api.askAgent(q),
    onSuccess: (data, variables) => {
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: data.response }
      ]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I encountered an error trying to process your request." }
      ]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query.trim();
    setQuery("");
    setMessages(prev => [...prev, { role: "user", content: currentQuery }]);
    mutate(currentQuery);
  };

  const handleSuggestedClick = (q: string) => {
    setQuery(q);
    setMessages(prev => [...prev, { role: "user", content: q }]);
    mutate(q);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-6rem)]" // Fill remaining height
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-charm-heading font-display flex items-center gap-3">
          Ask LedgerPilotAI
          <Sparkles className="w-6 h-6 text-charm-brand" />
        </h1>
        <p className="text-charm-muted mt-2">Investigate financial state, cash variances, and exceptions.</p>
      </div>

      <div className="flex-1 overflow-y-auto charm-panel rounded-t-2xl p-6 mb-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-charm-heading mb-2">How can I help you today?</h2>
              <p className="text-charm-muted">I can explain reconciliation results, find transactions, and analyze cash variance.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedClick(q)}
                  className="p-4 text-left border border-charm-border rounded-xl hover:border-charm-brand hover:bg-charm-brand/5 transition-all text-sm font-medium text-charm-body"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl p-6 ${
                    msg.role === 'user' 
                      ? 'bg-charm-brand text-white' 
                      : 'bg-white border border-charm-border shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm md:text-base">{msg.content}</p>
                  ) : (
                    <div className="ai-markdown-content prose prose-sm md:prose-base prose-blue max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl p-6 bg-white border border-charm-border shadow-sm flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-charm-brand border-t-transparent rounded-full animate-spin" />
                  <span className="text-charm-muted text-sm">Analyzing financial data...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-charm-surface pb-4">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your financial data..."
            className="w-full pl-6 pr-14 py-4 rounded-full border border-charm-border focus:border-charm-brand focus:ring-2 focus:ring-charm-brand/20 outline-none text-charm-heading shadow-sm transition-all"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!query.trim() || isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-charm-brand text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
