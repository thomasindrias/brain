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

  // Phase 1.5: Conditional branches (offset)
  'visual-cortex': { x: 100, y: 340 },
  'parietal-insula': { x: 400, y: 340 },
  'anterior-cingulate': { x: 700, y: 340 },

  // Phase 2-6: Vertical stack
  'integration': { x: 400, y: 460 },
  'prefrontal': { x: 400, y: 560 },
  'cerebellum': { x: 400, y: 660 },
  'motor-cortex': { x: 400, y: 760 },
  'consolidation': { x: 400, y: 860 },
};

// Base edges - all static connections with default styling (gray dashed for pending)
export const baseEdges: Edge[] = [
  // Phase 0 → 0.5
  { id: 'e-sb-bg', source: 'sensory-buffer', target: 'basal-ganglia' },

  // Phase 0.5 → 1 (parallel dispatch)
  { id: 'e-bg-amy', source: 'basal-ganglia', target: 'amygdala' },
  { id: 'e-bg-hipp', source: 'basal-ganglia', target: 'hippocampus' },
  { id: 'e-bg-lang', source: 'basal-ganglia', target: 'language-center' },

  // Phase 1 → 1.5 (conditional branches - dashed by default)
  {
    id: 'e-lang-vc',
    source: 'language-center',
    target: 'visual-cortex',
    style: { strokeDasharray: '5,5' },
  },
  {
    id: 'e-lang-pi',
    source: 'language-center',
    target: 'parietal-insula',
    style: { strokeDasharray: '5,5' },
  },
  {
    id: 'e-lang-ac',
    source: 'language-center',
    target: 'anterior-cingulate',
    style: { strokeDasharray: '5,5' },
  },

  // Phase 1 → 2
  { id: 'e-amy-int', source: 'amygdala', target: 'integration' },
  { id: 'e-hipp-int', source: 'hippocampus', target: 'integration' },
  { id: 'e-lang-int', source: 'language-center', target: 'integration' },

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
  'visual-cortex': { phase: '1.5', label: 'Visual Cortex', conditional: true },
  'parietal-insula': { phase: '1.5', label: 'Parietal-Insula', conditional: true },
  'anterior-cingulate': { phase: '1.5', label: 'Anterior Cingulate', conditional: true },
  'integration': { phase: '2', label: 'Integration' },
  'prefrontal': { phase: '3', label: 'Prefrontal' },
  'cerebellum': { phase: '4', label: 'Cerebellum' },
  'motor-cortex': { phase: '5', label: 'Motor Cortex' },
  'consolidation': { phase: '6', label: 'Consolidation' },
};
