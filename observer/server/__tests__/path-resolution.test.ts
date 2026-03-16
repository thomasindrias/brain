import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { createWatcher } from '../watcher';
import type { WSMessage } from '../../src/lib/types';

describe('path resolution', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses BRAIN_DATA_DIR for neuro path when set', () => {
    process.env.BRAIN_DATA_DIR = '/tmp/test-brain';

    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const neuroPath = brainDataDir
      ? path.join(brainDataDir, 'state-neuromodulators.md')
      : path.join('/fallback', 'regions', '1-chemical-and-health', 'state-neuromodulators.md');

    expect(neuroPath).toBe('/tmp/test-brain/state-neuromodulators.md');
  });

  it('uses BRAIN_DATA_DIR for watch dir when set', () => {
    process.env.BRAIN_DATA_DIR = '/tmp/test-brain';

    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const watchDir = brainDataDir
      ? path.join(brainDataDir, 'working-memory-cache', 'sessions')
      : path.join('/fallback', 'memory', 'working-memory-cache');

    expect(watchDir).toBe('/tmp/test-brain/working-memory-cache/sessions');
  });

  it('falls back to brainRoot paths when BRAIN_DATA_DIR unset', () => {
    delete process.env.BRAIN_DATA_DIR;

    const brainRoot = '/home/user/brain';
    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const neuroPath = brainDataDir
      ? path.join(brainDataDir, 'state-neuromodulators.md')
      : path.join(brainRoot, 'regions', '1-chemical-and-health', 'state-neuromodulators.md');

    expect(neuroPath).toBe('/home/user/brain/regions/1-chemical-and-health/state-neuromodulators.md');
  });

  it('falls back to brainRoot for watch dir when BRAIN_DATA_DIR unset', () => {
    delete process.env.BRAIN_DATA_DIR;

    const brainRoot = '/home/user/brain';
    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const watchDir = brainDataDir
      ? path.join(brainDataDir, 'working-memory-cache', 'sessions')
      : path.join(brainRoot, 'memory', 'working-memory-cache');

    expect(watchDir).toBe('/home/user/brain/memory/working-memory-cache');
  });

  it('uses home dir default when both env vars missing', () => {
    delete process.env.BRAIN_DATA_DIR;
    delete process.env.BRAIN_ROOT;

    const homeDir = os.homedir();
    const defaultBrainData = path.join(homeDir, '.config', 'brain-os');

    expect(defaultBrainData).toMatch(/\.config\/brain-os$/);
  });
});

describe('flat watcher mode', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brain-watcher-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('watches directory directly in flat mode (no buffers/ subdir)', async () => {
    const events: WSMessage[] = [];
    const watcher = createWatcher(tmpDir, (event) => events.push(event), {
      flat: true,
      debounceMs: 10,
    });

    // Give chokidar time to start watching
    await new Promise((r) => setTimeout(r, 200));

    // Write a buffer file directly into tmpDir (not tmpDir/buffers/)
    await fs.writeFile(
      path.join(tmpDir, 'signal-amygdala.md'),
      '[THREAT_LEVEL]: SAFE\n[EVIDENCE]: none\n'
    );

    // Wait for debounce + processing
    await new Promise((r) => setTimeout(r, 300));

    expect(events.length).toBeGreaterThanOrEqual(1);
    const bufferEvent = events.find((e) => e.type === 'buffer');
    expect(bufferEvent).toBeDefined();
    expect((bufferEvent as any).file).toBe('signal-amygdala.md');

    await watcher.close();
  });

  it('watches buffers/ subdir in non-flat mode', async () => {
    const buffersDir = path.join(tmpDir, 'buffers');
    await fs.mkdir(buffersDir);

    const events: WSMessage[] = [];
    const watcher = createWatcher(tmpDir, (event) => events.push(event), {
      flat: false,
      debounceMs: 10,
    });

    await new Promise((r) => setTimeout(r, 200));

    await fs.writeFile(
      path.join(buffersDir, 'signal-language.md'),
      '[INTENT]: build\n[USER_TONE]: casual\n'
    );

    await new Promise((r) => setTimeout(r, 300));

    expect(events.length).toBeGreaterThanOrEqual(1);
    const bufferEvent = events.find((e) => e.type === 'buffer');
    expect(bufferEvent).toBeDefined();
    expect((bufferEvent as any).file).toBe('signal-language.md');

    await watcher.close();
  });

  it('handles event-log.jsonl in flat mode', async () => {
    const events: WSMessage[] = [];
    const watcher = createWatcher(tmpDir, (event) => events.push(event), {
      flat: true,
      debounceMs: 10,
    });

    await new Promise((r) => setTimeout(r, 200));

    await fs.writeFile(
      path.join(tmpDir, 'event-log.jsonl'),
      '{"phase":"0","agent":"sensory-buffer","status":"start","ts":1000}\n'
    );

    await new Promise((r) => setTimeout(r, 300));

    const phaseEvent = events.find((e) => e.type === 'phase');
    expect(phaseEvent).toBeDefined();
    expect((phaseEvent as any).phase).toBe('0');
    expect((phaseEvent as any).agent).toBe('sensory-buffer');

    await watcher.close();
  });

  it('ignores non-.md files in flat mode', async () => {
    const events: WSMessage[] = [];
    const watcher = createWatcher(tmpDir, (event) => events.push(event), {
      flat: true,
      debounceMs: 10,
    });

    await new Promise((r) => setTimeout(r, 200));

    await fs.writeFile(path.join(tmpDir, 'random.txt'), 'not a buffer');

    await new Promise((r) => setTimeout(r, 300));

    const bufferEvents = events.filter((e) => e.type === 'buffer');
    expect(bufferEvents.length).toBe(0);

    await watcher.close();
  });
});
