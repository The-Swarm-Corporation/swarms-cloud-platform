import { SwarmType, SWARM_TYPES, SwarmSpec } from '@/types/api';

import {
  ArrowRightLeft,
  Boxes,
  ClipboardList,
  Cpu,
  Gavel,
  GitBranch,
  Grid3x3,
  Layers,
  ListOrdered,
  MessageSquare,
  Network,
  RefreshCw,
  RotateCw,
  Route,
  Scale,
  Sparkles,
  Users,
  Vote,
  Wand2,
  Workflow,
  LucideIcon,
} from 'lucide-react';

export type SwarmCategory =
  | 'collaboration'
  | 'workflow'
  | 'routing'
  | 'judgment'
  | 'auto';

export type SwarmComplexity = 'Low' | 'Medium' | 'High';

export type SwarmBenchmark = {
  accuracy: number;
  latencyS: number;
  costUsd: number;
  totalTokens: number;
  llmCalls: number;
  model: string;
  correctTasks: string[];
};

export type SwarmMeta = {
  label: string;
  description: string;
  longDescription: string;
  category: SwarmCategory;
  complexity: SwarmComplexity;
  icon: LucideIcon;
  whenToUse: string[];
  keyFeatures: string[];
  agentRoles: { name: string; role: string }[];
  exampleTask: string;
  apiNotes?: string;
  endpoint?: string;
  premium?: boolean;
  benchmark?: SwarmBenchmark;
};

const DEFAULT_MODEL = 'gpt-4.1';

export const SWARM_CATEGORY_LABEL: Record<SwarmCategory, string> = {
  collaboration: 'Collaboration',
  workflow: 'Workflow',
  routing: 'Routing',
  judgment: 'Judgment',
  auto: 'Auto',
};

export const SWARM_CATEGORY_TONE: Record<SwarmCategory, string> = {
  collaboration: 'border-accent/30 bg-accent/10 text-accent',
  workflow: 'border-success/30 bg-success/10 text-success',
  routing: 'border-warning/30 bg-warning/10 text-warning',
  judgment: 'border-border-strong bg-muted text-foreground',
  auto: 'border-border-strong bg-subtle text-muted-foreground',
};

