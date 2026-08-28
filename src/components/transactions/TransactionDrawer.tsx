import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { X, Clock, BrainCircuit, Activity, Link as LinkIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionDrawerProps {
  transactionId: string | null;
  onClose: () => void;
}

export function TransactionDrawer({ transactionId, onClose }: TransactionDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactionDetails', transactionId],
    queryFn: () => transactionId ? api.getTransactionDetails(transactionId) : Promise.reject('No ID'),
    enabled: !!transactionId,
  });

  if (!transactionId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-[600px] bg-charm-surface border-l border-charm-border shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${transactionId ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charm-border bg-white">
          <h2 className="text-lg font-bold text-charm-heading flex items-center">
            <FileText className="w-5 h-5 mr-2 text-charm-muted" />
            Transaction Details
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-charm-section rounded-full text-charm-muted hover:text-charm-heading transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-charm-section rounded-xl"></div>
              <div className="h-48 bg-charm-section rounded-xl"></div>
              <div className="h-32 bg-charm-section rounded-xl"></div>
            </div>
          ) : data ? (
            <>
              {/* Primary Transaction Info */}
              <div className="bg-white p-5 rounded-xl border border-charm-border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-medium text-charm-muted mb-1">Amount</div>
                    <div className="text-3xl font-bold text-charm-heading">
                      {data.transaction.amountMinor < 0 ? '-' : ''}${Math.abs(Number(data.transaction.amountMinor) / 100).toFixed(2)} {data.transaction.currency}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    data.transaction.status === 'MATCHED' ? 'bg-green-100 text-green-700 border-green-200' :
                    data.transaction.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {data.transaction.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <div className="text-charm-muted font-medium mb-1">Date</div>
                    <div className="text-charm-body">{format(new Date(data.transaction.transactionDate), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-charm-muted font-medium mb-1">Source</div>
                    <div className="text-charm-body font-medium">{data.transaction.sourceName}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-charm-muted font-medium mb-1">Description</div>
                    <div className="text-charm-body p-2 bg-charm-section rounded-md font-mono text-xs">{data.transaction.description}</div>
                  </div>
                  <div>
                    <div className="text-charm-muted font-medium mb-1">Reference</div>
                    <div className="text-charm-body break-all font-mono text-xs">{data.transaction.referenceId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-charm-muted font-medium mb-1">External ID</div>
                    <div className="text-charm-body break-all font-mono text-xs">{data.transaction.externalId}</div>
                  </div>
                </div>
              </div>

              {/* Reconciliation Status / Matches */}
              {data.matches && data.matches.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-charm-heading flex items-center">
                    <LinkIcon className="w-4 h-4 mr-2" /> Matches
                  </h3>
                  {data.matches.map((match: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-charm-border shadow-sm text-sm">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-charm-border">
                        <span className="font-medium flex items-center">
                          Counterparty: <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{match.matchType}</span>
                        </span>
                        <span className="font-bold text-green-600">{match.confidenceScore} Score</span>
                      </div>
                      
                      {match.counterparty && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <div className="text-xs text-charm-muted mb-0.5">Counterparty Amount</div>
                            <div>${(Math.abs(Number(match.counterparty.amountMinor)) / 100).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-charm-muted mb-0.5">Counterparty Date</div>
                            <div>{format(new Date(match.counterparty.transactionDate), "MMM d, yyyy")}</div>
                          </div>
                        </div>
                      )}

                      {/* Component Scores */}
                      <div className="bg-charm-section rounded p-3 text-xs">
                        <div className="font-medium mb-2 text-charm-muted uppercase">Deterministic Scores</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between"><span>Amount:</span> <span className="font-medium">{match.amountScore || 'N/A'}</span></div>
                          <div className="flex justify-between"><span>Date:</span> <span className="font-medium">{match.dateScore || 'N/A'}</span></div>
                          <div className="flex justify-between"><span>Ref:</span> <span className="font-medium">{match.referenceScore || 'N/A'}</span></div>
                          <div className="flex justify-between"><span>Desc:</span> <span className="font-medium">{match.descriptionScore || 'N/A'}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exceptions / AI */}
              {data.exceptions && data.exceptions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-charm-heading flex items-center">
                    <BrainCircuit className="w-4 h-4 mr-2" /> Exception & AI Details
                  </h3>
                  {data.exceptions.map((ex: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-charm-border shadow-sm text-sm">
                      <div className="mb-3">
                        <div className="font-medium text-red-600 mb-1">{ex.type} - {ex.severity}</div>
                        <div className="text-charm-body">{ex.reason}</div>
                      </div>
                      
                      {ex.aiDecision && (
                        <div className="mt-4 pt-3 border-t border-charm-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-charm-brand">AI Analysis</span>
                            <span className="px-2 py-0.5 bg-charm-section rounded text-xs">{ex.aiDecision}</span>
                          </div>
                          {ex.aiConfidence && (
                            <div className="text-xs text-charm-muted mb-2">Confidence: {ex.aiConfidence}</div>
                          )}
                          {ex.aiEvidence && (
                            <div className="bg-charm-section rounded p-3 text-xs space-y-1">
                              <div className="font-medium mb-1">Evidence:</div>
                              <ul className="list-disc pl-4 space-y-1">
                                {Array.isArray(ex.aiEvidence) ? ex.aiEvidence.map((ev: string, i: number) => (
                                  <li key={i}>{ev}</li>
                                )) : <li>{JSON.stringify(ex.aiEvidence)}</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Audit Log */}
              {data.auditHistory && data.auditHistory.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-charm-heading flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> Audit History
                  </h3>
                  <div className="bg-white rounded-xl border border-charm-border shadow-sm p-4 text-sm">
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-charm-border before:to-transparent">
                      {data.auditHistory.map((log: any, idx: number) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-charm-section text-charm-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Activity className="w-3 h-3" />
                          </div>
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-charm-border bg-charm-surface/50 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-charm-heading">{log.action}</span>
                              <span className="text-xs text-charm-muted">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span>
                            </div>
                            <div className="text-xs text-charm-body">By {log.actorType}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="text-center py-12 text-charm-muted">
              Could not load transaction details.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
