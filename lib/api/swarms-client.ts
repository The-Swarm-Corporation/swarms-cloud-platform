import {
  AgentConfig,
  AgentExecutionRequest,
  AgentExecutionResponse,
} from '@/types/agent';
import {
  APIHealthStatus,
  APIError,
  CreditBalanceResponse,
  RateLimitsResponse,
  SwarmSpec,
  SwarmCompletion,
} from '@/types/api';
import { GraphWorkflowInput, GraphWorkflowOutput } from '@/types/graph';

/**
 * The Swarms API is FastAPI, so 4xx/5xx errors arrive as `{ detail: ... }`
 * where `detail` is one of:
 *   - a string                      e.g. "Agent name is required…"
 *   - an object with a `message`    e.g. the premium-model 403 payload
 *   - an array of Pydantic errors   422 body validation: [{ loc, msg }, …]
 * Reading only `message`/`error.message` (the old behaviour) missed all three,
 * so every upstream error collapsed to "API Error: <status>". Pull the real
 * detail out here and let the route layer (lib/api/errors.ts) decide how much
 * of it to surface per status.
 */
function messageFromDetail(detail: unknown): string | undefined {
  if (typeof detail === 'string') {
    return detail.trim() || undefined;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d: any) => {
        const loc = Array.isArray(d?.loc)
          ? d.loc.filter((p: unknown) => p !== 'body').join('.')
          : '';
        const msg = d?.msg || d?.message || '';
        return loc && msg ? `${loc}: ${msg}` : msg || loc;
      })
      .filter(Boolean);
    return parts.length ? parts.join('; ') : undefined;
  }
  if (detail && typeof detail === 'object') {
    const o = detail as Record<string, unknown>;
    const msg = o.message ?? o.error;
    return typeof msg === 'string' && msg.trim() ? msg : undefined;
  }
  return undefined;
}

function deriveErrorMessage(status: number, errorData: any): string {
  return (
    messageFromDetail(errorData?.detail) ||
    (typeof errorData?.message === 'string' ? errorData.message : undefined) ||
    (typeof errorData?.error?.message === 'string'
      ? errorData.error.message
      : undefined) ||
    (typeof errorData?.error === 'string' ? errorData.error : undefined) ||
    `API Error: ${status}`
  );
}

async function parseError(response: Response): Promise<APIError> {
  const errorData = await response.json().catch(() => ({}));
  return {
    message: deriveErrorMessage(response.status, errorData),
    status: response.status,
    code: errorData?.code || errorData?.error?.code,
  };
}

function toAPIError(err: unknown, fallbackStatus = 0): APIError {
  if (err && typeof err === 'object' && 'status' in (err as any)) {
    return err as APIError;
  }
  const message = err instanceof Error ? err.message : String(err);
  return { message: `Network error: ${message}`, status: fallbackStatus };
}

export class SwarmsAPIClient {
  private baseURL: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor(apiKey: string, baseURL?: string) {
    this.baseURL = baseURL || 'https://api.swarms.world';
    this.apiKey = apiKey;
    this.headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  async executeAgent(
    config: AgentConfig,
    task: string,
    options?: {
      history?: any;
      img?: string;
      imgs?: string[];
      stream?: boolean;
      search_enabled?: boolean;
    }
  ): Promise<AgentExecutionResponse> {
    const payload: AgentExecutionRequest = {
      agent_config: config,
      task,
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}/v1/agent/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as AgentExecutionResponse;
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async executeBatch(
    requests: AgentExecutionRequest[]
  ): Promise<AgentExecutionResponse[]> {
    try {
      const response = await fetch(`${this.baseURL}/v1/agent/batch/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requests),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as AgentExecutionResponse[];
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async executeGraphWorkflow(
    input: GraphWorkflowInput
  ): Promise<GraphWorkflowOutput> {
    try {
      const response = await fetch(
        `${this.baseURL}/v1/graph-workflow/completions`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as GraphWorkflowOutput;
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async runSwarm(spec: SwarmSpec): Promise<SwarmCompletion> {
    try {
      const response = await fetch(`${this.baseURL}/v1/swarm/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(spec),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as SwarmCompletion;
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async listAgentConfigs(): Promise<AgentConfig[]> {
    try {
      const response = await fetch(`${this.baseURL}/v1/agents/list`, {
        method: 'GET',
        headers: { 'x-api-key': this.apiKey },
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : (result?.data || result?.agents || []);
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async checkHealth(): Promise<APIHealthStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'x-api-key': this.apiKey },
      });

      return {
        status: response.ok ? 'healthy' : 'degraded',
        latency_ms: Date.now() - start,
        last_checked: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'down',
        latency_ms: Date.now() - start,
        last_checked: new Date().toISOString(),
      };
    }
  }

  async getRateLimits(): Promise<RateLimitsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/v1/rate/limits`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as RateLimitsResponse;
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async getCredits(): Promise<CreditBalanceResponse> {
    try {
      const response = await fetch(`${this.baseURL}/v1/account/credits`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as CreditBalanceResponse;
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async getAvailableModels(): Promise<{ success?: boolean; models?: unknown }> {
    try {
      const response = await fetch(`${this.baseURL}/v1/models/available`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as { success?: boolean; models?: unknown };
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async getAvailableSwarmTypes(): Promise<{
    status?: boolean;
    timestamp?: string;
    swarm_types?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/v1/swarms/available`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as {
        status?: boolean;
        timestamp?: string;
        swarm_types?: string[];
      };
    } catch (err) {
      throw toAPIError(err);
    }
  }

  async getSwarmLogs(): Promise<{
    status?: string;
    count?: number;
    logs?: unknown;
    timestamp?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/v1/swarm/logs`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return (await response.json()) as {
        status?: string;
        count?: number;
        logs?: unknown;
        timestamp?: string;
      };
    } catch (err) {
      throw toAPIError(err);
    }
  }
}

export default SwarmsAPIClient;
