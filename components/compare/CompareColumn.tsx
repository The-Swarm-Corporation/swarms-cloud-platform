'use client';

import React, { useState } from 'react';
import { AgentConfig, AgentExecutionResponse, ROLE_OPTIONS } from '@/types/agent';
import {
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Clock,
  Zap,
  DollarSign,
  Sparkles,
} from 'lucide-react';

export type CompareStatus = 'idle' | 'running' | 'success' | 'error';

export interface CompareColumnState {
  id: string;
  config: AgentConfig;
  status: CompareStatus;
  result?: AgentExecutionResponse;
  error?: string;
  durationMs?: number;
}

interface CompareColumnProps {
  column: CompareColumnState;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<AgentConfig>) => void;
  onRemove: () => void;
  onImport: () => void;
}

const fieldLabel =
  'text-[11px] font-medium text-muted-foreground uppercase tracking-wider';
const inputBase =
  'w-full h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const textareaBase =
  'w-full rounded-md border border-border bg-input text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground resize-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Best-effort extraction of readable text from an agent's `outputs` payload. */
function extractOutputText(outputs: unknown): string {
  if (outputs == null) return '';
  if (typeof outputs === 'string') return outputs;

  if (Array.isArray(outputs)) {
    return outputs
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const role = typeof obj.role === 'string' ? obj.role : undefined;
          const content = obj.content ?? obj.text ?? obj.message ?? obj.result;
          const text =
            typeof content === 'string'
              ? content
              : content != null
              ? JSON.stringify(content, null, 2)
              : '';
          return role ? `${role}: ${text}` : text;
        }
        return JSON.stringify(item, null, 2);
      })
      .filter(Boolean)
      .join('\n\n');
  }

  if (typeof outputs === 'object') {
    const obj = outputs as Record<string, unknown>;
    const content = obj.content ?? obj.text ?? obj.message ?? obj.result;
    if (typeof content === 'string') return content;
    return JSON.stringify(outputs, null, 2);
  }

  return String(outputs);
}

function StatusBadge({ status }: { status: CompareStatus }) {
  if (status === 'running') {
    return <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />;
  }
  if (status === 'success') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />;
  }
  if (status === 'error') {
    return <XCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />;
  }
  return null;
}

export function CompareColumn({
  column,
  index,
  canRemove,
  onChange,
  onRemove,
  onImport,
}: CompareColumnProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { config, status, result, error, durationMs } = column;

  const outputText = result ? extractOutputText(result.outputs) : '';

  const copyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-11 border-b border-border bg-subtle/50 flex-shrink-0">
        <span className="text-[11px] tabular-nums font-mono text-muted-foreground flex-shrink-0">
          #{index + 1}
        </span>
        <input
          type="text"
          value={config.agent_name}
          onChange={(e) => onChange({ agent_name: e.target.value })}
          placeholder={`Agent ${index + 1}`}
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground font-medium focus:outline-none placeholder:text-muted-foreground"
        />
        <StatusBadge status={status} />
        <button
          type="button"
          onClick={onImport}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          title="Import a saved agent configuration"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:pointer-events-none flex-shrink-0"
          title={canRemove ? 'Remove agent' : 'At least 2 agents are required to compare'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Config */}
      <div className="p-3.5 space-y-3 flex-shrink-0">
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>Model</label>
          <input
            type="text"
            list="compare-model-suggestions"
            value={config.model_name}
            onChange={(e) => onChange({ model_name: e.target.value })}
            placeholder="e.g. gpt-5.4"
            className={`${inputBase} font-mono`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>System prompt</label>
          <textarea
            value={config.system_prompt || ''}
            onChange={(e) => onChange({ system_prompt: e.target.value })}
            placeholder="You are an expert in…"
            rows={3}
            className={`${textareaBase} font-mono`}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {advancedOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            Advanced settings
          </button>

          {advancedOpen && (
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Role</label>
                <select
                  value={config.role || 'worker'}
                  onChange={(e) => onChange({ role: e.target.value })}
                  className={inputBase}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={2}
                  value={config.temperature ?? 0.7}
                  onChange={(e) =>
                    onChange({ temperature: parseFloat(e.target.value) || 0 })
                  }
                  className={inputBase}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Max loops</label>
                <input
                  type="number"
                  min={1}
                  value={config.max_loops ?? 1}
                  onChange={(e) =>
                    onChange({ max_loops: parseInt(e.target.value) || 1 })
                  }
                  className={inputBase}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Max tokens</label>
                <input
                  type="number"
                  min={1}
                  value={config.max_tokens ?? 8192}
                  onChange={(e) =>
                    onChange({ max_tokens: parseInt(e.target.value) || 8192 })
                  }
                  className={inputBase}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="border-t border-border flex flex-col flex-1 min-h-[220px]">
        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Run the comparison to see this agent&apos;s response.
            </p>
          </div>
        )}

        {status === 'running' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground">Running…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex-1 p-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 break-words whitespace-pre-line">
                {error || 'Run failed'}
              </p>
            </div>
          </div>
        )}

        {status === 'success' && result && (
          <>
            <div className="grid grid-cols-3 gap-px bg-border border-b border-border flex-shrink-0">
              <Stat
                icon={<Clock className="w-3 h-3 text-accent" />}
                value={
                  typeof durationMs === 'number'
                    ? `${(durationMs / 1000).toFixed(2)}s`
                    : '—'
                }
              />
              <Stat
                icon={<Zap className="w-3 h-3 text-success" />}
                value={
                  typeof result.usage?.total_tokens === 'number'
                    ? result.usage.total_tokens.toLocaleString()
                    : '—'
                }
              />
              <Stat
                icon={<DollarSign className="w-3 h-3 text-success" />}
                value={
                  typeof result.usage?.total_cost === 'number'
                    ? `$${result.usage.total_cost.toFixed(4)}`
                    : '—'
                }
              />
            </div>
            <div className="flex items-center justify-end px-3 py-1.5 border-b border-border">
              <button
                type="button"
                onClick={copyOutput}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-3.5 overflow-y-auto max-h-[420px]">
              <pre className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap break-words font-mono">
                {outputText || 'No output returned.'}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="bg-card px-2.5 py-2 flex items-center gap-1.5 justify-center">
      {icon}
      <span className="text-xs font-mono text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}
