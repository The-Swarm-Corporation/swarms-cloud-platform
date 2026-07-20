'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useBillingHistory } from '@/lib/hooks/useBillingHistory';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/SearchBar';
import { Loader2, ExternalLink } from 'lucide-react';

const PER_PAGE = 5;

type Kind = 'subscription' | 'payment';

interface HistoryRow {
  id: string;
  kind: Kind;
  date: number;
  label: string;
  status: string | null;
  amount: number | null;
  currency: string;
  interval: string | null;
  url: string | null;
  number: string | null;
  cancelAtPeriodEnd: boolean;
}

function money(amount: number | null, currency: string): string {
  if (amount == null) return ' - ';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100);
}

function displayDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isoDate(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

function statusTone(status: string | null): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'trialing' || s === 'paid')
    return 'border-success/40 bg-success/10 text-success';
  if (s === 'past_due' || s === 'open' || s === 'unpaid' || s === 'incomplete')
    return 'border-warning/40 bg-warning/10 text-warning';
  return 'border-border bg-subtle text-muted-foreground';
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 h-5 rounded-sm border text-[10px] font-medium uppercase tracking-wider ${statusTone(
        status
      )}`}
    >
      {status || 'unknown'}
    </span>
  );
}

const th = 'text-left font-medium px-3 h-9 whitespace-nowrap';
const thRight = 'text-right font-medium px-3 h-9 whitespace-nowrap';
const td = 'px-3 py-2.5 align-middle';

export function BillingHistory() {
  const { data, isLoading } = useBillingHistory();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Merge subscriptions + payments into a single, date-sorted history.
  const rows = useMemo<HistoryRow[]>(() => {
    if (!data) return [];
    const subs: HistoryRow[] = data.subscriptions.map((s) => ({
      id: `sub_${s.id}`,
      kind: 'subscription',
      date: s.created,
      label: s.plan,
      status: s.status,
      amount: s.amount,
      currency: s.currency,
      interval: s.interval,
      url: null,
      number: null,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    }));
    const pays: HistoryRow[] = data.payments.map((p) => ({
      id: `pay_${p.id}`,
      kind: 'payment',
      date: p.created,
      label: p.description || 'Payment',
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      interval: null,
      url: p.url,
      number: p.number,
      cancelAtPeriodEnd: false,
    }));
    return [...subs, ...pays].sort((a, b) => b.date - a.date);
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.kind,
        r.label,
        r.status ?? '',
        r.number ?? '',
        money(r.amount, r.currency),
        displayDate(r.date),
        isoDate(r.date),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  if (isLoading && !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading billing history…</p>
      </div>
    );
  }

  if (!data) return null;
  if (!data.configured && rows.length === 0) return null;

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Billing history
        </h3>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by date, plan, status, amount…"
          className="w-full sm:w-72"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-subtle/40 px-3 py-6 text-center text-xs text-muted-foreground">
          No subscriptions or payments yet.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-subtle text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className={th}>Date</th>
                    <th className={th}>Item</th>
                    <th className={th}>Status</th>
                    <th className={thRight}>Amount</th>
                    <th className={thRight}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-xs text-muted-foreground"
                      >
                        No results for “{query}”.
                      </td>
                    </tr>
                  ) : (
                    slice.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-b-0">
                        <td className={`${td} tabular-nums text-foreground whitespace-nowrap`}>
                          {displayDate(r.date)}
                        </td>
                        <td className={`${td} text-foreground`}>
                          <span className="font-medium">{r.label}</span>
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {r.kind === 'subscription' ? 'Subscription' : 'Payment'}
                          </span>
                          {r.cancelAtPeriodEnd && (
                            <span className="ml-2 text-[10px] text-warning">cancels</span>
                          )}
                        </td>
                        <td className={td}>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className={`${td} text-right tabular-nums text-foreground`}>
                          {money(r.amount, r.currency)}
                          {r.interval && (
                            <span className="text-muted-foreground">/{r.interval}</span>
                          )}
                        </td>
                        <td className={`${td} text-right`}>
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                            >
                              {r.number || 'View'}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground"> - </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={current}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={PER_PAGE}
            totalItems={filtered.length}
          />
        </>
      )}
    </div>
  );
}
