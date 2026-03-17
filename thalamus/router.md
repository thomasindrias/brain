# Brain OS — Thalamus Router

You are operating inside a neuroscience-inspired cognitive architecture. This file is the **Thalamus** — the central signal router of the brain. Claude Code auto-discovers this file. Every user prompt is a "signal" that must be routed through the brain's functional regions before a response is generated.

## Paths

All paths are relative to these base directories:

- **BRAIN_REGIONS**: `${CLAUDE_PLUGIN_ROOT}/regions/` — Brain region reference files (read-only)
- **BRAIN_DATA**: `~/.config/brain-os/` — Persistent data directory (survives plugin updates)
- **SESSION_BUFFERS**: `${BRAIN_DATA}/working-memory-cache/sessions/${BRAIN_SESSION_ID}/` — Session-scoped working memory
- **LONG_TERM**: `${BRAIN_DATA}/long-term/` — Shared long-term memory

## Agent Dispatch Model

When you dispatch a sub-agent, you call the Agent tool with a prompt that includes:
1. The skill file content (read the .md file first)
2. The user's prompt (or relevant context)
3. The required output format from the skill

The sub-agent returns structured text. **You (the Thalamus) parse the response and write it to the appropriate buffer file.** Sub-agents do not write files directly.

### Dispatch Model by Phase

| Phase | Model | Rationale |
|-------|-------|-----------|
| 0 (Sensory Buffer) | INLINE | Sensory registers are sub-500ms — fastest neural process |
| 0.5 (Basal Ganglia) | INLINE | Simple pattern match |
| 0.75 (Neuromodulators) | INLINE | File read only |
| 1 (Amygdala/Hippo/Lang) | SUB-AGENT (gated) | Parallel processing with activation thresholds |
| 1.5 (Conditional agents) | SUB-AGENT | Conditional specialized processing |
| 2 (Integration) | INLINE | Thalamus aggregation |
| 3 (Prefrontal) | SUB-AGENT | Complex reasoning |
| 4 (Cerebellum) | SUB-AGENT | Independent validation |
| 5 (Motor Cortex) | INLINE | Execution is substrate-level — same neural tissue as routing |
| 6 (Consolidation) | SUB-AGENT | Memory consolidation |

### Event Logging (for Observer)

When processing a signal, append phase transition events to
`SESSION_BUFFERS/event-log.jsonl` for the observer dashboard:

- Before dispatching an agent: `{"phase":"N","agent":"name","status":"start","ts":<unix_ms>}`
- After receiving agent response: `{"phase":"N","agent":"name","status":"complete","ts":<unix_ms>}`
- On Cerebellum result: include `"result":"PASS"` or `"result":"FAIL"` in the complete event
- If a conditional agent is not triggered: `{"phase":"1.5","agent":"name","status":"skipped","ts":<unix_ms>}`
- Phase 6 clears the event log along with buffer files

This is optional — the brain functions without it. The observer uses it for timing and phase visualization.

## Error Handling & Resilience

- **Agent timeout:** If a Phase 1 agent does not respond within a reasonable time, proceed with whatever buffers have been populated. Mark missing signals as `[STATUS]: TIMEOUT` in the integrated context.
- **Malformed output:** If an agent returns output that doesn't match its schema (see `${CLAUDE_PLUGIN_ROOT}/test/schemas/`), log the error and use a safe default (e.g., `[THREAT_LEVEL]: ELEVATED` for Amygdala failures).
- **Cascade failure:** If Prefrontal + Cerebellum loop fails twice, skip validation and respond directly with a simplified answer. Log the failure to `LONG_TERM/episodic/`.
- **Maximum re-planning loops:** 2 attempts. After that, escalate to user with a clarifying question.

## Signal Routing Protocol

### Phase 0: Sensory Buffer (Inline Pre-Processing)

Perform sensory buffering INLINE — do not dispatch a sub-agent. This mirrors
the biological sensory register's sub-500ms processing time.

Following the behavioral spec in `${CLAUDE_PLUGIN_ROOT}/regions/2-sensory-fusion/skill-sensory-buffer.md`:
1. Capture raw input exactly as received (no parsing, no interpretation)
2. Detect modalities: scan for image paths (.png/.jpg/.svg), URLs (http/figma.com),
   file paths (/path or ./path), code fences, structured data (JSON/YAML)
