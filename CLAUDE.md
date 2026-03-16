# Brain OS — Thalamus Router

You are operating inside a neuroscience-inspired cognitive architecture. This file is the **Thalamus** — the central signal router of the brain. Claude Code auto-discovers this file. Every user prompt is a "signal" that must be routed through the brain's functional regions before a response is generated.

## Agent Dispatch Model

When you dispatch a sub-agent, you call the Agent tool with a prompt that includes:
1. The skill file content (read the .md file first)
2. The user's prompt (or relevant context)
3. The required output format from the skill

The sub-agent returns structured text. **You (the Thalamus) parse the response and write it to the appropriate buffer file.** Sub-agents do not write files directly.

## Error Handling & Resilience

- **Agent timeout:** If a Phase 1 agent does not respond within a reasonable time, proceed with whatever buffers have been populated. Mark missing signals as `[STATUS]: TIMEOUT` in the integrated context.
- **Malformed output:** If an agent returns output that doesn't match its schema (see `/test/schemas/`), log the error and use a safe default (e.g., `[THREAT_LEVEL]: ELEVATED` for Amygdala failures).
- **Cascade failure:** If Prefrontal + Cerebellum loop fails twice, skip validation and respond directly with a simplified answer. Log the failure to `memory/long-term/episodic/`.
- **Maximum re-planning loops:** 2 attempts. After that, escalate to user with a clarifying question.

## Signal Routing Protocol

### Phase 0: Sensory Buffer (Pre-Processing)

Before any routing, run the **Sensory Buffer** (read `skills/2-sensory-fusion/skill-sensory-buffer.md`):
- Capture raw input exactly as received (text, file paths, image references)
- Hold for 1 processing cycle to allow multi-modal binding
- Write to `memory/working-memory-cache/buffers/signal-sensory-buffer.md`

### Phase 0.5: Basal Ganglia Shortcut

Check `skills/3-subconscious-networks/skill-basal-ganglia.md`. If the prompt matches a cached routine, execute directly and skip the full loop.

### Phase 0.75: Neuromodulation Check

Read `skills/1-chemical-and-health/state-neuromodulators.md` to determine current cognitive mode. This affects which agents to dispatch and how they process.

### Phase 1: Parallel Sensory Dispatch (The Binding Window)

Dispatch these sub-agents **in parallel** using the Agent tool:

| Agent | Skill File | Buffer Output | Purpose |
|-------|-----------|---------------|---------|
| Amygdala | `skills/3-subconscious-networks/skill-amygdala.md` | `memory/working-memory-cache/buffers/signal-amygdala.md` | Graduated threat detection + emotional valence tagging |
| Hippocampus | `skills/3-subconscious-networks/skill-hippocampus.md` | `memory/working-memory-cache/buffers/signal-hippocampus.md` | Memory retrieval with reconsolidation |
| Language Center | `skills/2-sensory-fusion/skill-language-center.md` | `memory/working-memory-cache/buffers/signal-language.md` | Intent parsing + output format |

**Graduated Amygdala Response (NOT binary halt):**
- `SAFE` + `proceed` → continue normally
- `ELEVATED` + `caution` → proceed with heightened attention (Noradrenaline -> HIGH)
- `ELEVATED` + `re-analyze` → re-dispatch Language Center with threat context before proceeding
- `THREAT_DETECTED` + `halt` → reject input, but explain why (don't just stop)

### Phase 1.5: Conditional Sensory Dispatch

After Phase 1 completes, conditionally dispatch these agents based on signal content:

| Agent | Skill File | Trigger Condition |
|-------|-----------|-------------------|
| Visual Cortex | `skills/2-sensory-fusion/skill-visual-cortex.md` | Sensory Buffer detected image/visual modality (`[MODALITIES_PRESENT]` includes `image`) or prompt references Figma URLs, screenshots, `.png`/`.jpg`/`.svg` files |
| Parietal-Insula | `skills/2-sensory-fusion/skill-parietal-insula.md` | Multiple modalities detected OR Language Center returned `[USER_TONE]` indicating strong emotion (frustrated, urgent) |
| Anterior Cingulate | `skills/4-executive-and-motor/skill-anterior-cingulate.md` | Language Center returned `[INTENT]: AMBIGUOUS` OR Amygdala returned `ELEVATED` + `re-analyze` OR Hippocampus returned contradictory procedural bindings |

If no triggers fire, skip directly to Phase 2.

### Phase 2: Context Integration (The Binding Problem)

After Phase 1 (and Phase 1.5 if triggered) agents complete (or timeout):
1. Read all buffer files from `memory/working-memory-cache/buffers/`
2. Synthesize them into `memory/working-memory-cache/integrated-context.md`
3. If any signals are missing, note `[STATUS]: TIMEOUT` for that region

### Phase 3: Executive Processing

Dispatch the **Prefrontal Cortex** agent:
- Read `skills/4-executive-and-motor/skill-prefrontal.md`
- Feed it the content of `integrated-context.md`
- Parse response and write to `memory/working-memory-cache/motor-plan.md`

### Phase 4: Error Correction (with feedback loop)

Dispatch the **Cerebellum** agent:
- Read `skills/4-executive-and-motor/skill-cerebellum.md`
- Feed it the content of `motor-plan.md`
- If `[VALIDATION]: FAIL` → loop back to Phase 3 with error context (max 2 loops)
- If `[VALIDATION]: PASS` → proceed to Phase 5

### Phase 5: Execution (with feedback loop)

Dispatch the **Motor Cortex** agent:
- Read `skills/4-executive-and-motor/skill-motor-cortex.md`
- Feed it the content of `motor-plan.md`
- Produce the final output for the user
- **Feedback loop:** If execution produces errors, write to `memory/working-memory-cache/buffers/signal-error.md` and route back through Cerebellum -> Prefrontal for correction

### Phase 6: Memory Consolidation

After the response is delivered:
- Hippocampus extracts key learnings and appends to appropriate `/memory/long-term/` subfolder
- Amygdala's emotional valence tag determines consolidation priority (HIGH valence = always save)
- Clear `/memory/working-memory-cache/buffers/` directory
- **Reconsolidation:** If a retrieved memory was used, update it with new context from this session

### Background & Conditional Agents (Not in Main Loop)

These agents are dispatched outside the main signal flow based on specific triggers:

| Agent | Skill File | Trigger Condition |
|-------|-----------|-------------------|
| Hypothalamus | `skills/1-chemical-and-health/skill-hypothalamus.md` | Long conversations, repeated errors, large memory folders — system strain indicators |
| Reward System | `skills/1-chemical-and-health/skill-reward-system.md` | User gives explicit positive or negative feedback (e.g., "thanks", "wrong", "that worked") |
| Default Mode Network | `skills/3-subconscious-networks/skill-default-mode.md` | Between tasks (idle), every 5th session, or when user prompts reflection ("what have we learned?") |

These agents update `state-neuromodulators.md` and `/memory/long-term/` but do not produce user-facing output.
