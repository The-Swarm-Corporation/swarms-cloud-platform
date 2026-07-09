import {
  LayoutGrid,
  Hammer,
  Users,
  History,
  Cpu,
  Network,
  Sparkles,
  Wand2,
  Calculator,
  Settings,
  AppWindow,
  Package,
  Activity,
  BarChart3,
  Gauge,
  KeyRound,
  BookOpen,
  Workflow,
  GitCompare,
} from 'lucide-react';

export type AppCategory =
  | 'operate'
  | 'catalog'
  | 'build'
  | 'tools'
  | 'account'
  | 'discover';

export type AppStatus = 'live' | 'beta' | 'soon';

export type AppEntry = {
  href: string;
  label: string;
  description: string;
  longDescription: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  category: AppCategory;
  status: AppStatus;
};

export const APP_CATEGORIES: Record<
  AppCategory,
  { label: string; description: string }
> = {
  operate: {
    label: 'Operate',
    description:
      'Run and monitor the platform — dashboards, telemetry, and execution history.',
  },
  build: {
    label: 'Build',
    description:
      'Author, configure, and compose single agents and multi-agent swarms.',
  },
  catalog: {
    label: 'Catalog',
    description:
      'Browse every model and swarm architecture supported by the Swarms API.',
  },
  tools: {
    label: 'Tools',
    description:
      'Utilities for prompt engineering and cost forecasting.',
  },
  account: {
    label: 'Account',
    description: 'Workspace settings, API keys, and credit balance.',
  },
  discover: {
    label: 'Discover',
    description: 'Learn what the platform offers and how to get started.',
  },
};

export const CATEGORY_ORDER: AppCategory[] = [
  'operate',
  'build',
  'catalog',
  'tools',
  'account',
  'discover',
];

const STATUS_LABEL: Record<AppStatus, string> = {
  live: 'Live',
  beta: 'Beta',
  soon: 'Soon',
};

const STATUS_TONE: Record<AppStatus, string> = {
  live: 'border-success/30 bg-success/10 text-success',
  beta: 'border-warning/30 bg-warning/10 text-warning',
  soon: 'border-border-strong bg-subtle text-muted-foreground',
};

export function statusLabel(status: AppStatus): string {
  return STATUS_LABEL[status];
}

export function statusTone(status: AppStatus): string {
  return STATUS_TONE[status];
}