export const SWARM_TYPE_META: Record<SwarmType, SwarmMeta> = {
  AgentRearrange: {
    label: 'Agent Rearrange',
    description:
      'Dynamically reorders agent execution based on the task topology you define.',
    longDescription:
      'Define custom multi-agent flows with a simple DSL: use -> for sequential handoffs and commas for parallel execution. AgentRearrange is ideal when your workflow does not fit a pure pipeline or pure parallel pattern.',
    category: 'workflow',
    complexity: 'Medium',
    icon: ArrowRightLeft,
    whenToUse: [
      'Workflows with mixed sequential and parallel stages',
      'Fan-out / fan-in or diamond-shaped topologies',
      'Adaptive routing where agent order matters',
    ],
    keyFeatures: [
      'Flow DSL: A -> B, C -> D',
      'Runtime flow updates',
      'Team awareness and flow validation',
    ],
    agentRoles: [
      { name: 'Research Specialist', role: 'Gathers background information' },
      { name: 'Technical Writer', role: 'Turns research into content' },
      { name: 'Domain Expert', role: 'Validates specialized details' },
      { name: 'Editor', role: 'Polishes the final output' },
    ],
    exampleTask:
      'Create a technical blog post about machine learning in finance.',
    apiNotes: 'Requires the rearrange_flow field in the SwarmSpec.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 2.62,
      costUsd: 0.000072,
      totalTokens: 422,
      llmCalls: 3,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  MixtureOfAgents: {
    label: 'Mixture of Agents',
    description:
      'Multiple specialist agents contribute in parallel, then an aggregator synthesizes the answer.',
    longDescription:
      'Run multiple expert agents in parallel and synthesize their diverse outputs through an aggregator. This collaborative approach achieves higher quality through multi-perspective analysis.',
    category: 'collaboration',
    complexity: 'Medium',
    icon: Layers,
    whenToUse: [
      'Complex problem-solving requiring multiple expert perspectives',
      'Investment analysis, medical diagnosis, research synthesis',
      'When quality through collaboration matters more than latency',
    ],
    keyFeatures: [
      'Parallel expert execution',
      'Dedicated aggregator synthesis',
      'Optional multi-layer refinement',
    ],
    agentRoles: [
      { name: 'Technology Analyst', role: 'Technical perspective' },
      { name: 'Economic Analyst', role: 'Market and financial perspective' },
      { name: 'Environmental Specialist', role: 'Sustainability perspective' },
      { name: 'Policy Expert', role: 'Regulatory perspective' },
    ],
    exampleTask:
      'Analyze the electric vehicle market from technological, economic, environmental, and policy perspectives.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 1.87,
      costUsd: 0.000122,
      totalTokens: 717,
      llmCalls: 4,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  SequentialWorkflow: {
    label: 'Sequential Workflow',
    description:
      'Agents run one after another, each receiving the previous agent’s output as input.',
    longDescription:
      'Execute agents in a strict linear chain where each agent’s output becomes the next agent’s input. Perfect for step-by-step processes and multi-stage refinement pipelines.',
    category: 'workflow',
    complexity: 'Low',
    icon: ListOrdered,
    whenToUse: [
      'Tasks with clear sequential dependencies',
      'Multi-stage refinement or validation pipelines',
      'Content creation, data transformation, code review',
    ],
    keyFeatures: [
      'Ordered execution with automatic flow construction',
      'Shared memory and team awareness support',
      'Multiple execution loops and streaming modes',
    ],
    agentRoles: [
      { name: 'Research Specialist', role: 'Gathers comprehensive information' },
      { name: 'Content Writer', role: 'Transforms research into prose' },
      { name: 'Editor', role: 'Reviews and polishes content' },
      { name: 'SEO Optimizer', role: 'Optimizes for search engines' },
    ],
    exampleTask:
      'Create a comprehensive blog post about the future of renewable energy.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 2.5,
      costUsd: 0.000073,
      totalTokens: 424,
      llmCalls: 3,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  ConcurrentWorkflow: {
    label: 'Concurrent Workflow',
    description:
      'All agents run in parallel on the same task; outputs are returned together.',
    longDescription:
      'Run all agents simultaneously on the same task and return a per-agent result map. Ideal for independent subtasks, multiple perspectives, and time-critical analysis.',
    category: 'workflow',
    complexity: 'Low',
    icon: GitBranch,
    whenToUse: [
      'Independent subtasks or multiple perspectives on one input',
      'High-throughput or time-critical analysis',
      'Multi-source research or parallel market analysis',
    ],
    keyFeatures: [
      'True parallel execution',
      'Optional real-time dashboard',
      'Aggregated conversation history',
    ],
    agentRoles: [
      { name: 'AI Market Analyst', role: 'AI sector perspective' },
      { name: 'Healthcare Market Analyst', role: 'Healthcare perspective' },
      { name: 'Fintech Market Analyst', role: 'Fintech perspective' },
      { name: 'E-commerce Market Analyst', role: 'E-commerce perspective' },
    ],
    exampleTask:
      'Research market opportunities in AI, healthcare, fintech, and e-commerce simultaneously.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 1.03,
      costUsd: 0.000069,
      totalTokens: 388,
      llmCalls: 3,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  GroupChat: {
    label: 'Group Chat',
    description:
      'Agents participate in a multi-turn group conversation to reach a shared conclusion.',
    longDescription:
      'Multiple specialist agents engage in a shared multi-turn conversation to brainstorm, debate, or collaboratively solve problems. Supports multiple speaker selection strategies.',
    category: 'collaboration',
    complexity: 'Medium',
    icon: MessageSquare,
    whenToUse: [
      'Cross-functional planning and ideation',
      'Product strategy brainstorming',
      'Risk assessment with multiple stakeholders',
    ],
    keyFeatures: [
      'Round-robin, random, priority, and dynamic speakers',
      '@mention support',
      'Multi-turn collaborative prompting',
    ],
    agentRoles: [
      { name: 'Product Manager', role: 'Drives product vision' },
      { name: 'Growth Marketer', role: 'Designs acquisition strategy' },
      { name: 'Engineering Lead', role: 'Assesses feasibility' },
      { name: 'Customer Success Lead', role: 'Represents the customer voice' },
    ],
    exampleTask:
      'Develop a go-to-market strategy for an AI-powered project management tool.',
    benchmark: {
      accuracy: 0,
      latencyS: 1.37,
      costUsd: 0.000289,
      totalTokens: 1694,
      llmCalls: 3,
      model: 'gpt-4o-mini',
      correctTasks: [],
    },
  },
  MultiAgentRouter: {
    label: 'Multi-Agent Router',
    description:
      'A router agent dispatches each task to the most appropriate specialist agent.',
    longDescription:
      'An intelligent dispatcher routes incoming tasks to the most suitable specialist agent based on capabilities and workload. Great for multi-domain question answering and support triage.',
    category: 'routing',
    complexity: 'Medium',
    icon: Route,
    whenToUse: [
      'Customer service request routing',
      'Multi-domain question answering',
      'IT helpdesk or technical support triage',
    ],
    keyFeatures: [
      'Capability matching',
      'Load balancing across agents',
      'Dynamic task assignment',
    ],
    agentRoles: [
      { name: 'Billing Specialist', role: 'Handles billing issues' },
      { name: 'Technical Support', role: 'Resolves technical issues' },
      { name: 'Sales Consultant', role: 'Provides product recommendations' },
      { name: 'Policy Advisor', role: 'Explains policies and procedures' },
    ],
    exampleTask:
      'Handle multiple customer inquiries about billing, login issues, product recommendations, and return policy.',
    benchmark: {
      accuracy: 0.917,
      latencyS: 2.76,
      costUsd: 0.000220,
      totalTokens: 1148,
      llmCalls: 2,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'letter counting', 'syllogism'],
    },
  },
  AutoSwarmBuilder: {
    label: 'Auto Swarm Builder',
    description:
      'Generates an agent configuration automatically from a high-level task description.',
    longDescription:
      'Automatically design and assemble a team of specialized agents plus a swarm structure from a high-level task description. Useful for rapid prototyping when you are unsure of the best topology.',
    category: 'auto',
    complexity: 'High',
    icon: Wand2,
    whenToUse: [
      'Rapid prototyping when topology is unclear',
      'One-off tasks where manual design is overkill',
      'Dynamic agent team generation',
    ],
    keyFeatures: [
      'Boss agent decomposes the task',
      'Auto-generates agent specs',
      'Supports multiple swarm architecture types',
    ],
    agentRoles: [
      { name: 'Boss / Architect', role: 'Internal planner' },
      { name: 'Generated Agent 1', role: 'Role chosen by the builder' },
      { name: 'Generated Agent 2', role: 'Role chosen by the builder' },
    ],
    exampleTask:
      'Create a team to analyze financial reports and generate investment recommendations.',
    benchmark: {
      accuracy: 0.75,
      latencyS: 8.48,
      costUsd: 0.000622,
      totalTokens: 2951,
      llmCalls: 3.2,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  HierarchicalSwarm: {
    label: 'Hierarchical Swarm',
    description:
      'A director agent decomposes the task and supervises a team of worker agents.',
    longDescription:
      'A director agent analyzes the task, produces a structured plan, distributes orders to specialist worker agents, and optionally judges or refines results across multiple loops.',
    category: 'collaboration',
    complexity: 'High',
    icon: Workflow,
    whenToUse: [
      'Complex project management with specialized roles',
      'Multi-stage research or content workflows',
      'Tasks needing oversight, feedback, and iterative refinement',
    ],
    keyFeatures: [
      'Auto-created or custom director agent',
      'Structured plan + orders output',
      'Multi-loop feedback and optional agent-as-judge',
    ],
    agentRoles: [
      { name: 'Research Coordinator', role: 'Supervises and synthesizes' },
      { name: 'Technology Researcher', role: 'Technical perspective' },
      { name: 'Economic Analyst', role: 'Economic perspective' },
      { name: 'Ethics Specialist', role: 'Ethics perspective' },
    ],
    exampleTask:
      'Conduct comprehensive research on the impact of AI on healthcare.',
    apiNotes:
      'Configure the director via director_model_name and director_settings.',
    benchmark: {
      accuracy: 0,
      latencyS: 1.42,
      costUsd: 0.000931,
      totalTokens: 6014,
      llmCalls: 1,
      model: 'gpt-4o-mini',
      correctTasks: [],
    },
  },
  auto: {
    label: 'Auto',
    description:
      'Lets the API select the best swarm architecture for the supplied task.',
    longDescription:
      'Let the API automatically select the best swarm architecture for the supplied task. Useful when you do not know which topology fits best or want to reduce decision overhead.',
    category: 'auto',
    complexity: 'Low',
    icon: Sparkles,
    whenToUse: [
      'You are unsure which swarm topology fits best',
      'Rapid prototyping across architectures',
      'Reducing decision overhead for new users',
    ],
    keyFeatures: [
      'Automatic swarm type selection',
      'Delegates to the most appropriate orchestrator',
      'No topology-specific fields required',
    ],
    agentRoles: [
      { name: 'Generalist Agent A', role: 'Contributes based on chosen swarm' },
      { name: 'Generalist Agent B', role: 'Contributes based on chosen swarm' },
    ],
    exampleTask:
      'Build a comprehensive investment memo on NVIDIA stock.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 4.75,
      costUsd: 0.000188,
      totalTokens: 848,
      llmCalls: 4.2,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  MajorityVoting: {
    label: 'Majority Voting',
    description:
      'Multiple agents answer the same question; the majority answer wins.',
    longDescription:
      'Multiple agents independently answer or vote on a question; a consensus agent synthesizes the majority position. Ideal for content quality assessment and decision-making under uncertainty.',
    category: 'judgment',
    complexity: 'Medium',
    icon: Vote,
    whenToUse: [
      'Content quality assessment and approval',
      'Problem diagnosis with multiple expert opinions',
      'Decision-making under uncertainty',
    ],
    keyFeatures: [
      'Multi-loop consensus refinement',
      'Auto-created consensus agent',
      'Concurrent agent execution',
    ],
    agentRoles: [
      { name: 'Marketing Expert', role: 'Messaging and appeal' },
      { name: 'Technical Reviewer', role: 'Accuracy of claims' },
      { name: 'Legal Compliance', role: 'Compliance checks' },
      { name: 'Brand Guardian', role: 'Brand alignment' },
      { name: 'Audience Advocate', role: 'Target-audience resonance' },
    ],
    exampleTask:
      'Vote on whether marketing content claiming a 300% productivity increase is ready for publication.',
    apiNotes: 'Use an odd number of agents to avoid tie votes.',
    benchmark: {
      accuracy: 1,
      latencyS: 6.71,
      costUsd: 0.000559,
      totalTokens: 1919,
      llmCalls: 4,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'letter counting', 'syllogism'],
    },
  },
  CouncilAsAJudge: {
    label: 'Council as a Judge',
    description:
      'A council of agents reviews and rates candidate answers, returning a verdict.',
    longDescription:
      'A council of specialized judge agents evaluates a response across multiple dimensions in parallel, then an aggregator synthesizes findings into a comprehensive report.',
    category: 'judgment',
    complexity: 'High',
    icon: Scale,
    whenToUse: [
      'AI response quality evaluation',
      'Model benchmarking and A/B testing',
      'Automated QA and content review',
    ],
    keyFeatures: [
      'Six built-in evaluation dimensions',
      'Parallel judge execution',
      'Aggregator report with prioritized recommendations',
    ],
    agentRoles: [
      { name: 'Accuracy Judge', role: 'Factual correctness' },
      { name: 'Helpfulness Judge', role: 'Practical value' },
      { name: 'Harmlessness Judge', role: 'Safety and ethics' },
      { name: 'Coherence Judge', role: 'Structure and flow' },
      { name: 'Conciseness Judge', role: 'Communication efficiency' },
      { name: 'Instruction Adherence Judge', role: 'Requirement compliance' },
    ],
    exampleTask:
      'Evaluate an AI-generated explanation of REST vs GraphQL across all quality dimensions.',
    apiNotes: 'Configure the judge model via council_judge_model_name.',
    benchmark: {
      accuracy: 1,
      latencyS: 19.59,
      costUsd: 0.003871,
      totalTokens: 12811,
      llmCalls: 7,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'letter counting', 'syllogism'],
    },
  },
  HeavySwarm: {
    label: 'Heavy Swarm',
    description:
      'Large parallel deployment of agents for maximum throughput and coverage.',
    longDescription:
      'A multi-phase orchestration that decomposes a task into specialized questions, runs them through expert agents in parallel, and synthesizes a final answer. HeavySwarm manages its own agents internally.',
    category: 'collaboration',
    complexity: 'High',
    icon: Boxes,
    whenToUse: [
      'Deep research and comprehensive market analysis',
      'Due diligence and investment research',
      'Complex problems needing multi-perspective investigation',
    ],
    keyFeatures: [
      'Automatic task decomposition',
      'Five specialized agents: Research, Analysis, Alternatives, Verification, Synthesis',
      'Three variants: default, medium, heavy',
    ],
    agentRoles: [
      { name: 'Question Generator Agent', role: 'Decomposes the task' },
      { name: 'Research-Agent', role: 'Information gathering' },
      { name: 'Analysis-Agent', role: 'Pattern recognition' },
      { name: 'Alternatives-Agent', role: 'Option generation' },
      { name: 'Verification-Agent', role: 'Fact-checking and risk' },
      { name: 'Synthesis-Agent', role: 'Final report' },
    ],
    exampleTask:
      'Should we invest in NVIDIA stock? Provide a detailed financial, market, risk, and alternatives analysis.',
    apiNotes:
      'Requires an empty agents array. Use heavy_swarm_* fields for configuration.',
    benchmark: {
      accuracy: 0.917,
      latencyS: 8.79,
      costUsd: 0.000698,
      totalTokens: 2418,
      llmCalls: 2,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'letter counting', 'syllogism'],
    },
  },
  BatchedGridWorkflow: {
    label: 'Batched Grid Workflow',
    description:
      'Runs a matrix of agent-task combinations as a batched grid execution.',
    longDescription:
      'Execute a grid of agents × tasks in parallel, returning every agent’s response to every task. Premium-only feature useful for comparative analysis and A/B testing.',
    category: 'workflow',
    complexity: 'High',
    icon: Grid3x3,
    whenToUse: [
      'A/B testing agent configurations on identical tasks',
      'Multi-expert review of multiple items',
      'Comparative analysis across product categories or topics',
    ],
    keyFeatures: [
      'Full task × agent matrix execution',
      'Parallel batch processing',
      'Iterative refinement via max_loops',
    ],
    agentRoles: [
      { name: 'Technical Analyst', role: 'Technical evaluation' },
      { name: 'User Experience Analyst', role: 'Usability evaluation' },
      { name: 'Value Analyst', role: 'Pricing and value evaluation' },
    ],
    exampleTask:
      'Analyze smartphone, laptop, and tablet market segments with each analyst evaluating every category.',
    endpoint: '/v1/batched-grid-workflow/completions',
    premium: true,
    apiNotes:
      'Uses agent_completions and tasks instead of agents. max_loops is required.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 1,
      costUsd: 0.000068,
      totalTokens: 388,
      llmCalls: 3,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  LLMCouncil: {
    label: 'LLM Council',
    description:
      'A panel of LLM-backed agents deliberates and returns a consensus response.',
    longDescription:
      'A panel of LLM-backed agents independently answers, anonymously peer-reviews and ranks each other’s responses, then a chairman synthesizes the best elements into a final answer.',
    category: 'judgment',
    complexity: 'High',
    icon: Users,
    whenToUse: [
      'High-stakes decisions needing multi-model diversity',
      'Investment strategy or research synthesis',
      'Any query where peer review improves answer quality',
    ],
    keyFeatures: [
      'Independent parallel responses',
      'Anonymous peer review and ranking',
      'Chairman agent final synthesis',
    ],
    agentRoles: [
      { name: 'Analytical Councilor', role: 'Deep analytical thinking' },
      { name: 'Concise Councilor', role: 'Clear, structured communication' },
      { name: 'Balanced Councilor', role: 'Nuanced trade-off analysis' },
      { name: 'Creative Councilor', role: 'Innovative perspectives' },
      { name: 'Chairman', role: 'Final synthesis' },
    ],
    exampleTask:
      'What are the most promising renewable energy investment opportunities for 2025?',
    apiNotes: 'Configure the chairman model via chairman_model.',
    benchmark: {
      accuracy: 1,
      latencyS: 6.89,
      costUsd: 0.000858,
      totalTokens: 4014,
      llmCalls: 7,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'letter counting', 'syllogism'],
    },
  },
  DebateWithJudge: {
    label: 'Debate with Judge',
    description:
      'Agents debate opposing positions while a judge agent decides the winner.',
    longDescription:
      'Two adversarial agents (Pro and Con) debate a topic while a Judge agent evaluates, provides feedback, and synthesizes a balanced verdict. Requires exactly three agents in order: Pro, Con, Judge.',
    category: 'judgment',
    complexity: 'High',
    icon: Gavel,
    whenToUse: [
      'Policy analysis requiring balanced pro/con evaluation',
      'Investment bull/bear case analysis',
      'Ethical dilemmas and strategic trade-off decisions',
    ],
    keyFeatures: [
      'Structured Pro/Con argumentation',
      'Impartial judge evaluation',
      'Progressive refinement across loops',
    ],
    agentRoles: [
      { name: 'Pro Advocate', role: 'Argues in favor' },
      { name: 'Con Advocate', role: 'Argues against' },
      { name: 'Impartial Judge', role: 'Evaluates and synthesizes' },
    ],
    exampleTask:
      'Should companies adopt a mandatory 4-day work week?',
    apiNotes:
      'Requires exactly 3 agents in order: Pro, Con, Judge. Use lower temperature for the Judge.',
    benchmark: {
      accuracy: 1,
      latencyS: 36.68,
      costUsd: 0.002672,
      totalTokens: 9224,
      llmCalls: 6,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'letter counting', 'syllogism'],
    },
  },
  RoundRobin: {
    label: 'Round Robin',
    description:
      'Agents take turns in a fixed rotation, cycling through until the task is solved.',
    longDescription:
      'Agents take randomized turns, each receiving the full conversation history, to collaboratively refine a task. Similar to a brainstorming roundtable.',
    category: 'workflow',
    complexity: 'Medium',
    icon: RotateCw,
    whenToUse: [
      'Collaborative brainstorming and research synthesis',
      'Code review with multiple engineering perspectives',
      'Cross-functional strategic planning',
    ],
    keyFeatures: [
      'Randomized turn order each loop',
      'Full conversation context',
      'Built-in collaborative prompting',
    ],
    agentRoles: [
      { name: 'Product Strategist', role: 'Positioning and value proposition' },
      { name: 'Growth Marketer', role: 'Acquisition and launch strategy' },
      { name: 'Sales Engineer', role: 'Enterprise readiness' },
    ],
    exampleTask:
      'Develop a go-to-market strategy for an AI-powered code review tool.',
    benchmark: {
      accuracy: 0.833,
      latencyS: 3.35,
      costUsd: 0.000150,
      totalTokens: 829,
      llmCalls: 3,
      model: 'gpt-4o-mini',
      correctTasks: ['historical fact', 'factual recall', 'multiplication', 'unit rate', 'syllogism'],
    },
  },
  PlannerWorkerSwarm: {
    label: 'Planner / Worker Swarm',
    description:
      'A planner agent breaks down the task into steps; worker agents execute each step.',
    longDescription:
      'A planner decomposes a goal into prioritized tasks; worker agents claim and execute them concurrently from a shared queue; a judge evaluates and decides whether to iterate.',
    category: 'collaboration',
    complexity: 'High',
    icon: ClipboardList,
    whenToUse: [
      'Long-horizon tasks with many parallel subtasks',
      'Autonomous coding or research pipelines',
      'Workloads requiring optimistic concurrency and replanning',
    ],
    keyFeatures: [
      'Planner-agent task decomposition',
      'Worker pool with shared task queue',
      'Judge-driven iteration cycles',
    ],
    agentRoles: [
      { name: 'Planner Agent', role: 'Creates task queue' },
      { name: 'Research-Agent', role: 'Gathers information' },
      { name: 'Analysis-Agent', role: 'Analyzes findings' },
      { name: 'Judge Agent', role: 'Evaluates completion' },
    ],
    exampleTask:
      'Produce a comprehensive market report on the EV industry covering manufacturers, technology, barriers, and outlook.',
    benchmark: {
      accuracy: 0,
      latencyS: 0,
      costUsd: 0,
      totalTokens: 0,
      llmCalls: 0,
      model: 'gpt-4o-mini',
      correctTasks: [],
    },
  },
};

export function metaFor(typeId: string): SwarmMeta {
  const known = SWARM_TYPE_META[typeId as SwarmType];
  if (known) return known;
  return {
    label: typeId,
    description: 'No description available for this swarm type.',
    longDescription: 'No description available for this swarm type.',
    category: 'auto',
    complexity: 'Medium',
    icon: Cpu,
    whenToUse: [],
    keyFeatures: [],
    agentRoles: [],
    exampleTask: '',
  };
}

export function isKnownSwarmType(typeId: string): typeId is SwarmType {
  return (SWARM_TYPES as readonly string[]).includes(typeId);
}

export function displaySwarmName(typeId: string): string {
  return metaFor(typeId).label;
}

export function swarmHref(typeId: string): string {
  return `/swarms/${encodeURIComponent(typeId)}`;
}

function baseAgentSpec(name: string, role: string, prompt: string) {
  return {
    agent_name: name,
    description: role,
    system_prompt: prompt,
    model_name: DEFAULT_MODEL,
    max_loops: 1,
    temperature: 0.3,
  };
}

export function buildSwarmPayload(typeId: string): unknown {
  const meta = metaFor(typeId);
  const task = meta.exampleTask;

  switch (typeId as SwarmType) {
    case 'AgentRearrange': {
      const flow = meta.agentRoles.map((a) => a.name).join(' -> ');
      return {
        name: 'Adaptive Content Creation',
        description: `Dynamic flow using ${typeId}`,
        swarm_type: typeId,
        rearrange_flow: flow,
        task,
        agents: meta.agentRoles.map((a) =>
          baseAgentSpec(
            a.name,
            a.role,
            `You are the ${a.name}. ${a.role}. Contribute to the shared task clearly and concisely.`
          )
        ),
        max_loops: 1,
      };
    }

    case 'SequentialWorkflow':
    case 'ConcurrentWorkflow':
    case 'GroupChat':
    case 'MultiAgentRouter':
    case 'MixtureOfAgents':
    case 'MajorityVoting':
    case 'RoundRobin':
    case 'HierarchicalSwarm':
    case 'PlannerWorkerSwarm':
    case 'LLMCouncil':
    case 'CouncilAsAJudge':
    case 'DebateWithJudge':
    case 'AutoSwarmBuilder':
    case 'auto': {
      const spec: SwarmSpec = {
        name: `${meta.label} Example`,
        description: `Example ${typeId} swarm`,
        swarm_type: typeId as SwarmType,
        task,
        agents: meta.agentRoles.map((a) =>
          baseAgentSpec(
            a.name,
            a.role,
            `You are the ${a.name}. ${a.role}. Be concise and focused.`
          )
        ),
        max_loops: 1,
      };

      if (typeId === 'HierarchicalSwarm') {
        spec.director_model_name = 'gpt-4.1';
        spec.director_settings = { temperature: 0.2, max_tokens: 4000 };
      }
      if (typeId === 'CouncilAsAJudge') {
        (spec as Record<string, unknown>).council_judge_model_name = 'gpt-5.4';
      }
      if (typeId === 'LLMCouncil') {
        (spec as Record<string, unknown>).chairman_model = 'gpt-5.1';
      }
      if (typeId === 'DebateWithJudge') {
        spec.agents = [
          baseAgentSpec(
            'Pro Advocate',
            'Argues in favor of the proposition',
            'You are an expert debater arguing IN FAVOR. Present compelling, evidence-based arguments.'
          ),
          baseAgentSpec(
            'Con Advocate',
            'Argues against the proposition',
            'You are an expert debater arguing AGAINST. Present compelling counter-arguments and identify risks.'
          ),
          baseAgentSpec(
            'Impartial Judge',
            'Evaluates both sides and synthesizes a verdict',
            'You are an impartial judge. Objectively assess both sides and synthesize a balanced conclusion.'
          ),
        ];
      }
      if (typeId === 'auto') {
        spec.agents = [
          baseAgentSpec(
            'Research Specialist',
            'Gathers and organizes source material',
            'You are a meticulous researcher. Collect relevant facts and organize them clearly.'
          ),
          baseAgentSpec(
            'Analyst',
            'Synthesizes research into actionable insights',
            'You are an analyst. Turn the research into a concise, actionable summary.'
          ),
        ];
      }

      return spec;
    }

    case 'HeavySwarm':
      return {
        name: 'Deep Research Swarm',
        description: `Example ${typeId} multi-phase analysis`,
        swarm_type: typeId,
        task,
        agents: [],
        heavy_swarm_max_loops: 1,
        heavy_swarm_question_agent_model_name: 'gpt-4.1',
        heavy_swarm_worker_model_name: 'claude-sonnet-4-20250514',
        max_loops: 1,
      };

    case 'BatchedGridWorkflow':
      return {
        name: 'Product Review Analysis Grid',
        description: `Example ${typeId} grid execution`,
        agent_completions: meta.agentRoles.map((a) =>
          baseAgentSpec(
            a.name,
            a.role,
            `You are the ${a.name}. ${a.role}. Evaluate each task independently and concisely.`
          )
        ),
        tasks: [
          'Analyze the smartphone market segment and top products',
          'Analyze the laptop market segment and top products',
          'Analyze the tablet market segment and top products',
        ],
        max_loops: 1,
      };

    default:
      return {
        name: `${meta.label} Example`,
        description: `Example ${typeId} swarm`,
        swarm_type: typeId,
        task,
        agents: meta.agentRoles.map((a) =>
          baseAgentSpec(
            a.name,
            a.role,
            `You are the ${a.name}. ${a.role}. Contribute clearly and concisely.`
          )
        ),
        max_loops: 1,
      };
  }
}

export function buildListSwarmTypesPayload(): unknown {
  return {};
}

export type SwarmFaq = { question: string; answer: string };

export function buildSwarmFaqs(typeId: string): SwarmFaq[] {
  const meta = metaFor(typeId);
  const label = meta.label;
  const endpoint = meta.endpoint ?? '/v1/swarm/completions';
  const extra = meta.endpoint
    ? ' via its dedicated endpoint'
    : ' via POST /v1/swarm/completions';

  return [
    {
      question: `How do I run a ${label} swarm?`,
      answer: `Set your SWARMS_API_KEY environment variable, then send a request${extra} with swarm_type set to "${typeId}". Use the code examples on this page as a starting template.`,
    },
    {
      question: `When should I use ${label}?`,
      answer:
        meta.whenToUse.length > 0
          ? meta.whenToUse.join(' ')
          : `Use ${label} when its pattern matches your task shape.`,
    },
    {
      question: 'Can I mix models and providers inside one swarm?',
      answer:
        'Yes. Each agent in the swarm can use a different model_name from any supported provider. A single Swarms API key covers every model in the catalog.',
    },
  ];
}

export function swarmKeywords(typeId: string): string[] {
  const meta = metaFor(typeId);
  const base = [
    typeId,
    meta.label,
    `${meta.label} swarm`,
    `${typeId} example`,
    `${typeId} API`,
    `${typeId} quickstart`,
    `${typeId} code example`,
    `${typeId} Python`,
    `${typeId} TypeScript`,
    `${typeId} cURL`,
    `${typeId} Go`,
    `${meta.label} tutorial`,
    'Swarms API',
    'multi-agent swarm',
    'swarm architecture',
    'agent orchestration',
    meta.category,
  ];
  const specific = meta.whenToUse.flatMap((use) => [
    use,
    `${typeId} ${use}`,
    `${meta.label} ${use}`,
  ]);
  return Array.from(new Set([...base, ...specific, ...meta.keyFeatures]));
}

export function swarmSeoTitle(typeId: string): string {
  const meta = metaFor(typeId);
  return `${meta.label} (${typeId}) — Swarm API Quickstart & Examples`;
}

export function swarmSeoDescription(typeId: string): string {
  const meta = metaFor(typeId);
  return `Run ${meta.label} (${typeId}) through the Swarms API. Copy Python, TypeScript, cURL, and Go examples, inspect the architecture, and launch your first multi-agent swarm.`;
}

function computeRank(
  values: number[],
  value: number,
  lowerIsBetter: boolean
): { rank: number; total: number } {
  const sorted = [...values].sort((a, b) => (lowerIsBetter ? a - b : b - a));
  const index = sorted.findIndex((v) => v >= value);
  const rank = index === -1 ? sorted.length : index + 1;
  return { rank, total: sorted.length };
}

function rankLabel(
  rank: number,
  total: number,
  labels: [string, string, string]
): string {
  const percentile = (rank - 1) / total;
  if (percentile <= 0.33) return labels[0];
  if (percentile <= 0.66) return labels[1];
  return labels[2];
}

const benchmarkEntries = Object.values(SWARM_TYPE_META).filter(
  (m) =>
    m.benchmark &&
    m.benchmark.latencyS > 0 &&
    m.benchmark.costUsd > 0
);

const latencyValues = benchmarkEntries.map((m) => m.benchmark!.latencyS);
const costValues = benchmarkEntries.map((m) => m.benchmark!.costUsd);

export function benchmarkLatencyLabel(typeId: string): string {
  const bm = metaFor(typeId).benchmark;
  if (!bm || bm.latencyS <= 0) return '';
  const { rank, total } = computeRank(latencyValues, bm.latencyS, true);
  return rankLabel(rank, total, ['Fast', 'Moderate', 'Slow']);
}

export function benchmarkCostLabel(typeId: string): string {
  const bm = metaFor(typeId).benchmark;
  if (!bm || bm.costUsd <= 0) return '';
  const { rank, total } = computeRank(costValues, bm.costUsd, true);
  return rankLabel(rank, total, ['Cheap', 'Moderate', 'Expensive']);
}

export function swarmStructuredName(typeId: string): string {
  return `${metaFor(typeId).label} — Swarms API`;
}

export function swarmApplicationUrl(typeId: string): string {
  const href = swarmHref(typeId);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${href}`;
  }
  return href;
}

export { SWARM_TYPES };

export function recommendedSwarmTypes(typeId: string, count = 3): string[] {
  const meta = metaFor(typeId);
  const sameCategory = (SWARM_TYPES as readonly string[]).filter(
    (t) =>
      t !== typeId &&
      metaFor(t).category === meta.category &&
      t !== 'auto'
  );
  const others = (SWARM_TYPES as readonly string[]).filter(
    (t) =>
      t !== typeId &&
      metaFor(t).category !== meta.category &&
      t !== 'auto'
  );
  return [...sameCategory, ...others].slice(0, count);
}
