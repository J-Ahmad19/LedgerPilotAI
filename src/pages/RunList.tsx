import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Calendar } from "lucide-react";

export function Runs() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () => api.getRuns()
  });

  const handleStartRun = async () => {
    try {
      await api.startRun();
      alert("Run started!");
      window.location.reload();
    } catch (e) {
      alert("Failed to start run");
    }
  };

  if (isLoading) return <div>Loading runs...</div>;

  const runs = data?.runs || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-charm-heading font-display">
          Reconciliation Runs
        </h1>
        <button 
          onClick={handleStartRun}
          className="charm-btn-primary"
        >
          Start New Run
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charm-muted" />
          <input 
            type="text" 
            placeholder="Search runs..." 
            className="charm-input pl-9 w-full"
          />
        </div>
        <button className="charm-btn-secondary flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Status
        </button>
        <button className="charm-btn-secondary flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Date Range
        </button>
      </div>

      <div className="charm-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-charm-band border-b border-charm-border text-charm-muted font-medium">
            <tr>
              <th className="p-4 font-medium">Run ID</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Created</th>
              <th className="p-4 font-medium">Records</th>
              <th className="p-4 font-medium">Matched</th>
              <th className="p-4 font-medium">Review</th>
              <th className="p-4 font-medium">Unmatched</th>
              <th className="p-4 font-medium">Match Rate</th>
              <th className="p-4 font-medium text-right">Unresolved Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charm-border">
            {runs.map((run: any) => (
              <tr 
                key={run.id} 
                onClick={() => navigate(`/runs/${run.id}`)}
                className="hover:bg-charm-surface/50 transition-colors cursor-pointer"
              >
                <td className="p-4 font-mono text-xs text-charm-muted">
                  {run.id.split("-")[0]}...
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    run.status === "COMPLETED" ? "bg-green-100 text-green-700 border border-green-200" :
                    run.status === "PROCESSING" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                    "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="p-4 text-charm-body">
                  {run.startedAt ? format(new Date(run.startedAt), "MMM d, yyyy HH:mm") : "-"}
                </td>
                <td className="p-4 text-charm-body">{run.totalRecords || 0}</td>
                <td className="p-4 text-charm-body">{run.matchedRecords || 0}</td>
                <td className="p-4 text-charm-brand font-medium">{run.partialMatches || 0}</td>
                <td className="p-4 text-charm-body">{run.unmatchedRecords || 0}</td>
                <td className="p-4 text-charm-body">{run.matchRate || "0.00"}%</td>
                <td className="p-4 text-right font-medium text-charm-heading">
                  {run.unmatchedAmountMinor ? `$${(Number(run.unmatchedAmountMinor) / 100).toFixed(2)}` : "$0.00"}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-charm-muted">
                  No reconciliation runs found. Start a new run to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
