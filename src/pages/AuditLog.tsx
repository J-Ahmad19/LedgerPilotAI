import { useState, useEffect } from "react";
import { api } from "../services/api";
import { TopHeader } from "../components/layout/TopHeader";
import { Card } from "../components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { format } from "date-fns";
import { History, Search, Code, CheckCircle, AlertTriangle, FileText, Settings, User } from "lucide-react";
import { Drawer } from "../components/ui/Drawer";
import { LoadingState } from "../components/ui/states/LoadingState";
import { ErrorState } from "../components/ui/states/ErrorState";

interface AuditLog {
  id: string;
  action: string;
  actorType: string;
  actorId: string;
  entityType: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  metadata: any;
  createdAt: string;
  userName: string | null;
}

const ACTION_COLORS: Record<string, string> = {
  TRANSACTION_IMPORTED: "bg-blue-100 text-blue-800 border-blue-200",
  DUPLICATE_DETECTED: "bg-orange-100 text-orange-800 border-orange-200",
  RECONCILIATION_STARTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  RECONCILIATION_COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AUTO_MATCH: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AI_MATCH: "bg-purple-100 text-purple-800 border-purple-200",
  EXCEPTION_CREATED: "bg-amber-100 text-amber-800 border-amber-200",
  EXCEPTION_APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EXCEPTION_REJECTED: "bg-red-100 text-red-800 border-red-200",
  TRANSACTION_MARKED_UNMATCHED: "bg-orange-100 text-orange-800 border-orange-200",
  RESOLUTION_NOTE_ADDED: "bg-blue-100 text-blue-800 border-blue-200",
  CASH_VARIANCE_RECALCULATED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  WORKSPACE_CREATED: "bg-slate-100 text-slate-800 border-slate-200",
};

const ACTOR_ICONS: Record<string, any> = {
  System: Settings,
  Agent: Code,
  User: User,
};

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [filters, setFilters] = useState({
    action: "All",
    entityType: "All",
    actorType: "All",
  });

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await api.getAuditLogs({
        action: filters.action !== "All" ? filters.action : undefined,
        entityType: filters.entityType !== "All" ? filters.entityType : undefined,
        actorType: filters.actorType !== "All" ? filters.actorType : undefined,
      });
      setLogs(res.logs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const renderStateJson = (state: any) => {
    if (!state) return <span className="text-charm-muted italic">None</span>;
    return (
      <pre className="bg-charm-band p-4 rounded-lg overflow-x-auto text-xs text-charm-heading font-mono border border-charm-border">
        {JSON.stringify(state, null, 2)}
      </pre>
    );
  };

  return (
    <div className="flex flex-col h-full bg-charm-base text-charm-text">
      <TopHeader />

      <div className="flex-1 overflow-auto p-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-charm-heading">System Audit Log</h1>
            <p className="text-sm text-charm-muted mt-1">
              Immutable record of all system events, AI decisions, and user actions.
            </p>
          </div>
        </div>

        <Card className="p-4 flex flex-wrap gap-4 items-end bg-white border border-charm-border">
          <div className="w-48">
            <label className="block text-xs font-medium text-charm-muted mb-1">Actor Type</label>
            <Select
              value={filters.actorType}
              onChange={(e) => setFilters(f => ({ ...f, actorType: e.target.value }))}
              options={[
                { value: "All", label: "All Actors" },
                { value: "System", label: "System" },
                { value: "User", label: "User" },
                { value: "Agent", label: "AI Agent" },
              ]}
            />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-charm-muted mb-1">Action</label>
            <Select
              value={filters.action}
              onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
              options={[
                { value: "All", label: "All Actions" },
                { value: "TRANSACTION_IMPORTED", label: "Transaction Imported" },
                { value: "DUPLICATE_DETECTED", label: "Duplicate Detected" },
                { value: "RECONCILIATION_STARTED", label: "Reconciliation Started" },
                { value: "RECONCILIATION_COMPLETED", label: "Reconciliation Completed" },
                { value: "AUTO_MATCH", label: "Auto Match" },
                { value: "AI_MATCH", label: "AI Match" },
                { value: "EXCEPTION_CREATED", label: "Exception Created" },
                { value: "EXCEPTION_APPROVED", label: "Exception Approved" },
                { value: "EXCEPTION_REJECTED", label: "Exception Rejected" },
                { value: "TRANSACTION_MARKED_UNMATCHED", label: "Marked Unmatched" },
                { value: "RESOLUTION_NOTE_ADDED", label: "Note Added" },
                { value: "CASH_VARIANCE_RECALCULATED", label: "Cash Variance Recalculated" },
                { value: "WORKSPACE_CREATED", label: "Workspace Created" },
              ]}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-charm-muted mb-1">Entity Type</label>
            <Select
              value={filters.entityType}
              onChange={(e) => setFilters(f => ({ ...f, entityType: e.target.value }))}
              options={[
                { value: "All", label: "All Entities" },
                { value: "Transaction", label: "Transaction" },
                { value: "Exception", label: "Exception" },
                { value: "ReconciliationRun", label: "Reconciliation Run" },
                { value: "DataSource", label: "Data Source" },
                { value: "Tenant", label: "Tenant" },
              ]}
            />
          </div>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading audit trails..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadLogs} />
        ) : logs.length === 0 ? (
          <Card className="p-12 text-center text-charm-muted">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-charm-heading">No audit logs found</p>
            <p className="text-sm mt-1">Adjust filters to see more results</p>
          </Card>
        ) : (
          <Card className="overflow-hidden bg-white border border-charm-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Reason / Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => {
                  const ActorIcon = ACTOR_ICONS[log.actorType] || User;
                  return (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="whitespace-nowrap text-charm-muted">
                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <ActorIcon className="w-4 h-4 text-charm-muted" />
                          <span className="font-medium text-charm-heading">
                            {log.userName || log.actorType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium text-charm-heading">{log.entityType}</div>
                        <div className="text-xs text-charm-muted font-mono truncate w-32" title={log.entityId}>
                          {log.entityId.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-charm-text truncate max-w-xs">
                          {log.metadata?.message || log.metadata?.reason || log.metadata?.decision || "View details"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
      >
        {selectedLog && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-charm-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-charm-heading tracking-tight">
                  {selectedLog.action.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-charm-muted mt-1">
                  {format(new Date(selectedLog.createdAt), "PPpp")}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${ACTION_COLORS[selectedLog.action] || "bg-gray-100 text-gray-800"}`}>
                {selectedLog.actorType} {selectedLog.userName ? `(${selectedLog.userName})` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-charm-surface border-transparent">
                <div className="text-xs font-bold text-charm-muted uppercase tracking-wider mb-1">Entity Type</div>
                <div className="font-medium text-charm-heading">{selectedLog.entityType}</div>
              </Card>
              <Card className="p-4 bg-charm-surface border-transparent">
                <div className="text-xs font-bold text-charm-muted uppercase tracking-wider mb-1">Entity ID</div>
                <div className="font-mono text-sm text-charm-heading break-all">{selectedLog.entityId}</div>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-bold text-charm-heading mb-3">Event Metadata</h4>
              {renderStateJson(selectedLog.metadata)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-charm-heading mb-3">Before State</h4>
                {renderStateJson(selectedLog.beforeState)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-charm-heading mb-3">After State</h4>
                {renderStateJson(selectedLog.afterState)}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
