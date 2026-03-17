import type { Edge } from '@xyflow/react';
import type { DispatchModel } from './types';

// Node positions for vertical DAG layout
export const nodePositions: Record<string, { x: number; y: number }> = {
  // Phase 0: Top center
  'sensory-buffer': { x: 400, y: 0 },

  // Phase 0.5: Below sensory buffer
  'basal-ganglia': { x: 400, y: 100 },

  // Phase 0.75: Neuromodulation check
  'neuromodulators': { x: 400, y: 160 },

  // Phase 1: Parallel row (amygdala, hippocampus, language-center)
  'amygdala': { x: 200, y: 240 },
  'hippocampus': { x: 400, y: 240 },
  'language-center': { x: 600, y: 240 },

  // Phase 1.25: Depth re-evaluation
  'depth-reeval': { x: 400, y: 300 },

  // Phase 1.5: Conditional branches (offset)
  'visual-cortex': { x: 100, y: 420 },
  'parietal-insula': { x: 400, y: 420 },
  'anterior-cingulate': { x: 700, y: 420 },

  // Phase 2-6: Vertical stack
  'integration': { x: 400, y: 540 },
  'prefrontal': { x: 400, y: 640 },
  'cerebellum': { x: 400, y: 740 },
  'motor-cortex': { x: 400, y: 840 },
  'consolidation': { x: 400, y: 940 },
};

// Base edges - all static connections with default styling (gray dashed for pending)
export const baseEdges: Edge[] = [
  // Phase 0 → 0.5
  { id: 'e-sb-bg', source: 'sensory-buffer', target: 'basal-ganglia' },

  // Phase 0.5 -> 0.75
  { id: 'e-bg-neuro', source: 'basal-ganglia', target: 'neuromodulators' },

  // Phase 0.75 -> 1 (gated parallel dispatch)
  { id: 'e-neuro-amy', source: 'neuromodulators', target: 'amygdala' },
  { id: 'e-neuro-hipp', source: 'neuromodulators', target: 'hippocampus' },
  { id: 'e-neuro-lang', source: 'neuromodulators', target: 'language-center' },

  // Phase 1 → 1.25
  { id: 'e-amy-dr', source: 'amygdala', target: 'depth-reeval' },
  { id: 'e-hipp-dr', source: 'hippocampus', target: 'depth-reeval' },
  { id: 'e-lang-dr', source: 'language-center', target: 'depth-reeval' },

  // Phase 1.25 → 1.5 (conditional branches - dashed)
  {
    id: 'e-dr-vc',
    source: 'depth-reeval',
    target: 'visual-cortex',
    style: { strokeDasharray: '5,5' },
  },
  {
    id: 'e-dr-pi',
    source: 'depth-reeval',
    target: 'parietal-insula',
    style: { strokeDasharray: '5,5' },
  },
  {
    id: 'e-dr-ac',
    source: 'depth-reeval',
    target: 'anterior-cingulate',
    style: { strokeDasharray: '5,5' },
  },

  // Phase 1.25 → 2 (direct path)
  { id: 'e-dr-int', source: 'depth-reeval', target: 'integration' },

  // Phase 1.5 → 2
  {
    id: 'e-vc-int',
    source: 'visual-cortex',
    target: 'integration',
    style: { strokeDasharray: '5,5' },
  },
  {
    id: 'e-pi-int',
    source: 'parietal-insula',
    target: 'integration',
    style: { strokeDasharray: '5,5' },
  },
  {
    id: 'e-ac-int',
    source: 'anterior-cingulate',
    target: 'integration',
    style: { strokeDasharray: '5,5' },
  },

  // Phase 2 → 3 → 4 → 5 → 6 (vertical flow)
  { id: 'e-int-pf', source: 'integration', target: 'prefrontal' },
  { id: 'e-pf-cb', source: 'prefrontal', target: 'cerebellum' },
  { id: 'e-cb-mc', source: 'cerebellum', target: 'motor-cortex' },
  { id: 'e-mc-cons', source: 'motor-cortex', target: 'consolidation' },

  // Feedback loop edge (cerebellum → prefrontal) - hidden by default
  {
    id: 'e-cb-pf-feedback',
    source: 'cerebellum',
    target: 'prefrontal',
    style: { stroke: '#ef4444', strokeDasharray: '5,5' },
    hidden: true,
  },
];

// Node metadata: phase, label, dispatch model, conditional/gated flags
export const nodeMetadata: Record<
  string,
  { phase: string; label: string; conditional?: boolean; dispatch?: DispatchModel }
> = {
  'sensory-buffer': { phase: '0', label: 'Sensory Buffer', dispatch: 'inline' },
  'basal-ganglia': { phase: '0.5', label: 'Basal Ganglia', dispatch: 'inline' },
  'neuromodulators': { phase: '0.75', label: 'Neuromodulators', dispatch: 'inline' },
  'amygdala': { phase: '1', label: 'Amygdala', conditional: true, dispatch: 'sub-agent' },
  'hippocampus': { phase: '1', label: 'Hippocampus', conditional: true, dispatch: 'sub-agent' },
  'language-center': { phase: '1', label: 'Language Center', dispatch: 'sub-agent' },
  'depth-reeval': { phase: '1.25', label: 'Depth Re-eval', dispatch: 'inline' },
  'visual-cortex': { phase: '1.5', label: 'Visual Cortex', conditional: true, dispatch: 'sub-agent' },
  'parietal-insula': { phase: '1.5', label: 'Parietal-Insula', conditional: true, dispatch: 'sub-agent' },
  'anterior-cingulate': { phase: '1.5', label: 'Anterior Cingulate', conditional: true, dispatch: 'sub-agent' },
  'integration': { phase: '2', label: 'Integration', dispatch: 'inline' },
  'prefrontal': { phase: '3', label: 'Prefrontal', dispatch: 'sub-agent' },
  'cerebellum': { phase: '4', label: 'Cerebellum', dispatch: 'hybrid' },
  'motor-cortex': { phase: '5', label: 'Motor Cortex', dispatch: 'inline' },
  'consolidation': { phase: '6', label: 'Consolidation', dispatch: 'sub-agent' },
};
