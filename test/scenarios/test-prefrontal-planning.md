# Test: Prefrontal Cortex Planning

## Input (integrated-context.md)
[THREAT_LEVEL]: SAFE
[INTENT]: build
[ENTITIES]: fibonacci, Python, function
[SEMANTIC_BINDING]: User prefers simple code, YAGNI
[MEMORY_STATE]: FOUND

## Expected Motor Plan Output
[PROBLEM_ANALYSIS]: Create a Python function that calculates fibonacci numbers
[CONSTRAINTS]: Keep it simple (YAGNI), Python language
[STEP_BY_STEP_BLUEPRINT]:
1. Define function signature with n parameter
2. Handle base cases (0 and 1)
3. Use iterative approach (simpler than recursive)
4. Return the nth fibonacci number
[EDGE_CASES]: Negative input, very large n
[CONFIDENCE]: HIGH

## Pass Criteria
- [CONFIDENCE] is HIGH or MEDIUM
- Blueprint has numbered steps
- Does NOT contain actual code (Prefrontal is THINKER not DOER)
