import type { Node, Edge } from '@xyflow/react';
import type {
  GraphAgentSpec,
  GraphEdgeSpec,
  GraphWorkflowInput,
} from '@/types/graph';

// React Flow node data carries the agent spec. The node id is a stable internal
// identifier (independent of agent_name) so renaming an agent never breaks the
// edges that connect to it - names are resolved to ids only when building the
// API payload.
export type AgentNodeData = {
  spec: GraphAgentSpec;
  // Decorations computed from graph topology for display (badges on the node).
  isEntry?: boolean;
  isEnd?: boolean;
};

export type AgentFlowNode = Node<AgentNodeData, 'agent'>;
export type AgentFlowEdge = Edge;

export type WorkflowMeta = {
  name: string;
  task: string;
  maxLoops: number;
  autoCompile: boolean;
  verbose: boolean;
  img: string;
};

/** Build the GraphWorkflowInput payload sent to /v1/graph-workflow/completions. */
export function buildGraphPayload(
  nodes: AgentFlowNode[],
  edges: AgentFlowEdge[],
  meta: WorkflowMeta
): GraphWorkflowInput {
  const nameById = new Map<string, string>();
  for (const n of nodes) {
    nameById.set(n.id, n.data.spec.agent_name.trim());
  }

  const agents: GraphAgentSpec[] = nodes.map((n) => {
    const s = n.data.spec;
    const a: GraphAgentSpec = {
      agent_name: s.agent_name.trim(),
      model_name: s.model_name?.trim() || 'gpt-4.1',
      role: s.role || 'worker',
      max_loops:
        s.max_loops === 'auto'
          ? 'auto'
          : typeof s.max_loops === 'number'
          ? s.max_loops
          : 1,
      max_tokens: typeof s.max_tokens === 'number' ? s.max_tokens : 8192,
    };
    if (s.description?.trim()) a.description = s.description.trim();
    if (s.system_prompt?.trim()) a.system_prompt = s.system_prompt.trim();
    if (typeof s.temperature === 'number') a.temperature = s.temperature;
    if (typeof s.auto_generate_prompt === 'boolean')
      a.auto_generate_prompt = s.auto_generate_prompt;
    if (typeof s.streaming_on === 'boolean') a.streaming_on = s.streaming_on;
    if (typeof s.dynamic_temperature_enabled === 'boolean')
      a.dynamic_temperature_enabled = s.dynamic_temperature_enabled;
    if (typeof s.tool_call_summary === 'boolean')
      a.tool_call_summary = s.tool_call_summary;
    if (typeof s.reasoning_enabled === 'boolean')
      a.reasoning_enabled = s.reasoning_enabled;
    if (s.reasoning_enabled && s.reasoning_effort)
      a.reasoning_effort = s.reasoning_effort;
    if (s.reasoning_enabled && typeof s.thinking_tokens === 'number')
      a.thinking_tokens = s.thinking_tokens;
    if (s.mcp_url?.trim()) a.mcp_url = s.mcp_url.trim();
    if (s.max_loops === 'auto' && s.selected_tools?.length)
      a.selected_tools = s.selected_tools;
    if (
      s.llm_args &&
      typeof s.llm_args === 'object' &&
      Object.keys(s.llm_args).length > 0
    )
      a.llm_args = s.llm_args;
    return a;
  });

  const edgeSpecs: GraphEdgeSpec[] = edges
    .map((e) => {
      const source = nameById.get(e.source);
      const target = nameById.get(e.target);
      if (!source || !target) return null;
      return { source, target };
    })
    .filter((e): e is GraphEdgeSpec => e !== null);

  const { entryPoints, endPoints } = deriveEndpoints(nodes, edges, nameById);

  return {
    name: meta.name.trim() || undefined,
    agents,
    edges: edgeSpecs,
    entry_points: entryPoints.length ? entryPoints : undefined,
    end_points: endPoints.length ? endPoints : undefined,
    max_loops: meta.maxLoops,
    task: meta.task.trim() || undefined,
    img: meta.img.trim() || undefined,
    auto_compile: meta.autoCompile,
    verbose: meta.verbose,
  };
}

/**
 * Entry points are nodes with no incoming edge; end points are nodes with no
 * outgoing edge. This matches how the Graph Workflow API expects start/finish
 * nodes to be declared and removes that burden from the user.
 */
export function deriveEndpoints(
  nodes: AgentFlowNode[],
  edges: AgentFlowEdge[],
  nameById?: Map<string, string>
): { entryPoints: string[]; endPoints: string[] } {
  const names =
    nameById ??
    new Map(nodes.map((n) => [n.id, n.data.spec.agent_name.trim()]));
  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();
  for (const e of edges) {
    if (e.source !== e.target) {
      hasOutgoing.add(e.source);
      hasIncoming.add(e.target);
    }
  }
  const entryPoints: string[] = [];
  const endPoints: string[] = [];
  for (const n of nodes) {
    const name = names.get(n.id);
    if (!name) continue;
    if (!hasIncoming.has(n.id)) entryPoints.push(name);
    if (!hasOutgoing.has(n.id)) endPoints.push(name);
  }
  return { entryPoints, endPoints };
}

/** Human-readable problems that must be fixed before the workflow can run. */
export function validateGraph(
  nodes: AgentFlowNode[],
  edges: AgentFlowEdge[],
  meta: WorkflowMeta
): string[] {
  const issues: string[] = [];
  if (nodes.length === 0) {
    issues.push('Add at least one agent node.');
    return issues;
  }

  const names = nodes.map((n) => n.data.spec.agent_name.trim());
  if (names.some((n) => !n)) {
    issues.push('Every agent needs a name.');
  }
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const n of names) {
    if (!n) continue;
    if (seen.has(n)) dupes.add(n);
    seen.add(n);
  }
  if (dupes.size) {
    issues.push(`Duplicate agent names: ${[...dupes].join(', ')}.`);
  }

  if (nodes.length > 1 && edges.length === 0) {
    issues.push('Connect your agents with at least one edge.');
  }

  if (!meta.task.trim()) {
    issues.push('Enter a task for the workflow to execute.');
  }

  return issues;
}
