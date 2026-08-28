import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, XCircle, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TabType = 'ALL' | 'MATCHED' | 'REVIEW' | 'UNMATCHED';

export function RunTabs({ runId }: { runId: string }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['runTransactions', runId, activeTab, page],
    queryFn: () => api.getRunTransactions(runId, activeTab, page, 50)
  });

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'Overview (All)', icon: <FileText className="w-4 h-4 mr-2" /> },
    { id: 'MATCHED', label: 'Matched', icon: <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> },
    { id: 'REVIEW', label: 'Needs Review', icon: <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" /> },
    { id: 'UNMATCHED', label: 'Unmatched', icon: <XCircle className="w-4 h-4 mr-2 text-red-500" /> },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setPage(1);
  };

  return (
    <div className="bg-charm-panel rounded-xl shadow-sm border border-charm-border overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-charm-border bg-charm-surface/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-1 min-w-[150px] items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-charm-brand text-charm-brand bg-white'
                : 'text-charm-muted hover:text-charm-heading hover:bg-charm-surface'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-charm-muted">
            Loading transactions...
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-charm-band border-b border-charm-border text-charm-muted font-medium">
                  <tr>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Reference</th>
                    <th className="p-4 font-medium">Description</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charm-border">
                  {data?.data?.map((item: any, idx: number) => {
                    let statusLabel = "";
                    let statusClass = "";
                    let tx = null;
                    
                    if (item.type === 'MATCH') {
                      statusLabel = "Matched";
                      statusClass = "bg-green-100 text-green-700 border-green-200";
                      tx = item.source || item.target;
                    } else if (item.type === 'EXCEPTION') {
                      if (item.exceptionDetails?.type === 'AMBIGUOUS_MATCH') {
                        statusLabel = "Review";
                        statusClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
                      } else {
                        statusLabel = "Unmatched";
                        statusClass = "bg-red-100 text-red-700 border-red-200";
                      }
                      tx = item.transaction;
                    }

                    if (!tx) return null;

                    return (
                      <tr key={idx} className="hover:bg-charm-surface/50 transition-colors">
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-4 text-charm-body">
                          {format(new Date(tx.transactionDate), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 font-mono text-xs text-charm-muted">
                          {tx.referenceId || '-'}
                        </td>
                        <td className="p-4 text-charm-body max-w-xs truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="p-4 text-right font-medium text-charm-heading">
                          ${(Number(tx.amountMinor) / 100).toFixed(2)}
                        </td>
                        <td className="p-4">
                          {item.type === 'EXCEPTION' && item.exceptionDetails?.type === 'AMBIGUOUS_MATCH' && (
                            <button
                              onClick={() => navigate(`/exceptions/${item.exceptionDetails.id}`)}
                              className="text-charm-brand hover:underline flex items-center text-sm font-medium"
                            >
                              Review <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                          )}
                          {item.type === 'MATCH' && (
                            <button
                              className="text-charm-muted hover:text-charm-heading text-sm"
                              title="Match details (not implemented)"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!data?.data || data.data.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-charm-muted">
                        No records found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-charm-border bg-charm-surface/30">
                <div className="text-sm text-charm-muted">
                  Showing page {data.page} of {data.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm rounded border border-charm-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-charm-section"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="px-3 py-1 text-sm rounded border border-charm-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-charm-section"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
