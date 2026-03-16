import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import WebSocket from 'ws';
import { createServer } from './index';
import type { Snapshot } from '../src/lib/types';

describe('WebSocket Server', () => {
  let tmpDir: string;
  let bufferDir: string;
  let neuroFile: string;
  let server: any;
  let port: number;

  beforeEach(async () => {
    // Create temporary directory structure
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brain-server-test-'));
    bufferDir = path.join(tmpDir, 'memory', 'working-memory-cache', 'buffers');
    await fs.mkdir(bufferDir, { recursive: true });

    neuroFile = path.join(tmpDir, 'skills', '1-chemical-and-health', 'state-neuromodulators.md');
    await fs.mkdir(path.dirname(neuroFile), { recursive: true });

    // Find available port
    port = 4100 + Math.floor(Math.random() * 1000);
  });

  afterEach(async () => {
    // Close server if it exists
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 50));
    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should send snapshot message on WebSocket connection', async () => {
    // Write some initial state
    await fs.writeFile(
      path.join(bufferDir, 'signal-amygdala.md'),
      '[THREAT_LEVEL]: SAFE\n[ACTION]: proceed\n'
    );

    const neuroContent = `| **Noradrenaline** | HIGH | Alert |
| **Acetylcholine** | MEDIUM | Focus |
| **Serotonin** | LOW | Mood |
| **Dopamine** | MEDIUM | Motivation |`;
    await fs.writeFile(neuroFile, neuroContent);

    // Create server
    server = await createServer({
      port,
      watchDir: bufferDir,
      brainRoot: tmpDir
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 200));

    // Connect WebSocket client
    const ws = new WebSocket(`ws://localhost:${port}`);

    const snapshot = await new Promise<Snapshot>((resolve, reject) => {
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'snapshot') {
            resolve(msg as Snapshot);
          }
        } catch (error) {
          reject(error);
        }
      });

      ws.on('error', reject);

      setTimeout(() => reject(new Error('Timeout waiting for snapshot')), 2000);
    });

    // Verify snapshot structure
    expect(snapshot.type).toBe('snapshot');
    expect(snapshot.buffers).toBeDefined();
    expect(snapshot.events).toBeDefined();
    expect(snapshot.neuro).toBeDefined();

    // Verify buffers were loaded
    expect(snapshot.buffers['signal-amygdala.md']).toBeDefined();
    expect(snapshot.buffers['signal-amygdala.md'].THREAT_LEVEL).toBe('SAFE');

    // Verify neuro was loaded
    expect(snapshot.neuro.noradrenaline).toBe('HIGH');
    expect(snapshot.neuro.acetylcholine).toBe('MEDIUM');

    // Verify events is an array
    expect(Array.isArray(snapshot.events)).toBe(true);

    ws.close();
  });

  it('should broadcast buffer updates to all connected clients', async () => {
    // Create server
    server = await createServer({
      port,
      watchDir: bufferDir,
      brainRoot: tmpDir
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Connect two clients
    const ws1 = new WebSocket(`ws://localhost:${port}`);
    const ws2 = new WebSocket(`ws://localhost:${port}`);

    // Wait for connections and skip snapshots
    await new Promise(resolve => setTimeout(resolve, 200));

    const messages1: any[] = [];
    const messages2: any[] = [];

    ws1.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type !== 'snapshot') {
        messages1.push(msg);
      }
    });

    ws2.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type !== 'snapshot') {
        messages2.push(msg);
      }
    });

    // Write a buffer file
    await fs.writeFile(
      path.join(bufferDir, 'signal-hippocampus.md'),
      '[STATUS]: active\n'
    );

    // Wait for broadcast
    await new Promise(resolve => setTimeout(resolve, 300));

    // Both clients should receive the update
    expect(messages1.length).toBeGreaterThan(0);
    expect(messages2.length).toBeGreaterThan(0);
    expect(messages1[0].type).toBe('buffer');
    expect(messages2[0].type).toBe('buffer');

    ws1.close();
    ws2.close();
  });

  it('should handle empty buffers directory', async () => {
    // Create server with empty directory
    server = await createServer({
      port,
      watchDir: bufferDir,
      brainRoot: tmpDir
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    const ws = new WebSocket(`ws://localhost:${port}`);

    const snapshot = await new Promise<Snapshot>((resolve, reject) => {
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'snapshot') {
            resolve(msg as Snapshot);
          }
        } catch (error) {
          reject(error);
        }
      });

      ws.on('error', reject);
      setTimeout(() => reject(new Error('Timeout')), 2000);
    });

    // Should have empty state
    expect(Object.keys(snapshot.buffers).length).toBe(0);
    expect(snapshot.events.length).toBe(0);
    expect(snapshot.neuro).toBeDefined();

    ws.close();
  });
});
