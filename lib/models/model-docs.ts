import {
  buildModelFaqs,
  buildSingleAgentPayload,
  buildSwarmPayload,
  displayModelName,
  modelOverview,
} from '@/lib/models/catalog';
import { buildSnippet } from '@/lib/api/snippets';
import { SITE } from '@/lib/seo';

const API_BASE_URL = 'https://api.swarms.world';
// SITE.url falls back to swarms.ai when NEXT_PUBLIC_SITE_URL isn't set, but
// this app only ever runs at cloud.swarms.world - hardcode it so the docs
// links are always correct regardless of env config.
export const CLOUD_URL = 'https://cloud.swarms.world';

const ENV_SNIPPET = `# .env
SWARMS_API_KEY="your-api-key"

# or export it in your shell
export SWARMS_API_KEY="your-api-key"`;

/** Build the canonical model page URL (matches app/models/[...model]). */
function modelPageUrl(modelId: string): string {
  const path = modelId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${CLOUD_URL}/models/${path}`;
}

/**
 * Render the full quick-start docs for a model as a single Markdown document,
 * suitable for pasting into an LLM or a docs file. Mirrors what the model
 * detail page shows: overview, API-key setup, single-agent and swarm examples
 * (cURL + Python), and the FAQ.
 */
export function buildModelDocs(opts: {
  modelId: string;
  modelName: string;
  description?: string | null;
}): string {
  const { modelId, modelName } = opts;
  const displayName = displayModelName(modelId);
  const overview =
    (opts.description && opts.description.trim()) || modelOverview(modelId);

  const agentPayload = buildSingleAgentPayload(modelName);
  const swarmPayload = buildSwarmPayload(modelName);

  const agentCurl = buildSnippet('curl', {
    baseUrl: API_BASE_URL,
    endpoint: '/v1/agent/completions',
    method: 'POST',
    payload: agentPayload,
  });
  const agentPython = buildSnippet('python', {
    baseUrl: API_BASE_URL,
    endpoint: '/v1/agent/completions',
    method: 'POST',
    payload: agentPayload,
  });
  const swarmCurl = buildSnippet('curl', {
    baseUrl: API_BASE_URL,
    endpoint: '/v1/swarm/completions',
    method: 'POST',
    payload: swarmPayload,
  });
  const swarmPython = buildSnippet('python', {
    baseUrl: API_BASE_URL,
    endpoint: '/v1/swarm/completions',
    method: 'POST',
    payload: swarmPayload,
  });

  const faqs = buildModelFaqs(modelId);

  const lines: string[] = [
    `# ${displayName} on ${SITE.name}`,
    '',
    `**Model ID:** \`${modelName}\``,
    '',
    overview,
    '',
    '## 1. Get your Swarms API key',
    '',
    `Create an API key from your Swarms Cloud API keys dashboard: ${CLOUD_URL}/api-keys (or https://swarms.world/platform/api-keys).`,
    '',
    '## 2. Set it in your environment',
    '',
    '```bash',
    ENV_SNIPPET,
    '```',
    '',
    '## 3. Run a single agent',
    '',
    `Execute one agent with \`${modelName}\` via the Agent Completions API (\`POST ${API_BASE_URL}/v1/agent/completions\`).`,
    '',
    '### cURL',
    '',
    '```bash',
    agentCurl,
    '```',
    '',
    '### Python',
    '',
    '```python',
    agentPython,
    '```',
    '',
    '## 4. Scale to a multi-agent swarm',
    '',
    `Chain multiple agents on \`${modelName}\` with the Swarm Completions API (\`POST ${API_BASE_URL}/v1/swarm/completions\`).`,
    '',
    '### cURL',
    '',
    '```bash',
    swarmCurl,
    '```',
    '',
    '### Python',
    '',
    '```python',
    swarmPython,
    '```',
    '',
    '## Frequently asked questions',
    '',
    ...faqs.flatMap((faq) => [`### ${faq.question}`, '', faq.answer, '']),
    '---',
    '',
    `Full documentation: ${modelPageUrl(modelId)}`,
    '',
  ];

  return lines.join('\n');
}
