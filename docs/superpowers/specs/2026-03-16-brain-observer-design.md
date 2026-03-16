# Brain OS Observer Dashboard — Design Spec

## Goal

A local web dashboard that visualizes the Brain OS cognitive loop in real-time using a React Flow node graph. Shows which phases are executing, what each agent produced, signal flow between phases, neuromodulator state, and feedback loops.

## Architecture

```
┌─────────────────────────────────────────┐
│  Claude Code session (runs Brain OS)    │
│  - Thalamus writes buffer files         │
│  - Thalamus appends to event-log.jsonl  │
└────────────────┬────────────────────────┘
                 │ filesystem
┌────────────────▼────────────────────────┐
│  Observer Server (Node.js + Express)    │
│  - chokidar watches working-memory/    │
│  - Tails event-log.jsonl                │
│  - Parses markdown buffers → JSON       │
│  - WebSocket pushes to browser          │
│  - Snapshots loops before Phase 6 clear │
│  - Recovers state from existing files   │
└────────────────┬────────────────────────┘
                 │ WebSocket (ws)
┌────────────────▼────────────────────────┐
│  Browser (Vite + React + Tailwind)      │
│  - React Flow vertical DAG canvas       │
│  - Custom nodes per brain region        │
│  - Animated edges for signal flow       │
│  - Slide-out drawer for buffer inspect  │
│  - Neuromodulator strip                 │
│  - Background agent status panel        │
│  - Session history (last 10 loops)      │
└─────────────────────────────────────────┘
```

## Data Flow

### Hybrid Approach (File Watcher + Event Log)

**1. File Watcher (buffer contents):**
The observer server uses chokidar to watch `memory/working-memory-cache/` for file changes. When a buffer file is written or modified, the server parses the markdown key-value format into structured JSON and pushes it to connected browsers via WebSocket.

- Watch path: `memory/working-memory-cache/` (recursive)
- Debounce: 100ms per file to handle partial writes
- Parse: Two parse modes:
  - **Key-value mode** (buffer files): Extract `[FIELD]: value` pairs into `Record<string, string>`. Multi-line values (e.g., `[STEP_BY_STEP_BLUEPRINT]` with numbered lists) are captured by reading all lines until the next `[FIELD]:` marker or end of file.
  - **Table mode** (state-neuromodulators.md): Parse markdown table rows into `Record<string, string>` (column headers as keys).

**2. Event Log (phase transitions):**
Small addition to CLAUDE.md — the Thalamus appends phase transition events to `memory/working-memory-cache/buffers/event-log.jsonl`. This provides timing data and phase state that can't be inferred from file changes alone.

Event log format (timestamps in Unix milliseconds):
```jsonl
{"phase":"0","agent":"sensory-buffer","status":"start","ts":1710590400000}
{"phase":"0","agent":"sensory-buffer","status":"complete","ts":1710590400120}
{"phase":"0.5","agent":"basal-ganglia","status":"start","ts":1710590400150}
{"phase":"0.5","agent":"basal-ganglia","status":"complete","result":"no-match","ts":1710590400200}
{"phase":"1","agent":"amygdala","status":"start","ts":1710590401000}
{"phase":"1","agent":"hippocampus","status":"start","ts":1710590401000}
{"phase":"1","agent":"language-center","status":"start","ts":1710590401000}
{"phase":"1","agent":"amygdala","status":"complete","ts":1710590403000}
{"phase":"1","agent":"hippocampus","status":"complete","ts":1710590404000}
{"phase":"1","agent":"language-center","status":"complete","ts":1710590404500}
{"phase":"1.5","agent":"visual-cortex","status":"skipped","ts":1710590404600}
{"phase":"2","agent":"integration","status":"start","ts":1710590405000}
{"phase":"2","agent":"integration","status":"complete","ts":1710590405080}
{"phase":"3","agent":"prefrontal","status":"start","ts":1710590406000}
{"phase":"3","agent":"prefrontal","status":"complete","ts":1710590414000}
{"phase":"4","agent":"cerebellum","status":"start","ts":1710590415000}
{"phase":"4","agent":"cerebellum","status":"complete","result":"PASS","ts":1710590420000}
{"phase":"5","agent":"motor-cortex","status":"start","ts":1710590421000}
{"phase":"5","agent":"motor-cortex","status":"complete","ts":1710590430000}
{"phase":"6","agent":"hippocampus","status":"consolidation","ts":1710590431000}
```

