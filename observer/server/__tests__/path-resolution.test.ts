import { describe, it, expect, afterEach } from 'vitest';
import * as path from 'path';
import * as os from 'os';

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
      : path.join('/fallback', 'skills', '1-chemical-and-health', 'state-neuromodulators.md');

    expect(neuroPath).toBe('/tmp/test-brain/state-neuromodulators.md');
  });

  it('uses BRAIN_DATA_DIR for watch dir when set', () => {
    process.env.BRAIN_DATA_DIR = '/tmp/test-brain';

    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const watchDir = brainDataDir
      ? path.join(brainDataDir, 'working-memory-cache', 'sessions')
      : path.join('/fallback', 'memory', 'working-memory-cache', 'buffers');

    expect(watchDir).toBe('/tmp/test-brain/working-memory-cache/sessions');
  });

  it('falls back to brainRoot paths when BRAIN_DATA_DIR unset', () => {
    delete process.env.BRAIN_DATA_DIR;

    const brainRoot = '/home/user/brain';
    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const neuroPath = brainDataDir
      ? path.join(brainDataDir, 'state-neuromodulators.md')
      : path.join(brainRoot, 'skills', '1-chemical-and-health', 'state-neuromodulators.md');

    expect(neuroPath).toBe('/home/user/brain/skills/1-chemical-and-health/state-neuromodulators.md');
  });

  it('falls back to brainRoot for watch dir when BRAIN_DATA_DIR unset', () => {
    delete process.env.BRAIN_DATA_DIR;

    const brainRoot = '/home/user/brain';
    const brainDataDir = process.env.BRAIN_DATA_DIR;
    const watchDir = brainDataDir
      ? path.join(brainDataDir, 'working-memory-cache', 'sessions')
      : path.join(brainRoot, 'memory', 'working-memory-cache', 'buffers');

    expect(watchDir).toBe('/home/user/brain/memory/working-memory-cache/buffers');
  });

  it('uses home dir default when both env vars missing', () => {
    delete process.env.BRAIN_DATA_DIR;
    delete process.env.BRAIN_ROOT;

    const homeDir = os.homedir();
    const defaultBrainData = path.join(homeDir, '.config', 'brain-os');

    expect(defaultBrainData).toMatch(/\.config\/brain-os$/);
  });
});
