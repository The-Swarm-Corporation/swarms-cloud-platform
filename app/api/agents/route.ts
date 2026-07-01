import { NextRequest, NextResponse } from 'next/server';
import { SwarmsAPIClient } from '@/lib/api/swarms-client';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/api/audit';

export async function POST(request: NextRequest) {
  const apiKey = await resolveApiKey();

  if (!apiKey) {
    return NextResponse.json(
      { error: 'No Swarms API key found. Sign in or create one in your Swarms account.' },
      { status: 401 }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { agent_config, task, ...options } = body;

    if (!agent_config || !task) {
      return NextResponse.json(
        { error: 'agent_config and task are required' },
        { status: 400 }
      );
    }

    const client = new SwarmsAPIClient(
      apiKey,
      process.env.SWARMS_API_BASE_URL
    );

    const result = await client.executeAgent(agent_config, task, options);

    logAuditEvent({
      action: 'swarm.executed',
      targetKind: 'agent',
      targetId: agent_config.agent_name,
      targetLabel: agent_config.agent_name,
      metadata: {
        model: agent_config.model_name,
        task_preview: task.slice(0, 200),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorFromUnknown('api/agents', error);
  }
}
