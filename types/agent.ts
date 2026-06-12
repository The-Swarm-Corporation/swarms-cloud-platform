// Agent configuration matching Swarms API
export interface AgentConfig {
  agent_name: string;
  description?: string;
  system_prompt?: string;
  model_name: string;
  role?: string;
  max_loops?: number;
  max_tokens?: number;
  temperature?: number;
  auto_generate_prompt?: boolean;
  streaming_on?: boolean;
  dynamic_temperature_enabled?: boolean;
  tool_call_summary?: boolean;
}

// Agent execution request
export interface AgentExecutionRequest {
  agent_config: AgentConfig;
  task: string;
  history?: any;
  img?: string;
  imgs?: string[];
  stream?: boolean;
  search_enabled?: boolean;
}

// Agent execution response from Swarms API
export interface AgentExecutionResponse {
  job_id: string;
  success: boolean;
  name: string;
  description?: string;
  temperature?: number;
  outputs: any;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    img_cost?: number;
    total_cost?: number;
  };
  timestamp: string;
}

// Local agent state (includes config + runtime info)
export interface Agent {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  kanbanStatus?: KanbanStatus; // Workflow status for kanban board
  created_at: string;
  updated_at: string;
  last_execution?: AgentExecutionResponse;
  execution_history: AgentExecutionResponse[];
  is_favorite?: boolean;
}

export type AgentStatus =
  | 'idle'
  | 'running'
  | 'stopped'
  | 'error'
  | 'completed';

export type KanbanStatus = 'idle' | 'todo' | 'in_progress' | 'done';

// Saved configuration preset
export interface SavedAgentConfig {
  id: string;
  name: string;
  config: AgentConfig;
  tags?: string[];
  created_at: string;
}

// Model options for the select dropdown
export const MODEL_OPTIONS = [
  { value: 'gpt-5.4', label: 'GPT-5.4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
] as const;

// Role options
export const ROLE_OPTIONS = [
  { value: 'worker', label: 'Worker' },
  { value: 'manager', label: 'Manager' },
  { value: 'executor', label: 'Executor' },
  { value: 'analyst', label: 'Analyst' },
] as const;