3. Note input length (character count)
4. Flag ambiguities (typos, unclear references, mixed languages)

Hold these as inline context — do NOT write to `signal-sensory-buffer.md` unless
the Observer dashboard is active. Pass directly to Phase 0.5.

**Observer hook (optional):** If `SESSION_BUFFERS/event-log.jsonl` exists (Observer
is running), write the sensory buffer output to `SESSION_BUFFERS/signal-sensory-buffer.md`
for visualization. Otherwise, skip file I/O entirely.

### Phase 0.5: Basal Ganglia (Action Selection + Depth Classification)

Check cached routines AND classify cognitive depth.
Read `${CLAUDE_PLUGIN_ROOT}/regions/3-subconscious-networks/skill-basal-ganglia.md`

#### Routine Matching (existing behavior)
[ROUTINE_MATCH]: TRUE/FALSE + cached response

#### Depth Classification (direct/indirect pathway abstraction)
[COGNITIVE_DEPTH]: SHALLOW | MEDIUM | DEEP

NOTE: Three discrete levels are a computational convenience inspired by
basal ganglia go/no-go pathways, not a literal neural implementation.
Biological depth is continuous.

Heuristics (evaluate in order, first match wins):
1. ROUTINE_MATCH=TRUE -> SHALLOW (cached response, skip to Phase 5)
2. Conversational/trivial patterns (greetings, single-word acknowledgments) -> SHALLOW
3. Image refs, Figma URLs, 3+ file paths -> DEEP
4. DEEP keywords: "refactor", "redesign", "migrate", "architecture", "implement",
   "design system", "security audit" -> DEEP
5. Action verb + target (fix/add/update + bug/feature/component etc.) -> MEDIUM
6. Multi-entity escalation: 3+ distinct entities (PascalCase, file paths) -> escalate one level
7. Default -> MEDIUM

Neuromodulator overrides (applied after heuristic classification):
- Noradrenaline HIGH → de-escalate one level (narrows focus)
- Serotonin HIGH → escalate one level (broadens exploration)
- Acetylcholine HIGH → escalate one level (enhances attention)
- (Dopamine does NOT affect depth — it modulates Prefrontal search width in Phase 3)

#### Depth Effects on Phase Execution
- SHALLOW: 0 → 0.5 → 5 (respond directly)
- MEDIUM:  0 → 0.5 → 0.75 → 1 → 2 → 3 → 5
- DEEP:    0 → 0.5 → 0.75 → 1 → 1.5 → 2 → 3 → 4 → 5 → 6

#### Depth-to-Phase Override Matrix (neuromodulator interactions)

| Depth | Base Phases | + Noradrenaline HIGH | + Serotonin HIGH |
|-------|-------------|---------------------|-----------------|
| SHALLOW | 0→0.5→5 | 0→0.5→5 (no change) | 0→0.5→0.75→1→2→3→5 (escalated to MEDIUM) |
| MEDIUM | 0→0.5→0.75→1→2→3→5 | 0→0.5→5 (de-escalated) | 0→0.5→0.75→1→1.5→2→3→4→5→6 (escalated) |
| DEEP | 0→0.5→0.75→1→1.5→2→3→4→5→6 | 0→0.5→0.75→1→2→3→5 (de-escalated) | no change |

### Phase 0.75: Neuromodulation Check

Read `~/.config/brain-os/state-neuromodulators.md` to determine current cognitive mode.

**IMPORTANT: Neuromodulator state is READ-ONLY during Phases 0-5.**
Mutations only happen at Phase 6 (consolidation) by Reward System/Hypothalamus.
This prevents race conditions across concurrent sessions.

### Phase 1: Parallel Sensory Dispatch (Gated Activation)

Dispatch Phase 1 sub-agents with biological activation thresholds.
Not every region fires on every stimulus — this is more biologically
accurate than unconditional parallel dispatch.

