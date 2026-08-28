import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { formatCurrency } from "../lib/utils";
import { TransactionDrawer } from "./TransactionDrawer";

export function Transactions() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [filters, setFilters] = useState<any>({
    status: "ALL",
    search: "",
    currency: "",
    source: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    runId: "",
    confidence: "",
    exceptionStatus: "",
  });

  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Convert flat filters to nested structures if needed by api
  const apiFilters = {
    status: filters.status,
    search: filters.search,
    currency: filters.currency,
    source: filters.source,
    dateRange: filters.dateFrom || filters.dateTo ? { from: filters.dateFrom, to: filters.dateTo } : undefined,
    amountRange: filters.minAmount || filters.maxAmount ? { min: filters.minAmount, max: filters.maxAmount } : undefined,
    runId: filters.runId,
    confidence: filters.confidence,
    exceptionStatus: filters.exceptionStatus,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["transactions", apiFilters, page, limit],
    queryFn: () => api.getTransactions(apiFilters, page, limit),
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <h1 className="text-3xl font-bold text-charm-heading font-display">Transactions</h1>

      {/* Filter Bar */}
      <div className="charm-panel p-4 shrink-0 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          <Input 
            placeholder="Search Reference/Desc" 
            name="search" 
            value={filters.search} 
            onChange={handleFilterChange} 
            className="w-48"
          />
          <Select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange} 
            className="w-36"
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "UNMATCHED", label: "Unmatched" },
              { value: "MATCHED", label: "Matched" },
              { value: "NEEDS_REVIEW", label: "Needs Review" },
            ]}
          />
          <Input 
            placeholder="Currency" 
            name="currency" 
            value={filters.currency} 
            onChange={handleFilterChange} 
            className="w-24"
          />
          <Input 
            placeholder="Min Amt" 
            type="number"
            name="minAmount" 
            value={filters.minAmount} 
            onChange={handleFilterChange} 
            className="w-28"
          />
          <Input 
            placeholder="Max Amt" 
            type="number"
            name="maxAmount" 
            value={filters.maxAmount} 
            onChange={handleFilterChange} 
            className="w-28"
          />
          <Input 
            type="date"
            name="dateFrom" 
            value={filters.dateFrom} 
            onChange={handleFilterChange} 
            className="w-36"
          />
          <Input 
            type="date"
            name="dateTo" 
            value={filters.dateTo} 
            onChange={handleFilterChange} 
            className="w-36"
          />
          <Select 
            name="exceptionStatus" 
            value={filters.exceptionStatus} 
            onChange={handleFilterChange} 
            className="w-40"
            options={[
              { value: "", label: "Any Exceptions" },
              { value: "OPEN", label: "Open" },
              { value: "RESOLVED", label: "Resolved" },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="charm-panel flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-charm-muted flex-1">Loading transactions...</div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Txn ID / Ref</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-charm-muted py-8">
                        No transactions found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data?.map((tx: any) => (
                      <TableRow 
                        key={tx.id} 
                        className="cursor-pointer hover:bg-charm-surface/80 transition-colors"
                        onClick={() => setSelectedTransactionId(tx.id)}
                      >
                        <TableCell className="font-mono text-xs">{tx.referenceId || tx.id.substring(0,8)}</TableCell>
                        <TableCell>{tx.sourceName}</TableCell>
                        <TableCell>{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={tx.description}>{tx.description}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{formatCurrency(tx.amountMinor)}</TableCell>
                        <TableCell>{tx.currency}</TableCell>
                        <TableCell>
                          {tx.matchDetails ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-charm-muted">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.matchDetails?.confidenceScore ? (
                            <span className="font-mono text-xs bg-charm-surface px-2 py-0.5 rounded border border-charm-border">
                              {(Number(tx.matchDetails.confidenceScore) * 100).toFixed(1)}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.status === 'MATCHED' ? 'bg-green-100 text-green-700' :
                            tx.status === 'NEEDS_REVIEW' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tx.status}
                          </span>
                          {tx.exceptionDetails && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700" title="Has Exception">
                              !
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {data?.totalPages > 1 && (
              <div className="shrink-0 flex items-center justify-between p-4 border-t border-charm-border bg-charm-surface">
                <span className="text-sm text-charm-muted">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total}
                </span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionDrawer 
        transactionId={selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
      />
    </div>
  );
}
