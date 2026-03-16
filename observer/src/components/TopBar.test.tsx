import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TopBar } from './TopBar';
import type { SessionSnapshot } from '../lib/types';

describe('TopBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createSession = (id: string, startTs: number): SessionSnapshot => ({
    id,
    buffers: {},
    events: [],
    neuro: {
      noradrenaline: 'MEDIUM',
      acetylcholine: 'MEDIUM',
      serotonin: 'MEDIUM',
      dopamine: 'MEDIUM',
    },
    startTs,
    endTs: startTs + 5000,
  });

  it('renders "Brain OS Observer" title', () => {
    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    expect(screen.getByText('Brain OS Observer')).toBeInTheDocument();
  });

  it('shows green "LIVE" badge when isLive is true', () => {
    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    const liveBadge = screen.getByText('LIVE');
    expect(liveBadge).toBeInTheDocument();
    expect(liveBadge).toHaveClass('bg-green-500/20');
  });

  it('shows gray "IDLE" badge when isLive is false', () => {
    render(
      <TopBar
        isLive={false}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    const idleBadge = screen.getByText('IDLE');
    expect(idleBadge).toBeInTheDocument();
    expect(idleBadge).toHaveClass('bg-zinc-500/20');
  });

  it('shows green connection indicator when connected', () => {
    const { container } = render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    const connectionDot = container.querySelector('.bg-green-500');
    expect(connectionDot).toBeInTheDocument();
  });

  it('shows red connection indicator when disconnected', () => {
    const { container } = render(
      <TopBar
        isLive={true}
        isConnected={false}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    const connectionDot = container.querySelector('.bg-red-500');
    expect(connectionDot).toBeInTheDocument();
  });

  it('shows re-plan counter', () => {
    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={2}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    expect(screen.getByText(/Re-plans:/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows elapsed time when loopStartTs is set', () => {
    const startTs = Date.now();
    vi.setSystemTime(startTs);

    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={startTs}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    // Advance time by 2.5 seconds
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Elapsed:/)).toBeInTheDocument();
    expect(screen.getByText('2.5s')).toBeInTheDocument();
  });

  it('does not show elapsed time when loopStartTs is null', () => {
    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={[]}
        onSelectSession={() => {}}
      />
    );

    expect(screen.queryByText(/Elapsed:/)).not.toBeInTheDocument();
  });

  it('renders session history dropdown', () => {
    const sessions = [
      createSession('session-1', 1000),
      createSession('session-2', 2000),
    ];

    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={sessions}
        onSelectSession={() => {}}
      />
    );

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();
  });

  it('calls onSelectSession when dropdown value changes', () => {
    const mockOnSelectSession = vi.fn();
    const sessions = [
      createSession('session-1', 1000),
      createSession('session-2', 2000),
    ];

    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={sessions}
        onSelectSession={mockOnSelectSession}
      />
    );

    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'session-1' } });

    expect(mockOnSelectSession).toHaveBeenCalledWith('session-1');
  });

  it('shows "Live View" option in dropdown', () => {
    const sessions = [createSession('session-1', 1000)];

    render(
      <TopBar
        isLive={true}
        isConnected={true}
        rePlanCount={0}
        loopStartTs={null}
        sessionHistory={sessions}
        onSelectSession={() => {}}
      />
    );

    expect(screen.getByText('Live View')).toBeInTheDocument();
  });
});
