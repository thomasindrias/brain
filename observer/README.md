# Brain OS Observer Dashboard

Real-time visualization dashboard for the Brain OS cognitive architecture.

## Project Status

**Current:** Task 1 (Scaffolding + Parser) - COMPLETE

- ✅ Project initialization with TypeScript, React, Vite
- ✅ Type definitions for WebSocket messages and brain nodes
- ✅ Constants for agent mapping, colors, and timeouts
- ✅ Parser implementation with 13 passing tests
  - Key-value parser for buffer files
  - Neuromodulator table parser

## Setup

```bash
cd observer
npm install
```

## Available Scripts

```bash
npm run dev          # Start dev server (concurrently runs server + vite)
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run build        # Build for production
```

## Project Structure

```
observer/
├── server/
│   ├── index.ts           # WebSocket server (Chunk 2)
│   ├── parser.ts          # Markdown parser
│   └── parser.test.ts     # Parser tests (13 passing)
├── src/
│   ├── lib/
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── constants.ts   # Agent mappings, colors, timeouts
│   ├── components/        # React components (future chunks)
│   ├── main.tsx           # React entry point
│   ├── index.css          # Tailwind CSS
│   └── test-setup.ts      # Vitest setup
└── index.html             # HTML entry point
```

## Test Coverage

All 13 parser tests passing:

### parseKeyValue
- ✅ Single-line key-value pairs
- ✅ Multi-line values (blueprints, lists)
- ✅ Empty input handling
- ✅ Values containing colons
- ✅ Whitespace trimming
- ✅ Markdown header filtering
- ✅ Multi-line value continuation

### parseNeuroTable
- ✅ Markdown table parsing
- ✅ Default levels for empty input
- ✅ Tables without bold markers
- ✅ Tables with header rows
- ✅ Malformed table handling
- ✅ Case-insensitive names

## Next Steps

- **Chunk 2:** File watcher + WebSocket server
- **Chunk 3:** Frontend state reducer + WebSocket hook
- **Chunk 4:** React Flow canvas + custom nodes
