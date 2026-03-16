# Brain OS — Architecture Overview

## Signal Flow (with Feedback Loops)

```
User Prompt
    |
    v
[Sensory Buffer]                 <- Phase 0: Raw input capture
    |
    v
[Basal Ganglia Check]            <- Phase 0.5: Cached routine shortcut
    |
    v (if no match)
[Neuromodulator State]           <- Phase 0.75: Read cognitive mode
    |
    +--------+-----------+
    v        v           v       <- Phase 1: Parallel Dispatch
 Amygdala  Hippocampus  Language
 (threat   (memory      Center
  + emo-    RAG)        (intent)
  tional
  tagging)
    |        |           |
    v        v           v
 signal-   signal-      signal-  <- Lock-free buffer writes
 amygdala  hippocampus  language
    |        |           |
    +--------+-----------+
             |
             v
    integrated-context.md        <- Phase 2: Binding
             |
             v
    Prefrontal Cortex            <- Phase 3: Planning (CoT)
             |                      ^
             v                      | (feedback on error)
        motor-plan.md               |
             |                      |
             v                      |
        Cerebellum ----FAIL-------->+  <- Phase 4: Validation
             |                         (max 2 loops)
           PASS
             |
             v
        Motor Cortex             <- Phase 5: Execution
             |                      |
             v                      | (efference copy on error)
        User Response               +---> signal-error.md
             |                             |
             v                             v
        Hippocampus              <- Phase 6: Consolidation
        (save to /long-term/        (+ reconsolidation)
         based on emotional
         valence priority)
```

## Brain Regions (15 total)

| Region | File | Function | Layer |
|--------|------|----------|-------|
| Thalamus | CLAUDE.md | Signal routing + error handling | Entry |
| Neuromodulators | state-neuromodulators.md | Dynamic hyperparameters | 1-Chemical |
| Hypothalamus | skill-hypothalamus.md | System health | 1-Chemical |
| Reward System | skill-reward-system.md | RLHF reinforcement | 1-Chemical |
| Sensory Buffer | skill-sensory-buffer.md | Raw input capture | 2-Sensory |
| Visual Cortex | skill-visual-cortex.md | Image processing | 2-Sensory |
| Language Center | skill-language-center.md | Intent parsing | 2-Sensory |
| Parietal-Insula | skill-parietal-insula.md | Multi-modal fusion + empathy | 2-Sensory |
| Amygdala | skill-amygdala.md | Graduated threat + emotional tagging | 3-Subconscious |
| Hippocampus | skill-hippocampus.md | Memory RAG + reconsolidation | 3-Subconscious |
| Basal Ganglia | skill-basal-ganglia.md | Cached routines | 3-Subconscious |
| Default Mode | skill-default-mode.md | Background synthesis | 3-Subconscious |
| Anterior Cingulate | skill-anterior-cingulate.md | Conflict resolution | 4-Executive |
| Prefrontal Cortex | skill-prefrontal.md | CoT planning + re-planning | 4-Executive |
| Cerebellum | skill-cerebellum.md | Error correction + real-time feedback | 4-Executive |
| Motor Cortex | skill-motor-cortex.md | Execution + efference copy | 4-Executive |

## Key Design Decisions

1. **CLAUDE.md IS the Thalamus** — auto-discovered by Claude Code, no bash glue needed
2. **Sub-agents return text to parent** — Thalamus parses and writes to buffers (not sub-agents writing directly)
3. **Lock-free parallelism** — each agent writes to its own dedicated buffer file
4. **Graduated Amygdala** — modulates attention, doesn't halt cognition (neuroscientifically accurate)
5. **Feedback loops** — Motor -> Cerebellum -> Prefrontal (mirrors efference copy mechanism)
6. **Emotional memory tagging** — Amygdala tags all inputs; high-valence memories always consolidated
7. **Memory reconsolidation** — recalled memories are updated with new session context
8. **Sensory buffer** — ultra-short-term hold solves temporal binding for multi-modal input
