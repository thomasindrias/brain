# Brain OS

A neuroscience-inspired cognitive architecture for Claude Code where every major brain function is a standalone markdown skill, orchestrated by `CLAUDE.md` (the Thalamus).

## How It Works

`CLAUDE.md` is auto-discovered by Claude Code on every session. It routes user prompts through a multi-phase signal processing pipeline modeled after the human brain:

```
User Prompt
    │
    ▼
[Sensory Buffer]              ← Phase 0: Raw input capture
    │
    ▼
[Basal Ganglia]               ← Phase 0.5: Cached routine shortcut
    │
    ▼
[Neuromodulators]             ← Phase 0.75: Read cognitive mode
    │
    ├──────────┼──────────┐
    ▼          ▼          ▼   ← Phase 1: Parallel dispatch
 Amygdala  Hippocampus  Language Center
    │          │          │
    ▼          ▼          ▼
 [buffers]  [buffers]  [buffers]  ← Lock-free writes
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
          Cerebellum ─FAIL───►┘  ← Phase 4: Validation
               │
             PASS
               │
               ▼
          Motor Cortex        ← Phase 5: Execution
               │
               ▼
          Hippocampus         ← Phase 6: Memory consolidation
```

## Architecture

### 4 Layers, 15 Brain Regions

| Layer | Skills | Purpose |
|-------|--------|---------|
| **1 — Chemical & Health** | Neuromodulators, Hypothalamus, Reward System | Dynamic hyperparameters, health monitoring, RLHF |
| **2 — Sensory Fusion** | Sensory Buffer, Language Center, Visual Cortex, Parietal-Insula | Input capture, intent parsing, multi-modal fusion |
| **3 — Subconscious** | Amygdala, Hippocampus, Basal Ganglia, Default Mode | Threat detection, memory RAG, cached routines, background synthesis |
| **4 — Executive & Motor** | Anterior Cingulate, Prefrontal, Cerebellum, Motor Cortex | Conflict resolution, planning, validation, execution |

### Key Design Decisions

- **CLAUDE.md IS the Thalamus** — auto-discovered, no glue scripts
- **Sub-agents return text** — Thalamus parses and writes to dedicated buffer files
- **Graduated Amygdala** — modulates attention instead of binary halt
- **Feedback loops** — Motor → Cerebellum → Prefrontal (efference copy mechanism)
- **Emotional memory tagging** — high-valence memories always consolidated
- **Memory reconsolidation** — recalled memories updated with new session context

### Memory System

```
/memory
├── /working-memory-cache      # Active session state
│   ├── /buffers               # Per-agent signal files (cleared after each response)
│   ├── integrated-context.md  # Merged buffer output
│   └── motor-plan.md          # Execution blueprint
└── /long-term                 # Persists across sessions
    ├── /episodic              # Session logs
    ├── /semantic              # Facts, preferences, user profile
    └── /procedural            # Solved patterns, code rules
```

## Testing

Run the schema validation harness:

```bash
bash test/harness.sh
```

Validates buffer outputs against expected schemas after a cognitive loop runs. See `test/scenarios/` for behavioral test specifications.

## Documentation

See [docs/architecture.md](docs/architecture.md) for the full signal flow diagram and design rationale.
