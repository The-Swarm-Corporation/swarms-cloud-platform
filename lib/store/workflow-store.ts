import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentFlowNode, AgentFlowEdge, WorkflowMeta } from '@/lib/graph/build';
import type { GraphWorkflowOutput } from '@/types/graph';

export interface SavedWorkflow {
  id: string;
  name: string;
  nodes: AgentFlowNode[];
  edges: AgentFlowEdge[];
  meta: WorkflowMeta;
  result: GraphWorkflowOutput | null;
  error: string | null;
  savedAt: string;
}

interface WorkflowStore {
  savedWorkflows: SavedWorkflow[];

  saveWorkflow: (wf: Omit<SavedWorkflow, 'id' | 'savedAt'>) => string;
  deleteWorkflow: (id: string) => void;
  getWorkflow: (id: string) => SavedWorkflow | undefined;
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      savedWorkflows: [],

      saveWorkflow: (wf) => {
        const id = crypto.randomUUID();
        const entry: SavedWorkflow = { ...wf, id, savedAt: new Date().toISOString() };
        set((state) => ({
          savedWorkflows: [...state.savedWorkflows, entry],
        }));
        return id;
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          savedWorkflows: state.savedWorkflows.filter((w) => w.id !== id),
        }));
      },

      getWorkflow: (id) => {
        return get().savedWorkflows.find((w) => w.id === id);
      },
    }),
    {
      name: 'workflow-store',
    }
  )
);
