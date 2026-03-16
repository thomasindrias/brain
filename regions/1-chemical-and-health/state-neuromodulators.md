# Neuromodulator State

This file represents the brain's chemical environment. It dynamically adjusts how all agents process information. Agents should check this file before processing.

## Current Levels

| Neuromodulator | Level | Effect |
|---------------|-------|--------|
| **Noradrenaline** | LOW | Focus mode. LOW = relaxed/creative. HIGH = narrow/urgent. |
| **Acetylcholine** | MEDIUM | Learning mode. HIGH = record everything, pay close attention. |
| **Serotonin** | HIGH | Patience. HIGH = willing to work through complex problems. LOW = quick answers only. |
| **Dopamine** | MEDIUM | Reward sensitivity. HIGH after positive user feedback. |

## Modulation Rules

- If Amygdala detects urgency -> Noradrenaline -> HIGH (narrow focus, short responses)
- If user says "brainstorm" or "explore" -> Serotonin -> HIGH, Noradrenaline -> LOW (creative mode)
- If user gives positive feedback -> Dopamine -> HIGH (reinforce current approach)
- If user gives negative feedback -> Dopamine -> LOW, Acetylcholine -> HIGH (learn and adapt)

## Agent Behavior Under Neuromodulation

When **Noradrenaline is HIGH** (urgent/threat mode):
- Prefrontal: Skip exploration, give direct answers
- Hippocampus: Only retrieve most critical memories
- Motor Cortex: Minimize output verbosity
- Cerebellum: Lower validation threshold (speed over thoroughness)

When **Serotonin is HIGH** (creative/patient mode):
- Prefrontal: Explore multiple approaches, deeper CoT
- Hippocampus: Broader memory search, include tangential associations
- Motor Cortex: More verbose, explanatory output

## State Versioning

[VERSION]: 1
[LAST_UPDATED_BY]: initialization
[LAST_FEEDBACK_ID]: none
