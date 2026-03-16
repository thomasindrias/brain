# Test: Feedback Loop (Motor -> Cerebellum -> Prefrontal)

## Input
Motor Cortex encounters an execution error (e.g., syntax error in generated code)

## Expected Signal Flow
1. Motor Cortex writes error to `buffers/signal-error.md`
2. Thalamus detects error signal
3. Cerebellum re-evaluates with error context
4. Prefrontal re-plans with error feedback
5. Motor Cortex re-executes corrected plan

## Pass Criteria
- `signal-error.md` is created
- Prefrontal receives error context in re-planning
- Maximum 2 re-planning loops before user escalation
