import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { formatCurrency } from "../lib/utils";
import { ExceptionInvestigation } from "../components/ExceptionInvestigation";

export function Exceptions() {
  const [activeFilter, setActiveFilter] = useState("All"); // All, Critical, High, Medium
  const [selectedException, setSelectedException] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["exceptions", { status: 'OPEN' }],
    queryFn: () => api.getExceptions({ status: 'OPEN' })
  });

  const allExceptions = data?.exceptions || [];
  
  const exceptions = useMemo(() => {
    if (activeFilter === "All") return allExceptions;
    return allExceptions.filter((e: any) => e.exception.severity?.toUpperCase() === activeFilter.toUpperCase());
  }, [allExceptions, activeFilter]);

  if (isLoading) return <div className="p-6">Loading exceptions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-charm-heading font-display">Exceptions</h1>
          <p className="text-charm-muted mt-1">{allExceptions.length} Open Exceptions</p>
        </div>
        
        {/* Basic severity filters */}
        <div className="flex space-x-2">
          {["All", "Critical", "High", "Medium"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter 
                  ? "bg-charm-brand text-white shadow-sm" 
                  : "bg-charm-surface border border-charm-border text-charm-muted hover:text-charm-body"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="charm-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-charm-border bg-charm-base">
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Exception ID</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Transaction</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Amount</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Reason</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Confidence</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">AI Recommendation</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Age</th>
              <th className="p-4 text-xs font-semibold text-charm-muted uppercase tracking-wider">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charm-border bg-charm-surface">
            {exceptions.map(({ exception, transaction }: any) => {
              // Calculate age in days
              const ageMs = Date.now() - new Date(exception.createdAt).getTime();
              const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
              
              return (
                <tr 
                  key={exception.id} 
                  className="hover:bg-charm-base/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedException(exception.id)}
                >
                  <td className="p-4 text-sm font-mono text-charm-body truncate max-w-[100px]">{exception.id.split('-')[0]}</td>
                  <td className="p-4 text-sm text-charm-heading max-w-[200px] truncate">{transaction?.description || transaction?.merchantName || transaction?.externalId}</td>
                  <td className="p-4 text-sm font-semibold">{transaction?.amountMinor ? formatCurrency(transaction.amountMinor) : "-"}</td>
                  <td className="p-4 text-sm text-charm-body max-w-[200px] truncate">{exception.reason}</td>
                  <td className="p-4 text-sm font-mono">{(Number(exception.confidence) * 100).toFixed(1)}%</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                      {exception.aiDecision || 'REVIEW'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-charm-muted">{ageDays}d</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      exception.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' : 
                      exception.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {exception.severity || 'MEDIUM'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {exceptions.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-charm-muted">
                  No exceptions found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ExceptionInvestigation 
        exceptionId={selectedException} 
        onClose={() => setSelectedException(null)} 
      />
    </div>
  );
}
