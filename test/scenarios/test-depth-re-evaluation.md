# Test: Depth Re-Evaluation (Phase 1.25)

## Biological Basis
Depth of processing isn't fixed at stimulus onset — the brain continuously re-evaluates.

## Scenario A: Escalation (MEDIUM -> DEEP)
Input: "fix the button" (classified MEDIUM by Basal Ganglia)
Phase 1 returns: Language Center [INTENT]: AMBIGUOUS
Expected: Phase 1.25 escalates to DEEP
Result: Phase 1.5 triggers (Anterior Cingulate), Phase 4 runs, Phase 6 runs

## Scenario B: De-escalation (DEEP -> MEDIUM)
Input: "refactor the login page" (classified DEEP by keyword match)
Phase 1 returns: Language Center [INTENT]: fix, Hippocampus [MEMORY_STATE]: NULL, Amygdala [THREAT_LEVEL]: SAFE
Expected: Phase 1.25 de-escalates to MEDIUM
Result: Phase 1.5 skipped, Phase 4 skipped, Phase 6 skipped

## Pass Criteria
- Phase 1.25 event logged in event-log.jsonl
- Subsequent phases match re-classified depth, not original
