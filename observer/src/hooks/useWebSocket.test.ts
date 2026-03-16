import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

describe('useWebSocket', () => {
  let mockWebSocket: any;
  let mockWebSocketInstances: any[] = [];

  beforeEach(() => {
    // Mock WebSocket constructor
    mockWebSocketInstances = [];

    global.WebSocket = vi.fn().mockImplementation((url: string) => {
      mockWebSocket = {
        url,
        readyState: WebSocket.CONNECTING,
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
        close: vi.fn(),
        send: vi.fn(),
      };
      mockWebSocketInstances.push(mockWebSocket);
      return mockWebSocket;
    }) as any;

    // Mock setTimeout and clearTimeout for reconnection tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should call onMessage when server sends data', async () => {
    const onMessage = vi.fn();
    const testMessage = { type: 'phase', phase: '0', agent: 'sensory-buffer', status: 'start', ts: 1000 };

    renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    // Simulate connection
    await act(async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) mockWebSocket.onopen(new Event('open'));
    });

    // Simulate message
    await act(async () => {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(testMessage),
      });
      if (mockWebSocket.onmessage) mockWebSocket.onmessage(messageEvent);
    });

    expect(onMessage).toHaveBeenCalledWith(testMessage);
  });

  it('should report connected: true when connected', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    expect(result.current.connected).toBe(false);

    // Simulate connection
    await act(async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) mockWebSocket.onopen(new Event('open'));
    });

    expect(result.current.connected).toBe(true);
  });

  it('should report connected: false when disconnected', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    // First connect
    await act(async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      if (mockWebSocket.onopen) mockWebSocket.onopen(new Event('open'));
    });

    expect(result.current.connected).toBe(true);

    // Then disconnect
    await act(async () => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) mockWebSocket.onclose(new CloseEvent('close'));
    });

    expect(result.current.connected).toBe(false);
  });

  it('should clean up WebSocket on unmount', () => {
    const onMessage = vi.fn();
    const { unmount } = renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('should implement exponential backoff reconnection', async () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    // Initial connection attempt
    expect(mockWebSocketInstances).toHaveLength(1);

    // Simulate connection failure
    await act(async () => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) mockWebSocket.onclose(new CloseEvent('close'));
    });

    // Wait for first reconnection attempt (1s)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockWebSocketInstances).toHaveLength(2);

    // Simulate second failure
    const secondWs = mockWebSocketInstances[1];
    await act(async () => {
      secondWs.readyState = WebSocket.CLOSED;
      if (secondWs.onclose) secondWs.onclose(new CloseEvent('close'));
    });

    // Wait for second reconnection attempt (2s)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockWebSocketInstances).toHaveLength(3);

    // Simulate third failure
    const thirdWs = mockWebSocketInstances[2];
    await act(async () => {
      thirdWs.readyState = WebSocket.CLOSED;
      if (thirdWs.onclose) thirdWs.onclose(new CloseEvent('close'));
    });

    // Wait for third reconnection attempt (4s)
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(mockWebSocketInstances).toHaveLength(4);
  });

  it('should cap reconnection delay at 10 seconds', async () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    // Simulate multiple failures to exceed max delay
    for (let i = 0; i < 5; i++) {
      const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
      await act(async () => {
        ws.readyState = WebSocket.CLOSED;
        if (ws.onclose) ws.onclose(new CloseEvent('close'));
      });

      // Each delay: 1s, 2s, 4s, 8s, 10s (capped)
      const expectedDelay = Math.min(1000 * Math.pow(2, i), 10000);
      await act(async () => {
        vi.advanceTimersByTime(expectedDelay);
      });

      expect(mockWebSocketInstances.length).toBeGreaterThan(i + 1);
    }
  });

  it('should reset delay on successful connection', async () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    // First connection failure
    await act(async () => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      if (mockWebSocket.onclose) mockWebSocket.onclose(new CloseEvent('close'));
    });

    // Wait for reconnection (1s)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockWebSocketInstances).toHaveLength(2);

    // Second connection failure
    const secondWs = mockWebSocketInstances[1];
    await act(async () => {
      secondWs.readyState = WebSocket.CLOSED;
      if (secondWs.onclose) secondWs.onclose(new CloseEvent('close'));
    });

    // Wait for reconnection (2s - exponential backoff)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockWebSocketInstances).toHaveLength(3);

    // Third connection succeeds
    const thirdWs = mockWebSocketInstances[2];
    await act(async () => {
      thirdWs.readyState = WebSocket.OPEN;
      if (thirdWs.onopen) thirdWs.onopen(new Event('open'));
    });

    // Now disconnect again
    await act(async () => {
      thirdWs.readyState = WebSocket.CLOSED;
      if (thirdWs.onclose) thirdWs.onclose(new CloseEvent('close'));
    });

    // Should use base delay (1s) again, not continue exponential backoff
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockWebSocketInstances).toHaveLength(4);
  });

  it('should handle invalid JSON gracefully', async () => {
    const onMessage = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useWebSocket('ws://localhost:3001', onMessage));

    // Simulate connection
    mockWebSocket.readyState = WebSocket.OPEN;
    if (mockWebSocket.onopen) mockWebSocket.onopen(new Event('open'));

    // Send invalid JSON
    const messageEvent = new MessageEvent('message', {
      data: 'invalid json {',
    });
    if (mockWebSocket.onmessage) mockWebSocket.onmessage(messageEvent);

    // onMessage should not be called
    expect(onMessage).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
