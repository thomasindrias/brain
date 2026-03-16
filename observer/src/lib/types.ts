// Neuromodulator levels
export type NeuroLevels = {
  noradrenaline: string;
  acetylcholine: string;
  serotonin: string;
  dopamine: string;
};

// Node status states
export type NodeStatus = 'pending' | 'active' | 'complete' | 'error' | 'skipped';

// Brain node data structure
export type BrainNodeData = {
  phase: string;
  label: string;
  agent: string;
  status: NodeStatus;
  fields: Record<string, string>;
  timing?: {
    start?: number;
    end?: number;
  };
  conditional?: boolean;
};

// Event log status (distinct from UI NodeStatus)
export type EventStatus = 'start' | 'complete' | 'skipped';

// WebSocket message types
export type PhaseEvent = {
  type: 'phase';
  phase: string;
  agent: string;
  status: EventStatus;
  result?: string;
  ts: number;
};

export type BufferUpdate = {
  type: 'buffer';
  file: string;
  agent: string;
  fields: Record<string, string>;
  ts: number;
};

export type NeuroUpdate = {
  type: 'neuro';
  levels: NeuroLevels;
  ts: number;
};

export type Snapshot = {
  type: 'snapshot';
  buffers: Record<string, Record<string, string>>;
  events: PhaseEvent[];
  neuro: NeuroLevels;
};

export type WSMessage = PhaseEvent | BufferUpdate | NeuroUpdate | Snapshot;

// Session snapshot structure
export type SessionSnapshot = {
  id: string;
  buffers: Record<string, Record<string, string>>;
  events: PhaseEvent[];
  neuro: NeuroLevels;
  startTs: number;
  endTs?: number;
};

// UI actions
export type UIAction =
  | { type: 'SELECT_NODE'; agent: string | null }
  | { type: 'VIEW_SESSION'; sessionId: string | null };

// Background agent status tracking
export type BackgroundAgentStatus = {
  hypothalamus: string;
  'reward-system': string;
  'default-mode': string;
};

// Complete brain state (used by reducer)
export type BrainState = {
  nodes: Record<string, BrainNodeData>;
  currentPhase: string | null;
  neuro: NeuroLevels;
  selectedNode: string | null;
  viewingSession: string | null;
  sessionHistory: SessionSnapshot[];
  feedbackLoopActive: boolean;
  rePlanCount: number;
  isLive: boolean;
  loopStartTs: number | null;
  lastEventTs: number | null;
  backgroundAgents: BackgroundAgentStatus;
};
