import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { BrainNodeData } from '../../lib/types';
import { NODE_COLORS } from '../../lib/constants';
import { StatusBadge } from './StatusBadge';

export function BrainNode({ data }: NodeProps<BrainNodeData>) {
  const { phase, label, status, fields, timing, conditional } = data;

  // Calculate timing if complete
  const timingText =
    status === 'complete' && timing?.start && timing?.end
      ? `${((timing.end - timing.start) / 1000).toFixed(1)}s`
      : null;

  // Extract status badge value from fields
  const statusValue = getStatusValue(fields);

  // Conditional nodes are dimmed when pending
  const isConditionalPending = conditional && status === 'pending';

  // Pulse animation when active
  const pulseClass = status === 'active' ? 'animate-pulse' : '';

  // Border style
  const borderStyle = isConditionalPending ? 'border-dashed' : 'border-solid';
  const opacityClass = isConditionalPending ? 'opacity-35' : '';

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className={`brain-node px-4 py-3 rounded-lg border-2 bg-zinc-900 min-w-[180px] ${borderStyle} ${opacityClass} ${pulseClass}`}
        style={{ borderColor: NODE_COLORS[status] }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-mono text-zinc-400">P{phase}</span>
          {timingText && (
            <span className="text-xs font-mono text-zinc-400">{timingText}</span>
          )}
        </div>
        <div className="text-sm font-medium text-white mb-2">{label}</div>
        {statusValue && (
          <div className="flex justify-start">
            <StatusBadge value={statusValue} />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

// Extract meaningful status value from fields
function getStatusValue(fields: Record<string, string>): string | null {
  // Priority order for status extraction
  const statusKeys = [
    'THREAT_LEVEL',
    'VALIDATION',
    'MEMORIES',
    'INTENT',
    'CONFLICT_LEVEL',
  ];

  for (const key of statusKeys) {
    if (fields[key]) {
      return fields[key];
    }
  }

  return null;
}
