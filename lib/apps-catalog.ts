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
} from 'lucide-react';

export type AppCategory = 'operate' | 'catalog' | 'build' | 'tools' | 'account';

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
    description: 'Workspace settings, API key, and credit balance.',
  },
};

export const CATEGORY_ORDER: AppCategory[] = [
  'operate',
  'build',
  'catalog',
  'tools',
  'account',
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
