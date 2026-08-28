import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { Bot, DollarSign, ArrowRight, TrendingDown, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

export function CashPosition() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch real cash position data
  const { data: cashData, isLoading: isCashLoading } = useQuery({
    queryKey: ["cashPosition"],
    queryFn: () => api.getCashPosition()
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.askAgent("Why is my cash position different from the bank?"),
    onSuccess: (data) => {
      setExplanation(data.response);
    }
  });

  const formatCurrency = (minorUnits: string | number) => {
    const amount = Number(minorUnits) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isCashLoading) {
    return <div className="animate-pulse p-8">Loading cash position...</div>;
  }

  const cp = cashData?.cashPosition;
  const isVariance = Number(cp?.varianceMinor) !== 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      <h1 className="text-3xl font-bold text-charm-heading font-display">
        Cash Position
      </h1>

      {/* TOP SUMMARY */}
      <div className="charm-panel p-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-charm-brand/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 text-center md:text-left bg-white p-6 rounded-2xl border border-charm-border shadow-sm"
          >
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium tracking-wide uppercase">Expected Cash</p>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-charm-heading tracking-tight font-display">
              {cp ? formatCurrency(cp.expectedClosingCashMinor) : "INR 0"}
            </p>
          </motion.div>

          <div className="hidden md:flex items-center justify-center text-charm-muted">
            <ArrowRight className="w-8 h-8" />
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 text-center bg-white p-6 rounded-2xl border border-charm-border shadow-sm"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-charm-muted" />
              <p className="text-sm text-charm-muted font-medium tracking-wide uppercase">Actual Cash</p>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-charm-heading tracking-tight font-display">
              {cp ? formatCurrency(cp.actualBankBalanceMinor) : "INR 0"}
            </p>
          </motion.div>

          <div className="hidden md:flex items-center justify-center text-charm-muted">
            <ArrowRight className="w-8 h-8" />
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`flex-1 text-center md:text-right p-6 rounded-2xl border transition-colors shadow-sm ${isVariance ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
          >
            <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
              <TrendingDown className={`w-5 h-5 ${isVariance ? 'text-red-600' : 'text-green-600'}`} />
              <p className={`text-sm font-medium tracking-wide uppercase ${isVariance ? 'text-red-700' : 'text-green-700'}`}>Variance</p>
            </div>
            <p className={`text-4xl md:text-5xl font-bold tracking-tight font-display ${isVariance ? 'text-red-600' : 'text-green-600'}`}>
              {cp ? formatCurrency(cp.varianceMinor) : "INR 0"}
            </p>
          </motion.div>
        </div>
      </div>

      {isVariance && cp?.breakdown && cp.breakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* VARIANCE BREAKDOWN */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-charm-heading">Variance Breakdown</h2>
            <div className="space-y-4">
              {cp.breakdown.map((item, index) => (
                <div key={index} className="charm-panel p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-charm-heading">{item.cause}</h3>
                    <span className="text-sm font-bold bg-charm-base px-2 py-1 rounded">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 font-display">
                    {formatCurrency(item.amountMinor)}
                  </p>
                  <p className="text-sm text-charm-muted mt-2">
                    {item.transactionCount} transaction{item.transactionCount === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>

            {/* PRIMARY CTA */}
            <div className="pt-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/exceptions')}
                className="w-full charm-btn-primary py-3 text-lg"
              >
                Investigate Variance
              </motion.button>
            </div>
          </div>

          {/* TOP CONTRIBUTING TRANSACTIONS */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-charm-heading">Top Contributing Transactions</h2>
            <div className="charm-panel overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-charm-border bg-charm-base">
                    <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Transaction ID</th>
                    <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Amount</th>
                    <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Source</th>
                    <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Reason</th>
                    <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charm-border bg-charm-surface">
                  {cp.topTransactions && cp.topTransactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-charm-base/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/exceptions')} // In a full app, this would route to exception detail
                    >
                      <td className="p-4 text-sm font-mono text-charm-body truncate max-w-[100px]">{tx.id.split('-')[0]}</td>
                      <td className="p-4 text-sm font-semibold text-red-600">{formatCurrency(tx.amountMinor)}</td>
                      <td className="p-4 text-sm text-charm-heading max-w-[150px] truncate">{tx.source}</td>
                      <td className="p-4 text-sm text-charm-body max-w-[200px] truncate">{tx.reason}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          tx.status === 'UNMATCHED' ? 'bg-red-100 text-red-700 border-red-200' : 
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!cp.topTransactions || cp.topTransactions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-charm-muted">
                        No active transactions contributing to variance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI EXPLANATION - Kept as requested for explaining variance in natural language */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="charm-panel overflow-hidden shadow-sm mt-8"
      >
        <div className="p-6 border-b border-charm-border bg-charm-band flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-charm-heading font-display">AI Variance Explanation</h2>
              <p className="text-sm text-charm-muted mt-1">Let the finance assistant explain the discrepancy.</p>
            </div>
          </div>
          
          {!explanation && !isPending && isVariance && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => mutate()}
              className="hidden md:flex charm-btn-primary"
            >
              Analyze Variance
            </motion.button>
          )}
        </div>

        <div className="p-6">
          {!explanation && !isPending && isVariance && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => mutate()}
              className="md:hidden charm-btn-primary w-full mb-4"
            >
              Analyze Variance
            </motion.button>
          )}

          {!isVariance && !explanation && !isPending && (
            <div className="text-center py-8 text-charm-muted">
              <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
              <p>No variance detected. The books perfectly match the bank!</p>
            </div>
          )}

          {isPending && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-charm-brand border-t-transparent rounded-full animate-spin shadow-sm" />
              <span className="text-charm-brand font-medium animate-pulse">Deep analyzing exceptions and records...</span>
            </div>
          )}

          {explanation && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-charm-surface border border-charm-border p-8 rounded-2xl shadow-inner"
            >
              <div className="ai-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {explanation}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