export const APPS: AppEntry[] = [
  {
    href: '/',
    label: 'Dashboard',
    description: 'Overview, metrics, and rate-limit monitoring.',
    longDescription:
      'Real-time analytics for your Swarms workspace — agent counts, executions, success rate, and rate-limit windows across minute/hour/day.',
    keywords: ['home', 'overview', 'analytics', 'metrics', 'stats', 'rate limits'],
    icon: LayoutGrid,
    category: 'operate',
    status: 'live',
  },
  {
    href: '/history',
    label: 'Execution history',
    description: 'Past executions and outputs.',
    longDescription:
      'API request log explorer backed by /v1/swarm/logs. Search and paginate every agent and swarm run with token usage and cost breakdowns.',
    keywords: ['executions', 'logs', 'runs', 'past', 'observability', 'audit'],
    icon: History,
    category: 'operate',
    status: 'live',
  },
  {
    href: '/observability',
    label: 'Observability',
    description: 'Monitor latency, errors, and performance.',
    longDescription:
      'Real-time monitoring for API requests — latency, error rates, cache hit rate, and rate-limit windows across every agent and swarm execution.',
    keywords: [
      'monitoring',
      'latency',
      'errors',
      'performance',
      'telemetry',
      'metrics',
      'cache',
    ],
    icon: Activity,
    category: 'operate',
    status: 'live',
  },
  {
    href: '/token-usage',
    label: 'Token usage',
    description: 'Track token usage and cost over time.',
    longDescription:
      'Charts of input/output tokens and cost across your completions — by day, week, or month, grouped by agent or API key, with filters, a table view, and CSV export.',
    keywords: [
      'usage',
      'tokens',
      'consumption',
      'cost',
      'analytics',
      'charts',
      'input tokens',
      'output tokens',
      'spend',
    ],
    icon: BarChart3,
    category: 'operate',
    status: 'live',
  },
  {
    href: '/rate-limits',
    label: 'Rate limits',
    description: 'Live rate-limit usage and reset countdowns.',
    longDescription:
      'Per-minute, per-hour, and per-day windows with live usage bars, countdowns to each reset, tier details, and upgrade options.',
    keywords: [
      'rate limits',
      'limits',
      'quota',
      'throttle',
      '429',
      'requests per minute',
      'reset',
      'tier',
      'upgrade',
    ],
    icon: Gauge,
    category: 'account',
    status: 'live',
  },
  {
    href: '/workbench',
    label: 'Workbench',
    description: 'Build, configure, and run agents.',
    longDescription:
      'Author single agents — model, prompt, temperature, tools — and execute them against the production Swarms API in one click.',
    keywords: ['build', 'create', 'configure', 'run', 'editor', 'IDE'],
    icon: Hammer,
    category: 'build',
    status: 'live',
  },
  {
    href: '/agents',
    label: 'Agents',
    description: 'Manage every agent in your workspace.',
    longDescription:
      'Catalog of agent configurations from /v1/agents/list. Search, sort, and inspect every persisted agent on your account.',
    keywords: ['list', 'manage', 'configurations'],
    icon: Users,
    category: 'build',
    status: 'live',
  },
  {
    href: '/playground',
    label: 'Playground',
    description: 'Compose multiple agents and run them as a swarm.',
    longDescription:
      'Interactive composer for multi-agent swarms. Pick agents, pick an architecture, send a task, and inspect the output.',
    keywords: [
      'playground',
      'compose',
      'multi-agent',
      'collaborate',
      'run',
      'experiment',
    ],
    icon: Sparkles,
    category: 'build',
    status: 'live',
  },
  {
    href: '/compare',
    label: 'Compare',
    description: 'Run the same task through 2+ agents side by side.',
    longDescription:
      'Configure or import 2 to 6 agents, send them the same task, and compare their responses, latency, tokens, and cost side by side.',
    keywords: [
      'compare',
      'comparison',
      'side by side',
      'a/b test',
      'models',
      'benchmark',
      'versus',
      'multiple models',
    ],
    icon: GitCompare,
    category: 'build',
    status: 'live',
  },
  {
    href: '/workflow-builder',
    label: 'Workflow Builder',
    description: 'Visually build flows of agents on a canvas.',
    longDescription:
      'Drag agents onto a canvas, connect them into a directed flow, then run the workflow on the platform or export the exact /v1/graph-workflow/completions request as Python, TypeScript, Go, or cURL. Pro/Ultra plans.',
    keywords: [
      'workflow',
      'builder',
      'visual editor',
      'node editor',
      'flow',
      'graph',
      'directed graph',
      'multi-agent',
      'orchestration',
      'pipeline',
      'dag',
    ],
    icon: Workflow,
    category: 'build',
    status: 'beta',
  },
  {
    href: '/models',
    label: 'Models',
    description: 'Browse available AI models for agents and swarms.',
    longDescription:
      'Live model catalog from /v1/models/available — GPT, Claude, Gemini, Llama and more. Cached for 10 hours; refresh on demand.',
    keywords: ['llm', 'ai', 'catalog', 'providers', 'gpt', 'claude'],
    icon: Cpu,
    category: 'catalog',
    status: 'live',
  },
  {
    href: '/swarms',
    label: 'Swarm types',
    description: 'Multi-agent architectures supported by the Swarms API.',
    longDescription:
      'Every architecture from /v1/swarms/available with descriptions — Hierarchical, Sequential, Concurrent, Mixture of Agents, Council, Debate, Router, Auto Builder, and more.',
    keywords: [
      'architecture',
      'topology',
      'hierarchical',
      'sequential',
      'concurrent',
      'router',
      'council',
      'voting',
      'debate',
    ],
    icon: Network,
    category: 'catalog',
    status: 'live',
  },
  {
    href: '/sdks',
    label: 'SDKs',
    description: 'Official client libraries and MCP server.',
    longDescription:
      'Build with the Swarms API in any language. Official, typed SDKs for Python, TypeScript, Go, Java, and C#, plus the MCP server for Claude Desktop and Cursor.',
    keywords: [
      'sdk',
      'client library',
      'python',
      'typescript',
      'javascript',
      'go',
      'java',
      'csharp',
      '.net',
      'mcp',
      'model context protocol',
      'claude desktop',
      'cursor',
      'swarms-client',
      'swarms-ts',
    ],
    icon: Package,
    category: 'catalog',
    status: 'live',
  },
  {
    href: '/prompts',
    label: 'Prompt generator',
    description: 'Auto-generate production-grade system prompts.',
    longDescription:
      'A specialized Prompt Architect agent (claude-sonnet-4-6) turns a one-line brief into a drop-in deployable system prompt with named sections and operating constraints.',
    keywords: [
      'prompt',
      'prompt engineering',
      'system prompt',
      'generate prompt',
      'prompt architect',
      'meta prompt',
      'sonnet',
      'claude',
    ],
    icon: Wand2,
    category: 'tools',
    status: 'live',
  },
  {
    href: '/pricing',
    label: 'Pricing calculator',
    description: 'Estimate API costs by tokens and tools.',
    longDescription:
      'Token-based calculator for unified pricing ($6.50/M in, $18.50/M out), agent cost, image, MCP, Exa search, web scraper, plus night discount and Frenzy Mode.',
    keywords: [
      'cost',
      'tokens',
      'estimate',
      'price',
      'calculator',
      'billing',
    ],
    icon: Calculator,
    category: 'tools',
    status: 'live',
  },
  {
    href: '/api-keys',
    label: 'API keys',
    description: 'View, create, and revoke API keys.',
    longDescription:
      'Manage the API keys that authenticate your apps against the Swarms API. Full keys are shown once at creation; revoke compromised keys instantly.',
    keywords: [
      'api key',
      'keys',
      'authentication',
      'credentials',
      'token',
      'security',
      'create key',
      'revoke',
    ],
    icon: KeyRound,
    category: 'account',
    status: 'live',
  },
  {
    href: '/settings',
    label: 'Settings',
    description: 'API keys, preferences, and workspace settings.',
    longDescription:
      'Manage your Swarms API key, view your credit balance (paid, free, referral), and choose the workspace theme.',
    keywords: ['api key', 'preferences', 'config', 'account', 'credits'],
    icon: Settings,
    category: 'account',
    status: 'live',
  },
  {
    href: '/learn-more',
    label: 'Learn more',
    description: 'Product overview of The Swarms Cloud.',
    longDescription:
      'The Swarms Cloud in one page — capabilities, all 16 swarm architectures, the management console, global infrastructure, pricing, and SDKs.',
    keywords: [
      'about',
      'overview',
      'introduction',
      'landing',
      'features',
      'enterprise',
      'what is swarms',
    ],
    icon: BookOpen,
    category: 'discover',
    status: 'live',
  },
];

export const APPS_DIRECTORY_ENTRY: AppEntry = {
  href: '/apps',
  label: 'Apps',
  description: 'Every page, tool, and product in Swarms Cloud.',
  longDescription:
    'A grouped directory of every app on the platform with search.',
  keywords: ['apps', 'launcher', 'directory', 'index', 'all pages'],
  icon: AppWindow,
  category: 'operate',
  status: 'live',
};
