'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from '@xyflow/react';
import { Navbar } from '@/components/layout/Navbar';
import { SnippetPreview } from '@/components/ui/SnippetPreview';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { NodeInspector } from '@/components/graph/NodeInspector';
import { GraphResults } from '@/components/graph/GraphResults';
import { apiFetch } from '@/lib/api/client-fetch';
import {
  buildGraphPayload,
  validateGraph,
  deriveEndpoints,
  type AgentFlowNode,
  type AgentFlowEdge,
  type WorkflowMeta,
} from '@/lib/graph/build';
import type { GraphAgentSpec, GraphWorkflowOutput } from '@/types/graph';
import {
  Plus,
  Play,
  Loader2,
  XCircle,
  Network,
  Code2,
  ListTree,
  Info,
  AlertTriangle,
  LogIn,
  LogOut,
  Settings2,
  X,
  Save,
  Bookmark,
  Trash2,
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import type { SavedWorkflow } from '@/lib/store/workflow-store';

const fieldLabel =
  'text-[11px] font-medium text-muted-foreground uppercase tracking-wider';
const inputBase =
  'w-full h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type DrawerMode = 'none' | 'node' | 'settings' | 'output' | 'code' | 'saved';

function blankSpec(name: string): GraphAgentSpec {
  return {
    agent_name: name,
    model_name: 'gpt-4.1',
    role: 'worker',
    system_prompt: '',
    temperature: 0.5,
    max_loops: 1,
    max_tokens: 8192,
  };
}

const INITIAL_NODES: AgentFlowNode[] = [
  {
    id: 'node-research',
    type: 'agent',
    position: { x: 0, y: 80 },
    data: {
      spec: {
        agent_name: 'ResearchAgent',
        model_name: 'gpt-4.1',
        role: 'worker',
        system_prompt:
          'You are an expert researcher. Conduct thorough research and provide comprehensive findings.',
        temperature: 0.3,
        max_loops: 1,
        max_tokens: 4000,
      },
    },
  },
  {
    id: 'node-analysis',
    type: 'agent',
    position: { x: 320, y: 80 },
    data: {
      spec: {
        agent_name: 'AnalysisAgent',
        model_name: 'gpt-4.1',
        role: 'analyst',
        system_prompt:
          'You are an expert analyst. Analyze the provided research and extract key insights.',
        temperature: 0.3,
        max_loops: 1,
        max_tokens: 4000,
      },
    },
  },
];

const INITIAL_EDGES: AgentFlowEdge[] = [
  { id: 'edge-r-a', source: 'node-research', target: 'node-analysis' },
];

export default function GraphWorkflowPage() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<AgentFlowNode>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<AgentFlowEdge>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerMode>('none');

  const [name, setName] = useState('Research-Analysis-Workflow');
  const [task, setTask] = useState('');
  const [maxLoops, setMaxLoops] = useState(1);
  const [autoCompile, setAutoCompile] = useState(true);
  const [verbose, setVerbose] = useState(false);
  const [img, setImg] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GraphWorkflowOutput | null>(null);

  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const deleteWorkflow = useWorkflowStore((s) => s.deleteWorkflow);
  const savedWorkflows = useWorkflowStore((s) => s.savedWorkflows);

  const meta: WorkflowMeta = useMemo(
    () => ({ name, task, maxLoops, autoCompile, verbose, img }),
    [name, task, maxLoops, autoCompile, verbose, img]
  );

  const decoratedNodes = useMemo(() => {
    const { entryPoints, endPoints } = deriveEndpoints(nodes, edges);
    const entry = new Set(entryPoints);
    const end = new Set(endPoints);
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isEntry: entry.has(n.data.spec.agent_name.trim()),
        isEnd: end.has(n.data.spec.agent_name.trim()),
      },
    }));
  }, [nodes, edges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const selectedDuplicate = useMemo(() => {
    if (!selectedNode) return false;
    const nm = selectedNode.data.spec.agent_name.trim();
    if (!nm) return false;
    return nodes.filter((n) => n.data.spec.agent_name.trim() === nm).length > 1;
  }, [selectedNode, nodes]);

  const issues = useMemo(
    () => validateGraph(nodes, edges, meta),
    [nodes, edges, meta]
  );
  const endpoints = useMemo(() => deriveEndpoints(nodes, edges), [nodes, edges]);
  const payload = useMemo(
    () => buildGraphPayload(nodes, edges, meta),
    [nodes, edges, meta]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId(id);
    setDrawer('node');
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setDrawer((d) => (d === 'node' ? 'none' : d));
  }, []);

  const updateSelectedSpec = useCallback(
    (patch: Partial<GraphAgentSpec>) => {
      if (!selectedNodeId) return;
      setNodes((ns) =>
        ns.map((n) =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, spec: { ...n.data.spec, ...patch } } }
            : n
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
      )
    );
    setNodes((ns) => ns.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
    setDrawer('none');
  }, [selectedNodeId, setNodes, setEdges]);

  const addNode = useCallback(() => {
    setNodes((ns) => {
      const existing = new Set(ns.map((n) => n.data.spec.agent_name.trim()));
      let i = ns.length + 1;
      let candidate = `Agent${i}`;
      while (existing.has(candidate)) {
        i += 1;
        candidate = `Agent${i}`;
      }
      const last = ns[ns.length - 1];
      const position = last
        ? { x: last.position.x + 80, y: last.position.y + 140 }
        : { x: 0, y: 80 };
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `node-${crypto.randomUUID()}`
          : `node-${i}-${ns.length}`;
      const newNode: AgentFlowNode = {
        id,
        type: 'agent',
        position,
        data: { spec: blankSpec(candidate) },
      };
      setSelectedNodeId(id);
      setDrawer('node');
      return [...ns, newNode];
    });
  }, [setNodes]);

  const run = useCallback(async () => {
    if (issues.length > 0 || isRunning) return;
    setIsRunning(true);
    setError(null);
    setResult(null);
    setDrawer('output');
    try {
      const res = await apiFetch('/api/graph-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setResult(data as GraphWorkflowOutput);
      saveWorkflow({ name, nodes, edges, meta, result: data as GraphWorkflowOutput, error: null });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  }, [issues.length, isRunning, payload, name, nodes, edges, meta, saveWorkflow]);

  const canRun = !isRunning && issues.length === 0;

  const handleSave = useCallback(() => {
    saveWorkflow({ name, nodes, edges, meta, result, error });
  }, [name, nodes, edges, meta, result, error, saveWorkflow]);

  const handleLoad = useCallback(
    (id: string) => {
      const wf = useWorkflowStore.getState().getWorkflow(id);
      if (!wf) return;
      setNodes(wf.nodes);
      setEdges(wf.edges);
      setName(wf.name);
      setTask(wf.meta.task);
      setMaxLoops(wf.meta.maxLoops);
      setAutoCompile(wf.meta.autoCompile);
      setVerbose(wf.meta.verbose);
      setImg(wf.meta.img);
      setResult(wf.result);
      setError(wf.error);
      setSelectedNodeId(null);
      setDrawer('none');
    },
    [setNodes, setEdges]
  );

  const toggleDrawer = (mode: Exclude<DrawerMode, 'none' | 'node'>) => {
    setDrawer((d) => (d === mode ? 'none' : mode));
    setSelectedNodeId(null);
  };

  const wide = drawer === 'code' || drawer === 'output' || drawer === 'saved';

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background">
      <Navbar />

      <div className="relative flex-1 min-h-0">
        {/* Canvas fills the editor (leaves room for the docked task bar) */}
        <div className="absolute inset-x-0 top-0 bottom-14">
          <GraphCanvas
            nodes={decoratedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
          />
        </div>

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center gap-2">
            <Network className="w-7 h-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Empty canvas</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Click <span className="font-medium">Add agent</span> to drop your
              first node, then drag from a node&apos;s right handle to connect it
              to another.
            </p>
          </div>
        )}

        {/* Floating top toolbar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 min-w-0 rounded-lg border border-border bg-card/95 backdrop-blur shadow-sm px-3 h-11 flex-1 max-w-md">
            <Network className="w-4 h-4 text-accent flex-shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name"
              maxLength={120}
              className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground focus:outline-none placeholder:text-muted-foreground"
            />
            <span className="hidden sm:inline-flex items-center h-5 px-2 rounded-full border border-warning/30 bg-warning/10 text-warning text-[10px] font-medium flex-shrink-0">
              Pro / Premium
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card/95 backdrop-blur shadow-sm px-1.5 h-11 ml-auto">
            <ToolbarButton onClick={addNode} icon={<Plus className="w-4 h-4" />} label="Add agent" />
            <span className="w-px h-5 bg-border mx-0.5" />
            <ToolbarButton
              onClick={() => toggleDrawer('settings')}
              icon={<Settings2 className="w-4 h-4" />}
              label="Settings"
              active={drawer === 'settings'}
            />
            <ToolbarButton
              onClick={() => toggleDrawer('code')}
              icon={<Code2 className="w-4 h-4" />}
              label="Code"
              active={drawer === 'code'}
            />
            <ToolbarButton
              onClick={() => toggleDrawer('output')}
              icon={<ListTree className="w-4 h-4" />}
              label="Output"
              active={drawer === 'output'}
            />
            <span className="w-px h-5 bg-border mx-0.5" />
            <ToolbarButton
              onClick={handleSave}
              icon={<Save className="w-4 h-4" />}
              label="Save"
            />
            <ToolbarButton
              onClick={() => toggleDrawer('saved')}
              icon={<Bookmark className="w-4 h-4" />}
              label="Saved"
              active={drawer === 'saved'}
            />
          </div>
        </div>

        {/* Slide-over drawer */}
        {drawer !== 'none' && (
          <aside
            className={`absolute top-0 right-0 bottom-14 z-20 bg-card border-l border-border shadow-xl flex flex-col w-full ${
              wide ? 'sm:w-[600px] sm:max-w-[92vw]' : 'sm:w-[380px]'
            }`}
          >
            <header className="flex items-center justify-between gap-2 px-4 h-12 border-b border-border bg-subtle/50 flex-shrink-0">
              <span className="text-sm font-semibold text-foreground">
                {drawer === 'node' && 'Agent node'}
                {drawer === 'settings' && 'Workflow settings'}
                {drawer === 'code' && 'Export code'}
                {drawer === 'output' && 'Run output'}
                {drawer === 'saved' && 'Saved workflows'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDrawer('none');
                  setSelectedNodeId(null);
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {drawer === 'node' && selectedNode && (
                <NodeInspector
                  key={selectedNode.id}
                  spec={selectedNode.data.spec}
                  onChange={updateSelectedSpec}
                  onDelete={deleteSelected}
                  duplicateName={selectedDuplicate}
                />
              )}
              {drawer === 'settings' && (
                <WorkflowSettings
                  maxLoops={maxLoops}
                  onMaxLoops={setMaxLoops}
                  autoCompile={autoCompile}
                  onAutoCompile={setAutoCompile}
                  verbose={verbose}
                  onVerbose={setVerbose}
                  img={img}
                  onImg={setImg}
                  issues={issues}
                  entryPoints={endpoints.entryPoints}
                  endPoints={endpoints.endPoints}
                  nodeCount={nodes.length}
                  edgeCount={edges.length}
                />
              )}
              {drawer === 'code' && (
                <SnippetPreview
                  endpoint="/v1/graph-workflow/completions"
                  method="POST"
                  payload={payload}
                  title="Workflow Builder request"
                />
              )}
              {drawer === 'output' &&
                (isRunning ? (
                  <div className="rounded-lg border border-border bg-card p-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Running {nodes.length} agent
                      {nodes.length === 1 ? '' : 's'} as a graph…
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complex graphs can take a few minutes.
                    </p>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-danger/40 bg-danger/5 p-4">
                    <div className="flex items-start gap-2 mb-1">
                      <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                      <div className="text-sm font-semibold text-foreground">
                        Run failed
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 ml-6 break-words whitespace-pre-line">
                      {error}
                    </p>
                  </div>
                ) : result ? (
                  <GraphResults result={result} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-subtle/50 p-10 text-center">
                    <ListTree className="w-5 h-5 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground mb-1">
                      No run yet
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Add a task below and hit{' '}
                      <span className="font-medium text-foreground">Run</span> to
                      see each node&apos;s output.
                    </p>
                  </div>
                ))}
              {drawer === 'saved' && (
                <SavedWorkflowsPanel
                  workflows={savedWorkflows}
                  onLoad={handleLoad}
                  onDelete={deleteWorkflow}
                />
              )}
            </div>
          </aside>
        )}
        </div>

        {/* Task command bar — pinned to the viewport bottom (always visible) */}
        <div className="fixed bottom-0 inset-x-0 z-40 h-14 border-t border-border bg-card px-3 sm:px-4 flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex-shrink-0">
            Task
          </span>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe the task for this workflow…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
            }}
            className="flex-1 min-w-0 h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          {issues.length > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0 max-w-[260px] truncate">
              <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
              {issues[0]}
            </span>
          )}
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            title={issues.length > 0 ? issues.join(' ') : 'Run on the platform (⌘↵)'}
            className="inline-flex items-center gap-1.5 h-9 px-5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex-shrink-0"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isRunning ? 'Running…' : 'Run'}
          </button>
        </div>
    </div>
  );
}

