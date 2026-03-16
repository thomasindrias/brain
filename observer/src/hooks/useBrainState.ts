import { useReducer, useEffect } from 'react';
import type {
  BrainState,
  BrainNodeData,
  WSMessage,
  UIAction,
  PhaseEvent,
  BufferUpdate,
  NeuroUpdate,
  Snapshot,
  SessionSnapshot,
} from '../lib/types';
import { DEFAULT_NEURO_LEVELS, IDLE_TIMEOUT_MS, FILE_TO_AGENT } from '../lib/constants';

// Node definitions with phase, label, agent, and conditional flags
const createNode = (
  phase: string,
  label: string,
  agent: string,
  conditional?: boolean
): BrainNodeData => ({
  phase,
  label,
  agent,
  status: 'pending',
  fields: {},
  timing: undefined,
  conditional,
});

// Initial state with all 13 nodes
export const initialState: BrainState = {
  nodes: {
    'sensory-buffer': createNode('0', 'Sensory Buffer', 'sensory-buffer'),
    'basal-ganglia': createNode('0.5', 'Basal Ganglia', 'basal-ganglia'),
    'amygdala': createNode('1', 'Amygdala', 'amygdala'),
    'hippocampus': createNode('1', 'Hippocampus', 'hippocampus'),
    'language-center': createNode('1', 'Language Center', 'language-center'),
    'visual-cortex': createNode('1.5', 'Visual Cortex', 'visual-cortex', true),
    'parietal-insula': createNode('1.5', 'Parietal-Insula', 'parietal-insula', true),
    'anterior-cingulate': createNode('1.5', 'Anterior Cingulate', 'anterior-cingulate', true),
    'integration': createNode('2', 'Integration', 'integration'),
    'prefrontal': createNode('3', 'Prefrontal', 'prefrontal'),
    'cerebellum': createNode('4', 'Cerebellum', 'cerebellum'),
    'motor-cortex': createNode('5', 'Motor Cortex', 'motor-cortex'),
    'consolidation': createNode('6', 'Consolidation', 'consolidation'),
  },
  currentPhase: null,
  neuro: DEFAULT_NEURO_LEVELS,
  selectedNode: null,
  viewingSession: null,
  sessionHistory: [],
  feedbackLoopActive: false,
  rePlanCount: 0,
  isLive: true,
  loopStartTs: null,
  lastEventTs: null,
  backgroundAgents: {
    hypothalamus: 'idle',
    'reward-system': 'idle',
    'default-mode': 'idle',
  },
  basalGangliaShortcut: false,
  matchedRoutine: null,
};

// Pure reducer function
export function brainReducer(
  state: BrainState,
  action: WSMessage | UIAction
): BrainState {
  // Handle UI actions
  if ('type' in action) {
    if (action.type === 'SELECT_NODE') {
      return {
        ...state,
        selectedNode: action.agent,
      };
    }

    if (action.type === 'VIEW_SESSION') {
      // If switching back to live view, just update flags
      if (action.sessionId === null) {
        return {
          ...state,
          viewingSession: null,
          isLive: true,
        };
      }

      // Find the session snapshot
      const snapshot = state.sessionHistory.find(s => s.id === action.sessionId);
      if (!snapshot) {
        return state; // Session not found, no-op
      }

      // Reconstruct state from snapshot
      let newState = { ...initialState };

      // Replay events to reconstruct node states
      for (const event of snapshot.events) {
        newState = handlePhaseEvent(newState, event);
      }

      // Overlay buffer fields from snapshot (map filenames to agent names)
      for (const [fileOrAgent, fields] of Object.entries(snapshot.buffers)) {
        const agent = FILE_TO_AGENT[fileOrAgent] || fileOrAgent;
        if (newState.nodes[agent]) {
          newState.nodes[agent] = {
            ...newState.nodes[agent],
            fields: {
              ...newState.nodes[agent].fields,
              ...fields,
            },
          };
        }
      }

      // Set neuromodulator levels and viewing flags
      return {
        ...newState,
        neuro: snapshot.neuro,
        viewingSession: action.sessionId,
        isLive: false,
        sessionHistory: state.sessionHistory, // Preserve history
        loopStartTs: snapshot.startTs,
        lastEventTs: snapshot.endTs ?? snapshot.startTs,
      };
    }

    if (action.type === 'CHECK_IDLE') {
      // Check if idle timeout has elapsed
      if (state.lastEventTs) {
        const now = Date.now();
        const elapsed = now - state.lastEventTs;
        if (elapsed >= IDLE_TIMEOUT_MS && state.isLive) {
          return {
            ...state,
            isLive: false,
          };
        }
      }
      return state;
    }

    // Handle WebSocket messages
    if (action.type === 'phase') {
      return handlePhaseEvent(state, action);
    }

    if (action.type === 'buffer') {
      return handleBufferUpdate(state, action);
    }

    if (action.type === 'neuro') {
      return handleNeuroUpdate(state, action);
    }

    if (action.type === 'snapshot') {
      return handleSnapshot(state, action);
    }
  }

  return state;
}

