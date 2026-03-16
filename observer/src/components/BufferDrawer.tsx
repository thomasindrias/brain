import { useEffect } from 'react';
import type { BrainNodeData } from '../lib/types';
import { StatusBadge } from './nodes/StatusBadge';

type BufferDrawerProps = {
  node: BrainNodeData | null;
  onClose: () => void;
};

export function BufferDrawer({ node, onClose }: BufferDrawerProps) {
  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Render nothing when no node selected
  if (!node) {
    return null;
  }

  const fieldEntries = Object.entries(node.fields);

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-zinc-900 border-l border-zinc-800 shadow-xl transform transition-transform duration-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">{node.label}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Phase {node.phase}</span>
            <StatusBadge value={node.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close drawer"
          className="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {fieldEntries.length === 0 ? (
          <p className="text-zinc-500 text-sm">No buffer data</p>
        ) : (
          <div className="space-y-3">
            {fieldEntries.map(([key, value]) => (
              <div key={key} className="border-b border-zinc-800 pb-3 last:border-0">
                <div className="text-xs font-medium text-zinc-400 mb-1">{key}</div>
                <div className="text-sm text-zinc-100 font-mono whitespace-pre-wrap break-words">
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
