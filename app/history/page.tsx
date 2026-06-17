'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { LogCard } from '@/components/outputs/LogCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { useSwarmLogs } from '@/lib/hooks/useSwarmLogs';
import { downloadCsv, csvTimestamp } from '@/lib/utils/csv';
import {
  DATE_PRESETS,
  getActiveRange,
  type DatePreset,
} from '@/lib/utils/date-window';
import {
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
  Download,
} from 'lucide-react';

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const { logs, count, isLoading, error, refetch } = useSwarmLogs();
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams?.get('search') ?? '',
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const activeRange = useMemo<{ from: number; to: number } | null>(
    () => getActiveRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return logs.filter((log) => {
      if (activeRange) {
        const t = log.timestamp ? new Date(log.timestamp).getTime() : NaN;
        if (!Number.isFinite(t)) return false;
        if (t < activeRange.from || t > activeRange.to) return false;
      }

      if (!q) return true;
      const name = log.agentName?.toLowerCase() || '';
      const endpoint = log.endpoint?.toLowerCase() || '';
      const id = log.id.toLowerCase();
      const timestamp = log.timestamp?.toLowerCase() || '';
      const task = log.task?.toLowerCase() || '';
      const raw =
        log.raw && typeof log.raw === 'object'
          ? JSON.stringify(log.raw).toLowerCase()
          : '';
      return (
        name.includes(q) ||
        endpoint.includes(q) ||
        id.includes(q) ||
        timestamp.includes(q) ||
        task.includes(q) ||
        raw.includes(q)
      );
    });
  }, [logs, searchQuery, activeRange]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, datePreset, customFrom, customTo]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleExportCsv = () => {
    const headers = [
      'timestamp',
      'agent_name',
      'endpoint',
      'id',
      'status',
      'task',
      'input_tokens',
      'output_tokens',
      'total_tokens',
      'total_cost_usd',
    ];
    const rows = filteredLogs.map((log) => [
      log.timestamp ?? '',
      log.agentName ?? '',
      log.endpoint ?? '',
      log.id,
      log.success ? 'success' : 'failed',
      log.task ?? '',
      log.usage?.input_tokens ?? '',
      log.usage?.output_tokens ?? '',
      log.usage?.total_tokens ?? '',
      log.usage?.total_cost ?? '',
    ]);
    downloadCsv(`executions_${csvTimestamp()}.csv`, headers, rows);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground">Activity</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Execution history
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                API request logs from{' '}
                <code className="text-foreground">/v1/swarm/logs</code>, sorted
                by recency.
              </p>
            </div>
            {!(isLoading && logs.length === 0) && (
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap flex-shrink-0 sm:self-end sm:pb-1">
                <span className="text-foreground font-medium">
                  {filteredLogs.length.toLocaleString()}
                </span>{' '}
                of {(count ?? logs.length).toLocaleString()} logs
              </span>
            )}
          </div>

          {!(isLoading && logs.length === 0) && (
            <div className="mb-5 pb-4 border-b border-border flex flex-col gap-2.5">
              {/* Row 1 — search + actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by agent, endpoint, ID, task, or timestamp…"
                  className="flex-1 min-w-0"
                />
                <div className="flex items-center gap-2">
                  {filteredLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      aria-label="Export filtered logs as CSV"
                      title={`Export ${filteredLogs.length.toLocaleString()} log${
                        filteredLogs.length === 1 ? '' : 's'
                      } as CSV`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={refetch}
                    disabled={isLoading}
                    aria-label="Refresh"
                    title="Refresh"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Row 2 — date filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="radiogroup"
                  aria-label="Date range"
                  className="inline-flex items-center gap-0.5 rounded-md border border-border bg-subtle p-0.5"
                >
                  {DATE_PRESETS.map((p) => {
                    const active = datePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDatePreset(p.id)}
                        className={`inline-flex items-center justify-center px-2.5 h-7 rounded text-xs font-medium transition-colors ${
                          active
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {datePreset === 'custom' && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="uppercase tracking-wider">From</span>
                      <input
                        type="date"
                        value={customFrom}
                        max={customTo || undefined}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="h-7 px-2 rounded-md border border-border bg-input text-foreground text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="uppercase tracking-wider">To</span>
                      <input
                        type="date"
                        value={customTo}
                        min={customFrom || undefined}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="h-7 px-2 rounded-md border border-border bg-input text-foreground text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      />
                    </label>
                    {(customFrom || customTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomFrom('');
                          setCustomTo('');
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isLoading && logs.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading logs…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-3 text-danger" />
              <p className="text-sm text-foreground mb-2">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No execution history"
              description="Execute agents to see their history here."
            />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              title="No logs match"
              description="Try a different search or date range."
            />
          ) : (
            <>
              <div className="space-y-3">
                {paginatedLogs.map((log) => (
                  <LogCard key={log.id} entry={log} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredLogs.length}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-subtle/50 p-10">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {description}
      </p>
    </div>
  );
}