// Handle phase events
function handlePhaseEvent(state: BrainState, event: PhaseEvent): BrainState {
  const { phase, agent, status, result, ts } = event;

  // Check if this is a new Phase 0 start (cognitive loop restart)
  if (phase === '0' && status === 'start' && state.loopStartTs !== null) {
    // Push current state to session history
    const sessionSnapshot: SessionSnapshot = {
      id: `session-${state.loopStartTs}`,
      buffers: extractBuffers(state),
      events: extractEvents(state),
      neuro: state.neuro,
      startTs: state.loopStartTs,
      endTs: state.lastEventTs ?? state.loopStartTs,
    };

    const newHistory = [...state.sessionHistory, sessionSnapshot];

    // Cap history at 10 entries
    const cappedHistory = newHistory.length > 10 ? newHistory.slice(-10) : newHistory;

    // Reset all nodes to pending
    const resetNodes: Record<string, BrainNodeData> = {};
    for (const [key, node] of Object.entries(state.nodes)) {
      resetNodes[key] = {
        ...node,
        status: 'pending',
        fields: {},
        timing: undefined,
      };
    }

    // Set the new sensory-buffer to active
    resetNodes[agent] = {
      ...resetNodes[agent],
      status: 'active',
      timing: { start: ts },
    };

    return {
      ...state,
      nodes: resetNodes,
      sessionHistory: cappedHistory,
      currentPhase: phase,
      loopStartTs: ts,
      lastEventTs: ts,
      rePlanCount: 0,
      feedbackLoopActive: false,
      basalGangliaShortcut: false,
      matchedRoutine: null,
    };
  }

  // Regular phase event handling
  const node = state.nodes[agent];
  if (!node) return state;

  let updatedNode = { ...node };

  if (status === 'start') {
    updatedNode.status = 'active';
    updatedNode.timing = { ...updatedNode.timing, start: ts };
  } else if (status === 'complete') {
    updatedNode.status = 'complete';
    updatedNode.timing = { ...updatedNode.timing, end: ts };
  } else if (status === 'skipped') {
    updatedNode.status = 'skipped';
  }

  // Handle Cerebellum result
  let newRePlanCount = state.rePlanCount;
  let newFeedbackLoopActive = state.feedbackLoopActive;

  if (agent === 'cerebellum' && status === 'complete') {
    if (result === 'FAIL') {
      newRePlanCount += 1;
      newFeedbackLoopActive = true;
    } else if (result === 'PASS') {
      newFeedbackLoopActive = false;
    }
  }

  // Handle Basal Ganglia shortcut
  let newBasalGangliaShortcut = state.basalGangliaShortcut;
  let newMatchedRoutine = state.matchedRoutine;
  let updatedNodes = {
    ...state.nodes,
    [agent]: updatedNode,
  };

  if (agent === 'basal-ganglia' && status === 'complete' && result === 'match') {
    newBasalGangliaShortcut = true;
    // Extract matched routine text from fields if available
    newMatchedRoutine = updatedNode.fields['MATCHED_ROUTINE'] || 'routine';

    // Mark all downstream nodes as skipped
    const downstreamAgents = [
      'amygdala', 'hippocampus', 'language-center',
      'visual-cortex', 'parietal-insula', 'anterior-cingulate',
      'integration', 'prefrontal', 'cerebellum', 'motor-cortex', 'consolidation'
    ];

    for (const downstreamAgent of downstreamAgents) {
      if (updatedNodes[downstreamAgent]) {
        updatedNodes[downstreamAgent] = {
          ...updatedNodes[downstreamAgent],
          status: 'skipped',
        };
      }
    }
  }

  return {
    ...state,
    nodes: updatedNodes,
    currentPhase: phase,
    loopStartTs: state.loopStartTs ?? (phase === '0' && status === 'start' ? ts : null),
    lastEventTs: ts,
    rePlanCount: newRePlanCount,
    feedbackLoopActive: newFeedbackLoopActive,
    basalGangliaShortcut: newBasalGangliaShortcut,
    matchedRoutine: newMatchedRoutine,
  };
}

