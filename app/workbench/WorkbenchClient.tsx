'use client';

import React, { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AgentGrid } from '@/components/agents/AgentGrid';
import { AgentTable } from '@/components/agents/AgentTable';
import { AgentHeatmap } from '@/components/agents/AgentHeatmap';
import { AgentKanban } from '@/components/agents/AgentKanban';
import { AgentConfigForm } from '@/components/agents/AgentConfigForm';
import { AgentConfigsTable } from '@/components/agents/AgentConfigsTable';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import {
  ImageUploader,
  type UploadedImage,
} from '@/components/ui/ImageUploader';
import { SnippetPreview } from '@/components/ui/SnippetPreview';
import { OutputsPanel } from '@/components/outputs/OutputsPanel';
import { ViewModeSwitcher } from '@/components/dashboard/ViewModeSwitcher';
import { useUIStore } from '@/lib/store/ui-store';
import { useAgents } from '@/lib/hooks/useAgents';
import { useAgentExecution } from '@/lib/hooks/useAgentExecution';
import { Agent, AgentConfig } from '@/types/agent';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function WorkbenchPage() {
  const viewMode = useUIStore((state) => state.viewMode);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isConfigsModalOpen, setIsConfigsModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AgentConfig | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [executingAgent, setExecutingAgent] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [taskImages, setTaskImages] = useState<UploadedImage[]>([]);

  const { createAgent, updateAgent } = useAgents();
  const { executeAgent, isExecuting } = useAgentExecution();

  const handleCreateAgent = (config: AgentConfig) => {
    if (editingAgent) {
      updateAgent(editingAgent.id, { config });
      setEditingAgent(null);
    } else {
      createAgent(config);
    }
    setIsCreateModalOpen(false);
  };

  const handleSelectConfig = (config: AgentConfig) => {
    setSelectedConfig(config);
    setEditingAgent(null);
    setIsConfigsModalOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsCreateModalOpen(true);
  };

  const handleExecuteAgent = (agent: Agent) => {
    setExecutingAgent(agent);
    setIsExecuteModalOpen(true);
  };

  const handleRunTask = async () => {
    if (executingAgent && taskInput.trim()) {
      try {
        const opts =
          taskImages.length > 0
            ? { imgs: taskImages.map((img) => img.base64) }
            : undefined;
        await executeAgent(
          executingAgent.id,
          executingAgent.config,
          taskInput,
          opts
        );
        setIsExecuteModalOpen(false);
        setTaskInput('');
        setTaskImages([]);
        setExecutingAgent(null);
      } catch {
        /* surfaced via toast */
      }
    }
  };

  // Mirror the exact payload the server route will send to /v1/agent/completions
  // so the snippet preview always matches what the user is about to run.
  const previewPayload = useMemo(() => {
    if (!executingAgent) return null;
    return {
      agent_config: executingAgent.config,
      task: taskInput,
      ...(taskImages.length > 0
        ? { imgs: taskImages.map((img) => img.base64) }
        : {}),
    };
  }, [executingAgent, taskInput, taskImages]);

  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <div className="page-wrapper">
      <Navbar />

      <main
        className={`page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 transition-[padding] duration-200 box-border ${
          sidebarOpen ? 'xl:pr-[500px] 2xl:pr-[560px]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Page header */}
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs text-muted-foreground">Build</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Workbench
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Create, configure, and execute agents across grid, table, heatmap, and kanban views.
            </p>
          </div>

          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-border">
            <ViewModeSwitcher />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsConfigsModalOpen(true)}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Configurations</span>
                <span className="sm:hidden">Configs</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New agent</span>
              </Button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <AgentGrid
              onCreateAgent={() => setIsCreateModalOpen(true)}
              onEditAgent={handleEditAgent}
              onExecuteAgent={handleExecuteAgent}
            />
          ) : viewMode === 'table' ? (
            <AgentTable
              onCreateAgent={() => setIsCreateModalOpen(true)}
              onEditAgent={handleEditAgent}
              onExecuteAgent={handleExecuteAgent}
            />
          ) : viewMode === 'heatmap' ? (
            <AgentHeatmap
              onCreateAgent={() => setIsCreateModalOpen(true)}
              onEditAgent={handleEditAgent}
              onExecuteAgent={handleExecuteAgent}
            />
          ) : (
            <AgentKanban
              onCreateAgent={() => setIsCreateModalOpen(true)}
              onEditAgent={handleEditAgent}
              onExecuteAgent={handleExecuteAgent}
            />
          )}
        </div>
      </main>

      {/* Create/Edit Agent Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAgent(null);
          setSelectedConfig(null);
        }}
        title={editingAgent ? 'Edit agent' : 'Create new agent'}
      >
        <AgentConfigForm
          initialConfig={editingAgent?.config || selectedConfig || undefined}
          onSubmit={handleCreateAgent}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingAgent(null);
            setSelectedConfig(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isConfigsModalOpen}
        onClose={() => setIsConfigsModalOpen(false)}
        title="Agent configurations"
        size="large"
      >
        <AgentConfigsTable onSelectConfig={handleSelectConfig} />
      </Modal>

      <Modal
        isOpen={isExecuteModalOpen}
        onClose={() => {
          setIsExecuteModalOpen(false);
          setTaskInput('');
          setTaskImages([]);
          setExecutingAgent(null);
        }}
        title={`Execute: ${executingAgent?.config.agent_name ?? ''}`}
        size="large"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setIsExecuteModalOpen(false);
                setTaskInput('');
                setTaskImages([]);
                setExecutingAgent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleRunTask}
              isLoading={isExecuting}
              disabled={!taskInput.trim() || isExecuting}
            >
              {isExecuting ? 'Executing…' : 'Execute'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Task"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="e.g. Analyze the latest AI trends and provide a summary…"
            rows={6}
            showCharCount
            helperText="Be specific and clear about what you want the agent to accomplish."
            autoFocus
          />

          <ImageUploader
            value={taskImages}
            onChange={setTaskImages}
            label="Attached images"
            helperText="Sent as base64 in the `imgs` field of the request."
          />

          {executingAgent && (
            <div className="rounded-lg border border-border bg-subtle p-3.5 w-full min-w-0 overflow-hidden">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2.5">
                Configuration
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <Detail label="Model" value={executingAgent.config.model_name} mono />
                <Detail label="Temperature" value={String(executingAgent.config.temperature)} mono />
                <Detail label="Max loops" value={String(executingAgent.config.max_loops)} mono />
                <Detail label="Max tokens" value={String(executingAgent.config.max_tokens)} mono />
              </div>
            </div>
          )}

          {previewPayload && (
            <SnippetPreview
              endpoint="/v1/agent/completions"
              method="POST"
              payload={previewPayload}
              title="Request preview"
            />
          )}
        </div>
      </Modal>

      <OutputsPanel />
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 min-w-0">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span
        className={`text-foreground truncate text-right ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
