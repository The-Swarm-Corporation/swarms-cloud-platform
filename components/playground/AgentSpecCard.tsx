'use client';

import React from 'react';
import { SwarmAgentSpec } from '@/types/api';
import { MODEL_OPTIONS, ROLE_OPTIONS } from '@/types/agent';
import { Button } from '@/components/ui/Button';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface AgentSpecCardProps {
  index: number;
  agent: SwarmAgentSpec;
  onChange: (next: SwarmAgentSpec) => void;
  onRemove: () => void;
  canRemove: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}

const fieldLabel = 'text-[11px] font-medium text-muted-foreground uppercase tracking-wider';
const inputBase =
  'w-full h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const textareaBase =
  'w-full rounded-md border border-border bg-input text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground resize-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function AgentSpecCard({
  index,
  agent,
  onChange,
  onRemove,
  canRemove,
  expanded,
  onToggleExpand,
}: AgentSpecCardProps) {
  const update = (patch: Partial<SwarmAgentSpec>) =>
    onChange({ ...agent, ...patch });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 h-11 border-b border-border bg-subtle/50">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-[11px] tabular-nums font-mono text-muted-foreground flex-shrink-0">
          #{index + 1}
        </span>
        <input
          type="text"
          value={agent.agent_name || ''}
          onChange={(e) => update({ agent_name: e.target.value })}
          placeholder={`Agent ${index + 1}`}
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground font-medium focus:outline-none placeholder:text-muted-foreground"
        />
        <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0 hidden sm:inline">
          {agent.model_name || 'gpt-5.4'}
        </span>
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title={canRemove ? 'Remove agent' : 'At least one agent is required'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="p-3.5 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Model</label>
              <select
                value={agent.model_name || 'gpt-5.4'}
                onChange={(e) => update({ model_name: e.target.value })}
                className={inputBase}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Role</label>
              <select
                value={agent.role || 'worker'}
                onChange={(e) => update({ role: e.target.value })}
                className={inputBase}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>System prompt</label>
            <textarea
              value={agent.system_prompt || ''}
              onChange={(e) => update({ system_prompt: e.target.value })}
              placeholder="You are an expert in…"
              rows={3}
              className={`${textareaBase} font-mono`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Temperature</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={2}
                value={agent.temperature ?? 0.7}
                onChange={(e) =>
                  update({ temperature: parseFloat(e.target.value) || 0 })
                }
                className={inputBase}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Max loops</label>
              <input
                type="number"
                min={1}
                value={typeof agent.max_loops === 'number' ? agent.max_loops : 1}
                onChange={(e) =>
                  update({ max_loops: parseInt(e.target.value) || 1 })
                }
                className={inputBase}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Max tokens</label>
              <input
                type="number"
                min={1}
                value={agent.max_tokens ?? 8192}
                onChange={(e) =>
                  update({ max_tokens: parseInt(e.target.value) || 8192 })
                }
                className={inputBase}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
