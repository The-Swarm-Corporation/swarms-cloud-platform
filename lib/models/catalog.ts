export type ModelEntry = {
  id: string;
  raw: unknown;
  searchText: string;
};

export function flattenModels(payload: unknown): ModelEntry[] {
  if (!payload) return [];

  const collected: ModelEntry[] = [];

  const pushEntry = (id: string, raw: unknown) => {
    const searchText = JSON.stringify(raw ?? id).toLowerCase();
    collected.push({ id, raw, searchText });
  };

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          pushEntry(item, item);
        } else if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const id =
            (typeof rec.id === 'string' && rec.id) ||
            (typeof rec.name === 'string' && rec.name) ||
            (typeof rec.model === 'string' && rec.model) ||
            (typeof rec.model_name === 'string' && rec.model_name) ||
            JSON.stringify(item);
          pushEntry(String(id), item);
        }
      }
      return;
    }

    if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>;
      if (Array.isArray(rec.models)) {
        visit(rec.models);
        return;
      }
      if (Array.isArray(rec.data)) {
        visit(rec.data);
        return;
      }
      for (const [key, v] of Object.entries(rec)) {
        if (Array.isArray(v)) {
          for (const item of v) {
            if (typeof item === 'string') {
              pushEntry(`${key}/${item}`, { provider: key, model: item });
            } else if (item && typeof item === 'object') {
              const rec2 = item as Record<string, unknown>;
              const id =
                (typeof rec2.id === 'string' && rec2.id) ||
                (typeof rec2.name === 'string' && rec2.name) ||
                (typeof rec2.model === 'string' && rec2.model) ||
                JSON.stringify(item);
              pushEntry(String(id), { provider: key, ...rec2 });
            }
          }
        } else if (typeof v === 'string') {
          pushEntry(`${key}: ${v}`, { [key]: v });
        }
      }
    }
  };

  visit(payload);
  return collected;
}

/** The model name to put in agent_config.model_name for an entry. */
export function entryModelName(entry: ModelEntry): string {
  const meta =
    entry.raw && typeof entry.raw === 'object'
      ? (entry.raw as Record<string, unknown>)
      : null;
  return (
    (meta && typeof meta.model === 'string' && meta.model) ||
    (meta && typeof meta.model_name === 'string' && meta.model_name) ||
    entry.id
  );
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  gemini: 'Google',
  'meta-llama': 'Meta Llama',
  meta: 'Meta',
  mistral: 'Mistral',
  mistralai: 'Mistral AI',
  deepseek: 'DeepSeek',
  xai: 'xAI',
  'x-ai': 'xAI',
  groq: 'Groq',
  cohere: 'Cohere',
  qwen: 'Qwen',
  perplexity: 'Perplexity',
  nvidia: 'NVIDIA',
  microsoft: 'Microsoft',
  amazon: 'Amazon',
  bedrock: 'Bedrock',
  azure: 'Azure',
  together: 'Together',
  together_ai: 'Together AI',
  fireworks: 'Fireworks',
  fireworks_ai: 'Fireworks AI',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
  huggingface: 'Hugging Face',
};

const ACRONYMS = new Set([
  'gpt',
  'ai',
  'llm',
  'glm',
  'vl',
  'tts',
  'sts',
  'moe',
  'hd',
  'xl',
  'r1',
  'v1',
  'v2',
  'v3',
]);

function titleToken(token: string): string {
  const lower = token.toLowerCase();
  if (ACRONYMS.has(lower)) return lower.toUpperCase();
  // Size tokens like 70b, 8x7b → 70B, 8x7B
  if (/^\d+(x\d+)?b$/i.test(token)) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/** "gpt-4.1-mini" → "GPT 4.1 Mini"; "claude-opus-4-1" → "Claude Opus 4.1" */
export function cleanModelName(name: string): string {
  const tokens = name.split(/[-_\s]+/).filter(Boolean);

  // Re-join dash-separated version parts: ["4", "1"] → "4.1". Only short
  // numeric continuations qualify so date stamps like "20250514" stay apart.
  const merged: string[] = [];
  for (const token of tokens) {
    const prev = merged[merged.length - 1];
    if (prev && /^\d+$/.test(prev) && /^\d{1,2}$/.test(token)) {
      merged[merged.length - 1] = `${prev}.${token}`;
    } else {
      merged.push(token);
    }
  }

  return merged.map(titleToken).join(' ');
}

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider.toLowerCase()] ?? cleanModelName(provider);
}

