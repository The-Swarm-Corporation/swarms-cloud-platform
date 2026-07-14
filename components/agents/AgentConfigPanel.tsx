'use client';

import React, { useMemo } from 'react';
import { SnippetPreview } from '@/components/ui/SnippetPreview';
import type { Agent } from '@/types/agent';

interface AgentConfigPanelProps {
  agent: Agent;
}

export function AgentConfigPanel({ agent }: AgentConfigPanelProps) {
  const executionPayload = useMemo(
    () => ({ agent_config: agent.config, task: 'Describe your task here' }),
    [agent],
  );

  return (
    <div className="py-4">
      <SnippetPreview
        endpoint="/v1/agent/completions"
        method="POST"
        payload={executionPayload}
        title="Agent configuration"
        defaultLanguage="json"
      />
    </div>
  );
}
