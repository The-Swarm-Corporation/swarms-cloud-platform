'use client';

import React, { useMemo } from 'react';
import { useAgentStore } from '@/lib/store/agent-store';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';

export function StatsPanel() {
  const agentsFromStore = useAgentStore((state) => state.agents);
  const hydrated = useIsHydrated();
  const agents = hydrated ? agentsFromStore : [];
  const runningAgents = useMemo(
    () => agents.filter((agent) => agent.status === 'running'),
    [agents]
  );

  const completedAgents = agents.filter((a) => a.status === 'completed').length;
  const successRate = agents.length > 0
    ? Math.round((completedAgents / agents.length) * 100)
    : 0;

  const stats: { label: string; value: string | number; tone?: 'default' | 'success' }[] = [
    { label: 'Agents', value: agents.length },
    { label: 'Active', value: runningAgents.length, tone: runningAgents.length > 0 ? 'success' : 'default' },
    { label: 'Success', value: `${successRate}%` },
  ];

  return (
    <div className="hidden md:flex items-center divide-x divide-border">
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-baseline gap-1.5 ${i === 0 ? 'pr-3' : 'px-3'}`}>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
          <span
            className={`text-sm font-semibold tabular-nums ${
              s.tone === 'success' ? 'text-success' : 'text-foreground'
            }`}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
