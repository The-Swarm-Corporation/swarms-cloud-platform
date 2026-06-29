'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AgentNode } from './AgentNode';
import type { AgentFlowNode, AgentFlowEdge } from '@/lib/graph/build';

const nodeTypes = { agent: AgentNode };

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  style: { strokeWidth: 1.5 },
};

interface GraphCanvasProps {
  nodes: AgentFlowNode[];
  edges: AgentFlowEdge[];
  onNodesChange: OnNodesChange<AgentFlowNode>;
  onEdgesChange: OnEdgesChange<AgentFlowEdge>;
  onConnect: (connection: Connection) => void;
  onNodeClick: (id: string) => void;
  onPaneClick: () => void;
}

export function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
}: GraphCanvasProps) {
  // Disallow self-loops; React Flow already dedupes identical source→target.
  const isValidConnection = useCallback(
    (c: Connection | AgentFlowEdge) => c.source !== c.target,
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onNodeClick(node.id)}
      onPaneClick={onPaneClick}
      isValidConnection={isValidConnection}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      className="bg-subtle/40"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={18}
        size={1}
        className="!text-border"
        color="currentColor"
      />
      <Controls
        showInteractive={false}
        className="!border !border-border !bg-card !shadow-sm [&_button]:!border-border [&_button]:!bg-card [&_button]:!text-foreground [&_button:hover]:!bg-muted [&_svg]:!fill-current"
      />
      <MiniMap
        pannable
        zoomable
        className="!hidden lg:!block !bg-card !border !border-border !bottom-3 !right-3"
        maskColor="rgb(var(--muted) / 0.6)"
        nodeColor="rgb(var(--accent))"
        nodeStrokeColor="rgb(var(--border))"
      />
    </ReactFlow>
  );
}
