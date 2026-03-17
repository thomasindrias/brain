# Test: MEDIUM Depth Optimized Routing (End-to-End)

## Setup
- Fresh install (empty long-term memory)
- Second message in session (not first)
- No threat patterns in input
- Neuromodulators at baseline

## Input
"add a loading spinner to the dashboard"

## Expected Phase Execution
0 (inline) → 0.5 (inline, MEDIUM) → 0.75 (inline) → 1 (Language Center ONLY, Amygdala+Hippocampus gated) → 1.25 (inline, no change) → 2 (inline) → 3 (Prefrontal sub-agent) → 5 (inline)

## Expected Sub-Agent Count: 2
1. Language Center (Phase 1)
2. Prefrontal Cortex (Phase 3)

## Pass Criteria
- Total sub-agent dispatches = 2 (was 5 in v1)
- Phases 1.5, 4, 6 NOT executed (MEDIUM depth)
- signal-amygdala.md has inline defaults (not sub-agent output)
- signal-hippocampus.md has inline [MEMORY_STATE]: NULL
