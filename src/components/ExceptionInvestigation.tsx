import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { formatCurrency } from "../lib/utils";
import { Drawer } from "./ui/Drawer";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface ExceptionInvestigationProps {
  exceptionId: string | null;
  onClose: () => void;
}

export function ExceptionInvestigation({ exceptionId, onClose }: ExceptionInvestigationProps) {
  const queryClient = useQueryClient();
  const [resolutionNote, setResolutionNote] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["exceptionDetails", exceptionId],
    queryFn: () => api.getExceptionById(exceptionId as string),
    enabled: !!exceptionId,
  });

  const resolveMutation = useMutation({
    mutationFn: (payload: { decision: string; targetTransactionId?: string; resolutionNote?: string }) => 
      api.resolveException(exceptionId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      onClose();
    },
  });

  const handleResolve = (decision: string) => {
    if (decision === 'Approve Match' && !selectedCandidate) {
      alert("Please select a candidate to match with.");
      return;
    }
    
    if (confirm(`Are you sure you want to resolve this exception with decision: ${decision}?`)) {
      resolveMutation.mutate({
        decision,
        targetTransactionId: decision === 'Approve Match' ? selectedCandidate || undefined : undefined,
        resolutionNote
      });
    }
  };

  return (
    <Drawer
      isOpen={!!exceptionId}
      onClose={onClose}
      title="Exception Review"
      className="max-w-5xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">Loading details...</div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Source & Candidates */}
          <div className="space-y-6">
            
            {/* Source Transaction */}
            <div className="charm-panel p-5">
              <h3 className="text-lg font-semibold text-charm-heading mb-4 border-b border-charm-border pb-2">Source Transaction</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-charm-muted">ID:</span> <span className="font-mono text-xs">{data.sourceTransaction?.id}</span></div>
                <div className="flex justify-between"><span className="text-charm-muted">Date:</span> <span>{new Date(data.sourceTransaction?.transactionDate).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-charm-muted">Amount:</span> <span className="font-semibold">{formatCurrency(data.sourceTransaction?.amountMinor)}</span></div>
                <div className="flex justify-between"><span className="text-charm-muted">Description:</span> <span className="text-right">{data.sourceTransaction?.description || data.sourceTransaction?.merchantName}</span></div>
                <div className="flex justify-between"><span className="text-charm-muted">Reference:</span> <span className="font-mono">{data.sourceTransaction?.referenceId || 'N/A'}</span></div>
              </div>
            </div>

            {/* Candidate Transactions */}
            <div className="charm-panel p-5">
              <h3 className="text-lg font-semibold text-charm-heading mb-4 border-b border-charm-border pb-2">Candidate Transaction(s)</h3>
              {data.candidates && data.candidates.length > 0 ? (
                <div className="space-y-3">
                  {data.candidates.map((c: any) => (
                    <div 
                      key={c.transaction.id} 
                      onClick={() => setSelectedCandidate(c.transaction.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedCandidate === c.transaction.id ? 'border-charm-brand bg-charm-brand/5' : 'border-charm-border hover:border-charm-muted'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">{formatCurrency(c.transaction.amountMinor)}</span>
                        <span className="text-xs font-mono bg-charm-base px-2 py-0.5 rounded">{(Number(c.matchDetails.confidenceScore) * 100).toFixed(1)}% Match</span>
                      </div>
                      <div className="text-sm text-charm-muted">{new Date(c.transaction.transactionDate).toLocaleDateString()}</div>
                      <div className="text-sm truncate">{c.transaction.description || c.transaction.merchantName}</div>
                      <div className="text-xs font-mono text-charm-muted mt-1">Ref: {c.transaction.referenceId || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-charm-muted text-sm py-4 text-center bg-charm-base rounded border border-charm-border">
                  No candidate transactions found for this exception.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: AI Analysis & Actions */}
          <div className="space-y-6">
            
            {/* AI Analysis */}
            <div className="charm-panel p-5 border-l-4 border-l-charm-brand">
              <h3 className="text-lg font-semibold text-charm-heading mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-charm-brand" />
                AI Analysis
              </h3>
              
              <div className="space-y-4">
                <div className="bg-charm-base p-4 rounded-xl border border-charm-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-charm-muted text-sm">Suggested Decision</span>
                    <span className="font-bold text-charm-heading">{data.exception.aiDecision || 'REVIEW'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-charm-muted text-sm">Confidence</span>
                    <span className="font-mono">{data.exception.aiConfidence ? (Number(data.exception.aiConfidence) * 100).toFixed(1) : (Number(data.exception.confidence) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-charm-heading mb-2">Evidence</h4>
                  <ul className="text-sm space-y-1 text-charm-body">
                    {data.exception.aiEvidence ? (
                      (data.exception.aiEvidence as string[]).map((ev: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-charm-muted shrink-0 mt-0.5" />
                        <span>Based on exact amount and similar dates.</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-charm-heading mb-2">Reason Codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.exception.aiReasonCodes ? (
                      (data.exception.aiReasonCodes as string[]).map((code: string, idx: number) => (
                        <span key={idx} className="bg-charm-base border border-charm-border px-2 py-1 rounded text-xs font-mono">{code}</span>
                      ))
                    ) : (
                      <span className="bg-charm-base border border-charm-border px-2 py-1 rounded text-xs font-mono">{data.exception.reason}</span>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-200">
                  <span className="font-semibold">Suggested Action:</span> {data.exception.suggestedAction}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="charm-panel p-5">
              <h3 className="text-lg font-semibold text-charm-heading mb-4">Resolution</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-charm-heading mb-1">Resolution Note</label>
                <textarea 
                  className="w-full bg-charm-base border border-charm-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-charm-brand text-charm-body"
                  rows={3}
                  placeholder="Add context for this resolution..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => handleResolve('Approve Match')}
                  disabled={resolveMutation.isPending || (!selectedCandidate && data.candidates?.length > 0)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Approve Match
                </button>
                <button 
                  onClick={() => handleResolve('Reject Match')}
                  disabled={resolveMutation.isPending}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Reject Match
                </button>
                <button 
                  onClick={() => handleResolve('Keep Unmatched')}
                  disabled={resolveMutation.isPending}
                  className="flex-1 bg-white hover:bg-charm-base text-charm-body border border-charm-border px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  Keep Unmatched
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
