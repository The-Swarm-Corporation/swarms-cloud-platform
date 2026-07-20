'use client';

import React, { useState } from 'react';
import { SwarmLogEntry } from '@/lib/hooks/useSwarmLogs';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function formatDate(timestamp: string | null): string {
  if (!timestamp) return ' - ';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function stringifyResponse(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.text === 'string') return rec.text;
    if (typeof rec.content === 'string') return rec.content;
    if (typeof rec.message === 'string') return rec.message;
    if (typeof rec.result === 'string') return rec.result;
    if (Array.isArray(value)) {
      return value
        .map((it) =>
          typeof it === 'string' ? it : JSON.stringify(it, null, 2)
        )
        .join('\n\n');
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function LogCard({ entry }: { entry: SwarmLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const responseText = stringifyResponse(entry.response);

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 hover:border-accent transition-all duration-300 w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h3
              className="text-sm font-bold text-foreground font-mono truncate"
              title={entry.agentName || entry.endpoint || 'Log'}
            >
              {entry.agentName || entry.endpoint || `Log ${entry.id}`}
            </h3>
            {entry.success ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-danger" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono flex-wrap">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="break-all">{formatDate(entry.timestamp)}</span>
            <span className="text-muted-foreground flex-shrink-0">•</span>
            <span className="text-accent/60 break-all">
              ID: {entry.id.slice(0, 12)}
            </span>
            {entry.endpoint && (
              <>
                <span className="text-muted-foreground flex-shrink-0">•</span>
                <span className="text-muted-foreground break-all">
                  {entry.endpoint}
                </span>
              </>
            )}
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-mono font-semibold flex-shrink-0 self-start ${
            entry.success
              ? 'bg-success/10 text-success border border-success/50'
              : 'bg-danger/10 text-danger border border-danger/50'
          }`}
        >
          {entry.success ? 'SUCCESS' : 'FAILED'}
        </div>
      </div>

      {/* Task */}
      {entry.task && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Task
          </div>
          <div className="bg-subtle border border-border rounded p-3 text-xs text-foreground/90 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {entry.task}
          </div>
        </div>
      )}

      {/* Response */}
      {responseText && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Response
            </div>
            {responseText.length > 600 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Expand
                  </>
                )}
              </button>
            )}
          </div>
          <div
            className={`bg-muted border border-border rounded p-3 sm:p-4 overflow-x-auto ${
              expanded ? 'max-h-[600px]' : 'max-h-64 sm:max-h-80'
            } overflow-y-auto`}
          >
            <pre className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap break-words font-mono">
              {responseText}
            </pre>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {entry.usage && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 pt-2 border-t border-border">
          {entry.usage.input_tokens !== undefined && (
            <UsageStat
              icon={<Zap className="w-3 h-3 text-accent" />}
              label="Input"
              value={`${entry.usage.input_tokens.toLocaleString()} tokens`}
              tone="accent"
            />
          )}
          {entry.usage.output_tokens !== undefined && (
            <UsageStat
              icon={<Zap className="w-3 h-3 text-success" />}
              label="Output"
              value={`${entry.usage.output_tokens.toLocaleString()} tokens`}
              tone="success"
            />
          )}
          {entry.usage.total_tokens !== undefined && (
            <UsageStat
              icon={<Zap className="w-3 h-3 text-accent" />}
              label="Total"
              value={`${entry.usage.total_tokens.toLocaleString()} tokens`}
              tone="accent"
            />
          )}
          {entry.usage.total_cost !== undefined && (
            <UsageStat
              icon={<DollarSign className="w-3 h-3 text-success" />}
              label="Cost"
              value={`$${entry.usage.total_cost.toFixed(4)}`}
              tone="success"
            />
          )}
        </div>
      )}
    </div>
  );
}

function UsageStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'accent' | 'success';
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="text-xs font-mono min-w-0">
        <div className="text-muted-foreground">{label}</div>
        <div className={tone === 'accent' ? 'text-accent' : 'text-success'}>
          {value}
        </div>
      </div>
    </div>
  );
}
