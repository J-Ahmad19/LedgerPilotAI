import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { formatCurrency } from "../lib/utils";

export function Exceptions() {
  const { data, isLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => api.getExceptions()
  });

  if (isLoading) return <div>Loading exceptions...</div>;

  const exceptions = data?.exceptions || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Exception Review Queue
      </h1>

      <div className="space-y-4">
        {exceptions.map(({ exception, transaction }: any) => (
          <div key={exception.id} className="bg-[#15172b] border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <span>{transaction?.externalId || 'Unknown'}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    exception.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {exception.type}
                  </span>
                </h3>
                <p className="text-gray-400 text-sm mt-1">{transaction?.normalizedDescription || transaction?.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{transaction?.amountMinor ? formatCurrency(transaction.amountMinor) : "-"}</div>
                <div className="text-sm text-gray-500">{transaction?.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : ""}</div>
              </div>
            </div>

            <div className="bg-[#0f101f] p-4 rounded-lg border border-gray-800/50 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">AI Confidence: </span>
                <span className="text-white font-mono">{(Number(exception.confidence) * 100).toFixed(1)}%</span>
              </div>
              <div className="text-sm mt-2">
                <span className="text-gray-500">Reason: </span>
                <span className="text-white">{exception.reason}</span>
              </div>
              <div className="text-sm mt-2">
                <span className="text-gray-500">Suggested Action: </span>
                <span className="text-blue-400">{exception.suggestedAction}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button className="bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/20 px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Approve Suggestion
              </button>
              <button className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Reject
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Resolve Manually
              </button>
            </div>
          </div>
        ))}
        {exceptions.length === 0 && (
          <div className="text-center p-12 bg-[#15172b] border border-gray-800 rounded-xl text-gray-500">
            No active exceptions! Great job.
          </div>
        )}
      </div>
    </div>
  );
}
