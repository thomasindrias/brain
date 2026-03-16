import { describe, it, expect } from 'vitest';
import { brainReducer, initialState } from './useBrainState';
import type { PhaseEvent, BufferUpdate, NeuroUpdate, Snapshot, BrainState } from '../lib/types';
import { DEFAULT_NEURO_LEVELS } from '../lib/constants';

describe('brainReducer', () => {
  describe('initialState', () => {
    it('should have all 13 nodes in pending status', () => {
      const expectedAgents = [
        'sensory-buffer',
        'basal-ganglia',
        'amygdala',
        'hippocampus',
        'language-center',
        'visual-cortex',
        'parietal-insula',
        'anterior-cingulate',
        'integration',
        'prefrontal',
        'cerebellum',
        'motor-cortex',
        'consolidation',
      ];

      expectedAgents.forEach((agent) => {
        expect(initialState.nodes[agent]).toBeDefined();
        expect(initialState.nodes[agent].status).toBe('pending');
        expect(initialState.nodes[agent].agent).toBe(agent);
      });
    });

    it('should mark conditional nodes correctly', () => {
      expect(initialState.nodes['visual-cortex'].conditional).toBe(true);
      expect(initialState.nodes['parietal-insula'].conditional).toBe(true);
      expect(initialState.nodes['anterior-cingulate'].conditional).toBe(true);
      expect(initialState.nodes['sensory-buffer'].conditional).toBeUndefined();
    });

    it('should initialize with default neuromodulator levels', () => {
      expect(initialState.neuro).toEqual(DEFAULT_NEURO_LEVELS);
    });

    it('should start in live mode', () => {
      expect(initialState.isLive).toBe(true);
      expect(initialState.viewingSession).toBeNull();
      expect(initialState.selectedNode).toBeNull();
    });
  });

  describe('Phase events', () => {
    it('should set node to active on phase start', () => {
      const event: PhaseEvent = {
        type: 'phase',
        phase: '0',
        agent: 'sensory-buffer',
        status: 'start',
        ts: 1000,
      };

      const newState = brainReducer(initialState, event);

      expect(newState.nodes['sensory-buffer'].status).toBe('active');
      expect(newState.nodes['sensory-buffer'].timing?.start).toBe(1000);
      expect(newState.currentPhase).toBe('0');
      expect(newState.lastEventTs).toBe(1000);
    });

    it('should set node to complete on phase complete', () => {
      const startEvent: PhaseEvent = {
        type: 'phase',
        phase: '1',
        agent: 'amygdala',
        status: 'start',
        ts: 1000,
      };

      const completeEvent: PhaseEvent = {
        type: 'phase',
        phase: '1',
        agent: 'amygdala',
        status: 'complete',
        ts: 1500,
      };

      let state = brainReducer(initialState, startEvent);
      state = brainReducer(state, completeEvent);

      expect(state.nodes['amygdala'].status).toBe('complete');
      expect(state.nodes['amygdala'].timing?.end).toBe(1500);
      expect(state.lastEventTs).toBe(1500);
    });

    it('should set node to skipped on phase skipped', () => {
      const event: PhaseEvent = {
        type: 'phase',
        phase: '1.5',
        agent: 'visual-cortex',
        status: 'skipped',
        ts: 2000,
      };

      const newState = brainReducer(initialState, event);

      expect(newState.nodes['visual-cortex'].status).toBe('skipped');
    });

    it('should increment rePlanCount on Cerebellum FAIL result', () => {
      const failEvent: PhaseEvent = {
        type: 'phase',
        phase: '4',
        agent: 'cerebellum',
        status: 'complete',
        result: 'FAIL',
        ts: 3000,
      };

      const newState = brainReducer(initialState, failEvent);

      expect(newState.rePlanCount).toBe(1);
      expect(newState.feedbackLoopActive).toBe(true);
    });

    it('should clear feedbackLoopActive on Cerebellum PASS result', () => {
      const stateWithLoop: BrainState = {
        ...initialState,
        rePlanCount: 1,
        feedbackLoopActive: true,
      };

      const passEvent: PhaseEvent = {
        type: 'phase',
        phase: '4',
        agent: 'cerebellum',
        status: 'complete',
        result: 'PASS',
        ts: 3000,
      };

      const newState = brainReducer(stateWithLoop, passEvent);

      expect(newState.feedbackLoopActive).toBe(false);
    });

    it('should reset all nodes to pending and push to history on new Phase 0 start', () => {
      // Create a state with some completed nodes
      const activeState: BrainState = {
        ...initialState,
        nodes: {
          ...initialState.nodes,
          'sensory-buffer': {
            ...initialState.nodes['sensory-buffer'],
            status: 'complete',
            timing: { start: 1000, end: 1500 },
            fields: { test: 'value' },
          },
          'amygdala': {
            ...initialState.nodes['amygdala'],
            status: 'complete',
          },
        },
        currentPhase: '5',
        loopStartTs: 1000,
        lastEventTs: 5000,
        rePlanCount: 2,
        neuro: { noradrenaline: 'HIGH', acetylcholine: 'LOW', serotonin: 'MEDIUM', dopamine: 'HIGH' },
      };

      const newPhase0Event: PhaseEvent = {
        type: 'phase',
        phase: '0',
        agent: 'sensory-buffer',
        status: 'start',
        ts: 10000,
      };

      const newState = brainReducer(activeState, newPhase0Event);

      // All nodes should be reset to pending except the new one (active)
      expect(newState.nodes['sensory-buffer'].status).toBe('active');
      expect(newState.nodes['amygdala'].status).toBe('pending');
      expect(newState.nodes['amygdala'].fields).toEqual({});

      // Session should be pushed to history
      expect(newState.sessionHistory).toHaveLength(1);
      expect(newState.sessionHistory[0].startTs).toBe(1000);
      expect(newState.sessionHistory[0].endTs).toBe(5000);

      // Counters should be reset
      expect(newState.rePlanCount).toBe(0);
      expect(newState.feedbackLoopActive).toBe(false);

      // New loop should start
      expect(newState.loopStartTs).toBe(10000);
    });

    it('should cap session history at 10 entries', () => {
      // Create a state with 10 history entries
      const historyState: BrainState = {
        ...initialState,
        sessionHistory: Array.from({ length: 10 }, (_, i) => ({
          id: `session-${i}`,
          buffers: {},
          events: [],
          neuro: DEFAULT_NEURO_LEVELS,
          startTs: i * 1000,
          endTs: (i + 1) * 1000,
        })),
        loopStartTs: 1000,
        lastEventTs: 2000,
      };

      const newPhase0Event: PhaseEvent = {
        type: 'phase',
        phase: '0',
        agent: 'sensory-buffer',
        status: 'start',
        ts: 15000,
      };

      const newState = brainReducer(historyState, newPhase0Event);

      expect(newState.sessionHistory).toHaveLength(10);
      // Oldest session should be removed (session-0)
      expect(newState.sessionHistory[0].id).toBe('session-1');
      // Newest session should be added
      expect(newState.sessionHistory[9].id).toBe(`session-${newState.sessionHistory[9].startTs}`);
    });

    it('should record loopStartTs from first Phase 0 event', () => {
      const event: PhaseEvent = {
        type: 'phase',
        phase: '0',
        agent: 'sensory-buffer',
        status: 'start',
        ts: 5000,
      };

      const newState = brainReducer(initialState, event);

      expect(newState.loopStartTs).toBe(5000);
    });
  });

  describe('Buffer events', () => {
    it('should store parsed fields on the correct node', () => {
      const bufferEvent: BufferUpdate = {
        type: 'buffer',
        file: 'signal-amygdala.md',
        agent: 'amygdala',
        fields: {
          THREAT_LEVEL: 'SAFE',
          EMOTIONAL_VALENCE: 'NEUTRAL',
        },
        ts: 2000,
      };

      const newState = brainReducer(initialState, bufferEvent);

      expect(newState.nodes['amygdala'].fields).toEqual({
        THREAT_LEVEL: 'SAFE',
        EMOTIONAL_VALENCE: 'NEUTRAL',
      });
    });

    it('should merge buffer fields with existing fields', () => {
      const stateWithFields: BrainState = {
        ...initialState,
        nodes: {
          ...initialState.nodes,
          'amygdala': {
            ...initialState.nodes['amygdala'],
            fields: { THREAT_LEVEL: 'SAFE' },
          },
        },
      };

      const bufferEvent: BufferUpdate = {
        type: 'buffer',
        file: 'signal-amygdala.md',
        agent: 'amygdala',
        fields: {
          EMOTIONAL_VALENCE: 'NEUTRAL',
        },
        ts: 2000,
      };

      const newState = brainReducer(stateWithFields, bufferEvent);

      expect(newState.nodes['amygdala'].fields).toEqual({
        THREAT_LEVEL: 'SAFE',
        EMOTIONAL_VALENCE: 'NEUTRAL',
      });
    });

    it('should store buffer fields even without corresponding phase event', () => {
      const bufferEvent: BufferUpdate = {
        type: 'buffer',
        file: 'signal-hippocampus.md',
        agent: 'hippocampus',
        fields: {
          MEMORIES_RETRIEVED: '3',
        },
        ts: 2000,
      };

      const newState = brainReducer(initialState, bufferEvent);

      expect(newState.nodes['hippocampus'].status).toBe('pending'); // Status unchanged
      expect(newState.nodes['hippocampus'].fields).toEqual({
        MEMORIES_RETRIEVED: '3',
      });
    });
  });

  describe('Neuromodulator events', () => {
    it('should update all four neuromodulator levels', () => {
      const neuroEvent: NeuroUpdate = {
        type: 'neuro',
        levels: {
          noradrenaline: 'HIGH',
          acetylcholine: 'LOW',
          serotonin: 'MEDIUM',
          dopamine: 'HIGH',
        },
        ts: 3000,
      };

      const newState = brainReducer(initialState, neuroEvent);

      expect(newState.neuro).toEqual({
        noradrenaline: 'HIGH',
        acetylcholine: 'LOW',
        serotonin: 'MEDIUM',
        dopamine: 'HIGH',
      });
    });
  });

  describe('Snapshot events', () => {
    it('should replay events to reconstruct node states', () => {
      const snapshot: Snapshot = {
        type: 'snapshot',
        buffers: {},
        events: [
          {
            type: 'phase',
            phase: '0',
            agent: 'sensory-buffer',
            status: 'start',
            ts: 1000,
          },
          {
            type: 'phase',
            phase: '0',
            agent: 'sensory-buffer',
            status: 'complete',
            ts: 1500,
          },
          {
            type: 'phase',
            phase: '1',
            agent: 'amygdala',
            status: 'start',
            ts: 2000,
          },
        ],
        neuro: DEFAULT_NEURO_LEVELS,
      };

      const newState = brainReducer(initialState, snapshot);

      expect(newState.nodes['sensory-buffer'].status).toBe('complete');
      expect(newState.nodes['sensory-buffer'].timing?.start).toBe(1000);
      expect(newState.nodes['sensory-buffer'].timing?.end).toBe(1500);
      expect(newState.nodes['amygdala'].status).toBe('active');
      expect(newState.nodes['amygdala'].timing?.start).toBe(2000);
    });

    it('should overlay buffer fields from snapshot', () => {
      const snapshot: Snapshot = {
        type: 'snapshot',
        buffers: {
          'amygdala': {
            THREAT_LEVEL: 'SAFE',
            EMOTIONAL_VALENCE: 'POSITIVE',
          },
          'hippocampus': {
            MEMORIES_RETRIEVED: '5',
          },
        },
        events: [],
        neuro: DEFAULT_NEURO_LEVELS,
      };

      const newState = brainReducer(initialState, snapshot);

      expect(newState.nodes['amygdala'].fields).toEqual({
        THREAT_LEVEL: 'SAFE',
        EMOTIONAL_VALENCE: 'POSITIVE',
      });
      expect(newState.nodes['hippocampus'].fields).toEqual({
        MEMORIES_RETRIEVED: '5',
      });
    });

    it('should set neuromodulator levels from snapshot', () => {
      const snapshot: Snapshot = {
        type: 'snapshot',
        buffers: {},
        events: [],
        neuro: {
          noradrenaline: 'HIGH',
          acetylcholine: 'LOW',
          serotonin: 'MEDIUM',
          dopamine: 'HIGH',
        },
      };

      const newState = brainReducer(initialState, snapshot);

      expect(newState.neuro).toEqual({
        noradrenaline: 'HIGH',
        acetylcholine: 'LOW',
        serotonin: 'MEDIUM',
        dopamine: 'HIGH',
      });
    });
  });

  describe('UI actions', () => {
    it('should set selectedNode on SELECT_NODE action', () => {
      const action = {
        type: 'SELECT_NODE' as const,
        agent: 'amygdala',
      };

      const newState = brainReducer(initialState, action);

      expect(newState.selectedNode).toBe('amygdala');
    });

    it('should clear selectedNode when SELECT_NODE receives null', () => {
      const stateWithSelection: BrainState = {
        ...initialState,
        selectedNode: 'amygdala',
      };

      const action = {
        type: 'SELECT_NODE' as const,
        agent: null,
      };

      const newState = brainReducer(stateWithSelection, action);

      expect(newState.selectedNode).toBeNull();
    });

    it('should switch to historical view on VIEW_SESSION', () => {
      const action = {
        type: 'VIEW_SESSION' as const,
        sessionId: 'session-123',
      };

      const newState = brainReducer(initialState, action);

      expect(newState.viewingSession).toBe('session-123');
      expect(newState.isLive).toBe(false);
    });

    it('should return to live mode when VIEW_SESSION receives null', () => {
      const stateInHistory: BrainState = {
        ...initialState,
        viewingSession: 'session-123',
        isLive: false,
      };

      const action = {
        type: 'VIEW_SESSION' as const,
        sessionId: null,
      };

      const newState = brainReducer(stateInHistory, action);

      expect(newState.viewingSession).toBeNull();
      expect(newState.isLive).toBe(true);
    });
  });

  describe('Pure function requirement', () => {
    it('should not mutate the original state', () => {
      const originalState = { ...initialState };
      const event: PhaseEvent = {
        type: 'phase',
        phase: '1',
        agent: 'amygdala',
        status: 'start',
        ts: 1000,
      };

      brainReducer(initialState, event);

      // Deep equality check
      expect(initialState).toEqual(originalState);
    });
  });
});
