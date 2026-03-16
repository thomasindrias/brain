# Test: Full Cognitive Loop

## Input
User prompt: "Write a hello world function in Python"

## Expected Signal Flow
1. Thalamus receives prompt
2. Basal Ganglia check -> no cached routine -> proceed to full loop
3. Phase 1 (parallel): Amygdala (SAFE), Hippocampus (NULL or FOUND), Language Center (build intent)
4. Phase 2: Binding -> integrated-context.md populated
5. Phase 3: Prefrontal writes blueprint to motor-plan.md
6. Phase 4: Cerebellum validates -> PASS
7. Phase 5: Motor Cortex outputs Python hello world function
8. Phase 6: Hippocampus consolidates (if notable)

## Pass Criteria
- All buffer files created with valid schemas
- Motor plan contains blueprint (not code)
- Final output contains actual Python code
- No buffer files contain errors