**Special event types:**
- `"result":"no-match"` — Basal Ganglia found no cached routine (proceed to full loop)
- `"result":"match"` — Basal Ganglia shortcutted (skip remaining phases)
- `"result":"PASS"` / `"result":"FAIL"` — Cerebellum validation outcome
- `"status":"skipped"` — Conditional agent was not triggered

**3. State Resolution:**
- Event log is the source of truth for phase transitions
- Buffer file contents are supplementary data (what the agent produced)
- If a buffer file appears without a corresponding event, show the data but don't advance phase state
- If an event appears before its buffer file, show the node as active/complete but with "loading buffer..." in the drawer

### Resilience

**Server crash recovery:** On startup, read all existing buffer files and the event log to reconstruct current state. The UI immediately shows whatever state exists on disk.

**Harness noise filter:** File changes without corresponding event log entries don't trigger phase transitions. Buffer content updates are still shown (useful for debugging).

**Debounce:** 100ms debounce per file path on chokidar events. Only emit to WebSocket after file is stable.

**Auto-reconnect:** WebSocket client reconnects automatically with exponential backoff (1s, 2s, 4s, max 10s).

**Interrupted loop snapshot:** If a new Phase 0 event arrives without Phase 6 completing (user interrupted, crash), the server snapshots whatever state exists from the incomplete loop before resetting for the new loop. This prevents losing debugging data from failed/interrupted runs.

## UI Components

### 1. React Flow Canvas (BrainFlow)

Vertical DAG layout. Signal flows top to bottom.

**Node layout:**
```
                    [Sensory Buffer]           ← Phase 0
                          |
                    [Basal Ganglia]            ← Phase 0.5 (shortcut check)
                          |
              ┌───────────┼───────────┐
              v           v           v        ← Phase 1 (parallel)
         [Amygdala]  [Hippocampus]  [Language]
              |           |           |
              |     (Visual) (Parietal) (ACC)  ← Phase 1.5 (conditional, dashed)
              |           |           |
              └───────────┼───────────┘
                          v
                    [Integration]              ← Phase 2
                          |
                    ┌─────v─────┐
                    |           |
                    v           | (Cerebellum → Prefrontal feedback, red dashed)
              [Prefrontal] <────┘              ← Phase 3
                    |
                    v
              [Cerebellum]                     ← Phase 4
                    |
                    v
              [Motor Cortex]                   ← Phase 5
                    |
                    v
              [Consolidation]                  ← Phase 6
```

**Phase 0.5 (Basal Ganglia):**
If `result: "match"`, all downstream nodes dim out and the flow short-circuits. The matched routine response is shown in the Basal Ganglia node. If `result: "no-match"`, the node completes and flow continues normally.

**Feedback loops (two separate loops):**
1. **Cerebellum → Prefrontal** (Phase 4 → Phase 3): Red dashed edge. Appears when `[VALIDATION]: FAIL`. Shows re-plan count (e.g., "1/2"). After max 2 loops, shows "escalated to user."
2. **Motor Cortex → Cerebellum → Prefrontal** (Phase 5 → Phase 4 → Phase 3): Red dashed edge from Motor Cortex back through Cerebellum. Appears when Motor Cortex writes `signal-error.md`.

**Conditional nodes (Phase 1.5):**
Visual Cortex, Parietal-Insula, and Anterior Cingulate are shown as dashed-border nodes branching off from between Phase 1 and Phase 2. They remain dim/dashed by default. When triggered, they solidify and animate. If Phase 1.5 is skipped entirely (event log shows `"status":"skipped"`), they stay dashed and dim.

**Conditional node buffer files:**

