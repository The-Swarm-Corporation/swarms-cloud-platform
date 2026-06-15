import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedAgentConfig, AgentConfig } from '@/types/agent';

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

interface ConfigStore {
  // State
  savedConfigs: SavedAgentConfig[];

  // Actions
  saveConfig: (name: string, config: AgentConfig, tags?: string[]) => string;
  loadConfig: (id: string) => SavedAgentConfig | undefined;
  deleteConfig: (id: string) => void;
  updateConfig: (id: string, updates: Partial<SavedAgentConfig>) => void;
  getAllConfigs: () => SavedAgentConfig[];
  getConfigsByTag: (tag: string) => SavedAgentConfig[];
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      savedConfigs: [],

      saveConfig: (name, config, tags) => {
        const id = generateId();
        const newConfig: SavedAgentConfig = {
          id,
          name,
          config,
          tags,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          savedConfigs: [...state.savedConfigs, newConfig],
        }));
        return id;
      },

      loadConfig: (id) => {
        return get().savedConfigs.find((c) => c.id === id);
      },

      deleteConfig: (id) => {
        set((state) => ({
          savedConfigs: state.savedConfigs.filter((c) => c.id !== id),
        }));
      },

      updateConfig: (id, updates) => {
        set((state) => ({
          savedConfigs: state.savedConfigs.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      getAllConfigs: () => get().savedConfigs,

      getConfigsByTag: (tag) => {
        return get().savedConfigs.filter((c) => c.tags?.includes(tag));
      },
    }),
    {
      name: 'config-store',
    }
  )
);