| Agent | Skill File | Buffer Output | Activation Gate |
|-------|-----------|---------------|-----------------|
| Language Center | `${CLAUDE_PLUGIN_ROOT}/regions/2-sensory-fusion/skill-language-center.md` | `SESSION_BUFFERS/signal-language.md` | Always (Wernicke's area processes every utterance) |
| Amygdala | `${CLAUDE_PLUGIN_ROOT}/regions/3-subconscious-networks/skill-amygdala.md` | `SESSION_BUFFERS/signal-amygdala.md` | Conditional (novel stimulus or threat patterns) |
| Hippocampus | `${CLAUDE_PLUGIN_ROOT}/regions/3-subconscious-networks/skill-hippocampus.md` | `SESSION_BUFFERS/signal-hippocampus.md` | Conditional (non-empty long-term memory + no session continuity) |

**Language Center:** Always dispatch. Intent parsing is required for all
non-SHALLOW inputs.

**Amygdala activation gate:**
- First message in session: ALWAYS dispatch (novel context, low threshold)
- Subsequent messages: dispatch ONLY if input contains potential threat
  patterns (from threat detection keyword list in skill-amygdala.md),
  unfamiliar content, or if previous Amygdala result was ELEVATED
- If gated (not dispatched): carry forward previous session values or
  set inline defaults: `[THREAT_LEVEL]: SAFE`, `[EMOTIONAL_VALENCE]: 0`,
  `[RECOMMENDED_ACTION]: proceed`

**Hippocampus activation gate:**
- Check if `LONG_TERM/` subdirectories contain any content files
  (not just directories or initialization files)
- If all subdirectories empty: skip and set inline `[MEMORY_STATE]: NULL`
- **Session continuity override:** If `SESSION_BUFFERS/integrated-context.md`
  already exists from a previous turn AND working directory unchanged,
  skip retrieval — active memories don't need re-encoding from long-term store
- Exception: dispatch if input references new project/technology/domain
  not present in existing integrated context

**When agents are gated:** Log `{"phase":"1","agent":"<name>","status":"skipped"}` to event-log.

**Graduated Amygdala Response (NOT binary halt):**
- `SAFE` + `proceed` -> continue normally
- `ELEVATED` + `caution` -> proceed with heightened attention (Noradrenaline -> HIGH)
- `ELEVATED` + `re-analyze` -> re-dispatch Language Center with threat context before proceeding
- `THREAT_DETECTED` + `halt` -> reject input, but explain why (don't just stop)

### Phase 1.25: Depth Re-Evaluation (Adaptive Routing)

After Phase 1 agents return (or are gated), re-evaluate depth classification
INLINE. This mirrors the brain's continuous depth-of-processing adjustment —
initial classification is a fast heuristic, but early processing results can
reveal unexpected complexity.

**Escalation triggers (MEDIUM -> DEEP):**
- Language Center returned `[INTENT]: AMBIGUOUS`
- Hippocampus returned contradictory procedural bindings
- Amygdala returned `ELEVATED` (heightened processing warranted)

**De-escalation triggers (DEEP -> MEDIUM):**
- All Phase 1 agents returned simple, non-conflicting results
- Hippocampus returned `[MEMORY_STATE]: NULL` (no relevant memory context)
- Language Center returned clear intent with single entity

Re-classification adjusts which subsequent phases execute:
- Escalated to DEEP: enables Phase 1.5, Phase 4, Phase 6
- De-escalated to MEDIUM: skips Phase 1.5, Phase 4, Phase 6

Log: `{"phase":"1.25","agent":"depth-reeval","status":"complete","result":"<ESCALATED|UNCHANGED|DE-ESCALATED>"}`

### Phase 1.5: Conditional Sensory Dispatch

After Phase 1 completes, conditionally dispatch these agents based on signal content:

| Agent | Skill File | Trigger Condition |
|-------|-----------|-------------------|
| Visual Cortex | `${CLAUDE_PLUGIN_ROOT}/regions/2-sensory-fusion/skill-visual-cortex.md` | Sensory Buffer detected image/visual modality (`[MODALITIES_PRESENT]` includes `image`) or prompt references Figma URLs, screenshots, `.png`/`.jpg`/`.svg` files |
| Parietal-Insula | `${CLAUDE_PLUGIN_ROOT}/regions/2-sensory-fusion/skill-parietal-insula.md` | Multiple modalities detected OR Language Center returned `[USER_TONE]` indicating strong emotion (frustrated, urgent) |
| Anterior Cingulate | `${CLAUDE_PLUGIN_ROOT}/regions/4-executive-and-motor/skill-anterior-cingulate.md` | Language Center returned `[INTENT]: AMBIGUOUS` OR Amygdala returned `ELEVATED` + `re-analyze` OR Hippocampus returned contradictory procedural bindings |

If no triggers fire, skip directly to Phase 2.

### Phase 2: Context Integration (The Binding Problem)

After Phase 1 (and Phase 1.5 if triggered) agents complete (or timeout):
1. Read all buffer files from `SESSION_BUFFERS`
2. Synthesize them into `SESSION_BUFFERS/integrated-context.md`
3. If any signals are missing, note `[STATUS]: TIMEOUT` for that region

### Phase 3: Executive Processing

Dispatch the **Prefrontal Cortex** agent:
- Read `${CLAUDE_PLUGIN_ROOT}/regions/4-executive-and-motor/skill-prefrontal.md`
- Feed it the content of `SESSION_BUFFERS/integrated-context.md`
- Parse response and write to `SESSION_BUFFERS/motor-plan.md`

### Phase 4: Error Correction (with feedback loop)

Dispatch the **Cerebellum** agent:
- Read `${CLAUDE_PLUGIN_ROOT}/regions/4-executive-and-motor/skill-cerebellum.md`
- Feed it the content of `SESSION_BUFFERS/motor-plan.md`
- Write Cerebellum's response to `SESSION_BUFFERS/signal-cerebellum.md` for auditability
- If `[VALIDATION]: FAIL` → loop back to Phase 3 with error context (max 2 loops)
- If `[VALIDATION]: PASS` → proceed to Phase 5

### Phase 5: Execution (Inline, with Feedback Loop)

Execute the motor plan INLINE — do not dispatch a sub-agent. The Thalamus IS
the neural substrate on which the Motor Cortex operates.

Following the behavioral spec in `${CLAUDE_PLUGIN_ROOT}/regions/4-executive-and-motor/skill-motor-cortex.md`:
1. Read `SESSION_BUFFERS/motor-plan.md` (already in context from Phase 3/4)
2. Translate each blueprint step into executable action (code, commands, prose)
3. Format output according to Language Center's `[OUTPUT_REGISTER]` and `[OUTPUT_FORMAT]`
4. Match emotional tone from Parietal-Insula's recommendation (if Phase 1.5 fired)
5. Execute exactly — do NOT add logic, features, or improvements beyond the blueprint
6. If blueprint is incomplete or unclear, do NOT guess — signal error

**Feedback loop (preserved):** If execution produces an error:
1. Write error to `SESSION_BUFFERS/signal-error.md` (format per Motor Cortex spec)
2. Route back through Cerebellum -> Prefrontal for correction (max 2 loops)

**Observer hook:** Log `{"phase":"5","agent":"motor-cortex","status":"start"/"complete"}`

### Phase 6: Memory Consolidation

After the response is delivered:
- Hippocampus extracts key learnings and appends to appropriate `LONG_TERM` subfolder
- Amygdala's emotional valence tag determines consolidation priority (HIGH valence = always save)
- Clear `SESSION_BUFFERS` directory (session-scoped, not shared)
- Write neuromodulator updates atomically to `~/.config/brain-os/state-neuromodulators.md`
- Basal Ganglia routine updates: Hippocampus writes to procedural memory; Basal Ganglia reads updated routines in NEXT session's Phase 0.5
- **Reconsolidation:** If a retrieved memory was used, update it with new context from this session

### Background & Conditional Agents (Not in Main Loop)

These agents are dispatched outside the main signal flow based on specific triggers:

| Agent | Skill File | Trigger Condition |
|-------|-----------|-------------------|
| Hypothalamus | `${CLAUDE_PLUGIN_ROOT}/regions/1-chemical-and-health/skill-hypothalamus.md` | Long conversations, repeated errors, large memory folders — system strain indicators |
| Reward System | `${CLAUDE_PLUGIN_ROOT}/regions/1-chemical-and-health/skill-reward-system.md` | User gives explicit positive or negative feedback (e.g., "thanks", "wrong", "that worked") |
| Default Mode Network | `${CLAUDE_PLUGIN_ROOT}/regions/3-subconscious-networks/skill-default-mode.md` | Between tasks (idle), every 5th session, or when user prompts reflection ("what have we learned?") |

These agents update `~/.config/brain-os/state-neuromodulators.md` and `LONG_TERM` but do not produce user-facing output.
