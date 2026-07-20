// Swarms API response wrapper
export interface SwarmsAPIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata?: {
    request_id: string;
    duration_ms: number;
  };
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// Rate limits response from API
export interface RateLimitWindow {
  count: number;
  limit: number;
  exceeded: boolean;
  remaining: number;
  reset_time: string;
}

export interface RateLimitsInfo {
  minute: RateLimitWindow;
  hour: RateLimitWindow;
  day: RateLimitWindow;
}

export interface RateLimitLimits {
  maximum_requests_per_minute: number;
  maximum_requests_per_hour: number;
  maximum_requests_per_day: number;
  tokens_per_agent: number;
}

export interface RateLimitsResponse {
  rate_limits: RateLimitsInfo;
  limits: RateLimitLimits;
  tier: string | null;
  timestamp: string | null;
  success: boolean | null;
}

// Credit balance response from /v1/account/credits
export interface CreditBalanceResponse {
  credit: number;
  free_credit: number;
  referral_credits: number;
  total_credits: number;
}

// Usage metrics summary from /v1/metrics/summary
export interface MetricsSummaryResponse {
  success: boolean;
  unique_agents: number;
  total_completion_calls: number;
  successful_completions: number;
  completions_last_24h: number;
  completions_last_7d: number;
  timestamp: string;
}

// API health status
export interface APIHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  last_checked: string;
}

// API error response
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// Swarm execution (POST /v1/swarm/completions)
export const SWARM_TYPES = [
  'SequentialWorkflow',
  'ConcurrentWorkflow',
  'GroupChat',
  'MixtureOfAgents',
  'HierarchicalSwarm',
  'MajorityVoting',
  'CouncilAsAJudge',
  'DebateWithJudge',
  'LLMCouncil',
  'RoundRobin',
  'PlannerWorkerSwarm',
  'MultiAgentRouter',
  'AgentRearrange',
  'AutoSwarmBuilder',
  'HeavySwarm',
  'BatchedGridWorkflow',
  'auto',
] as const;

export type SwarmType = (typeof SWARM_TYPES)[number];

export const SWARM_TYPE_DESCRIPTIONS: Record<SwarmType, string> = {
  SequentialWorkflow:
    'Agents run one after another; each builds on the previous output.',
  ConcurrentWorkflow: 'All agents run in parallel on the same task.',
  GroupChat: 'Agents converse in a shared chat to reach a conclusion.',
  MixtureOfAgents:
    'Multiple agents respond; an aggregator synthesizes the answer.',
  HierarchicalSwarm: 'A manager agent delegates to worker agents.',
  MajorityVoting: 'Agents vote; the majority answer wins.',
  CouncilAsAJudge: 'A council of agents judges and selects the best response.',
  DebateWithJudge: 'Agents debate; a judge issues the verdict.',
  LLMCouncil: 'A council of LLMs collaborates to produce a single answer.',
  RoundRobin: 'Agents take turns in a fixed rotation.',
  PlannerWorkerSwarm:
    'A planner decomposes the task; workers execute the steps.',
  MultiAgentRouter: 'Router picks the best agent for each task.',
  AgentRearrange: 'Custom flow string defines how agents pass work.',
  AutoSwarmBuilder: 'Auto-generates a swarm structure from the task.',
  HeavySwarm: 'Heavy reasoning swarm - slow but thorough.',
  BatchedGridWorkflow: 'Grid of agents processes tasks in batches.',
  auto: 'Let Swarms choose the best swarm type for the task.',
};

export interface SwarmAgentSpec {
  agent_name?: string;
  description?: string;
  system_prompt?: string;
  model_name?: string;
  role?: string;
  max_loops?: number | string;
  max_tokens?: number;
  temperature?: number;
  auto_generate_prompt?: boolean;
  streaming_on?: boolean;
  /** Single base64 image for the agent to process. */
  img?: string;
  /** Multiple base64 images for the agent to process. */
  imgs?: string[];
}

export interface SwarmSpec {
  name?: string;
  description?: string;
  agents?: SwarmAgentSpec[];
  swarm_type?: SwarmType;
  rearrange_flow?: string;
  task?: string;
  rules?: string;
  max_loops?: number;
  stream?: boolean;
  /** Optional image URL associated with the swarm task. */
  img?: string;
}

export interface SwarmCompletion {
  job_id: string | null;
  status: string | null;
  swarm_name: string | null;
  description: string | null;
  swarm_type: string | null;
  output: unknown;
  number_of_agents: number | null;
  execution_time: number | null;
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    total_cost?: number;
    [k: string]: unknown;
  } | null;
}
