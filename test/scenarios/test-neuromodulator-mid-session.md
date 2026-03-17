# Test: Neuromodulator Mid-Session Update

## Biological Basis
Neuromodulators shift in milliseconds, not between sessions.

## Setup
Baseline state: Noradrenaline=LOW, Serotonin=HIGH, Dopamine=MEDIUM

## Scenario A: Positive feedback mid-session
User says: "perfect, that's exactly what I needed"
Expected: Reward System fires, transient Dopamine=HIGH set
Next turn: Phase 0.75 reads transient override (Dopamine=HIGH), not baseline
Baseline file on disk: UNCHANGED (still Dopamine=MEDIUM)

## Scenario B: Negative feedback
User says: "no, that's completely wrong"
Expected: Transient Dopamine=LOW + Acetylcholine=HIGH
Next turn processing: broader memory search (ACh HIGH), lower reward sensitivity

## Scenario C: Decay
Baseline state hasn't been updated in >24 hours
Serotonin=HIGH should decay to MEDIUM at Phase 0.75
Noradrenaline=LOW should NOT decay (LOW is its baseline)

## Pass Criteria
- Baseline state file untouched until Phase 6
- Transient overrides affect same-session processing
- Decay applied only to stale states
