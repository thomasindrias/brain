import { watch } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { WSMessage, PhaseEvent, BufferUpdate, NeuroUpdate } from '../src/lib/types';
import { FILE_TO_AGENT, DEBOUNCE_MS } from '../src/lib/constants';
import { parseKeyValue, parseNeuroTable } from './parser';

/**
 * Options for creating a file watcher
 */
export interface WatcherOptions {
  /** Path to neuromodulator file (optional) */
  neuroFilePath?: string;
  /** Debounce delay in milliseconds (default: 100ms) */
  debounceMs?: number;
}

/**
 * Callback for watcher events
 */
export type WatcherCallback = (event: WSMessage) => void;

/**
 * JSONL file offset tracker
 */
interface JsonlTracker {
  path: string;
  offset: number;
}

/**
 * Creates a file watcher for Brain OS buffer files
 *
 * Watches:
 * - {watchDir}/buffers/*.md - Buffer files
 * - {watchDir}/buffers/event-log.jsonl - Phase events log
 * - Optional neuromodulator file
 *
 * @param watchDir - Root directory to watch (contains buffers/ subdirectory)
 * @param callback - Function to call when files change
 * @param options - Optional watcher configuration
 * @returns Chokidar watcher instance with close() method
 */
export function createWatcher(
  watchDir: string,
  callback: WatcherCallback,
  options: WatcherOptions = {}
) {
  const { neuroFilePath, debounceMs = DEBOUNCE_MS } = options;

  // Per-file debounce timers
  const debounceTimers = new Map<string, NodeJS.Timeout>();

  // JSONL offset tracker
  const jsonlTrackers = new Map<string, JsonlTracker>();

  // Paths to watch
  const bufferDir = path.join(watchDir, 'buffers');
  const watchPaths = [bufferDir];
  if (neuroFilePath) {
    watchPaths.push(neuroFilePath);
  }

  /**
   * Handle file change with debouncing
   */
  const handleFileChange = (filePath: string) => {
    // Clear existing timer for this file
    const existingTimer = debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(async () => {
      debounceTimers.delete(filePath);
      await processFileChange(filePath);
    }, debounceMs);

    debounceTimers.set(filePath, timer);
  };

  /**
   * Process a file change event
   */
  const processFileChange = async (filePath: string) => {
    try {
      const filename = path.basename(filePath);
      const ext = path.extname(filePath);

      // Check if file still exists (might have been deleted during debounce)
      try {
        await fs.access(filePath);
      } catch {
        // File was deleted, skip processing
        return;
      }

      // Handle JSONL event log
      if (filename === 'event-log.jsonl') {
        await processJsonlFile(filePath);
        return;
      }

      // Handle neuromodulator file
      if (neuroFilePath && filePath === neuroFilePath) {
        await processNeuroFile(filePath);
        return;
      }

      // Handle buffer markdown files
      if (ext === '.md' && path.dirname(filePath) === bufferDir) {
        await processBufferFile(filePath, filename);
        return;
      }
    } catch (error) {
      // Ignore ENOENT errors (file deleted during processing)
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
  };

  /**
   * Process JSONL file (tail new lines only)
   */
  const processJsonlFile = async (filePath: string) => {
    // Get or initialize tracker
    let tracker = jsonlTrackers.get(filePath);
    if (!tracker) {
      tracker = { path: filePath, offset: 0 };
      jsonlTrackers.set(filePath, tracker);
    }

    // Read file stats
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // If file is smaller than offset, it was truncated or recreated
    if (fileSize < tracker.offset) {
      tracker.offset = 0;
    }

    // Read only new bytes
    if (fileSize > tracker.offset) {
      const handle = await fs.open(filePath, 'r');
      const buffer = Buffer.allocUnsafe(fileSize - tracker.offset);
      await handle.read(buffer, 0, buffer.length, tracker.offset);
      await handle.close();

      // Update offset
      tracker.offset = fileSize;

      // Parse new lines
      const newContent = buffer.toString('utf-8');
      const lines = newContent.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as PhaseEvent;
          // Add type field if not present
          const phaseEvent: PhaseEvent = {
            type: 'phase',
            phase: event.phase,
            agent: event.agent,
            status: event.status,
            ts: event.ts,
            ...(event.result && { result: event.result })
          };
          callback(phaseEvent);
        } catch (error) {
          console.error(`Error parsing JSONL line: ${line}`, error);
        }
      }
    }
  };

  /**
   * Process neuromodulator file
   */
  const processNeuroFile = async (filePath: string) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const levels = parseNeuroTable(content);

    const event: NeuroUpdate = {
      type: 'neuro',
      levels,
      ts: Date.now()
    };

    callback(event);
  };

  /**
   * Process buffer markdown file
   */
  const processBufferFile = async (filePath: string, filename: string) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const fields = parseKeyValue(content);

    // Derive agent name from filename
    const agent = FILE_TO_AGENT[filename] || filename.replace('signal-', '').replace('.md', '');

    const event: BufferUpdate = {
      type: 'buffer',
      file: filename,
      agent,
      fields,
      ts: Date.now()
    };

    callback(event);
  };

  // Create watcher
  const watcher = watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 10
    }
  });

  // Watch for add and change events
  watcher.on('add', handleFileChange);
  watcher.on('change', handleFileChange);

  // Error handling
  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  return watcher;
}