// Handle buffer updates
function handleBufferUpdate(state: BrainState, event: BufferUpdate): BrainState {
  const { agent, fields } = event;

  const node = state.nodes[agent];
  if (!node) return state;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [agent]: {
        ...node,
        fields: {
          ...node.fields,
          ...fields,
        },
      },
    },
  };
}

// Handle neuromodulator updates
function handleNeuroUpdate(state: BrainState, event: NeuroUpdate): BrainState {
  return {
    ...state,
    neuro: event.levels,
  };
}

// Handle snapshot events
function handleSnapshot(state: BrainState, snapshot: Snapshot): BrainState {
  // Start with a clean slate
  let newState = { ...initialState };

  // Replay all events to reconstruct node states
  for (const event of snapshot.events) {
    newState = handlePhaseEvent(newState, event);
  }

  // Overlay buffer fields from snapshot (map filenames to agent names)
  for (const [fileOrAgent, fields] of Object.entries(snapshot.buffers)) {
    const agent = FILE_TO_AGENT[fileOrAgent] || fileOrAgent;
    if (newState.nodes[agent]) {
      newState.nodes[agent] = {
        ...newState.nodes[agent],
        fields: {
          ...newState.nodes[agent].fields,
          ...fields,
        },
      };
    }
  }

  // Set neuromodulator levels
  newState.neuro = snapshot.neuro;

  // Preserve existing session history
  newState.sessionHistory = state.sessionHistory;

  return newState;
}

// Helper: Extract buffer data from current state
function extractBuffers(state: BrainState): Record<string, Record<string, string>> {
  const buffers: Record<string, Record<string, string>> = {};
  for (const [agent, node] of Object.entries(state.nodes)) {
    if (Object.keys(node.fields).length > 0) {
      buffers[agent] = node.fields;
    }
  }
  return buffers;
}

// Helper: Extract events from current state (reconstructed from node timing)
function extractEvents(state: BrainState): PhaseEvent[] {
  const events: PhaseEvent[] = [];

  for (const node of Object.values(state.nodes)) {
    if (node.timing?.start) {
      events.push({
        type: 'phase',
        phase: node.phase,
        agent: node.agent,
        status: 'start',
        ts: node.timing.start,
      });
    }
    if (node.timing?.end) {
      events.push({
        type: 'phase',
        phase: node.phase,
        agent: node.agent,
        status: 'complete',
        ts: node.timing.end,
      });
    }
  }

  // Sort by timestamp
  return events.sort((a, b) => a.ts - b.ts);
}

// React hook wrapper
export function useBrainState() {
  const [state, dispatch] = useReducer(brainReducer, initialState);

  // Idle timeout check - runs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_IDLE' });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return [state, dispatch] as const;
}
