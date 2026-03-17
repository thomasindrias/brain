# Test: Hybrid Cerebellum (Phase 4)

## Biological Basis
Cerebellum's forward model runs continuously — not as a separate activation.

## Scenario A: Inline PASS
motor-plan.md: Simple, well-structured plan with no destructive actions
Expected: Inline checklist passes, [VALIDATION]: PASS written to signal-cerebellum.md
Result: No sub-agent dispatched, proceed to Phase 5

## Scenario B: Sub-agent FAIL
motor-plan.md: Plan references non-existent API, includes `rm -rf /`
Expected: Inline checklist catches destructive action or hallucination
Result: Full Cerebellum sub-agent dispatched with specific failing checks
Cerebellum returns [VALIDATION]: FAIL, routes back to Phase 3

## Pass Criteria
- Scenario A: No sub-agent event for phase "4", signal-cerebellum.md shows PASS
- Scenario B: Sub-agent event logged, signal-cerebellum.md shows FAIL with ERROR_INTERCEPT
