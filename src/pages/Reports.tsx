import { useState, useEffect } from "react";
import { api } from "../services/api";
import { TopHeader } from "../components/layout/TopHeader";
import { Card } from "../components/ui/Card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";
import { Select } from "../components/ui/Select";
import { format } from "date-fns";
import { Download, FileText, Activity, AlertTriangle, TrendingUp, DollarSign, List, BrainCircuit } from "lucide-react";
import { exportToCSV } from "../lib/export";
import { LoadingState } from "../components/ui/states/LoadingState";
import { ErrorState } from "../components/ui/states/ErrorState";

const REPORT_TYPES = [
  { id: "reconciliation-summary", name: "Reconciliation Summary", icon: Activity },
  { id: "exceptions", name: "Exception Report", icon: AlertTriangle },
  { id: "match-rate-trend", name: "Match Rate Trend", icon: TrendingUp },
  { id: "cash-variance", name: "Cash Variance", icon: DollarSign },
  { id: "unmatched-transactions", name: "Unmatched Transactions", icon: List },
  { id: "ai-decisions", name: "AI Decision Summary", icon: BrainCircuit },
  { id: "run-performance", name: "Run Performance", icon: FileText },
];

export function Reports() {
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0].id);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sourceId, setSourceId] = useState("");
  const [runId, setRunId] = useState("");

  const fetchReportData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filters = {
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        sourceId: sourceId || undefined,
        runId: runId || undefined
      };

      let res;
      switch (activeReport) {
        case "reconciliation-summary":
          res = await api.reports.getReconciliationSummary(filters);
          break;
        case "exceptions":
          res = await api.reports.getExceptionsReport(filters);
          break;
        case "match-rate-trend":
          res = await api.reports.getMatchRateTrend(filters);
          break;
        case "cash-variance":
          res = await api.reports.getCashVarianceReport(filters);
          break;
        case "unmatched-transactions":
          res = await api.reports.getUnmatchedTransactionsReport(filters);
          break;
        case "ai-decisions":
          res = await api.reports.getAIDecisionSummary(filters);
          break;
        case "run-performance":
          res = await api.reports.getRunPerformanceReport(filters);
          break;
        default:
          res = { report: [] };
      }
      setReportData(res.report || []);
    } catch (err: any) {
      setError(err.message || "Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateRange, sourceId, runId]);

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(item => headers.map(header => item[header]));
    exportToCSV(`report-${activeReport}-${format(new Date(), 'yyyy-MM-dd')}`, headers, rows);
  };

  const renderTable = () => {
    if (reportData.length === 0) {
      return (
        <div className="py-12 text-center text-charm-muted">
          No data available for the selected filters.
        </div>
      );
    }

    const headers = Object.keys(reportData[0]);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(h => (
                <TableHead key={h} className="uppercase text-xs tracking-wider">
                  {h.replace(/([A-Z])/g, ' $1').trim()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((row, i) => (
              <TableRow key={i}>
                {headers.map(h => {
                  let val = row[h];
                  if (val !== null && val !== undefined && typeof val === 'object' && val instanceof Date === false) {
                      // handle JSON stringifying if necessary, but most returns are primitives or date strings
                      val = JSON.stringify(val);
                  }
                  if (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) {
                      // Attempt to format date
                      try {
                          val = format(new Date(val), 'yyyy-MM-dd HH:mm');
                      } catch(e) {}
                  }
                  return (
                    <TableCell key={h} className="text-sm">
                      {val === null || val === undefined ? '-' : String(val)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-charm-base text-charm-text">
      <TopHeader />

      <div className="flex-1 overflow-auto p-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-charm-heading">Financial Reports</h1>
            <p className="text-sm text-charm-muted mt-1">
              Deep operational history and investigation reports.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={reportData.length === 0 || isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-charm-border text-charm-heading text-sm font-medium rounded-lg hover:bg-charm-surface transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-charm-heading uppercase tracking-wider">Report Type</h3>
            <nav className="space-y-1">
              {REPORT_TYPES.map(rt => {
                const Icon = rt.icon;
                const isActive = activeReport === rt.id;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setActiveReport(rt.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? "bg-white text-charm-brand shadow-sm border border-charm-border"
                        : "text-charm-muted hover:bg-charm-surface hover:text-charm-heading"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{rt.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="md:col-span-3 space-y-4">
            <Card className="p-4 flex gap-4 bg-white border border-charm-border flex-wrap">
              <div className="w-40">
                <label className="block text-xs font-medium text-charm-muted mb-1">Start Date</label>
                <input 
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-charm-surface border border-charm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-charm-brand"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-charm-muted mb-1">End Date</label>
                <input 
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-charm-surface border border-charm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-charm-brand"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-charm-muted mb-1">Source ID</label>
                <input 
                  type="text"
                  placeholder="Filter by Source..."
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-charm-surface border border-charm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-charm-brand"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-charm-muted mb-1">Run ID</label>
                <input 
                  type="text"
                  placeholder="Filter by Run..."
                  value={runId}
                  onChange={(e) => setRunId(e.target.value)}
                  className="w-full bg-charm-surface border border-charm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-charm-brand"
                />
              </div>
            </Card>

            <Card className="bg-white border border-charm-border">
              {isLoading ? (
                <div className="py-12">
                  <LoadingState message="Loading report data..." />
                </div>
              ) : error ? (
                <div className="py-12">
                  <ErrorState message={error} onRetry={fetchReportData} />
                </div>
              ) : (
                renderTable()
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
