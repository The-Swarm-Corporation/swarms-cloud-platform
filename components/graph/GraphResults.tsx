'use client';

import React, { useState } from 'react';
import type { GraphWorkflowOutput } from '@/types/graph';
import {
  CheckCircle2,
  XCircle,
  Users,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

function stringify(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (typeof rec.content === 'string') return rec.content;
    if (typeof rec.text === 'string') return rec.text;
    if (typeof rec.output === 'string') return rec.output;
    if (typeof rec.response === 'string') return rec.response;
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function GraphResults({ result }: { result: GraphWorkflowOutput }) {
  const [copied, setCopied] = useState(false);
  const success = (result.status || '').toLowerCase().includes('success');
  const outputs = result.outputs || {};
  const entries = Object.entries(outputs);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 h-11 border-b border-border bg-subtle/50">
        <div className="flex items-center gap-2 min-w-0">
          {success ? (
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-foreground truncate">
            {result.name || 'Workflow result'}
          </span>
          {result.status && (
            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border flex-shrink-0">
              {result.status}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="Copy raw JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border border-b border-border">
        <Stat
          icon={<Users className="w-3 h-3 text-accent" />}
          label="Nodes"
          value={entries.length.toString()}
        />
        <Stat
          icon={<Zap className="w-3 h-3 text-success" />}
          label="Tokens"
          value={
            typeof result.usage?.total_tokens === 'number'
              ? result.usage.total_tokens.toLocaleString()
              : '—'
          }
        />
        <Stat
          icon={<DollarSign className="w-3 h-3 text-success" />}
          label="Cost"
          value={
            typeof result.usage?.token_cost === 'number'
              ? `$${result.usage.token_cost.toFixed(4)}`
              : '—'
          }
        />
      </div>

      {entries.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No node outputs returned.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {entries.map(([name, value], i) => (
            <NodeOutput
              key={name}
              index={i}
              name={name}
              text={stringify(value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card px-3 py-2.5 flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-mono text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}

function NodeOutput({
  index,
  name,
  text,
}: {
  index: number;
  name: string;
  text: string;
}) {
  const isLong = text.length > 600;
  const [expanded, setExpanded] = useState(!isLong);
  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] tabular-nums font-mono text-muted-foreground flex-shrink-0">
            #{index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground font-mono truncate">
            {name}
          </span>
        </div>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
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
        className={`bg-muted border border-border rounded p-3 overflow-y-auto ${
          expanded ? 'max-h-[600px]' : 'max-h-40'
        }`}
      >
        <pre className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap break-words font-mono">
          {text || '—'}
        </pre>
      </div>
    </div>
  );
}
