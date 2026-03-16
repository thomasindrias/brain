import { useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
} from '@xyflow/react';
import type { Node, Edge, NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BrainState } from '../lib/types';
import { nodePositions, baseEdges } from '../lib/flowConfig';
import { BrainNode } from './nodes/BrainNode';

// Register custom node types
const nodeTypes = {
  brain: BrainNode,
};

type BrainFlowProps = {
  state: BrainState;
  onNodeClick: (agent: string) => void;
};

function BrainFlowInner({ state, onNodeClick }: BrainFlowProps) {
  // Convert BrainState.nodes to React Flow Node[]
  const initialNodes: Node[] = Object.entries(state.nodes).map(([agent, data]) => ({
    id: agent,
    type: 'brain',
    position: nodePositions[agent] || { x: 0, y: 0 },
    data,
    draggable: false,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  // Update nodes when state changes
  useEffect(() => {
    const updatedNodes: Node[] = Object.entries(state.nodes).map(([agent, data]) => ({
      id: agent,
      type: 'brain',
      position: nodePositions[agent] || { x: 0, y: 0 },
      data,
      draggable: false,
    }));
    setNodes(updatedNodes);
  }, [state.nodes, setNodes]);

  // Update edges based on state
  useEffect(() => {
    const updatedEdges = baseEdges.map((edge) => {
      const sourceNode = state.nodes[edge.source];
      const targetNode = state.nodes[edge.target];

      // Feedback loop edge visibility with label
      if (edge.id === 'e-cb-pf-feedback') {
        return {
          ...edge,
          hidden: !state.feedbackLoopActive,
          label: state.feedbackLoopActive ? `${state.rePlanCount}/2` : undefined,
          labelStyle: { fill: '#ef4444', fontWeight: 700 },
          labelBgStyle: { fill: '#27272a' },
        };
      }

      // Dynamic edge styling based on node status
      let style = edge.style || {};
      let animated = false;

      // Both nodes complete → green solid animated
      if (sourceNode?.status === 'complete' && targetNode?.status === 'complete') {
        style = { ...style, stroke: '#22c55e', strokeDasharray: undefined };
        animated = true;
      }
      // Target active → yellow
      else if (targetNode?.status === 'active') {
        style = { ...style, stroke: '#eab308', strokeDasharray: undefined };
      }
      // Pending → gray dashed (preserve existing dasharray if exists)
      else {
        style = { ...style, stroke: '#71717a' };
      }

      return {
        ...edge,
        style,
        animated,
      };
    });

    setEdges(updatedEdges);
  }, [state.nodes, state.feedbackLoopActive, state.rePlanCount, setEdges]);

  // Handle node click
  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    onNodeClick(node.id);
  };

  return (
    <div className="relative w-full h-full bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="#27272a" gap={16} />
        <Controls />
      </ReactFlow>

      {/* Idle overlay when not live */}
      {!state.isLive && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 pointer-events-none">
          <div className="text-xl text-zinc-400 font-medium">
            Waiting for signal...
          </div>
        </div>
      )}
    </div>
  );
}

export function BrainFlow(props: BrainFlowProps) {
  return (
    <ReactFlowProvider>
      <BrainFlowInner {...props} />
    </ReactFlowProvider>
  );
}
