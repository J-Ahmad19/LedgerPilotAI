import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";
import { RunTabs } from "../components/runs/RunTabs";
import { api } from "../services/api";

type RunDetails = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progressPercentage: number;
  currentStep: string;
  processedRecords: number;
  totalRecords: number;
  matchedRecords: number;
  partialMatches: number;
  unmatchedRecords: number;
  errorInformation: string | null;
};

const STEPS = [
  "Queued",
  "Validating Records",
  "Normalizing Transactions",
  "Detecting Duplicates",
  "Generating Candidate Matches",
  "Deterministic Matching",
  "Completed"
];

export function RunProgress() {
  const { runId } = useParams<{ runId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [run, setRun] = useState<RunDetails | null>(null);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!runId || !token) return;

    const fetchRun = async () => {
      try {
        const data = await api.getRunDetails(runId);
        setRun(data.run);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchRun();

    const interval = setInterval(() => {
      if (run?.status === "COMPLETED" || run?.status === "FAILED" || run?.status === "CANCELLED") {
        clearInterval(interval);
      } else {
        fetchRun();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, token, run?.status]);

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl border border-red-200 text-red-700">
          <h2 className="text-xl font-bold mb-2">Error loading run</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-8 flex items-center justify-center h-64 text-charm-muted">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s === run.currentStep) >= 0 
    ? STEPS.findIndex(s => s === run.currentStep) 
    : 0;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await api.cancelRun(runId!);
      setRun(prev => prev ? { ...prev, status: "CANCELLED", currentStep: "Cancelled by User" } : null);
    } catch (err: any) {
      alert(err.message || "Failed to cancel run");
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-charm-heading">Reconciliation Progress</h1>
        <p className="text-charm-muted mt-2">
          Your financial data is being processed deterministically. You can navigate away; the run will continue in the background.
        </p>
      </div>

      <div className="bg-charm-panel rounded-xl shadow-sm border border-charm-border p-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium mb-2 text-charm-heading">
            <span>{run.progressPercentage}% Complete</span>
            <span>{run.processedRecords} / {run.totalRecords || 0} Records</span>
          </div>
          <div className="h-4 bg-charm-section rounded-full overflow-hidden border border-charm-border">
            <div 
              className="h-full bg-charm-brand transition-all duration-500 ease-out"
              style={{ width: `${run.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || run.status === "COMPLETED";
            const isCurrent = idx === currentStepIndex && run.status !== "COMPLETED" && run.status !== "FAILED";
            
            return (
              <div key={step} className={`flex items-center gap-4 ${isCompleted ? 'text-charm-heading' : isCurrent ? 'text-charm-brand font-medium' : 'text-charm-muted'}`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
                <span className="text-lg">{step}</span>
              </div>
            )
          })}
        </div>

        {/* Error State */}
        {run.status === "FAILED" && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-8">
            <h3 className="font-bold">Run Failed</h3>
            <p>{run.errorInformation || "An unknown error occurred during processing."}</p>
          </div>
        )}

        {/* Cancelled State */}
        {run.status === "CANCELLED" && (
          <div className="bg-orange-50 text-orange-700 p-4 rounded-lg border border-orange-200 mb-8">
            <h3 className="font-bold">Run Cancelled</h3>
            <p>The reconciliation run was aborted by the user.</p>
          </div>
        )}

        {/* Results Summary and Tabs (if completed) */}
        {run.status === "COMPLETED" && (
          <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-xl border border-charm-border shadow-sm">
              <h3 className="font-semibold text-charm-heading text-lg mb-6 border-b border-charm-border pb-2">Run Results Summary</h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-charm-heading font-mono">{run.matchedRecords}</p>
                  <p className="text-sm font-medium text-charm-muted uppercase tracking-wider mt-1">Auto-Matched</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-charm-heading font-mono">{run.partialMatches}</p>
                  <p className="text-sm font-medium text-amber-600 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    {run.partialMatches > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                    Require Review
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-charm-heading font-mono">{run.unmatchedRecords}</p>
                  <p className="text-sm font-medium text-red-600 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    {run.unmatchedRecords > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                    Unmatched
                  </p>
                </div>
              </div>
            </div>

            {/* Run Tabs Component */}
            <RunTabs runId={runId as string} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-charm-border gap-4">
          {(run.status === "QUEUED" || run.status === "PROCESSING") && (
            showCancelConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium mr-2">Are you sure?</span>
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 rounded-lg font-medium text-charm-body hover:bg-charm-section transition-colors"
                >
                  No, Keep Running
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowCancelConfirm(true)}
                className="px-6 py-2 rounded-lg font-medium border border-charm-border text-charm-muted hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Cancel Run
              </button>
            )
          )}

          <button 
            onClick={() => navigate('/runs')}
            className="px-6 py-2 rounded-lg font-medium border border-charm-border text-charm-body hover:bg-charm-section transition-colors"
          >
            View All Runs
          </button>
          
          {run.status === "COMPLETED" && run.partialMatches > 0 && (
            <button 
              onClick={() => navigate('/exceptions')}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-charm-brand text-white hover:bg-charm-brand/90 transition-colors shadow-sm"
            >
              Review Exceptions <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
