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

/** "gpt-4.1-mini" → "GPT 4.1 Mini" */
export function cleanModelName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(titleToken)
    .join(' ');
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
