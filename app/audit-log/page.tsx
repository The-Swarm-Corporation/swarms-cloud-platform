'use client';

import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AuditTable } from '@/components/audit/AuditTable';
import { AuditToolbar } from '@/components/audit/AuditToolbar';
import { Pagination } from '@/components/ui/Pagination';
import { useAuditEvents } from '@/lib/hooks/useAuditEvents';
import { downloadCsv, csvTimestamp } from '@/lib/utils/csv';
import { Clock, Loader2, XCircle } from 'lucide-react';
import type { AuditCategory } from '@/lib/audit/types';

const ITEMS_PER_PAGE = 50;

export default function AuditLogPage() {
  const {
    events,
    count,
    isLoading,
    error,
    refetch,
    setSearch,
    setCategory,
    setActor,
    setDateRange,
    setOffset,
    options,
  } = useAuditEvents();

  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setLocalDateRange] = useState({ from: '', to: '' });

  const handleSearchChange = (search: string) => {
    setSearch(search);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: AuditCategory | '') => {
    setCategory(category);
    setCurrentPage(1);
  };

  const handleActorChange = (actor: string) => {
    setActor(actor);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: { from: string; to: string }) => {
    setLocalDateRange(range);
    setDateRange(range.from, range.to);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setOffset((page - 1) * ITEMS_PER_PAGE);
  };

  const handleExportCsv = () => {
    const headers = [
      'timestamp_utc',
      'actor_name',
      'actor_kind',
      'action',
      'target_kind',
      'target_label',
      'target_id',
      'ip_address',
      'user_agent',
      'metadata_json',
    ];
    const rows = events.map((event) => [
      event.created_at,
      event.actor_user_id ?? 'System',
      event.actor_kind,
      event.action,
      event.target_kind,
      event.target_label ?? '',
      event.target_id ?? '',
      event.ip_address ?? '',
      event.user_agent ?? '',
      JSON.stringify(event.metadata),
    ]);
    downloadCsv(`audit_log_${csvTimestamp()}.csv`, headers, rows);
  };

  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE);

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground">Activity</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Audit Log
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Append-only record of account-affecting actions.
              </p>
            </div>
            {count !== null && !isLoading && (
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap flex-shrink-0 sm:self-end sm:pb-1">
                Showing{' '}
                <span className="text-foreground font-medium">
                  {events.length.toLocaleString()}
                </span>{' '}
                of {count.toLocaleString()} events
              </span>
            )}
          </div>

          <div className="mb-5 pb-4 border-b border-border">
            <AuditToolbar
              search={options.search}
              onSearchChange={handleSearchChange}
              category={options.category}
              onCategoryChange={handleCategoryChange}
              actor={options.actor}
              onActorChange={handleActorChange}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onRefresh={refetch}
              onExportCsv={handleExportCsv}
              isLoading={isLoading}
            />
          </div>

          {isLoading && events.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading audit events…</p>
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
          ) : events.length === 0 ? (
            <EmptyState
              title="No audit events"
              description="Activity will appear here as actions are performed."
            />
          ) : (
            <>
              <AuditTable events={events} isLoading={false} error={null} />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={count ?? 0}
                  onItemsPerPageChange={() => {}}
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
