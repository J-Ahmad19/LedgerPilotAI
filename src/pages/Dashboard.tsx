import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { api } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// For demo purposes, hardcode a tenant ID
const TENANT_ID = "00000000-0000-0000-0000-000000000000";

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["runs", TENANT_ID],
    queryFn: () => api.getRuns(TENANT_ID)
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard data...</div>;
  }

  const runs = data?.runs || [];
  
  // Aggregate metrics across all runs
  const totalProcessed = runs.reduce((acc: number, run: any) => acc + Number(run.totalRecords || 0), 0);
  const totalMatched = runs.reduce((acc: number, run: any) => acc + Number(run.matchedRecords || 0), 0);
  const totalExceptions = runs.reduce((acc: number, run: any) => acc + Number(run.unmatchedRecords || 0) + Number(run.partialMatches || 0), 0);

  const averageMatchRate = totalProcessed > 0 ? ((totalMatched / totalProcessed) * 100).toFixed(1) : "0.0";

  const chartData = runs.map((run: any, idx: number) => ({
    name: `Run ${runs.length - idx}`,
    matched: Number(run.matchedRecords || 0),
    unmatched: Number(run.unmatchedRecords || 0) + Number(run.partialMatches || 0)
  })).reverse().slice(-10); // last 10 runs

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Controller Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Processed" 
          value={totalProcessed.toString()} 
          icon={FileSpreadsheet} 
          trend="+12% from last week"
        />
        <MetricCard 
          title="Avg. Match Rate" 
          value={`${averageMatchRate}%`} 
          icon={CheckCircle2} 
          trend="Target: 95%"
          highlight
        />
        <MetricCard 
          title="Active Exceptions" 
          value={totalExceptions.toString()} 
          icon={AlertCircle} 
          trend="Requires review"
          alert={totalExceptions > 0}
        />
        <MetricCard 
          title="Recent Runs" 
          value={runs.length.toString()} 
          icon={Activity} 
        />
      </div>

      <div className="bg-[#15172b] p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-semibold mb-6">Reconciliation Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="matched" fill="#3b82f6" name="Matched" stackId="a" radius={[0, 0, 4, 4]} />
              <Bar dataKey="unmatched" fill="#ef4444" name="Exceptions" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, highlight, alert }: any) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'border-blue-500/50 bg-blue-500/5' : alert ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800 bg-[#15172b]'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${highlight ? 'bg-blue-500/20 text-blue-400' : alert ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className={`text-sm mt-4 ${alert ? 'text-red-400' : 'text-gray-500'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}
