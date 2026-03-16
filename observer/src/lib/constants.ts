import type { NodeStatus, NeuroLevels } from './types';

// Agent to buffer filename mapping
export const AGENT_TO_FILE: Record<string, string> = {
  'sensory-buffer': 'signal-sensory-buffer.md',
  'basal-ganglia': 'signal-basal-ganglia.md',
  'amygdala': 'signal-amygdala.md',
  'hippocampus': 'signal-hippocampus.md',
  'language-center': 'signal-language.md',
  'visual-cortex': 'signal-visual-cortex.md',
  'parietal-insula': 'signal-parietal-insula.md',
  'anterior-cingulate': 'signal-anterior-cingulate.md',
  'integration': 'integrated-context.md',
  'prefrontal': 'motor-plan.md',
  'cerebellum': 'signal-cerebellum.md',
  'motor-cortex': 'signal-motor-cortex.md',
};

// Reverse mapping: filename to agent
export const FILE_TO_AGENT: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_TO_FILE).map(([agent, file]) => [file, agent])
);

// Phase execution order
export const PHASE_ORDER = ['0', '0.5', '0.75', '1', '1.5', '2', '3', '4', '5', '6'];

// Node visual status colors (Tailwind border colors)
export const NODE_COLORS: Record<NodeStatus, string> = {
  pending: '#27272a',    // zinc-800
  active: '#eab308',     // yellow-500
  complete: '#22c55e',   // green-500
  error: '#ef4444',      // red-500
  skipped: '#71717a',    // zinc-500
};

// Neuromodulator level to percentage mapping
export const NEURO_LEVELS: Record<string, number> = {
  LOW: 25,
  MEDIUM: 55,
  HIGH: 90,
};

// Neuromodulator level to color mapping
export const NEURO_COLORS: Record<string, string> = {
  LOW: '#22c55e',       // green-500
  MEDIUM: '#eab308',    // yellow-500
  HIGH: '#ef4444',      // red-500
};

// WebSocket and timing constants
export const WS_RECONNECT_BASE_MS = 1000;
export const WS_RECONNECT_MAX_MS = 10000;
export const IDLE_TIMEOUT_MS = 30000;
export const DEBOUNCE_MS = 100;

// Default neuromodulator levels
export const DEFAULT_NEURO_LEVELS: NeuroLevels = {
  noradrenaline: 'MEDIUM',
  acetylcholine: 'MEDIUM',
  serotonin: 'MEDIUM',
  dopamine: 'MEDIUM',
};
