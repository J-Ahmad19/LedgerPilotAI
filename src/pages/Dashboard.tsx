import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle2, FileSpreadsheet, ArrowRight, DollarSign, Clock, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => api.getDashboardMetrics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-charm-heading font-display">Error loading dashboard</h2>
        <p className="text-charm-muted mt-2 mb-6">There was a problem fetching your financial metrics.</p>
        <button onClick={() => window.location.reload()} className="bg-charm-brand text-white px-6 py-2 rounded-xl">
          Retry
        </button>
      </div>
    );
  }

  if (data.isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <FileSpreadsheet className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-charm-heading font-display mb-4">
          Connect your financial records to begin.
        </h1>
        <p className="text-charm-muted mb-8 text-lg">
          Upload your bank statements, payment processor files, or ledger exports to start reconciling and identifying exceptions.
        </p>
        <div className="flex gap-4">
          <Link to="/import" className="bg-charm-brand hover:bg-charm-brandHover text-white px-8 py-3 rounded-xl font-medium transition-colors">
            Upload Data
          </Link>
          <button className="bg-white border border-charm-border hover:bg-charm-panel text-charm-heading px-8 py-3 rounded-xl font-medium transition-colors">
            Try Demo Dataset
          </button>
        </div>
      </div>
    );
  }

  const {
    kpis,
    reconciliationTrend,
    needsAttention,
    recentRuns
  } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-charm-heading font-display">
            Controller Dashboard
          </h1>
          <p className="text-charm-muted mt-1">Overview of your workspace reconciliation health.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/import" className="bg-white border border-charm-border hover:bg-charm-panel text-charm-heading px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Import Data
          </Link>
          <Link to="/import" className="bg-charm-brand hover:bg-charm-brandHover text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            New Reconciliation Run
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Transactions Processed" 
          value={kpis.transactionsProcessed.toLocaleString()} 
          icon={FileSpreadsheet} 
          trend="Lifetime total"
        />
        <MetricCard 
          title="Match Rate" 
          value={`${kpis.matchRate}%`} 
          icon={CheckCircle2} 
          trend="Target: 95%"
          highlight
        />
        <MetricCard 
          title="Active Exceptions" 
          value={kpis.activeExceptions.toLocaleString()} 
          icon={AlertCircle} 
          trend="Requires review"
          alert={kpis.activeExceptions > 0}
        />
        <MetricCard 
          title="Cash Variance" 
          value={`$${(Number(kpis.cashVariance) / 100).toFixed(2)}`} 
          icon={Activity} 
          trend="Last snapshot"
          alert={Number(kpis.cashVariance) !== 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Amount Match Rate" 
          value={`${kpis.amountMatchRate}%`} 
          icon={DollarSign} 
        />
        <MetricCard 
          title="Auto Resolution Rate" 
          value={`${kpis.autoResolutionRate}%`} 
          icon={CheckCircle2} 
        />
        <MetricCard 
          title="Unresolved Amount" 
          value={`$${(Number(kpis.unresolvedAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={AlertCircle} 
          alert={Number(kpis.unresolvedAmount) > 0}
        />
        <MetricCard 
          title="Average Run Duration" 
          value={`${kpis.averageRunDuration}s`} 
          icon={Clock} 
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Trend and Recent Runs */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="charm-panel p-6">
            <h2 className="text-lg font-bold mb-6 text-charm-heading font-display">Reconciliation Trend</h2>
            <div className="h-72">
              {reconciliationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reconciliationTrend}>
                    <XAxis dataKey="name" stroke="#79716B" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#79716B" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FBFAF9', border: '1px solid #E7E6E5', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1C1917' }}
                    />
                    <Bar dataKey="matched" fill="#2563eb" name="Matched" stackId="a" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="exceptions" fill="#E4544B" name="Exceptions" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-charm-muted">Not enough data to display trend</div>
              )}
            </div>
          </div>

          <div className="charm-panel p-0 overflow-hidden">
            <div className="p-6 border-b border-charm-border flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-charm-heading font-display">Recent Reconciliation Runs</h2>
              <Link to="/runs" className="text-sm font-medium text-charm-brandText hover:text-charm-brand">View All</Link>
            </div>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left">
                <thead className="bg-charm-section">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-charm-muted uppercase tracking-wider">Run ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-charm-muted uppercase tracking-wider">Records</th>
                    <th className="px-6 py-3 text-xs font-semibold text-charm-muted uppercase tracking-wider">Match Rate</th>
                    <th className="px-6 py-3 text-xs font-semibold text-charm-muted uppercase tracking-wider">Exceptions</th>
                    <th className="px-6 py-3 text-xs font-semibold text-charm-muted uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charm-border">
                  {recentRuns.map((run: any) => (
                    <tr key={run.runId} className="hover:bg-charm-section/50 transition-colors cursor-pointer" onClick={() => navigate(`/runs/${run.runId}`)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charm-heading">{run.runId.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charm-body">{run.records.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charm-body">{run.matchRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charm-body">{run.exceptions}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                          ${run.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : ''}
                          ${run.status === 'FAILED' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentRuns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-charm-muted">No recent runs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Needs Attention and Cash Position */}
        <div className="space-y-8">
          
          <div className="charm-panel p-6 flex flex-col items-start bg-white border border-charm-border">
            <h2 className="text-lg font-bold text-charm-heading font-display mb-2">Cash Position</h2>
            <p className="text-sm text-charm-muted mb-6">Comparison of expected vs actual balances.</p>
            
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-charm-border">
                <span className="text-charm-body font-medium">Expected Cash</span>
                <span className="text-charm-heading font-semibold">${(Number(kpis.expectedCash) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-charm-border">
                <span className="text-charm-body font-medium">Actual Cash</span>
                <span className="text-charm-heading font-semibold">${(Number(kpis.actualCash) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-charm-body font-bold">Variance</span>
                <span className={`font-bold ${Number(kpis.cashVariance) !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${(Number(kpis.cashVariance) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <Link to="/cash-position" className="mt-8 w-full block text-center bg-white border border-charm-border hover:bg-charm-section text-charm-heading px-4 py-2 rounded-lg font-medium transition-colors">
              Why Is My Cash Off?
            </Link>
          </div>

          <div className="charm-panel p-0 overflow-hidden bg-white border-charm-border">
             <div className="p-6 border-b border-charm-border bg-white flex justify-between items-center">
              <h2 className="text-lg font-bold text-charm-heading font-display">Needs Your Attention</h2>
            </div>
            <div className="divide-y divide-charm-border">
              {needsAttention.map((exception: any) => (
                <div key={exception.id} className="p-4 hover:bg-charm-section/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      {exception.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-charm-heading">${(Number(exception.amount) / 100).toFixed(2)} {exception.currency}</span>
                  </div>
                  <p className="text-sm text-charm-body mb-3 line-clamp-2">{exception.reason}</p>
                </div>
              ))}
              {needsAttention.length === 0 && (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-charm-muted">All caught up! No active exceptions.</p>
                </div>
              )}
            </div>
            {needsAttention.length > 0 && (
              <div className="p-4 bg-charm-section border-t border-charm-border">
                <Link to="/exceptions" className="w-full flex items-center justify-center bg-charm-brand hover:bg-charm-brandHover text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Review Exceptions <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, highlight, alert }: any) {
  return (
    <div className={`p-6 rounded-2xl border ${highlight ? 'border-blue-500/20 bg-blue-50' : alert ? 'border-red-500/20 bg-red-50' : 'border-charm-border bg-white'} shadow-sm flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-charm-muted font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-charm-heading font-display">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${highlight ? 'bg-blue-100 text-blue-600' : alert ? 'bg-red-100 text-red-600' : 'bg-charm-section text-charm-heading border border-charm-border'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className={`text-xs font-medium ${alert ? 'text-red-600' : 'text-charm-muted'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-end">
        <div>
          <div className="h-8 bg-charm-border rounded w-48 mb-2"></div>
          <div className="h-4 bg-charm-border rounded w-64"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-charm-border rounded-lg"></div>
          <div className="h-10 w-48 bg-charm-border rounded-lg"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="p-6 rounded-2xl border border-charm-border bg-white h-32 flex flex-col justify-between">
             <div className="flex justify-between">
                <div>
                   <div className="h-4 bg-charm-border rounded w-24 mb-3"></div>
                   <div className="h-8 bg-charm-border rounded w-16"></div>
                </div>
                <div className="h-10 w-10 bg-charm-section rounded-xl"></div>
             </div>
             <div className="h-3 bg-charm-border rounded w-32 mt-4"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="charm-panel h-80 bg-white border border-charm-border rounded-2xl"></div>
           <div className="charm-panel h-64 bg-white border border-charm-border rounded-2xl"></div>
        </div>
        <div className="space-y-8">
           <div className="charm-panel h-64 bg-white border border-charm-border rounded-2xl"></div>
           <div className="charm-panel h-96 bg-white border border-charm-border rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
