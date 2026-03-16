import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BufferDrawer } from './BufferDrawer';
import type { BrainNodeData } from '../lib/types';

describe('BufferDrawer', () => {
  const mockOnClose = vi.fn();

  const createNode = (overrides: Partial<BrainNodeData> = {}): BrainNodeData => ({
    phase: '1',
    label: 'Amygdala',
    agent: 'amygdala',
    status: 'complete',
    fields: {
      THREAT_LEVEL: 'SAFE',
      ACTION: 'proceed',
    },
    ...overrides,
  });

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders nothing when node is null', () => {
    const { container } = render(<BufferDrawer node={null} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders region name, phase, and status badge', () => {
    const node = createNode({ label: 'Hippocampus', phase: '1', status: 'complete' });
    render(<BufferDrawer node={node} onClose={mockOnClose} />);

    expect(screen.getByText('Hippocampus')).toBeInTheDocument();
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
    expect(screen.getByText('complete')).toBeInTheDocument();
  });

  it('renders all buffer fields as key-value rows', () => {
    const node = createNode({
      fields: {
        THREAT_LEVEL: 'ELEVATED',
        ACTION: 'caution',
        VALENCE: 'NEGATIVE',
      },
    });
    render(<BufferDrawer node={node} onClose={mockOnClose} />);

    expect(screen.getByText('THREAT_LEVEL')).toBeInTheDocument();
    expect(screen.getByText('ELEVATED')).toBeInTheDocument();
    expect(screen.getByText('ACTION')).toBeInTheDocument();
    expect(screen.getByText('caution')).toBeInTheDocument();
    expect(screen.getByText('VALENCE')).toBeInTheDocument();
    expect(screen.getByText('NEGATIVE')).toBeInTheDocument();
  });

  it('renders values with monospace font', () => {
    const node = createNode({
      fields: { THREAT_LEVEL: 'SAFE' },
    });
    const { container } = render(<BufferDrawer node={node} onClose={mockOnClose} />);

    const valueElement = screen.getByText('SAFE');
    expect(valueElement).toHaveClass('font-mono');
  });

  it('calls onClose when close button (X) clicked', () => {
    const node = createNode();
    render(<BufferDrawer node={node} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key press', () => {
    const node = createNode();
    render(<BufferDrawer node={node} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on other key press', () => {
    const node = createNode();
    render(<BufferDrawer node={node} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows empty state when no fields', () => {
    const node = createNode({ fields: {} });
    render(<BufferDrawer node={node} onClose={mockOnClose} />);

    expect(screen.getByText('No buffer data')).toBeInTheDocument();
  });
});
