import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrainFlow } from './BrainFlow';
import type { BrainState } from '../lib/types';
import { initialState } from '../hooks/useBrainState';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, onNodeClick, children }: any) => (
    <div data-testid="react-flow">
      {nodes.map((node: any) => (
        <div
          key={node.id}
          data-testid={`node-${node.id}`}
          onClick={() => onNodeClick?.(null, node)}
        >
          {node.data.label}
        </div>
      ))}
      {children}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => (
    <div data-testid="react-flow-provider">{children}</div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  useNodesState: (initialNodes: any) => {
    const [nodes, setNodes] = [initialNodes, vi.fn()];
    const onNodesChange = vi.fn();
    return [nodes, setNodes, onNodesChange];
  },
  useEdgesState: (initialEdges: any) => {
    const [edges, setEdges] = [initialEdges, vi.fn()];
    const onEdgesChange = vi.fn();
    return [edges, setEdges, onEdgesChange];
  },
}));

describe('BrainFlow', () => {
  it('renders all 13 brain region node labels', () => {
    const onNodeClick = vi.fn();
    render(<BrainFlow state={initialState} onNodeClick={onNodeClick} />);

    // Verify all 13 nodes are rendered
    expect(screen.getByText('Sensory Buffer')).toBeInTheDocument();
    expect(screen.getByText('Basal Ganglia')).toBeInTheDocument();
    expect(screen.getByText('Amygdala')).toBeInTheDocument();
    expect(screen.getByText('Hippocampus')).toBeInTheDocument();
    expect(screen.getByText('Language Center')).toBeInTheDocument();
    expect(screen.getByText('Visual Cortex')).toBeInTheDocument();
    expect(screen.getByText('Parietal-Insula')).toBeInTheDocument();
    expect(screen.getByText('Anterior Cingulate')).toBeInTheDocument();
    expect(screen.getByText('Integration')).toBeInTheDocument();
    expect(screen.getByText('Prefrontal')).toBeInTheDocument();
    expect(screen.getByText('Cerebellum')).toBeInTheDocument();
    expect(screen.getByText('Motor Cortex')).toBeInTheDocument();
    expect(screen.getByText('Consolidation')).toBeInTheDocument();
  });

  it('shows "Waiting for signal..." overlay when idle', () => {
    const idleState: BrainState = {
      ...initialState,
      isLive: false,
    };
    const onNodeClick = vi.fn();
    render(<BrainFlow state={idleState} onNodeClick={onNodeClick} />);

    expect(screen.getByText('Waiting for signal...')).toBeInTheDocument();
  });

  it('does not show idle overlay when live', () => {
    const liveState: BrainState = {
      ...initialState,
      isLive: true,
    };
    const onNodeClick = vi.fn();
    render(<BrainFlow state={liveState} onNodeClick={onNodeClick} />);

    expect(screen.queryByText('Waiting for signal...')).not.toBeInTheDocument();
  });

  it('calls onNodeClick with agent name when node clicked', () => {
    const onNodeClick = vi.fn();
    render(<BrainFlow state={initialState} onNodeClick={onNodeClick} />);

    const amygdalaNode = screen.getByTestId('node-amygdala');
    amygdalaNode.click();

    expect(onNodeClick).toHaveBeenCalledWith('amygdala');
  });

  it('wraps ReactFlow in ReactFlowProvider', () => {
    const onNodeClick = vi.fn();
    render(<BrainFlow state={initialState} onNodeClick={onNodeClick} />);

    expect(screen.getByTestId('react-flow-provider')).toBeInTheDocument();
  });

  it('renders ReactFlow with Background and Controls', () => {
    const onNodeClick = vi.fn();
    render(<BrainFlow state={initialState} onNodeClick={onNodeClick} />);

    expect(screen.getByTestId('background')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });
});
