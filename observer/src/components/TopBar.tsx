import { useState, useEffect } from 'react';
import type { SessionSnapshot } from '../lib/types';

type TopBarProps = {
  isLive: boolean;
  isConnected: boolean;
  rePlanCount: number;
  loopStartTs: number | null;
  sessionHistory: SessionSnapshot[];
  onSelectSession: (sessionId: string | null) => void;
};

export function TopBar({
  isLive,
  isConnected,
  rePlanCount,
  loopStartTs,
  sessionHistory,
  onSelectSession,
}: TopBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every 100ms
  useEffect(() => {
    if (!loopStartTs) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const now = Date.now();
      setElapsedTime(now - loopStartTs);
    };

    // Initial update
    updateElapsed();

    const interval = setInterval(updateElapsed, 100);
    return () => clearInterval(interval);
  }, [loopStartTs]);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelectSession(value === '' ? null : value);
  };

  const formatElapsed = (ms: number): string => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between">
      {/* Left: Title and Status */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-zinc-100">Brain OS Observer</h1>

        {/* LIVE/IDLE Badge */}
        <div
          className={`px-2 py-1 rounded text-xs font-semibold ${
            isLive
              ? 'bg-green-500/20 text-green-500 border border-green-500'
              : 'bg-zinc-500/20 text-zinc-500 border border-zinc-500'
          }`}
        >
          {isLive ? 'LIVE' : 'IDLE'}
        </div>

        {/* Connection Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-xs text-zinc-400">
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Right: Metrics and Session Selector */}
      <div className="flex items-center gap-6">
        {/* Elapsed Time */}
        {loopStartTs && (
          <div className="text-sm text-zinc-400">
            <span className="text-zinc-500">Elapsed:</span>{' '}
            <span className="font-mono text-zinc-300">{formatElapsed(elapsedTime)}</span>
          </div>
        )}

        {/* Re-plan Counter */}
        <div className="text-sm text-zinc-400">
          <span className="text-zinc-500">Re-plans:</span>{' '}
          <span className="font-mono text-zinc-300">{rePlanCount}</span>
        </div>

        {/* Session History Dropdown */}
        <select
          value={isLive ? '' : sessionHistory.find((s) => !isLive)?.id || ''}
          onChange={handleSessionChange}
          className="bg-zinc-800 text-zinc-300 text-sm border border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Live View</option>
          {sessionHistory.map((session) => (
            <option key={session.id} value={session.id}>
              Session {new Date(session.startTs).toLocaleTimeString()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
