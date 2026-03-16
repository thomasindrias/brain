import express from 'express';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer } from 'ws';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createWatcher } from './watcher';
import { parseKeyValue, parseNeuroTable } from './parser';
import type {
  WSMessage,
  Snapshot,
  PhaseEvent,
  NeuroLevels,
  SessionSnapshot
} from '../src/lib/types';
import { DEFAULT_NEURO_LEVELS, FILE_TO_AGENT } from '../src/lib/constants';

/**
 * Server configuration options
 */
export interface ServerOptions {
  /** Port to listen on */
  port: number;
  /** Directory containing buffers/ subdirectory */
  watchDir: string;
  /** Root of brain repository (for neuromodulator file) */
  brainRoot: string;
}

/**
 * In-memory server state
 */
interface ServerState {
  currentBuffers: Record<string, Record<string, string>>;
  currentEvents: PhaseEvent[];
  currentNeuro: NeuroLevels;
  sessionHistory: SessionSnapshot[];
}

/**
 * Creates and starts the Brain OS Observer server
 *
 * @param options - Server configuration
 * @returns HTTP server instance
 */
export async function createServer(options: ServerOptions) {
  const { port, watchDir, brainRoot } = options;

  // Validate buffers directory exists
  try {
    await fs.access(watchDir);
  } catch {
    throw new Error(`Buffers directory not found: ${watchDir}`);
  }

  // Initialize state
  const state: ServerState = {
    currentBuffers: {},
    currentEvents: [],
    currentNeuro: { ...DEFAULT_NEURO_LEVELS },
    sessionHistory: []
  };

  // Load initial state
  await loadInitialState(state, watchDir, brainRoot);

  // Create Express app
  const app = express();

  // Serve static files in production
  const distPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist');
  try {
    await fs.access(distPath);
    app.use(express.static(distPath));
  } catch {
    // dist/ doesn't exist yet (dev mode)
  }

  // Create HTTP server
  const httpServer = createHttpServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrades
  httpServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  // Track connected clients
  const clients = new Set<any>();

  // Handle new WebSocket connections
  wss.on('connection', (ws) => {
    clients.add(ws);

    // Send snapshot on connection
    const snapshot: Snapshot = {
      type: 'snapshot',
      buffers: state.currentBuffers,
      events: state.currentEvents,
      neuro: state.currentNeuro
    };

    ws.send(JSON.stringify(snapshot));

    // Remove client on close
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  /**
   * Broadcast message to all connected clients
   */
  const broadcast = (message: WSMessage) => {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN state
        client.send(data);
      }
    }
  };

  /**
   * Handle watcher events
   */
  const handleWatcherEvent = (event: WSMessage) => {
    // Update state
    if (event.type === 'buffer') {
      state.currentBuffers[event.file] = event.fields;
    } else if (event.type === 'neuro') {
      state.currentNeuro = event.levels;
    } else if (event.type === 'phase') {
      state.currentEvents.push(event);

      // Check for Phase 0 start with existing state (new session)
      if (event.phase === '0' && event.status === 'start' && state.currentEvents.length > 1) {
        // Snapshot current session to history
        const sessionSnapshot: SessionSnapshot = {
          id: `session-${Date.now()}`,
          buffers: { ...state.currentBuffers },
          events: [...state.currentEvents.slice(0, -1)], // Exclude the new Phase 0 start
          neuro: { ...state.currentNeuro },
          startTs: state.currentEvents[0]?.ts || Date.now(),
          endTs: event.ts
        };

        state.sessionHistory.push(sessionSnapshot);

        // Keep only last 10 sessions
        if (state.sessionHistory.length > 10) {
          state.sessionHistory.shift();
        }

        // Reset current state
        state.currentBuffers = {};
        state.currentEvents = [event];
      }
    }

    // Broadcast to all clients
    broadcast(event);
  };

  // Create file watcher
  const neuroFilePath = path.join(brainRoot, 'skills', '1-chemical-and-health', 'state-neuromodulators.md');
  const watcher = createWatcher(
    path.dirname(watchDir), // Parent directory (contains buffers/)
    handleWatcherEvent,
    { neuroFilePath }
  );

  // Start HTTP server
  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      console.log(`Brain OS Observer Server listening on port ${port}`);
      console.log(`Watching buffers: ${watchDir}`);
      console.log(`Brain root: ${brainRoot}`);
      console.log(`Neuromodulator file: ${neuroFilePath}`);
      resolve();
    });
  });

  // Return server with close method
  return {
    close: (callback?: () => void) => {
      watcher.close();
      wss.close();
      httpServer.close(callback);
    },
    state
  };
}

/**
 * Load initial state from filesystem
 */
async function loadInitialState(
  state: ServerState,
  watchDir: string,
  brainRoot: string
) {
  try {
    // Load buffer files
    const files = await fs.readdir(watchDir);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(watchDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const fields = parseKeyValue(content);
        state.currentBuffers[file] = fields;
      } else if (file === 'event-log.jsonl') {
        // Load event log
        const filePath = path.join(watchDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const event = JSON.parse(line) as PhaseEvent;
            state.currentEvents.push({
              type: 'phase',
              ...event
            });
          } catch {
            // Ignore malformed lines
          }
        }
      }
    }

    // Load neuromodulator state
    const neuroFilePath = path.join(brainRoot, 'skills', '1-chemical-and-health', 'state-neuromodulators.md');
    try {
      const neuroContent = await fs.readFile(neuroFilePath, 'utf-8');
      state.currentNeuro = parseNeuroTable(neuroContent);
    } catch {
      // File doesn't exist, use defaults
    }
  } catch (error) {
    console.error('Error loading initial state:', error);
  }
}

/**
 * Start server if run directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '4100', 10);
  const brainRoot = process.env.BRAIN_ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../');
  const watchDir = path.join(brainRoot, 'memory', 'working-memory-cache', 'buffers');

  createServer({ port, watchDir, brainRoot }).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