| Agent | Buffer File | Key Fields |
|-------|------------|------------|
| Visual Cortex | `signal-visual-cortex.md` | `[VISUAL_TYPE]`, `[CONTENT_SUMMARY]`, `[ACTIONABLE_DATA]` |
| Parietal-Insula | `signal-parietal-insula.md` | `[FUSED_CONTEXT]`, `[USER_EMOTIONAL_STATE]`, `[RECOMMENDED_TONE]` |
| Anterior Cingulate | `signal-anterior-cingulate.md` | `[CONFLICT_TYPE]`, `[RESOLUTION]`, `[ESCALATE_TO_USER]` |

**Node states:**
| State | Visual |
|-------|--------|
| Pending | Gray border (#27272a), dim text |
| Active | Yellow border (#eab308), pulsing glow animation |
| Complete | Green border (#22c55e), subtle glow |
| Error | Red border (#ef4444) |
| Conditional (inactive) | Dashed gray border, 35% opacity |
| Conditional (active) | Same as Active/Complete above |

**Edge animations:**
- Completed edges: solid green line with animated dot flowing along the path
- Active edges: yellow line
- Pending edges: gray dashed
- Feedback loop (Cerebellum → Prefrontal): red dashed line, appears only when `[VALIDATION]: FAIL`

### 2. Custom Node (BrainNode)

Each node shows:
- Phase number label (small, top-left)
- Region name (bold, center)
- Status badge pill (e.g., "SAFE", "FOUND", "explore") — color-coded
- Timing info (e.g., "2.1s") when completed

Nodes are clickable — clicking opens the BufferDrawer with that node's buffer contents.

### 3. Buffer Drawer (BufferDrawer)

Slide-out panel from the right side. Shows when a node is clicked.

Contents:
- Header: region name + phase + status badge
- Body: parsed buffer fields as key-value rows (monospace values)
- Each field shows: field name (label), value (content), validation status (pass/fail icon based on schema)
- Close button (X) + clicking another node switches content
- Clicking outside or pressing Escape closes

### 4. Neuromodulator Strip (NeuroStrip)

Always-visible horizontal bar below the top bar. Shows four neuromodulators:
- Name abbreviation (NOR, ACH, SER, DOP)
- Current level (LOW / MEDIUM / HIGH)
- Color-coded: LOW=green, MEDIUM=yellow, HIGH=red
- Mini progress bar (25% / 55% / 90%)

Data source: parsed from `skills/1-chemical-and-health/state-neuromodulators.md`

### 5. Background Agents Panel

Small panel below/beside the main flow canvas. Not part of the DAG.

Shows three background agents as status pills:
- Hypothalamus: idle / monitoring / WARNING
- Reward System: idle / POSITIVE / NEGATIVE
- Default Mode: idle / consolidating

These light up when triggered. Data source: event log entries with their agent names.

### 6. Top Bar

- Left: "Brain OS Observer" title + LIVE indicator (green dot + "LIVE" badge when events are flowing, gray "IDLE" when no activity for 30s)
- Right: Connection status (green/red dot), elapsed time for current loop, re-plan loop counter (0/2), session history dropdown (last 10 loops)

### 7. Session History

In-memory ring buffer of the last 10 completed loops. Before Phase 6 clears buffers, the observer server snapshots the full loop state (all buffer contents + event log + timing).

UI: dropdown in top bar. Selecting a past session shows its frozen state in the flow canvas (all nodes completed, drawer still works). Current live session is always the default.

When a new Phase 0 event arrives, the previous loop's state is pushed to the ring buffer and the canvas resets to show the new live loop.

### 8. Idle State

When no cognitive loop is running (no event-log.jsonl, or no events in the last 30s):
- Full node graph visible but all nodes in "pending" state (gray)
- Center overlay text: "Waiting for signal..."
- Neuromodulator strip shows last known state (or defaults)
- LIVE badge switches to "IDLE"

## WebSocket Message Schema

The server pushes JSON messages to connected browsers. Three message types:

```typescript
// Phase transition event (from event-log.jsonl)
{ type: "phase", phase: string, agent: string, status: "start" | "complete" | "skipped", result?: string, ts: number }

// Buffer file update (from chokidar file change)
{ type: "buffer", file: string, agent: string, fields: Record<string, string>, ts: number }

// Neuromodulator state update (from state-neuromodulators.md change)
{ type: "neuro", levels: { noradrenaline: string, acetylcholine: string, serotonin: string, dopamine: string }, ts: number }

// Full state snapshot (sent on initial connection or reconnect)
{ type: "snapshot", buffers: Record<string, Record<string, string>>, events: PhaseEvent[], neuro: NeuroLevels }
```

## Tech Stack

| Component | Library | Purpose |
|-----------|---------|---------|
| Build tool | Vite | Fast dev server, HMR |
| UI framework | React + TypeScript | Component model |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Node graph | @xyflow/react (React Flow) | DAG visualization, custom nodes, animated edges |
| Server | Express | Static file serving + WebSocket upgrade |
| WebSocket | ws | Real-time push to browser |
| File watching | chokidar | Cross-platform file watcher with debounce |
| Dev runner | concurrently | Run server + Vite in parallel |

## File Structure

```
observer/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── tailwind.config.ts
├── server/
│   ├── index.ts              # Express + WebSocket server entry
│   ├── watcher.ts            # Chokidar file watcher + debounce
│   └── parser.ts             # Markdown buffer → JSON parser
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root layout + WebSocket provider
│   ├── index.css             # Tailwind imports + custom styles
│   ├── components/
│   │   ├── BrainFlow.tsx     # React Flow canvas + node/edge layout
│   │   ├── BufferDrawer.tsx  # Slide-out buffer inspector panel
│   │   ├── NeuroStrip.tsx    # Neuromodulator status bar
│   │   ├── TopBar.tsx        # Title, LIVE badge, session picker
│   │   ├── BackgroundAgents.tsx  # Background agent status pills
│   │   └── nodes/
│   │       ├── BrainNode.tsx     # Custom React Flow node
│   │       └── StatusBadge.tsx   # Status pill component
│   ├── hooks/
│   │   ├── useWebSocket.ts      # WebSocket connection + auto-reconnect
│   │   └── useBrainState.ts     # Central state reducer for brain state
│   └── lib/
│       ├── types.ts             # TypeScript types for brain state
│       ├── flowConfig.ts        # Node positions, edge definitions
│       └── constants.ts         # Colors, node IDs, phase mappings
└── postcss.config.js
```

## Brain OS Changes

### 1. Event Log (CLAUDE.md addition)

Add to the "Agent Dispatch Model" section of CLAUDE.md:

```markdown
### Event Logging (for Observer)

When processing a signal, append phase transition events to
`memory/working-memory-cache/buffers/event-log.jsonl` for the observer dashboard:

- Before dispatching an agent: `{"phase":"N","agent":"name","status":"start","ts":<unix_ms>}`
- After receiving agent response: `{"phase":"N","agent":"name","status":"complete","ts":<unix_ms>}`
- On Cerebellum result: include `"result":"PASS"` or `"result":"FAIL"` in the complete event
- Phase 6 clears the event log along with buffer files

This is optional — the brain functions without it. The observer uses it for timing and phase visualization.
```

### 2. Event Log Gitignore

The `buffers/.gitignore` currently ignores `*.md` files. Add `*.jsonl` to also ignore the event log:
```
*.md
*.jsonl
!.gitkeep
```

## How to Run

```bash
# Terminal 1: Start observer
cd observer && npm run dev
# Opens http://localhost:5173 (Vite) + observer server on :3001

# Terminal 2: Start Claude Code session
cd /path/to/brain && claude
# Use the brain normally — observer shows the loop in real-time
```

## Out of Scope

- Authentication / multi-user (local dev tool only)
- Persistent session storage (in-memory ring buffer is enough)
- Editing brain state from the UI (read-only observer)
- Mobile layout (desktop dashboard only)
- Deployment / hosting (localhost only)
