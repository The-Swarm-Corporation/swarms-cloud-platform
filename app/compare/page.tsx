'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { AgentConfigsTable } from '@/components/agents/AgentConfigsTable';
import {
  CompareColumn,
  CompareColumnState,
} from '@/components/compare/CompareColumn';
import { useUIStore } from '@/lib/store/ui-store';
import { AgentConfig, AgentExecutionResponse, MODEL_OPTIONS } from '@/types/agent';
import { Plus, Download, Play, GitCompare } from 'lucide-react';

const MAX_COLUMNS = 6;
const MIN_COLUMNS = 2;

function newColumnId() {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeColumn(index: number, overrides?: Partial<AgentConfig>): CompareColumnState {
  const defaultModel = MODEL_OPTIONS[index % MODEL_OPTIONS.length]?.value || 'gpt-5.4';
  return {
    id: newColumnId(),
    status: 'idle',
    config: {
      agent_name: `Agent ${String.fromCharCode(65 + index)}`,
      model_name: defaultModel,
      role: 'worker',
      system_prompt: '',
      temperature: 0.7,
      max_loops: 1,
      max_tokens: 8192,
      ...overrides,
    },
  };
}

export default function ComparePage() {
  const addToast = useUIStore((s) => s.addToast);

  const [task, setTask] = useState('');
  const [columns, setColumns] = useState<CompareColumnState[]>([
    makeColumn(0),
    makeColumn(1),
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [importTargetId, setImportTargetId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const updateColumn = (id: string, patch: Partial<AgentConfig>) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, config: { ...c.config, ...patch } } : c)),
    );
  };

  const addColumn = () => {
    setColumns((prev) => {
      if (prev.length >= MAX_COLUMNS) return prev;
      return [...prev, makeColumn(prev.length)];
    });
  };

  const removeColumn = (id: string) => {
    setColumns((prev) =>
      prev.length <= MIN_COLUMNS ? prev : prev.filter((c) => c.id !== id),
    );
  };

  const openImport = (targetId: string | null) => {
    setImportTargetId(targetId);
    setIsImportOpen(true);
  };

  const handleImportSelect = (config: AgentConfig) => {
    setColumns((prev) => {
      if (importTargetId) {
        return prev.map((c) =>
          c.id === importTargetId
            ? { ...c, config: { ...config }, status: 'idle', result: undefined, error: undefined }
            : c,
        );
      }
      if (prev.length >= MAX_COLUMNS) return prev;
      return [...prev, { id: newColumnId(), status: 'idle', config: { ...config } }];
    });
    setIsImportOpen(false);
    addToast({
      type: 'success',
      message: `Loaded "${config.agent_name}"`,
      duration: 2500,
    });
  };

  const canRun =
    !isRunning &&
    task.trim().length > 0 &&
    columns.filter((c) => c.config.agent_name.trim() && c.config.model_name.trim()).length >=
      MIN_COLUMNS;

  const runComparison = async () => {
    const trimmedTask = task.trim();
    if (!trimmedTask) {
      addToast({ type: 'error', message: 'Task is required', duration: 3000 });
      return;
    }
    if (
      columns.filter((c) => c.config.agent_name.trim() && c.config.model_name.trim()).length <
      MIN_COLUMNS
    ) {
      addToast({
        type: 'error',
        message: `Add at least ${MIN_COLUMNS} agents to compare`,
        duration: 3000,
      });
      return;
    }

    setIsRunning(true);
    const runColumns = columns;
    setColumns((prev) =>
      prev.map((c) => ({ ...c, status: 'running', result: undefined, error: undefined, durationMs: undefined })),
    );

    await Promise.allSettled(
      runColumns.map(async (col) => {
        const startedAt = Date.now();
        try {
          const res = await fetch('/api/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_config: col.config, task: trimmedTask }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.error || `Request failed (${res.status})`);
          }
          const durationMs = Date.now() - startedAt;
          setColumns((prev) =>
            prev.map((c) =>
              c.id === col.id
                ? { ...c, status: 'success', result: data as AgentExecutionResponse, durationMs }
                : c,
            ),
          );
        } catch (e: any) {
          setColumns((prev) =>
            prev.map((c) =>
              c.id === col.id
                ? { ...c, status: 'error', error: e?.message || 'Agent execution failed' }
                : c,
            ),
          );
        }
      }),
    );

    setIsRunning(false);
    addToast({ type: 'success', message: 'Comparison complete', duration: 2500 });
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <datalist id="compare-model-suggestions">
        {MODEL_OPTIONS.map((m) => (
          <option key={m.value} value={m.value} />
        ))}
      </datalist>

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Page header */}
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Compare</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-muted-foreground" />
              Compare agents
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Run the same task through 2 or more agents at once and see their
              responses side by side. Configure agents here or import saved
              configurations from{' '}
              <a href="/agents" className="text-accent hover:underline">
                /agents
              </a>
              .
            </p>
          </div>

          {/* Task + run, the primary action lives right under the input,
              not buried below the agent columns. */}
          <section className="rounded-lg border border-border bg-card p-4 sm:p-5 mb-5 space-y-3">
            <Textarea
              label="Task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What should every agent respond to? e.g. Summarize the tradeoffs of microservices vs a monolith."
              rows={3}
              showCharCount
              autoFocus
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {!task.trim()
                  ? 'Add a task, then run it through every agent below.'
                  : `Will run ${columns.length} agent${columns.length === 1 ? '' : 's'} on this task.`}
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={runComparison}
                disabled={!canRun}
                isLoading={isRunning}
                className="flex-shrink-0"
              >
                {!isRunning && <Play className="w-3.5 h-3.5" />}
                {isRunning ? 'Running…' : 'Run comparison'}
              </Button>
            </div>
          </section>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Agents{' '}
              <span className="text-muted-foreground font-normal tabular-nums">
                ({columns.length})
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openImport(null)}
                disabled={columns.length >= MAX_COLUMNS}
                title="Import a saved agent configuration"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import agent</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={addColumn}
                disabled={columns.length >= MAX_COLUMNS}
                title={
                  columns.length >= MAX_COLUMNS
                    ? `Up to ${MAX_COLUMNS} agents can be compared at once`
                    : 'Add a blank agent'
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add agent</span>
              </Button>
            </div>
          </div>

          {/* Columns */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {columns.map((col, i) => (
              <div key={col.id} className="flex-1 min-w-[300px] sm:min-w-[340px]">
                <CompareColumn
                  column={col}
                  index={i}
                  canRemove={columns.length > MIN_COLUMNS}
                  onChange={(patch) => updateColumn(col.id, patch)}
                  onRemove={() => removeColumn(col.id)}
                  onImport={() => openImport(col.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import saved configuration"
        size="large"
      >
        <AgentConfigsTable onSelectConfig={handleImportSelect} />
      </Modal>
    </div>
  );
}
