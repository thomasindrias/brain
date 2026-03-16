import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createWatcher } from './watcher';
import type { WSMessage } from '../src/lib/types';

describe('File Watcher', () => {
  let tmpDir: string;
  let bufferDir: string;
  let neuroFile: string;
  let eventLogFile: string;
  let receivedEvents: WSMessage[] = [];
  let watchers: any[] = [];

  beforeEach(async () => {
    // Create temporary directory structure
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brain-watcher-test-'));
    bufferDir = path.join(tmpDir, 'buffers');
    await fs.mkdir(bufferDir, { recursive: true });

    neuroFile = path.join(tmpDir, 'state-neuromodulators.md');
    eventLogFile = path.join(bufferDir, 'event-log.jsonl');

    receivedEvents = [];
    watchers = [];
  });

  afterEach(async () => {
    // Close all watchers first
    for (const watcher of watchers) {
      await watcher.close();
    }
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 50));
    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should emit buffer event when .md file created in buffers/', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    // Wait for watcher to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Write a buffer file
    const bufferFile = path.join(bufferDir, 'signal-amygdala.md');
    await fs.writeFile(bufferFile, '[THREAT_LEVEL]: SAFE\n[ACTION]: proceed\n');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify event was emitted
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].type).toBe('buffer');

    if (receivedEvents[0].type === 'buffer') {
      expect(receivedEvents[0].agent).toBe('amygdala');
      expect(receivedEvents[0].file).toBe('signal-amygdala.md');
      expect(receivedEvents[0].fields.THREAT_LEVEL).toBe('SAFE');
      expect(receivedEvents[0].fields.ACTION).toBe('proceed');
      expect(receivedEvents[0].ts).toBeGreaterThan(0);
    }
  });

  it('should emit neuro event when neuromodulator file changes', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Write neuromodulator file with table content
    const neuroContent = `# Neuromodulator Levels

| **Name** | **Level** | **Effect** |
|----------|-----------|------------|
| **Noradrenaline** | HIGH | Alertness increased |
| **Acetylcholine** | MEDIUM | Focus normal |
| **Serotonin** | LOW | Mood regulation |
| **Dopamine** | MEDIUM | Motivation stable |
`;
    await fs.writeFile(neuroFile, neuroContent);

    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify neuro event was emitted
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].type).toBe('neuro');

    if (receivedEvents[0].type === 'neuro') {
      expect(receivedEvents[0].levels.noradrenaline).toBe('HIGH');
      expect(receivedEvents[0].levels.acetylcholine).toBe('MEDIUM');
      expect(receivedEvents[0].levels.serotonin).toBe('LOW');
      expect(receivedEvents[0].levels.dopamine).toBe('MEDIUM');
      expect(receivedEvents[0].ts).toBeGreaterThan(0);
    }
  });

  it('should debounce rapid changes to same file', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    await new Promise(resolve => setTimeout(resolve, 100));

    const bufferFile = path.join(bufferDir, 'signal-hippocampus.md');

    // Write 3 times quickly
    await fs.writeFile(bufferFile, '[STATUS]: version1\n');
    await new Promise(resolve => setTimeout(resolve, 20));
    await fs.writeFile(bufferFile, '[STATUS]: version2\n');
    await new Promise(resolve => setTimeout(resolve, 20));
    await fs.writeFile(bufferFile, '[STATUS]: version3\n');

    // Wait for debounce to settle
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should only get 1 event with final content
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].type).toBe('buffer');

    if (receivedEvents[0].type === 'buffer') {
      expect(receivedEvents[0].agent).toBe('hippocampus');
      expect(receivedEvents[0].fields.STATUS).toBe('version3');
    }
  });

  it('should emit phase events when event-log.jsonl is appended', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Write JSONL line
    const phaseEvent = JSON.stringify({
      phase: '1',
      agent: 'amygdala',
      status: 'start',
      ts: Date.now()
    });
    await fs.writeFile(eventLogFile, phaseEvent + '\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify phase event was emitted
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].type).toBe('phase');

    if (receivedEvents[0].type === 'phase') {
      expect(receivedEvents[0].phase).toBe('1');
      expect(receivedEvents[0].agent).toBe('amygdala');
      expect(receivedEvents[0].status).toBe('start');
      expect(receivedEvents[0].ts).toBeGreaterThan(0);
    }
  });

  it('should tail JSONL correctly on append', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Write first line
    const event1 = JSON.stringify({
      phase: '1',
      agent: 'amygdala',
      status: 'start',
      ts: Date.now()
    });
    await fs.writeFile(eventLogFile, event1 + '\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    // Write second line
    const event2 = JSON.stringify({
      phase: '1',
      agent: 'amygdala',
      status: 'complete',
      ts: Date.now()
    });
    await fs.appendFile(eventLogFile, event2 + '\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    // Should have 2 separate events, not re-reading old lines
    expect(receivedEvents.length).toBe(2);
    expect(receivedEvents[0].type).toBe('phase');
    expect(receivedEvents[1].type).toBe('phase');

    if (receivedEvents[0].type === 'phase' && receivedEvents[1].type === 'phase') {
      expect(receivedEvents[0].status).toBe('start');
      expect(receivedEvents[1].status).toBe('complete');
    }
  });

  it('should ignore non-matching files', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Write non-matching files
    await fs.writeFile(path.join(bufferDir, 'random.txt'), 'content');
    await fs.writeFile(path.join(tmpDir, 'other.md'), 'content');

    await new Promise(resolve => setTimeout(resolve, 200));

    // No events should be emitted
    expect(receivedEvents.length).toBe(0);
  });

  it('should handle phase events with result field', async () => {
    const watcher = createWatcher(tmpDir, (event) => {
      receivedEvents.push(event);
    }, { neuroFilePath: neuroFile });
    watchers.push(watcher);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Write phase event with result
    const phaseEvent = JSON.stringify({
      phase: '4',
      agent: 'cerebellum',
      status: 'complete',
      result: 'PASS',
      ts: Date.now()
    });
    await fs.writeFile(eventLogFile, phaseEvent + '\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].type).toBe('phase');

    if (receivedEvents[0].type === 'phase') {
      expect(receivedEvents[0].result).toBe('PASS');
    }
  });
});
