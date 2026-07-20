import { NextRequest, NextResponse } from 'next/server';
import { SwarmsAPIClient } from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import { GraphWorkflowInput } from '@/types/graph';

export async function POST(request: NextRequest) {
  const apiKey = await resolveApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'No Swarms API key found. Sign in or create one in your Swarms account.',
      },
      { status: 401 }
    );
  }

  let body: GraphWorkflowInput;
  try {
    body = (await request.json()) as GraphWorkflowInput;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Request body must be a GraphWorkflowInput object' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.agents) || body.agents.length === 0) {
    return NextResponse.json(
      { error: 'At least one agent (node) is required' },
      { status: 400 }
    );
  }

  if (!body.task || !body.task.trim()) {
    return NextResponse.json(
      { error: 'A task is required to run the workflow' },
      { status: 400 }
    );
  }

  const names = body.agents.map((a) => a?.agent_name?.trim()).filter(Boolean);
  if (names.length !== body.agents.length) {
    return NextResponse.json(
      { error: 'Every agent must have a non-empty name' },
      { status: 400 }
    );
  }
  if (new Set(names).size !== names.length) {
    return NextResponse.json(
      { error: 'Agent names must be unique - they identify nodes in the graph' },
      { status: 400 }
    );
  }

  try {
    const client = new SwarmsAPIClient(apiKey, process.env.SWARMS_API_BASE_URL);
    const result = await client.executeGraphWorkflow(body);
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorFromUnknown('api/graph-workflow', error);
  }
}
