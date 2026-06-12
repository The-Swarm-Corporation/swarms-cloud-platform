'use client';

import React, { useState } from 'react';
import { AgentConfig, MODEL_OPTIONS, ROLE_OPTIONS } from '@/types/agent';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, X } from 'lucide-react';

interface AgentConfigFormProps {
  initialConfig?: Partial<AgentConfig>;
  onSubmit: (config: AgentConfig) => void;
  onCancel?: () => void;
}

const fieldLabel = 'text-xs font-medium text-foreground';
const textareaClass =
  'w-full rounded-md border border-border bg-input text-foreground text-sm px-3 py-2.5 placeholder:text-muted-foreground resize-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const selectClass =
  'w-full h-9 rounded-md border border-border bg-input text-foreground text-sm px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function AgentConfigForm({
  initialConfig = {},
  onSubmit,
  onCancel,
}: AgentConfigFormProps) {
  const [config, setConfig] = useState<AgentConfig>({
    agent_name: initialConfig.agent_name || '',
    description: initialConfig.description || '',
    system_prompt: initialConfig.system_prompt || '',
    model_name: initialConfig.model_name || 'gpt-5.4',
    role: initialConfig.role || 'worker',
    max_loops: initialConfig.max_loops || 1,
    max_tokens: initialConfig.max_tokens || 8192,
    temperature: initialConfig.temperature || 0.7,
    auto_generate_prompt: initialConfig.auto_generate_prompt || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AgentConfig, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof AgentConfig, string>> = {};

    if (!config.agent_name.trim()) newErrors.agent_name = 'Agent name is required';
    if (!config.model_name) newErrors.model_name = 'Model is required';
    if (config.max_loops && (config.max_loops < 1 || config.max_loops > 100)) {
      newErrors.max_loops = 'Max loops must be between 1 and 100';
    }
    if (config.max_tokens && (config.max_tokens < 1 || config.max_tokens > 100000)) {
      newErrors.max_tokens = 'Max tokens must be between 1 and 100000';
    }
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      newErrors.temperature = 'Temperature must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Agent name"
        value={config.agent_name}
        onChange={(e) => setConfig({ ...config, agent_name: e.target.value })}
        error={errors.agent_name}
        placeholder="e.g. Research Analyst"
      />

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Description</label>
        <textarea
          value={config.description}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          placeholder="Brief description of the agent's purpose…"
          rows={2}
          className={textareaClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>System prompt</label>
        <textarea
          value={config.system_prompt}
          onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
          placeholder="You are an expert in…"
          rows={4}
          className={`${textareaClass} font-mono`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>Model</label>
          <select
            value={config.model_name}
            onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
            className={selectClass}
          >
            {MODEL_OPTIONS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>Role</label>
          <select
            value={config.role}
            onChange={(e) => setConfig({ ...config, role: e.target.value })}
            className={selectClass}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Max loops"
          type="number"
          value={config.max_loops}
          onChange={(e) => setConfig({ ...config, max_loops: parseInt(e.target.value) || 1 })}
          error={errors.max_loops}
          min={1}
          max={100}
        />
        <Input
          label="Max tokens"
          type="number"
          value={config.max_tokens}
          onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 8192 })}
          error={errors.max_tokens}
          min={1}
          max={100000}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className={fieldLabel}>Temperature</label>
          <span className="text-xs font-mono text-foreground tabular-nums">
            {config.temperature}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.temperature}
          onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-foreground"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>Focused</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>

      <label
        htmlFor="auto_generate_prompt"
        className="flex items-center gap-3 p-3 rounded-md border border-border bg-subtle cursor-pointer hover:bg-muted transition-colors"
      >
        <input
          type="checkbox"
          id="auto_generate_prompt"
          checked={config.auto_generate_prompt}
          onChange={(e) => setConfig({ ...config, auto_generate_prompt: e.target.checked })}
          className="w-4 h-4 accent-foreground"
        />
        <span className="text-sm text-foreground">Auto-generate system prompt</span>
      </label>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="sm:order-1">
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" className="flex-1 sm:order-2">
          <Save className="w-3.5 h-3.5" />
          Save agent
        </Button>
      </div>
    </form>
  );
}
