import { useEffect, useRef, useCallback } from "react";
import type { AgentEvent } from "../types.js";

export interface UseSSEOptions {
  url: string;
  onEvent: (event: AgentEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  enabled?: boolean;
}

/**
 * Hook for managing Server-Sent Events connection
 */
export function useSSE({ url, onEvent, onError, onOpen, enabled = true }: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);

  // Keep refs up to date
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const connect = useCallback(() => {
    console.log("[useSSE] ═══════════════════════════════════════");
    console.log("[useSSE] connect() called");
    console.log("[useSSE]    enabled:", enabled);
    console.log("[useSSE]    existing connection:", !!eventSourceRef.current);
    console.log("[useSSE]    url:", url);

    if (!enabled || eventSourceRef.current) {
      console.log("[useSSE] ⚠️  Skipping connection (not enabled or already connected)");
      console.log("[useSSE] ═══════════════════════════════════════");
      return;
    }

    if (!url || url.trim() === "") {
      console.error("[useSSE] ❌ Cannot connect: URL is empty");
      console.log("[useSSE] ═══════════════════════════════════════");
      return;
    }

    console.log("[useSSE] 🔌 Creating EventSource connection...");
    console.log("[useSSE] ═══════════════════════════════════════");

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log("[useSSE] ✅ Connection opened successfully");
      onOpenRef.current?.();
    };

    // Handle all event types (connected, answer_start, done, etc.)
    const handleEvent = (e: MessageEvent) => {
      try {
        const event: AgentEvent = JSON.parse(e.data);
        console.log("[useSSE] 📨 Received event:", e.type, "→", event.type);
        onEventRef.current(event);
      } catch (error) {
        console.error("[useSSE] ❌ Failed to parse event:", error);
      }
    };

    // Listen for all custom event types sent by the backend
    eventSource.addEventListener("connected", handleEvent);
    eventSource.addEventListener("answer_start", handleEvent);
    eventSource.addEventListener("done", handleEvent);
    eventSource.addEventListener("thinking", handleEvent);
    eventSource.addEventListener("tool_start", handleEvent);
    eventSource.addEventListener("tool_end", handleEvent);
    eventSource.addEventListener("tool_error", handleEvent);

    // Also listen for default 'message' events (fallback)
    eventSource.onmessage = handleEvent;

    eventSource.onerror = (error) => {
      console.error("[useSSE] ❌ Connection error:", error);
      onErrorRef.current?.(error);

      // Close and clean up on error
      eventSource.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = eventSource;
  }, [url, enabled]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("[useSSE] Disconnecting");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Connect when enabled and URL changes
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    disconnect,
    reconnect: () => {
      disconnect();
      connect();
    },
  };
}
