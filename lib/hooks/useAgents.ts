import { useMemo } from 'react';
import { useAgentStore } from '@/lib/store/agent-store';
import { useUIStore } from '@/lib/store/ui-store';
import { AgentConfig } from '@/types/agent';
import { apiFetch } from '@/lib/api/client-fetch';

async function logAgentAudit(
  action: 'agent.created' | 'agent.updated' | 'agent.deleted',
  targetId: string,
  targetLabel?: string
) {
  try {
    await apiFetch('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        action,
        targetKind: 'agent',
        targetId,
        targetLabel,
      }),
    });
  } catch {
    // non-blocking
  }
}

export function useAgents() {
  const agents = useAgentStore((state) => state.agents);
  const addAgent = useAgentStore((state) => state.addAgent);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const deleteAgent = useAgentStore((state) => state.deleteAgent);
  const getAgentById = useAgentStore((state) => state.getAgentById);
  const addToast = useUIStore((state) => state.addToast);

  const runningAgents = useMemo(
    () => agents.filter((agent) => agent.status === 'running'),
    [agents]
  );

  const createAgent = (config: AgentConfig) => {
    try {
      const id = addAgent(config);
      logAgentAudit('agent.created', id, config.agent_name);
      addToast({
        type: 'success',
        message: `Agent "${config.agent_name}" created successfully`,
        duration: 3000,
      });
      return id;
    } catch (error) {
      addToast({
        type: 'error',
        message: `Failed to create agent: ${(error as Error).message}`,
        duration: 5000,
      });
      throw error;
    }
  };

  const removeAgent = (id: string) => {
    const agent = getAgentById(id);
    if (agent) {
      const name = agent.config.agent_name;
      deleteAgent(id);
      logAgentAudit('agent.deleted', id, name);
      addToast({
        type: 'success',
        message: `Agent "${name}" deleted`,
        duration: 3000,
      });
    }
  };

  const duplicateAgent = (id: string) => {
    const agent = getAgentById(id);
    if (agent) {
      const newConfig = {
        ...agent.config,
        agent_name: `${agent.config.agent_name} (Copy)`,
      };
      return createAgent(newConfig);
    }
  };

  return {
    agents,
    runningAgents,
    createAgent,
    updateAgent,
    removeAgent,
    duplicateAgent,
    getAgentById,
  };
}
