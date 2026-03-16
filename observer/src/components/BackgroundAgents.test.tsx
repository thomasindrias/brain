import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BackgroundAgents } from './BackgroundAgents';
import type { BackgroundAgentStatus } from '../lib/types';

describe('BackgroundAgents', () => {
  const createStatus = (overrides: Partial<BackgroundAgentStatus> = {}): BackgroundAgentStatus => ({
    hypothalamus: 'idle',
    'reward-system': 'idle',
    'default-mode': 'idle',
    ...overrides,
  });

  it('renders 3 status pills', () => {
    const status = createStatus();
    const { container } = render(<BackgroundAgents status={status} />);

    const pills = container.querySelectorAll('.bg-zinc-800');
    expect(pills.length).toBeGreaterThanOrEqual(3);
  });

  it('shows hypothalamus pill', () => {
    const status = createStatus();
    render(<BackgroundAgents status={status} />);

    expect(screen.getByText(/Hypothalamus/i)).toBeInTheDocument();
  });

  it('shows reward-system pill', () => {
    const status = createStatus();
    render(<BackgroundAgents status={status} />);

    expect(screen.getByText(/Reward System/i)).toBeInTheDocument();
  });

  it('shows default-mode pill', () => {
    const status = createStatus();
    render(<BackgroundAgents status={status} />);

    expect(screen.getByText(/Default Mode/i)).toBeInTheDocument();
  });

  it('shows "idle" by default', () => {
    const status = createStatus();
    render(<BackgroundAgents status={status} />);

    const idleTexts = screen.getAllByText('idle');
    expect(idleTexts).toHaveLength(3);
  });

  it('shows active status when set to monitoring', () => {
    const status = createStatus({ hypothalamus: 'monitoring' });
    render(<BackgroundAgents status={status} />);

    expect(screen.getByText('monitoring')).toBeInTheDocument();
  });

  it('shows active status when set to POSITIVE', () => {
    const status = createStatus({ 'reward-system': 'POSITIVE' });
    render(<BackgroundAgents status={status} />);

    expect(screen.getByText('POSITIVE')).toBeInTheDocument();
  });

  it('shows active status when set to consolidating', () => {
    const status = createStatus({ 'default-mode': 'consolidating' });
    render(<BackgroundAgents status={status} />);

    expect(screen.getByText('consolidating')).toBeInTheDocument();
  });

  it('applies gray styling to idle status', () => {
    const status = createStatus({ hypothalamus: 'idle' });
    const { container } = render(<BackgroundAgents status={status} />);

    // Find the span with "idle" text
    const idleSpan = screen.getAllByText('idle')[0];
    expect(idleSpan).toHaveClass('text-zinc-500');
  });

  it('applies blue styling to monitoring status', () => {
    const status = createStatus({ hypothalamus: 'monitoring' });
    const { container } = render(<BackgroundAgents status={status} />);

    const monitoringSpan = screen.getByText('monitoring');
    expect(monitoringSpan).toHaveClass('text-blue-400');
  });

  it('applies green styling to POSITIVE status', () => {
    const status = createStatus({ 'reward-system': 'POSITIVE' });
    const { container } = render(<BackgroundAgents status={status} />);

    const positiveSpan = screen.getByText('POSITIVE');
    expect(positiveSpan).toHaveClass('text-green-400');
  });

  it('applies orange styling to WARNING status', () => {
    const status = createStatus({ hypothalamus: 'WARNING' });
    const { container } = render(<BackgroundAgents status={status} />);

    const warningSpan = screen.getByText('WARNING');
    expect(warningSpan).toHaveClass('text-orange-400');
  });
});
