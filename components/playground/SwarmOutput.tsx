'use client';

import React, { useState } from 'react';
import { SwarmCompletion } from '@/types/api';
import {
  Clock,
  Users,
  DollarSign,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

interface SwarmOutputProps {
  result: SwarmCompletion;
}

type Message = {
  role: string;
  content: string;
};

function looksLikeMessageList(value: unknown): value is Message[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      !Array.isArray(m) &&
      ('role' in m || 'agent_name' in m || 'name' in m) &&
      ('content' in m || 'output' in m || 'response' in m || 'text' in m)
  );
}

function normalizeMessage(raw: unknown): Message {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const role =
    (typeof obj.role === 'string' && obj.role) ||
    (typeof obj.agent_name === 'string' && obj.agent_name) ||
    (typeof obj.name === 'string' && obj.name) ||
    'agent';
  const contentRaw =
    obj.content ?? obj.output ?? obj.response ?? obj.text ?? obj.message ?? '';
  const content =
    typeof contentRaw === 'string'
      ? contentRaw
      : JSON.stringify(contentRaw, null, 2);
  return { role: String(role), content };
}

export function SwarmOutput({ result }: SwarmOutputProps) {
  const [copied, setCopied] = useState(false);
  const success = result.status?.toLowerCase().includes('success') || !!result.output;

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
            {result.swarm_name || 'Swarm result'}
          </span>
          {result.swarm_type && (
            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border flex-shrink-0">
              {result.swarm_type}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Copy raw JSON"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-b border-border">
        <Stat
          icon={<Users className="w-3 h-3 text-accent" />}
          label="Agents"
          value={result.number_of_agents?.toString() ?? ' - '}
        />
        <Stat
          icon={<Clock className="w-3 h-3 text-accent" />}
          label="Duration"
          value={
            typeof result.execution_time === 'number'
              ? `${result.execution_time.toFixed(2)}s`
              : ' - '
          }
        />
        <Stat
          icon={<Zap className="w-3 h-3 text-success" />}
          label="Tokens"
          value={
            typeof result.usage?.total_tokens === 'number'
              ? result.usage.total_tokens.toLocaleString()
              : ' - '
          }
        />
        <Stat
          icon={<DollarSign className="w-3 h-3 text-success" />}
          label="Cost"
          value={
            typeof result.usage?.total_cost === 'number'
              ? `$${result.usage.total_cost.toFixed(4)}`
              : ' - '
          }
        />
      </div>

      <OutputBody output={result.output} />
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

function OutputBody({ output }: { output: unknown }) {
  if (output == null) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No output returned.
      </div>
    );
  }

  if (typeof output === 'string') {
    return (
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono">
          {output}
        </pre>
      </div>
    );
  }

  if (looksLikeMessageList(output)) {
    return (
      <div className="divide-y divide-border">
        {(output as unknown[]).map((m, i) => {
          const msg = normalizeMessage(m);
          return <MessageRow key={i} index={i} message={msg} />;
        })}
      </div>
    );
  }

  if (Array.isArray(output)) {
    return (
      <div className="divide-y divide-border">
        {output.map((item, i) => (
          <div key={i} className="p-4 overflow-x-auto">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Item {i + 1}
            </div>
            <pre className="text-xs text-foreground/90 whitespace-pre-wrap break-words font-mono bg-muted border border-border rounded p-3 max-h-80 overflow-y-auto">
              {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  if (typeof output === 'object') {
    const entries = Object.entries(output as Record<string, unknown>);
    return (
      <div className="divide-y divide-border">
        {entries.map(([key, value]) => (
          <CollapsibleEntry
            key={key}
            label={key}
            value={value}
            defaultExpanded={entries.length <= 4}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <pre className="text-sm text-foreground font-mono">{String(output)}</pre>
    </div>
  );
}

function MessageRow({ index, message }: { index: number; message: Message }) {
  const isLong = message.content.length > 600;
  const [expanded, setExpanded] = useState(!isLong);
  return (
    <div className="p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] tabular-nums font-mono text-muted-foreground flex-shrink-0">
            #{index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground truncate">
            {message.role}
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
          {message.content}
        </pre>
      </div>
    </div>
  );
}

function CollapsibleEntry({
  label,
  value,
  defaultExpanded,
}: {
  label: string;
  value: unknown;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rendered =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <div className="p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left mb-2"
      >
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </button>
      {expanded && (
        <div className="bg-muted border border-border rounded p-3 max-h-[500px] overflow-y-auto">
          <pre className="text-xs text-foreground/90 whitespace-pre-wrap break-words font-mono">
            {rendered}
          </pre>
        </div>
      )}
    </div>
  );
}
