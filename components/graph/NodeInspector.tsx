'use client';

import React, { useState } from 'react';
import { MODEL_OPTIONS, ROLE_OPTIONS } from '@/types/agent';
import {
  AUTONOMOUS_TOOLS,
  REASONING_EFFORTS,
  type GraphAgentSpec,
} from '@/types/graph';
import { Trash2, Bot } from 'lucide-react';

const fieldLabel =
  'text-[11px] font-medium text-muted-foreground uppercase tracking-wider';
const inputBase =
  'w-full h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const textareaBase =
  'w-full rounded-md border border-border bg-input text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground resize-y transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

interface NodeInspectorProps {
  spec: GraphAgentSpec;
  onChange: (patch: Partial<GraphAgentSpec>) => void;
  onDelete: () => void;
  duplicateName?: boolean;
}

export function NodeInspector({
  spec,
  onChange,
  onDelete,
  duplicateName,
}: NodeInspectorProps) {
  const isAuto = spec.max_loops === 'auto';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-4 h-4 text-accent flex-shrink-0" />
          <h2 className="text-sm font-semibold text-foreground truncate">
            Agent node
          </h2>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-danger hover:border-danger/40 hover:bg-danger/5 transition-colors"
          title="Delete node"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {/* Identity */}
      <Section title="Identity">
        <Field label="Name (node ID)">
          <input
            type="text"
            value={spec.agent_name}
            onChange={(e) => onChange({ agent_name: e.target.value })}
            placeholder="ResearchAgent"
            className={`${inputBase} font-mono ${
              duplicateName ? 'border-danger focus-visible:ring-danger' : ''
            }`}
          />
          {duplicateName && (
            <span className="text-[11px] text-danger">
              Name must be unique. It identifies this node in the graph.
            </span>
          )}
        </Field>

        <Field label="Model" hint="Any model id the platform supports.">
          <input
            type="text"
            list="graph-model-options"
            value={spec.model_name || ''}
            onChange={(e) => onChange({ model_name: e.target.value })}
            placeholder="gpt-4.1, openai/o3-mini, claude-sonnet-4-20250514…"
            className={`${inputBase} font-mono`}
          />
          <datalist id="graph-model-options">
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </datalist>
        </Field>

        <Field label="Role">
          <select
            value={spec.role || 'worker'}
            onChange={(e) => onChange({ role: e.target.value })}
            className={inputBase}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea
            value={spec.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What this agent is responsible for…"
            rows={2}
            className={textareaBase}
          />
        </Field>
      </Section>

      {/* Prompt */}
      <Section title="Prompt">
        <Field label="System prompt">
          <textarea
            value={spec.system_prompt || ''}
            onChange={(e) => onChange({ system_prompt: e.target.value })}
            placeholder="You are an expert in…"
            rows={5}
            className={`${textareaBase} font-mono`}
          />
        </Field>
        <Toggle
          label="Auto-generate prompt"
          description="Let the agent write its own system prompt from the task."
          checked={spec.auto_generate_prompt ?? false}
          onChange={(v) => onChange({ auto_generate_prompt: v })}
        />
      </Section>

      {/* Generation */}
      <Section title="Generation">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Temperature">
            <input
              type="number"
              step="0.1"
              min={0}
              max={2}
              value={spec.temperature ?? 0.5}
              onChange={(e) =>
                onChange({ temperature: parseFloat(e.target.value) || 0 })
              }
              className={inputBase}
            />
          </Field>
          <Field label="Max tokens">
            <input
              type="number"
              min={1}
              value={spec.max_tokens ?? 8192}
              onChange={(e) =>
                onChange({ max_tokens: parseInt(e.target.value) || 8192 })
              }
              className={inputBase}
            />
          </Field>
        </div>

        <Toggle
          label="Autonomous (max_loops: auto)"
          description="Loop until the task is complete instead of a fixed count."
          checked={isAuto}
          onChange={(v) => onChange({ max_loops: v ? 'auto' : 1 })}
        />

        {!isAuto && (
          <Field label="Max loops">
            <input
              type="number"
              min={1}
              value={typeof spec.max_loops === 'number' ? spec.max_loops : 1}
              onChange={(e) =>
                onChange({ max_loops: parseInt(e.target.value) || 1 })
              }
              className={inputBase}
            />
          </Field>
        )}

        <Toggle
          label="Dynamic temperature"
          description="Adjust temperature automatically per task."
          checked={spec.dynamic_temperature_enabled ?? true}
          onChange={(v) => onChange({ dynamic_temperature_enabled: v })}
        />
        <Toggle
          label="Streaming"
          description="Stream output tokens as they are produced."
          checked={spec.streaming_on ?? false}
          onChange={(v) => onChange({ streaming_on: v })}
        />
      </Section>

      {/* Reasoning */}
      <Section title="Reasoning">
        <Toggle
          label="Enable reasoning"
          description="Allow the agent to reason before responding."
          checked={spec.reasoning_enabled ?? false}
          onChange={(v) => onChange({ reasoning_enabled: v })}
        />
        {spec.reasoning_enabled && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Effort">
              <select
                value={spec.reasoning_effort || 'low'}
                onChange={(e) => onChange({ reasoning_effort: e.target.value })}
                className={inputBase}
              >
                {REASONING_EFFORTS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Thinking tokens">
              <input
                type="number"
                min={0}
                value={spec.thinking_tokens ?? 0}
                onChange={(e) =>
                  onChange({ thinking_tokens: parseInt(e.target.value) || 0 })
                }
                className={inputBase}
              />
            </Field>
          </div>
        )}
      </Section>

      {/* Tools & MCP */}
      <Section title="Tools & MCP">
        <Toggle
          label="Summarize tool calls"
          description="Condense tool-call output into a summary."
          checked={spec.tool_call_summary ?? true}
          onChange={(v) => onChange({ tool_call_summary: v })}
        />
        <Field label="MCP server URL" hint="Connect the agent to an MCP server.">
          <input
            type="url"
            value={spec.mcp_url || ''}
            onChange={(e) => onChange({ mcp_url: e.target.value })}
            placeholder="https://your-mcp-server/mcp"
            className={`${inputBase} font-mono`}
          />
        </Field>

        {isAuto && (
          <Field
            label="Selected tools"
            hint="Restrict the autonomous looper to these tools (all safe tools if none selected)."
          >
            <div className="grid grid-cols-2 gap-1.5">
              {AUTONOMOUS_TOOLS.map((tool) => {
                const selected = spec.selected_tools?.includes(tool) ?? false;
                return (
                  <label
                    key={tool}
                    className="flex items-center gap-1.5 text-[11px] text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = new Set(spec.selected_tools ?? []);
                        if (e.target.checked) current.add(tool);
                        else current.delete(tool);
                        onChange({ selected_tools: [...current] });
                      }}
                      className="accent-accent"
                    />
                    <span className="font-mono truncate">{tool}</span>
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      </Section>

      {/* Advanced */}
      <Section title="Advanced">
        <JsonField
          label="LLM args (JSON)"
          hint="Extra args passed to the model, e.g. top_p, frequency_penalty."
          value={spec.llm_args}
          onCommit={(obj) => onChange({ llm_args: obj })}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-border first:border-t-0 first:pt-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={fieldLabel}>{label}</label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-muted/50 transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

/**
 * JSON editor with local draft state — commits the parsed object on blur so the
 * user can type freely without each keystroke being parsed. Seeded once from the
 * spec (the inspector is remounted per node via a React key).
 */
function JsonField({
  label,
  hint,
  value,
  onCommit,
}: {
  label: string;
  hint?: string;
  value: Record<string, unknown> | undefined;
  onCommit: (obj: Record<string, unknown> | undefined) => void;
}) {
  const [text, setText] = useState(() =>
    value && Object.keys(value).length ? JSON.stringify(value, null, 2) : ''
  );
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(null);
      onCommit(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setError(null);
        onCommit(parsed as Record<string, unknown>);
      } else {
        setError('Must be a JSON object.');
      }
    } catch {
      setError('Invalid JSON.');
    }
  };

  return (
    <Field label={label} hint={error ? undefined : hint}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        placeholder='{ "top_p": 0.9 }'
        rows={3}
        spellCheck={false}
        className={`${textareaBase} font-mono ${
          error ? 'border-danger focus-visible:ring-danger' : ''
        }`}
      />
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </Field>
  );
}
