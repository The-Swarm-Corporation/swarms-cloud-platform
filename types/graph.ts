// Types for the Graph Workflow API (POST /v1/graph-workflow/completions).
// Agents are nodes; edges define the directed flow of execution between them.

// Full agent schema accepted by the Swarms API (AgentSpec). model_name is a
// free-form string - any model id the platform supports is valid.
export interface GraphAgentSpec {
  agent_name: string;
  description?: string;
  system_prompt?: string;
  model_name?: string;
  role?: string;
  max_loops?: number | 'auto';
  max_tokens?: number;
  temperature?: number;
  auto_generate_prompt?: boolean;
  streaming_on?: boolean;
  dynamic_temperature_enabled?: boolean;
  tool_call_summary?: boolean;
  reasoning_enabled?: boolean;
  reasoning_effort?: string;
  thinking_tokens?: number;
  mcp_url?: string;
  selected_tools?: string[];
  llm_args?: Record<string, unknown>;
}

// Tools available to the autonomous looper when max_loops is 'auto'.
export const AUTONOMOUS_TOOLS = [
  'create_plan',
  'think',
  'subtask_done',
  'complete_task',
  'respond_to_user',
  'create_file',
  'update_file',
  'read_file',
  'list_directory',
  'delete_file',
  'create_sub_agent',
  'assign_task',
] as const;

export const REASONING_EFFORTS = ['low', 'medium', 'high'] as const;

export interface GraphEdgeSpec {
  source: string;
  target: string;
  metadata?: Record<string, unknown>;
}

export interface GraphWorkflowInput {
  name?: string;
  description?: string;
  agents: GraphAgentSpec[];
  edges?: GraphEdgeSpec[];
  entry_points?: string[];
  end_points?: string[];
  max_loops?: number;
  task?: string;
  img?: string;
  auto_compile?: boolean;
  verbose?: boolean;
}

export interface GraphWorkflowUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  token_cost?: number;
  cost_per_agent?: number;
}

export interface GraphWorkflowOutput {
  job_id: string;
  name?: string | null;
  description?: string | null;
  status: string;
  outputs: Record<string, unknown>;
  usage: GraphWorkflowUsage | null;
  timestamp: string;
}