/**
 * Split a model id into provider and bare name.
 * "openai/gpt-4.1" → { provider: "openai", name: "gpt-4.1" }
 */
export function splitModelId(id: string): {
  provider: string | null;
  name: string;
} {
  const slash = id.indexOf('/');
  if (slash > 0 && slash < id.length - 1) {
    return { provider: id.slice(0, slash), name: id.slice(slash + 1) };
  }
  return { provider: null, name: id };
}

/** "openai/gpt-4.1-mini" → "OpenAI: GPT 4.1 Mini" */
export function displayModelName(id: string): string {
  const { provider, name } = splitModelId(id);
  const clean = cleanModelName(name);
  return provider ? `${providerLabel(provider)}: ${clean}` : clean;
}

/** URL path for a model detail page; ids may contain slashes. */
export function modelHref(id: string): string {
  return `/models/${id.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Popular models, used for static generation, sitemap fallback, and as a
 * recommendation tie-breaker.
 */
export const POPULAR_MODEL_IDS: readonly string[] = [
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'o3',
  'o3-mini',
  'o4-mini',
  'claude-opus-4-1',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-latest',
  'claude-3-5-haiku-latest',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'deepseek-chat',
  'deepseek-reasoner',
  'groq/llama-3.3-70b-versatile',
  'groq/llama-3.1-8b-instant',
  'mistral/mistral-large-latest',
  'mistral/mistral-small-latest',
  'xai/grok-4',
  'xai/grok-3-mini',
];

/** Brand color + monogram per provider for badges; Cpu icon is the fallback. */
const PROVIDER_VISUALS: Record<string, { monogram: string; color: string }> = {
  openai: { monogram: 'OA', color: '#10a37f' },
  anthropic: { monogram: 'A', color: '#d97757' },
  google: { monogram: 'G', color: '#4285f4' },
  gemini: { monogram: 'G', color: '#4285f4' },
  meta: { monogram: 'M', color: '#0668e1' },
  'meta-llama': { monogram: 'M', color: '#0668e1' },
  mistral: { monogram: 'Mi', color: '#fa5111' },
  mistralai: { monogram: 'Mi', color: '#fa5111' },
  deepseek: { monogram: 'DS', color: '#4d6bfe' },
  xai: { monogram: 'X', color: '#9ca3af' },
  'x-ai': { monogram: 'X', color: '#9ca3af' },
  groq: { monogram: 'Gq', color: '#f55036' },
  cohere: { monogram: 'Co', color: '#39594d' },
  qwen: { monogram: 'Q', color: '#6157ff' },
  perplexity: { monogram: 'P', color: '#20b8cd' },
  nvidia: { monogram: 'NV', color: '#76b900' },
  microsoft: { monogram: 'MS', color: '#0078d4' },
  amazon: { monogram: 'AZ', color: '#ff9900' },
  bedrock: { monogram: 'BR', color: '#ff9900' },
  azure: { monogram: 'Az', color: '#0078d4' },
  together: { monogram: 'T', color: '#0f6fff' },
  together_ai: { monogram: 'T', color: '#0f6fff' },
  fireworks: { monogram: 'FW', color: '#7c3aed' },
  fireworks_ai: { monogram: 'FW', color: '#7c3aed' },
  openrouter: { monogram: 'OR', color: '#8b5cf6' },
  ollama: { monogram: 'Ol', color: '#94a3b8' },
  huggingface: { monogram: 'HF', color: '#ffb000' },
};

/**
 * Provider inferred from an entry's metadata or id prefix, or by matching
 * well-known model-name prefixes for bare ids like "gpt-4.1".
 */
export function entryProvider(entry: ModelEntry): string | null {
  const meta =
    entry.raw && typeof entry.raw === 'object'
      ? (entry.raw as Record<string, unknown>)
      : null;
  const explicit =
    (meta && typeof meta.provider === 'string' && meta.provider) ||
    splitModelId(entry.id).provider;
  if (explicit) return explicit;

  const bare = entry.id.toLowerCase();
  if (/^(gpt|o[1-9]|chatgpt|davinci|dall-e|whisper|omni)/.test(bare))
    return 'openai';
  if (bare.startsWith('claude')) return 'anthropic';
  if (bare.startsWith('gemini') || bare.startsWith('gemma')) return 'google';
  if (bare.startsWith('llama')) return 'meta';
  if (bare.startsWith('mistral') || bare.startsWith('mixtral'))
    return 'mistral';
  if (bare.startsWith('deepseek')) return 'deepseek';
  if (bare.startsWith('grok')) return 'xai';
  if (bare.startsWith('qwen') || bare.startsWith('qwq')) return 'qwen';
  if (bare.startsWith('command')) return 'cohere';
  if (bare.startsWith('sonar')) return 'perplexity';
  return null;
}

export function providerVisual(provider: string | null): {
  label: string;
  monogram: string;
  color: string;
} | null {
  if (!provider) return null;
  const visual = PROVIDER_VISUALS[provider.toLowerCase()];
  if (!visual) {
    return {
      label: providerLabel(provider),
      monogram: provider.slice(0, 2).toUpperCase(),
      color: '#94a3b8',
    };
  }
  return { label: providerLabel(provider), ...visual };
}

const VISION_PATTERNS =
  /gpt-4o|gpt-4\.1|gpt-5|o[34]|omni|claude|gemini|vision|-vl|vl-|pixtral|llava|grok-[4-9]|multimodal/i;

/** Heuristic capability detection from the model name. */
export function detectCapabilities(modelName: string): { vision: boolean } {
  return { vision: VISION_PATTERNS.test(modelName) };
}

export type ExampleVariant = 'basic' | 'vision' | 'autonomous' | 'streaming';

export function exampleVariantsFor(modelName: string): {
  key: ExampleVariant;
  label: string;
}[] {
  const variants: { key: ExampleVariant; label: string }[] = [
    { key: 'basic', label: 'Basic' },
  ];
  if (detectCapabilities(modelName).vision) {
    variants.push({ key: 'vision', label: 'Vision' });
  }
  variants.push(
    { key: 'autonomous', label: 'Autonomous' },
    { key: 'streaming', label: 'Streaming' }
  );
  return variants;
}

export function buildAgentPayloadVariant(
  modelName: string,
  variant: ExampleVariant
) {
  const base = buildSingleAgentPayload(modelName);
  switch (variant) {
    case 'vision':
      return {
        agent_config: {
          ...base.agent_config,
          agent_name: 'Image Analyst',
          description: 'Analyzes images and answers questions about them',
          system_prompt:
            'You are an expert at analyzing and describing images in detail.',
        },
        task: 'Describe what you see in this image in detail',
        img: '<base64-encoded image>',
      };
    case 'autonomous':
      return {
        agent_config: {
          ...base.agent_config,
          agent_name: 'Autonomous Researcher',
          description: 'Plans and executes multi-step tasks on its own',
          system_prompt:
            'You are an autonomous agent. Break the task into steps, use your tools, and decide when the task is complete.',
          max_loops: 'auto',
        },
        task: 'Research the current state of renewable energy, identify the top 3 challenges, and propose a solution for each',
      };
    case 'streaming':
      return {
        agent_config: {
          ...base.agent_config,
          streaming_on: true,
        },
        task: base.task,
      };
    default:
      return base;
  }
}

/**
 * Deterministic recommendations: same family (bare-name prefix relation)
 * first, then same provider, then popular models; alphabetical tie-break.
 */
export function rankRecommendations(
  catalog: ModelEntry[],
  modelId: string,
  count = 3
): ModelEntry[] {
  const currentBare = splitModelId(modelId).name.toLowerCase();
  const currentProvider = entryProvider({
    id: modelId,
    raw: null,
    searchText: '',
  });
  const popular = new Set(POPULAR_MODEL_IDS.map((id) => id.toLowerCase()));

  const seen = new Set<string>();
  const scored: { entry: ModelEntry; score: number }[] = [];
  for (const entry of catalog) {
    if (entry.id === modelId) continue;
    const name = entryModelName(entry);
    if (name === modelId || seen.has(name)) continue;
    seen.add(name);

    const bare = splitModelId(entry.id).name.toLowerCase();
    let score = 0;
    if (
      bare.length >= 3 &&
      currentBare.length >= 3 &&
      (bare.startsWith(currentBare) || currentBare.startsWith(bare))
    ) {
      score += 4;
    }
    const provider = entryProvider(entry);
    if (
      provider &&
      currentProvider &&
      provider.toLowerCase() === currentProvider.toLowerCase()
    ) {
      score += 2;
    }
    if (popular.has(entry.id.toLowerCase()) || popular.has(bare)) {
      score += 1;
    }
    scored.push({ entry, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id)
  );
  return scored.slice(0, count).map((s) => s.entry);
}

/**
 * Search-relevant ways people write this model's name:
 * "openai/gpt-4.1-mini", "gpt-4.1-mini", "GPT 4.1 Mini", "OpenAI GPT 4.1 Mini".
 */
export function modelNameAliases(modelId: string): string[] {
  const { provider, name } = splitModelId(modelId);
  const clean = cleanModelName(name);
  const aliases = new Set<string>([modelId, name, clean]);
  const spaced = name.replace(/[-_]+/g, ' ');
  if (spaced !== name) aliases.add(spaced);
  if (provider) {
    aliases.add(`${providerLabel(provider)} ${clean}`);
  }
  return Array.from(aliases);
}

const KEYWORD_SUFFIXES_PRIMARY = [
  'API',
  'API key',
  'agents',
  'agent API',
  'quickstart',
  'example',
  'code example',
  'Python example',
  'TypeScript example',
  'cURL example',
  'integration',
  'tutorial',
  'multi-agent',
  'swarm',
  'pricing',
  'API pricing',
] as const;

const KEYWORD_SUFFIXES_SECONDARY = ['API', 'agents', 'example'] as const;

/**
 * Extensive per-model keyword set: every alias crossed with high-intent
 * suffixes (full matrix for the two primary aliases, a short one for the
 * rest), plus how-to phrasings and provider terms. Merged with site-wide
 * keywords by buildMetadata.
 */
export function modelKeywords(modelId: string): string[] {
  const aliases = modelNameAliases(modelId);
  const { provider, name } = splitModelId(modelId);
  const clean = cleanModelName(name);
  const providerName = provider ? providerLabel(provider) : null;

  const keywords = new Set<string>();
  const [primaryA, primaryB] = [modelId, clean];

  for (const alias of aliases) {
    keywords.add(alias);
    const suffixes =
      alias === primaryA || alias === primaryB
        ? KEYWORD_SUFFIXES_PRIMARY
        : KEYWORD_SUFFIXES_SECONDARY;
    for (const suffix of suffixes) keywords.add(`${alias} ${suffix}`);
  }

  keywords.add(`run ${modelId}`);
  keywords.add(`use ${clean} API`);
  keywords.add(`how to use ${clean}`);
  keywords.add(`${clean} OpenAI compatible API`);
  keywords.add(`${clean} REST API`);
  keywords.add(`best model for AI agents`);
  if (providerName) {
    keywords.add(`${providerName} models`);
    keywords.add(`${providerName} API`);
    keywords.add(`${providerName} ${clean} API`);
  }

  return Array.from(keywords).slice(0, 80);
}

/** SERP title for a model page (brand suffix added by buildMetadata). */
export function modelSeoTitle(modelId: string): string {
  return `${displayModelName(modelId)} API — Agents, Quickstart & Examples`;
}

/**
 * SERP/OG description; prefers a concise catalog description when given,
 * otherwise generates a keyword-rich one. Kept under ~170 chars.
 */
export function modelSeoDescription(
  modelId: string,
  catalogDescription?: string | null
): string {
  if (
    catalogDescription &&
    catalogDescription.length >= 50 &&
    catalogDescription.length <= 300
  ) {
    return catalogDescription;
  }
  const clean = cleanModelName(splitModelId(modelId).name);
  return `Run ${clean} (${modelId}) through one OpenAI-compatible Swarms API. Copy Python, TypeScript & cURL examples, launch a single agent, and scale to multi-agent swarms.`;
}

/**
 * Crawlable overview prose for pages whose catalog entry has no
 * description; also reused as visible on-page copy.
 */
export function modelOverview(modelId: string): string {
  const { provider, name } = splitModelId(modelId);
  const clean = cleanModelName(name);
  const providerName = provider ? providerLabel(provider) : null;
  const vision = detectCapabilities(modelId).vision;
  return [
    `${clean}${providerName ? ` from ${providerName}` : ''} is available on Swarms Cloud through our Agent Completions API, no separate provider account or API key required.`,
    `Run it as a standalone agent with the Agent Completions API, enable tools, structured outputs, and autonomous loops, or orchestrate it inside multi-agent swarms alongside models from other providers.`,
    vision
      ? `${clean} also supports vision tasks: pass base64-encoded images and it can analyze, describe, and answer questions about them.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export type ModelFaq = { question: string; answer: string };

export function buildModelFaqs(modelId: string): ModelFaq[] {
  const clean = cleanModelName(splitModelId(modelId).name);
  const { provider } = splitModelId(modelId);
  const providerName = provider ? providerLabel(provider) : null;
  return [
    {
      question: `How do I use ${clean} with the Swarms API?`,
      answer: `Set your SWARMS_API_KEY environment variable, then send a POST request to /v1/agent/completions with agent_config.model_name set to "${modelId}". The API works from Python, TypeScript, cURL, or any HTTP client.`,
    },
    {
      question: `Can I use ${clean} in a multi-agent swarm?`,
      answer: `Yes. Pass "${modelId}" as the model_name of any agent in a POST to /v1/swarm/completions. You can mix it with other models across 17+ swarm architectures such as SequentialWorkflow, ConcurrentWorkflow, and HierarchicalSwarm.`,
    },
    {
      question: `How is ${clean} billed on Swarms Cloud?`,
      answer: `Usage is billed per input and output token. See the Swarms Cloud pricing page for the token cost calculator and current rates.`,
    },
    {
      question: providerName
        ? `Do I need a separate ${providerName} API key to use ${clean}?`
        : `Do I need a separate provider API key to use ${clean}?`,
      answer: `No. A single Swarms API key gives you access to every model in the catalog through one OpenAI-compatible API — no separate provider accounts required.`,
    },
  ];
}

export function buildSingleAgentPayload(modelName: string) {
  return {
    agent_config: {
      agent_name: 'Research Analyst',
      description: 'Expert in analyzing and synthesizing research data',
      system_prompt:
        'You are a Research Analyst with expertise in data analysis and synthesis.',
      model_name: modelName,
      max_loops: 1,
      max_tokens: 8192,
      temperature: 0.5,
    },
    task: 'Analyze the impact of artificial intelligence on healthcare',
  };
}

export function buildSwarmPayload(modelName: string) {
  return {
    name: 'Research Swarm',
    description: 'A two-agent research and analysis pipeline',
    swarm_type: 'SequentialWorkflow',
    task: 'Research the latest developments in renewable energy and summarize the top 3 trends',
    agents: [
      {
        agent_name: 'Researcher',
        description: 'Gathers and organizes source material',
        system_prompt:
          'You are a meticulous researcher. Collect relevant facts and organize them clearly.',
        model_name: modelName,
        max_loops: 1,
      },
      {
        agent_name: 'Analyst',
        description: 'Synthesizes research into actionable insights',
        system_prompt:
          'You are an analyst. Turn the research into a concise, actionable summary.',
        model_name: modelName,
        max_loops: 1,
      },
    ],
    max_loops: 1,
  };
}
