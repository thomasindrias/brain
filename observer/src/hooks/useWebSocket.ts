import { useEffect, useRef, useState } from 'react';
import type { WSMessage } from '../lib/types';
import { WS_RECONNECT_BASE_MS, WS_RECONNECT_MAX_MS } from '../lib/constants';

type UseWebSocketReturn = {
  connected: boolean;
};

export function useWebSocket(
  url: string,
  onMessage: (message: WSMessage) => void
): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef<number>(WS_RECONNECT_BASE_MS);
  const onMessageRef = useRef(onMessage);

  // Keep onMessageRef up to date
  onMessageRef.current = onMessage;

  useEffect(() => {
    let isCleaningUp = false;

    function connect() {
      if (isCleaningUp) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isCleaningUp) return;
        setConnected(true);
        // Reset reconnection delay on successful connection
        reconnectDelayRef.current = WS_RECONNECT_BASE_MS;
      };

      ws.onclose = () => {
        if (isCleaningUp) return;
        setConnected(false);

        // Schedule reconnection with exponential backoff
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (!isCleaningUp) {
            connect();
            // Increase delay for next attempt, capped at max
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * 2,
              WS_RECONNECT_MAX_MS
            );
          }
        }, reconnectDelayRef.current);
      };

      ws.onerror = () => {
        // Suppress errors from StrictMode double-mount teardown
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          onMessageRef.current(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }

    connect();

    // Cleanup function
    return () => {
      isCleaningUp = true;

      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]);

  return { connected };
}
