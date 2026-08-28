import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Drawer } from "../components/ui/Drawer";
import { formatCurrency } from "../lib/utils";

interface TransactionDrawerProps {
  transactionId: string | null;
  onClose: () => void;
}

export function TransactionDrawer({ transactionId, onClose }: TransactionDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["transactionDetails", transactionId],
    queryFn: () => api.getTransactionDetails(transactionId as string),
    enabled: !!transactionId,
  });

  return (
    <Drawer
      isOpen={!!transactionId}
      onClose={onClose}
      title="Transaction Details"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-charm-muted">
          Loading...
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-full text-charm-muted">
          Transaction not found
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {/* Source & Normalized Info */}
          <section className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-charm-heading border-b border-charm-border pb-2">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="charm-panel p-4">
                <div className="text-xs font-semibold text-charm-muted uppercase tracking-wider mb-2">Original</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charm-muted">Date</span>
                    <span className="text-charm-body font-medium">{new Date(data.transaction.transactionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charm-muted">Amount</span>
                    <span className="text-charm-body font-mono font-medium">{formatCurrency(data.transaction.amountMinor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charm-muted">Reference</span>
                    <span className="text-charm-body">{data.transaction.referenceId || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charm-muted">Desc</span>
                    <span className="text-charm-body text-right max-w-[150px] truncate" title={data.transaction.description}>{data.transaction.description || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="charm-panel p-4 bg-charm-surface-highlight border-charm-brand/20">
                <div className="text-xs font-semibold text-charm-brand uppercase tracking-wider mb-2">Normalized</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charm-muted">Reference</span>
                    <span className="text-charm-body">{data.transaction.normalizedReference || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charm-muted">Desc</span>
                    <span className="text-charm-body text-right max-w-[150px] truncate" title={data.transaction.normalizedDescription}>{data.transaction.normalizedDescription || '-'}</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-charm-border">
                    <span className="text-charm-muted">Source</span>
                    <span className="text-charm-body font-medium">{data.transaction.sourceName}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Exceptions */}
          {data.exceptions?.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-red-600 border-b border-red-200 pb-2 flex items-center gap-2">
                Exceptions ({data.exceptions.length})
              </h3>
              <div className="space-y-3">
                {data.exceptions.map((ex: any) => (
                  <div key={ex.id} className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-red-800 uppercase text-xs">{ex.type}</span>
                      <span className="text-red-600 font-mono text-xs">{(Number(ex.confidence || 0) * 100).toFixed(1)}% AI Conf</span>
                    </div>
                    <p className="text-red-900 mb-2">{ex.reason}</p>
                    {ex.suggestedAction && (
                      <p className="text-red-700 italic">Action: {ex.suggestedAction}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Matches */}
          <section className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-charm-heading border-b border-charm-border pb-2 flex items-center justify-between">
              <span>Match Details</span>
              <span className="text-sm font-normal px-2 py-0.5 bg-charm-panel rounded-full text-charm-muted border border-charm-border">
                {data.matches?.length || 0} candidate(s)
              </span>
            </h3>
            {data.matches?.length === 0 ? (
              <div className="text-sm text-charm-muted italic p-4 bg-charm-panel rounded-xl text-center">No matches found for this transaction.</div>
            ) : (
              <div className="space-y-4">
                {data.matches?.map((m: any) => (
                  <div key={m.id} className="charm-panel overflow-hidden">
                    <div className="bg-charm-surface-highlight p-3 border-b border-charm-border flex items-center justify-between text-sm">
                      <span className="font-semibold text-charm-brand uppercase tracking-wider text-xs">{m.matchType} Match</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded shadow-sm text-xs font-medium">Score: {(Number(m.confidenceScore) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Counterparty info */}
                      {m.counterparty && (
                        <div className="flex justify-between items-start text-sm">
                          <div>
                            <div className="text-charm-muted text-xs uppercase mb-1">Matched Record</div>
                            <div className="font-medium text-charm-heading">{m.counterparty.normalizedDescription || m.counterparty.description}</div>
                            <div className="text-charm-muted">{new Date(m.counterparty.transactionDate).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-medium text-charm-heading">{formatCurrency(m.counterparty.amountMinor)}</div>
                            <div className="text-charm-muted text-xs">{m.counterparty.referenceId}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Deterministic Scores */}
                      <div className="grid grid-cols-4 gap-2 border-t border-charm-border pt-4">
                        <div className="text-center">
                          <div className="text-[10px] text-charm-muted uppercase tracking-wider mb-1">Amount</div>
                          <div className="text-sm font-mono text-charm-body">{Number(m.amountScore || 0).toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-charm-muted uppercase tracking-wider mb-1">Date</div>
                          <div className="text-sm font-mono text-charm-body">{Number(m.dateScore || 0).toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-charm-muted uppercase tracking-wider mb-1">Ref</div>
                          <div className="text-sm font-mono text-charm-body">{Number(m.referenceScore || 0).toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-charm-muted uppercase tracking-wider mb-1">Desc</div>
                          <div className="text-sm font-mono text-charm-body">{Number(m.descriptionScore || 0).toFixed(2)}</div>
                        </div>
                      </div>

                      {/* AI Decision & Evidence */}
                      {m.matchType === 'AI' && (
                        <div className="border-t border-charm-brand/20 bg-blue-50/50 -mx-4 -mb-4 p-4 mt-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-blue-700 uppercase">AI Reasoning</span>
                            {m.aiDecision && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.aiDecision === 'MATCH' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {m.aiDecision}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-900 mb-2">{m.reason}</p>
                          {m.aiEvidence && (
                            <div className="text-xs text-blue-800 bg-white/60 p-2 rounded border border-blue-100 font-mono overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(m.aiEvidence, null, 2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Audit History */}
          <section className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-charm-heading border-b border-charm-border pb-2">Audit Log</h3>
            {data.auditHistory?.length === 0 ? (
              <div className="text-sm text-charm-muted italic">No audit events found.</div>
            ) : (
              <div className="relative border-l-2 border-charm-border ml-3 space-y-6">
                {data.auditHistory?.map((log: any) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-charm-brand rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_var(--charm-surface)]"></div>
                    <div className="text-sm">
                      <div className="font-medium text-charm-heading">{log.action}</div>
                      <div className="text-xs text-charm-muted mt-0.5 flex gap-2">
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>By {log.actorType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
