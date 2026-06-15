import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, AgentConfig, AgentStatus, AgentExecutionResponse, KanbanStatus } from '@/types/agent';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AgentStore {
  // State
  agents: Agent[];
  selectedAgentId: string | null;

  // Actions
  addAgent: (config: AgentConfig) => string;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  addExecutionToHistory: (id: string, execution: AgentExecutionResponse) => void;
  selectAgent: (id: string | null) => void;
  clearAgents: () => void;

  // Computed
  runningAgents: () => Agent[];
  getAgentById: (id: string) => Agent | undefined;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgentId: null,

      addAgent: (config) => {
        const id = generateId();
        const newAgent: Agent = {
          id,
          config,
          status: 'idle',
          kanbanStatus: 'idle',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          execution_history: [],
        };
        set((state) => ({ agents: [...state.agents, newAgent] }));
        return id;
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? { ...agent, ...updates, updated_at: new Date().toISOString() }
              : agent
          ),
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
        }));
      },

      setAgentStatus: (id, status) => {
        get().updateAgent(id, { status });
      },

      addExecutionToHistory: (id, execution) => {
        const agent = get().getAgentById(id);
        if (agent) {
          get().updateAgent(id, {
            last_execution: execution,
            execution_history: [...agent.execution_history, execution],
          });
        }
      },

      selectAgent: (id) => {
        set({ selectedAgentId: id });
      },

      clearAgents: () => {
        set({ agents: [], selectedAgentId: null });
      },

      runningAgents: () => {
        return get().agents.filter((agent) => agent.status === 'running');
      },

      getAgentById: (id) => {
        return get().agents.find((agent) => agent.id === id);
      },
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({ agents: state.agents }),
    }
  )
);
