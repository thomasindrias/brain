# Test: Inline Sensory Buffer (Phase 0)

## Biological Basis
Sensory registers operate in <500ms — the fastest neural process.
No sub-agent should be dispatched for raw input capture.

## Input
User prompt: "add a search bar to the header"

## Expected Behavior
- Phase 0 runs INLINE (no sub-agent dispatched)
- Modalities detected: text (no image, no URL, no code fence)
- Input length: 33 characters
- No signal-sensory-buffer.md written to disk (unless Observer active)
- Variables passed directly to Phase 0.5

## Pass Criteria
- No sub-agent event logged for phase "0" in event-log.jsonl
- Phase 0.5 receives modality data without file I/O
- If Observer active: signal-sensory-buffer.md exists and passes schema validation
