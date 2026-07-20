'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, LogIn, LogOut } from 'lucide-react';
import type { AgentFlowNode } from '@/lib/graph/build';

/**
 * Custom graph node representing one agent. The left handle is the target
 * (incoming work), the right handle is the source (outgoing work) - matching
 * the left-to-right reading direction of the workflow.
 */
export function AgentNode({ data, selected }: NodeProps<AgentFlowNode>) {
  const { spec, isEntry, isEnd } = data;

  return (
    <div
      className={`relative w-[208px] rounded-lg border bg-card shadow-sm transition-colors ${
        selected
          ? 'border-accent ring-2 ring-accent/30'
          : 'border-border hover:border-border-strong'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
      />

      <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-subtle/60 rounded-t-lg">
        <Bot className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span
          className="text-xs font-semibold text-foreground font-mono truncate flex-1"
          title={spec.agent_name}
        >
          {spec.agent_name || 'Unnamed'}
        </span>
        {isEntry && (
          <span title="Entry point">
            <LogIn className="w-3 h-3 text-success flex-shrink-0" />
          </span>
        )}
        {isEnd && (
          <span title="End point">
            <LogOut className="w-3 h-3 text-warning flex-shrink-0" />
          </span>
        )}
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Model
          </span>
          <span className="text-[11px] font-mono text-foreground truncate max-w-[120px]">
            {spec.model_name || 'gpt-4.1'}
          </span>
        </div>
        {spec.system_prompt?.trim() ? (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
            {spec.system_prompt}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 italic">
            No system prompt
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-accent"
      />
    </div>
  );
}
