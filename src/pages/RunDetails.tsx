import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { format } from "date-fns";

const TENANT_ID = "00000000-0000-0000-0000-000000000000";

export function Runs() {
  const { data, isLoading } = useQuery({
    queryKey: ["runs", TENANT_ID],
    queryFn: () => api.getRuns(TENANT_ID)
  });

  const handleStartRun = async () => {
    try {
      await api.startRun(TENANT_ID);
      alert("Run started!");
      // Ideally we invalidate queries here, but a reload is fine for a hackathon
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
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Reconciliation Runs
        </h1>
        <button 
          onClick={handleStartRun}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Start New Run
        </button>
      </div>

      <div className="bg-[#15172b] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0f101f] border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">Run ID</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Records</th>
              <th className="p-4 font-medium">Match Rate</th>
              <th className="p-4 font-medium">Exceptions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {runs.map((run: any) => (
              <tr key={run.id} className="hover:bg-gray-800/20 transition-colors">
                <td className="p-4 font-mono text-xs text-gray-400">
                  {run.id.split("-")[0]}...
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    run.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                    run.status === "PROCESSING" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300">
                  {run.startedAt ? format(new Date(run.startedAt), "MMM d, yyyy HH:mm") : "-"}
                </td>
                <td className="p-4">{run.totalRecords || 0}</td>
                <td className="p-4">{run.matchRate || "0.0"}%</td>
                <td className="p-4 text-red-400">{Number(run.unmatchedRecords || 0) + Number(run.partialMatches || 0)}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
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
