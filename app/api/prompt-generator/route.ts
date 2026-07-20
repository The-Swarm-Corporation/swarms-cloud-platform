import { NextRequest, NextResponse } from 'next/server';
import SwarmsAPIClient from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import { MODEL_OPTIONS, type AgentConfig } from '@/types/agent';

const DEFAULT_MODEL = 'claude-sonnet-4-6';

// Models the user may pick for the Prompt Architect agent. The default sits
// alongside the shared agent-config options so the allowlist stays in sync.
const ALLOWED_MODELS = new Set<string>([
  DEFAULT_MODEL,
  ...MODEL_OPTIONS.map((m) => m.value),
]);

function resolveModel(requested: unknown): string {
  return typeof requested === 'string' && ALLOWED_MODELS.has(requested)
    ? requested
    : DEFAULT_MODEL;
}

const PROMPT_ARCHITECT_SYSTEM_PROMPT = `You are Prompt Architect - a senior prompt engineer specializing in production-grade system prompts for AI agents. Your only job is to translate a high-level description of a desired agent into a complete, deployable system prompt.

When given a brief, follow this internal process before writing:

1. CLARIFY the role: identify the agent's domain expertise, primary responsibilities, and the user persona it serves.
2. SPECIFY success criteria: explicit, measurable behaviors that define correct output. Replace vague qualities like "helpful" with operational definitions.
3. DEFINE operating constraints: what the agent must always do, never do, and how to handle ambiguity or edge cases.
4. STRUCTURE the output format: precisely how responses should be organized - markdown sections, JSON schema, plain prose, bullet patterns, length envelopes.
5. INCLUDE one concrete example showing input → expected output, but only when wording alone leaves real ambiguity.

OUTPUT REQUIREMENTS

- Return ONLY the system prompt. No preamble, no meta-commentary, no sign-off, no "Here is your prompt:" introduction.
- Write in second person ("You are…") addressing the agent directly.
- Open with one short paragraph defining role and domain.
- Follow with named sections such as: Responsibilities, Operating Principles, Output Format, Boundaries.
- Keep total length between 200 and 600 words unless the task genuinely requires more.
- Use confident, declarative voice. No hedging - avoid "try to", "if possible", "you should consider", "feel free to".
- Use backticks for code identifiers, file paths, tool names, and API field names so the prompt renders cleanly in any UI.
- Never include disclaimers, model self-references ("As an AI…"), refusal templates, or apologetic framing.

QUALITY BAR

Every prompt you produce must be drop-in usable in a production agent runtime. A skilled prompt engineer reading your output should not need to edit it before deployment. Prefer specificity over flexibility; prefer one strong instruction over three weak ones.`;

function buildArchitectConfig(model: string): AgentConfig {
  return {
    agent_name: 'Prompt Architect',
    description:
      'Designs production-grade system prompts for AI agents from a high-level brief.',
    system_prompt: PROMPT_ARCHITECT_SYSTEM_PROMPT,
    model_name: model,
    role: 'analyst',
    max_loops: 1,
    max_tokens: 4000,
    temperature: 0.4,
    auto_generate_prompt: false,
    streaming_on: false,
  };
}

type Body = {
  goal?: string;
  domain?: string;
  audience?: string;
  constraints?: string;
  outputFormat?: string;
  model?: string;
};

function buildTask(body: Body): string {
  const goal = (body.goal ?? '').trim();
  if (!goal) return '';

  const lines: string[] = [
    'Generate a production-grade system prompt for an AI agent with the following brief.',
    '',
    `GOAL: ${goal}`,
  ];

  if (body.domain?.trim()) lines.push(`DOMAIN / ROLE: ${body.domain.trim()}`);
  if (body.audience?.trim()) lines.push(`TARGET USERS: ${body.audience.trim()}`);
  if (body.constraints?.trim())
    lines.push(`CONSTRAINTS: ${body.constraints.trim()}`);
  if (body.outputFormat?.trim())
    lines.push(`PREFERRED OUTPUT FORMAT: ${body.outputFormat.trim()}`);

  lines.push(
    '',
    'Return ONLY the finished system prompt - no preamble, no meta-commentary.'
  );

  return lines.join('\n');
}

function extractText(outputs: unknown): string {
  if (typeof outputs === 'string') return outputs.trim();
  if (Array.isArray(outputs)) {
    const parts: string[] = [];
    for (const item of outputs) {
      if (typeof item === 'string') {
        parts.push(item);
      } else if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        if (typeof rec.content === 'string') parts.push(rec.content);
        else if (typeof rec.text === 'string') parts.push(rec.text);
        else if (typeof rec.message === 'string') parts.push(rec.message);
      }
    }
    return parts.join('\n\n').trim();
  }
  if (outputs && typeof outputs === 'object') {
    const rec = outputs as Record<string, unknown>;
    if (typeof rec.content === 'string') return rec.content.trim();
    if (typeof rec.text === 'string') return rec.text.trim();
    if (typeof rec.message === 'string') return rec.message.trim();
    if (typeof rec.result === 'string') return rec.result.trim();
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = await resolveApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Swarms API key found. Sign in or create one in your Swarms account.' },
        { status: 401 }
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const task = buildTask(body);
    if (!task) {
      return NextResponse.json(
        { error: 'A goal is required to generate a prompt.' },
        { status: 400 }
      );
    }

    const model = resolveModel(body.model);
    const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
    const result = await client.executeAgent(buildArchitectConfig(model), task);

    return NextResponse.json({
      prompt: extractText(result.outputs),
      job_id: result.job_id,
      usage: result.usage ?? null,
      timestamp: result.timestamp,
      model,
    });
  } catch (error) {
    return jsonErrorFromUnknown('api/prompt-generator', error);
  }
}