function SavedWorkflowsPanel({
  workflows,
  onLoad,
  onDelete,
}: {
  workflows: SavedWorkflow[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (workflows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-subtle/50 p-10 text-center">
        <Bookmark className="w-5 h-5 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground mb-1">
          No saved workflows
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Click <span className="font-medium text-foreground">Save</span> in the
          toolbar to save your current workflow, or run it to auto-save.
        </p>
      </div>
    );
  }

  const sorted = [...workflows].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((wf) => (
        <div
          key={wf.id}
          className="rounded-lg border border-border bg-card p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {wf.name || 'Untitled workflow'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {wf.nodes.length} agent{wf.nodes.length === 1 ? '' : 's'} ·{' '}
                {wf.edges.length} edge{wf.edges.length === 1 ? '' : 's'}
                {wf.result && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        wf.result.status === 'completed'
                          ? 'bg-success'
                          : 'bg-warning'
                      }`}
                    />
                    {wf.result.status}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {new Date(wf.savedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onLoad(wf.id)}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => onDelete(wf.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                aria-label="Delete workflow"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm transition-colors ${
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function WorkflowSettings({
  maxLoops,
  onMaxLoops,
  autoCompile,
  onAutoCompile,
  verbose,
  onVerbose,
  img,
  onImg,
  issues,
  entryPoints,
  endPoints,
  nodeCount,
  edgeCount,
}: {
  maxLoops: number;
  onMaxLoops: (n: number) => void;
  autoCompile: boolean;
  onAutoCompile: (b: boolean) => void;
  verbose: boolean;
  onVerbose: (b: boolean) => void;
  img: string;
  onImg: (s: string) => void;
  issues: string[];
  entryPoints: string[];
  endPoints: string[];
  nodeCount: number;
  edgeCount: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Select a node on the canvas to edit that agent. These settings apply to
        the whole workflow.
      </p>

      {issues.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            Fix before running
          </div>
          <ul className="list-disc list-inside text-[11px] text-foreground/80 space-y-0.5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Counter label="Nodes" value={nodeCount} />
        <Counter label="Edges" value={edgeCount} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Max loops</label>
        <input
          type="number"
          min={1}
          max={50}
          value={maxLoops}
          onChange={(e) => onMaxLoops(parseInt(e.target.value) || 1)}
          className={inputBase}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Image URL (optional)</label>
        <input
          type="url"
          value={img}
          onChange={(e) => onImg(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={inputBase}
        />
        <span className="text-[11px] text-muted-foreground">
          Passed as <code className="text-foreground">img</code> for
          vision-enabled agents.
        </span>
      </div>

      <div className="space-y-2">
        <Toggle
          label="Auto-compile"
          description="Optimize the graph before execution."
          checked={autoCompile}
          onChange={onAutoCompile}
        />
        <Toggle
          label="Verbose logging"
          description="Enable detailed execution logs."
          checked={verbose}
          onChange={onVerbose}
        />
      </div>

      <div className="pt-3 border-t border-border space-y-2">
        <EndpointList
          icon={<LogIn className="w-3 h-3 text-success" />}
          label="Entry"
          names={entryPoints}
        />
        <EndpointList
          icon={<LogOut className="w-3 h-3 text-warning" />}
          label="End"
          names={endPoints}
        />
        <p className="text-[11px] text-muted-foreground">
          Derived automatically. Nodes with no incoming edge start the flow;
          nodes with no outgoing edge end it.
        </p>
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-subtle px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-mono text-foreground tabular-nums leading-tight">
        {value}
      </div>
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

function EndpointList({
  icon,
  label,
  names,
}: {
  icon: React.ReactNode;
  label: string;
  names: string[];
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="inline-flex items-center gap-1 text-muted-foreground uppercase tracking-wider text-[10px] pt-0.5 flex-shrink-0 w-12">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap gap-1 min-w-0">
        {names.length === 0 ? (
          <span className="text-muted-foreground/60">—</span>
        ) : (
          names.map((n) => (
            <span
              key={n}
              className="px-1.5 py-0.5 rounded-sm bg-subtle border border-border font-mono text-[10px] text-foreground"
            >
              {n}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
