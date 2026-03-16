import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrainNode } from './BrainNode';
import type { NodeProps } from '@xyflow/react';
import type { BrainNodeData } from '../../lib/types';

// Mock React Flow's Handle component
vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

describe('BrainNode', () => {
  const createNodeProps = (data: Partial<BrainNodeData>): NodeProps<BrainNodeData> => ({
    id: 'test-node',
    data: {
      phase: '1',
      label: 'Test Node',
      agent: 'test-agent',
      status: 'pending',
      fields: {},
      ...data,
    } as BrainNodeData,
    selected: false,
    type: 'brain',
    xPos: 0,
    yPos: 0,
    zIndex: 0,
    isConnectable: true,
    dragging: false,
  });

  it('renders region label text', () => {
    const props = createNodeProps({ label: 'Amygdala' });
    render(<BrainNode {...props} />);
    expect(screen.getByText('Amygdala')).toBeInTheDocument();
  });

  it('shows phase number badge', () => {
    const props = createNodeProps({ phase: '1', label: 'Amygdala' });
    render(<BrainNode {...props} />);
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('shows status badge when status field exists', () => {
    const props = createNodeProps({
      fields: { THREAT_LEVEL: 'SAFE' },
      status: 'complete',
    });
    render(<BrainNode {...props} />);
    expect(screen.getByText('SAFE')).toBeInTheDocument();
  });

  it('shows VALIDATION status from cerebellum', () => {
    const props = createNodeProps({
      agent: 'cerebellum',
      fields: { VALIDATION: 'PASS' },
      status: 'complete',
    });
    render(<BrainNode {...props} />);
    expect(screen.getByText('PASS')).toBeInTheDocument();
  });

  it('shows timing when complete', () => {
    const props = createNodeProps({
      status: 'complete',
      timing: { start: 1000, end: 3100 },
    });
    render(<BrainNode {...props} />);
    // 3100 - 1000 = 2100ms = 2.1s
    expect(screen.getByText('2.1s')).toBeInTheDocument();
  });

  it('applies conditional styling when pending', () => {
    const props = createNodeProps({
      status: 'pending',
      conditional: true,
    });
    const { container } = render(<BrainNode {...props} />);
    const node = container.querySelector('.brain-node');
    expect(node).toHaveClass('border-dashed');
    expect(node).toHaveClass('opacity-35');
  });

  it('does not apply conditional styling when active', () => {
    const props = createNodeProps({
      status: 'active',
      conditional: true,
    });
    const { container } = render(<BrainNode {...props} />);
    const node = container.querySelector('.brain-node');
    expect(node).not.toHaveClass('opacity-35');
  });

  it('applies pulse animation when active', () => {
    const props = createNodeProps({ status: 'active' });
    const { container } = render(<BrainNode {...props} />);
    const node = container.querySelector('.brain-node');
    expect(node).toHaveClass('animate-pulse');
  });

  it('has React Flow Handle components for connections', () => {
    const props = createNodeProps({});
    render(<BrainNode {...props} />);
    expect(screen.getByTestId('handle-target-top')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source-bottom')).toBeInTheDocument();
  });

  it('does not show timing when not complete', () => {
    const props = createNodeProps({
      status: 'active',
      timing: { start: 1000 },
    });
    render(<BrainNode {...props} />);
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
  });

  it('shows FOUND status from hippocampus', () => {
    const props = createNodeProps({
      agent: 'hippocampus',
      fields: { MEMORIES: 'FOUND' },
      status: 'complete',
    });
    render(<BrainNode {...props} />);
    expect(screen.getByText('FOUND')).toBeInTheDocument();
  });
});
