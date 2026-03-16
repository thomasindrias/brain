# Brain OS

A neuroscience-inspired cognitive architecture for Claude Code. Every major brain function is a standalone markdown region, orchestrated by the Thalamus router and injected via a SessionStart hook — giving you a personal cognitive layer across all projects.

## How It Works

Install as a Claude Code plugin. On every session start, the thalamus routing protocol is injected as context. It routes user prompts through a multi-phase signal processing pipeline modeled after the human brain:

```
User Prompt
    │
    ▼
[Sensory Buffer]              ← Phase 0: Raw input capture
    │
    ▼
[Basal Ganglia]               ← Phase 0.5: Depth classification + cached routines
    │                           SHALLOW → skip to Phase 5
    │                           MEDIUM  → Phases 0-3, 5
    │                           DEEP    → Full loop (0-6)
    ▼
[Neuromodulators]             ← Phase 0.75: Read cognitive mode (READ-ONLY)
    │
    ├──────────┼──────────┐
    ▼          ▼          ▼   ← Phase 1: Parallel dispatch
 Amygdala  Hippocampus  Language Center
    │          │          │
    └──────────┼──────────┘
               ▼
    integrated-context.md     ← Phase 2: Binding
               │
               ▼
    Prefrontal Cortex         ← Phase 3: Planning (CoT)
               │              ▲
               ▼              │ (feedback)
          motor-plan.md       │
               │              │
               ▼              │
          Cerebellum ─FAIL───►┘  ← Phase 4: Validation (DEEP only)
               │
             PASS
               │
               ▼
          Motor Cortex        ← Phase 5: Execution
               │
               ▼
          Hippocampus         ← Phase 6: Memory consolidation (DEEP only)
```

## Installation

```bash
claude plugin add /path/to/brain-os
```

Or clone and link:

```bash
git clone <repo-url> ~/.claude/plugins/brain-os
```

### Migrating from Repo Layout

If you were using Brain OS as a project-level `CLAUDE.md` with the `memory/` directory:

```bash
bash scripts/migrate-from-repo.sh /path/to/old/repo
```

This copies your long-term memories and neuromodulator state to `~/.config/brain-os/`.

## Architecture

### 4 Layers, 15 Brain Regions

| Layer | Regions | Purpose |
|-------|---------|---------|
| **1 — Chemical & Health** | Neuromodulators, Hypothalamus, Reward System | Dynamic hyperparameters, health monitoring, reinforcement learning |
| **2 — Sensory Fusion** | Sensory Buffer, Language Center, Visual Cortex, Parietal-Insula | Input capture, intent parsing, multi-modal fusion |
| **3 — Subconscious** | Amygdala, Hippocampus, Basal Ganglia, Default Mode | Threat detection, memory RAG, cached routines, background synthesis |
| **4 — Executive & Motor** | Anterior Cingulate, Prefrontal, Cerebellum, Motor Cortex | Conflict resolution, planning, validation, execution |

### Adaptive Depth

The Basal Ganglia classifies every prompt into one of three depth levels, determining which phases execute:

| Depth | Phases | Example |
|-------|--------|---------|
| SHALLOW | 0 → 0.5 → 5 | "hello", "thanks" |
| MEDIUM | 0 → 0.5 → 0.75 → 1 → 2 → 3 → 5 | "fix the bug in auth.ts" |
| DEEP | 0 → 0.5 → 0.75 → 1 → 1.5 → 2 → 3 → 4 → 5 → 6 | "refactor the auth system to OAuth2" |

Neuromodulators can override depth: Noradrenaline HIGH de-escalates, Serotonin/Acetylcholine HIGH escalate.

### Key Design Decisions

- **Plugin-based injection** — Thalamus router injected via SessionStart hook, works across all projects
- **Region files are internal** — placed in `regions/` (not `skills/`) to prevent Claude Code auto-discovery
- **Session-scoped working memory** — each session gets isolated buffers via `BRAIN_SESSION_ID`
- **Persistent data in `~/.config/brain-os/`** — survives plugin updates (outside plugin cache)
- **Cross-project memory** — episodic entries tagged with `[PROJECT]` for context-dependent retrieval
- **Neuromodulator immutability** — state is read-only during Phases 0-5, mutations only at Phase 6
- **Graduated Amygdala** — modulates attention instead of binary halt
- **Feedback loops** — Motor → Cerebellum → Prefrontal (efference copy mechanism)

### Data Directory

Persistent data lives at `~/.config/brain-os/` (created on first session):

```
~/.config/brain-os/
├── VERSION
├── state-neuromodulators.md          # Mutable cognitive mode
├── working-memory-cache/
│   └── sessions/                     # Session-scoped buffers
│       └── <session-id>/
│           ├── signal-sensory-buffer.md
│           ├── signal-amygdala.md
│           ├── signal-hippocampus.md
│           ├── signal-language.md
│           ├── signal-cerebellum.md
│           ├── integrated-context.md
│           ├── motor-plan.md
│           └── event-log.jsonl
└── long-term/                        # Shared across sessions
    ├── episodic/                     # Session logs with [PROJECT] tags
    ├── semantic/                     # User profile, facts, preferences
    └── procedural/                   # Solved patterns, code rules
```

## Observer Dashboard

Real-time visualization of the cognitive loop:

```bash
/brain-observer
```

Shows phase transitions, buffer contents, and neuromodulator levels via a React Flow graph with WebSocket updates.

## Testing

```bash
# All tests
bash test/hooks/test-session-start-output.sh
bash test/hooks/test-data-dir-init.sh
bash test/hooks/test-json-escape.sh
bash test/depth/test-depth-heuristics.sh
bash test/harness.sh

# Observer tests
cd observer && npx vitest run
```

## Project Structure

```
brain-os/
├── .claude-plugin/plugin.json        # Plugin manifest
├── hooks/                            # SessionStart hook
├── thalamus/router.md                # Core routing protocol
├── regions/                          # 15 brain region files
│   ├── 1-chemical-and-health/
│   ├── 2-sensory-fusion/
│   ├── 3-subconscious-networks/
│   └── 4-executive-and-motor/
├── commands/brain-observer.md        # /brain-observer slash command
├── observer/                         # React Flow dashboard
├── scripts/migrate-from-repo.sh      # Migration from repo layout
└── test/                             # Schema validators and tests
```

## License

MIT
