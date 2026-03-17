import type { Edge } from '@xyflow/react';

// Node positions for vertical DAG layout
export const nodePositions: Record<string, { x: number; y: number }> = {
  // Phase 0: Top center
  'sensory-buffer': { x: 400, y: 0 },

  // Phase 0.5: Below sensory buffer
  'basal-ganglia': { x: 400, y: 100 },

  // Phase 1: Parallel row (amygdala, hippocampus, language-center)
  'amygdala': { x: 200, y: 220 },
  'hippocampus': { x: 400, y: 220 },
  'language-center': { x: 600, y: 220 },

  // Phase 1.25: Depth re-evaluation
  'depth-reeval': { x: 400, y: 280 },

  // Phase 1.5: Conditional branches (offset)
  'visual-cortex': { x: 100, y: 400 },
  'parietal-insula': { x: 400, y: 400 },
  'anterior-cingulate': { x: 700, y: 400 },

  // Phase 2-6: Vertical stack
  'integration': { x: 400, y: 520 },
  'prefrontal': { x: 400, y: 620 },
  'cerebellum': { x: 400, y: 720 },
  'motor-cortex': { x: 400, y: 820 },
  'consolidation': { x: 400, y: 920 },
};

// Base edges - all static connections with default styling (gray dashed for pending)
export const baseEdges: Edge[] = [
  // Phase 0 → 0.5
  { id: 'e-sb-bg', source: 'sensory-buffer', target: 'basal-ganglia' },

  // Phase 0.5 → 1 (parallel dispatch)
  { id: 'e-bg-amy', source: 'basal-ganglia', target: 'amygdala' },
  { id: 'e-bg-hipp', source: 'basal-ganglia', target: 'hippocampus' },
  { id: 'e-bg-lang', source: 'basal-ganglia', target: 'language-center' },

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

// Node metadata: phase, label, conditional flag per agent
export const nodeMetadata: Record<
  string,
  { phase: string; label: string; conditional?: boolean }
> = {
  'sensory-buffer': { phase: '0', label: 'Sensory Buffer' },
  'basal-ganglia': { phase: '0.5', label: 'Basal Ganglia' },
  'amygdala': { phase: '1', label: 'Amygdala' },
  'hippocampus': { phase: '1', label: 'Hippocampus' },
  'language-center': { phase: '1', label: 'Language Center' },
  'depth-reeval': { phase: '1.25', label: 'Depth Re-eval' },
  'visual-cortex': { phase: '1.5', label: 'Visual Cortex', conditional: true },
  'parietal-insula': { phase: '1.5', label: 'Parietal-Insula', conditional: true },
  'anterior-cingulate': { phase: '1.5', label: 'Anterior Cingulate', conditional: true },
  'integration': { phase: '2', label: 'Integration' },
  'prefrontal': { phase: '3', label: 'Prefrontal' },
  'cerebellum': { phase: '4', label: 'Cerebellum' },
  'motor-cortex': { phase: '5', label: 'Motor Cortex' },
  'consolidation': { phase: '6', label: 'Consolidation' },
};
