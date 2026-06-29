'use client';

import { RefreshCw, Download, Search } from 'lucide-react';
import { AUDIT_CATEGORIES, type AuditCategory } from '@/lib/audit/types';

interface AuditToolbarProps {
  search?: string;
  onSearchChange: (search: string) => void;
  category?: AuditCategory | '';
  onCategoryChange: (category: AuditCategory | '') => void;
  actor?: string;
  onActorChange: (actor: string) => void;
  dateRange?: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  isLoading: boolean;
}

export function AuditToolbar({
  search = '',
  onSearchChange,
  category = '',
  onCategoryChange,
  actor = '',
  onActorChange,
  dateRange = { from: '', to: '' },
  onDateRangeChange,
  onRefresh,
  onExportCsv,
  isLoading,
}: AuditToolbarProps) {
  const range = dateRange ?? { from: '', to: '' };
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Date:</label>
          <select
            value={getDatePreset(range)}
            onChange={(e) => handleDatePresetChange(e.target.value, onDateRangeChange)}
            className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All time</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="custom">Custom</option>
          </select>
          {getDatePreset(range) === 'custom' && (
            <>
              <input
                type="date"
                value={range.from}
                onChange={(e) => onDateRangeChange({ ...range, from: e.target.value })}
                className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={range.to}
                onChange={(e) => onDateRangeChange({ ...range, to: e.target.value })}
                className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Category:</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as AuditCategory | '')}
            className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All</option>
            {AUDIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Actor:</label>
          <select
            value={actor}
            onChange={(e) => onActorChange(e.target.value)}
            className="px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="self">Self</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function getDatePreset(range: { from: string; to: string }): string {
  if (!range.from && !range.to) return 'all';
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const from = range.from ? new Date(range.from) : null;
  const to = range.to ? new Date(range.to) : null;

  if (!from || !to) return 'custom';
  if (Math.abs(from.getTime() - dayAgo.getTime()) < 60 * 1000 && Math.abs(to.getTime() - now.getTime()) < 60 * 1000) return '24h';
  if (Math.abs(from.getTime() - weekAgo.getTime()) < 60 * 1000 && Math.abs(to.getTime() - now.getTime()) < 60 * 1000) return '7d';
  if (Math.abs(from.getTime() - monthAgo.getTime()) < 60 * 1000 && Math.abs(to.getTime() - now.getTime()) < 60 * 1000) return '30d';
  return 'custom';
}

function handleDatePresetChange(
  preset: string,
  onChange: (range: { from: string; to: string }) => void
) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toStr = () => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  switch (preset) {
    case 'all':
      onChange({ from: '', to: '' });
      break;
    case '24h': {
      const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      onChange({ from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, to: toStr() });
      break;
    }
    case '7d': {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      onChange({ from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, to: toStr() });
      break;
    }
    case '30d': {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      onChange({ from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, to: toStr() });
      break;
    }
    case 'custom':
      break;
  }
}
