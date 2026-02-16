/**
 * Hook for agent streaming (adapted for VS Code message passing)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVSCodeMessaging } from './useVSCodeMessaging';
import type { Message, AgentEvent, ExtensionToWebviewMessage } from '../types';

export function useAgentStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentMessageIdRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  /**
   * Handle messages from extension
   */
  const handleExtensionMessage = useCallback((message: ExtensionToWebviewMessage) => {
    console.log('[useAgentStream] Extension message: - useAgentStream.ts:23', message.type);

    switch (message.type) {
      case 'sessionStarted':
        console.log('[useAgentStream] Session started: - useAgentStream.ts:27', message.sessionId);
        console.log('[useAgentStream] Current message ID: - useAgentStream.ts:28', currentMessageIdRef.current);
        currentSessionIdRef.current = message.sessionId; // Use ref for immediate access
        isProcessingRef.current = true;
        setCurrentSessionId(message.sessionId);
        setIsProcessing(true);
        setError(null);
        break;

      case 'agentEvent':
        // Only process events if they match the current session (use ref for immediate access)
        if (message.sessionId && message.sessionId !== currentSessionIdRef.current) {
          console.log('[useAgentStream] Ignoring event from different session. Current: - useAgentStream.ts:39', currentSessionIdRef.current, 'Event from:', message.sessionId);
          return;
        }
        handleAgentEvent(message.event);
        break;

      case 'sessionCancelled':
        console.log('[useAgentStream] Session cancelled: - useAgentStream.ts:46', message.sessionId);

        // Only clear refs and update state if this cancelled session is the current one
        // (prevents race condition where old session cancellation clears new message's refs)
        if (message.sessionId === currentSessionIdRef.current) {
          console.log('[useAgentStream] Cancelled session matches current session, clearing refs - useAgentStream.ts:50');
          currentSessionIdRef.current = null;
          isProcessingRef.current = false;
          setIsProcessing(false);
          setCurrentSessionId(null);

          // Mark current message as cancelled
          if (currentMessageIdRef.current) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === currentMessageIdRef.current
                  ? { ...msg, error: 'Cancelled by user', isProcessing: false }
                  : msg
              )
            );
            currentMessageIdRef.current = null;
          }
        } else {
          console.log('[useAgentStream] Ignoring stale session cancellation. Cancelled: - useAgentStream.ts:66', message.sessionId, 'Current:', currentSessionIdRef.current);
        }
        break;

      case 'error':
        console.error('[useAgentStream] Error: - useAgentStream.ts:66', message.error);
        isProcessingRef.current = false;
        setError(message.error);
        setIsProcessing(false);
        setCurrentSessionId(null);

        // Update current message with error
        if (currentMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? { ...msg, error: message.error, isProcessing: false }
                : msg
            )
          );
          currentMessageIdRef.current = null;
        }
        break;

      case 'historyCleared':
        console.log('[useAgentStream] History cleared - useAgentStream.ts:86');
        setMessages([]);
        setError(null);
        break;
    }
  }, []);

  /**
   * Handle individual agent events
   */
  const handleAgentEvent = useCallback((event: AgentEvent) => {
    const messageId = currentMessageIdRef.current;

    console.log('[useAgentStream] Agent event received: - useAgentStream.ts:99', event.type, 'messageId:', messageId);

    if (!messageId) {
      console.warn('[useAgentStream] ⚠️ DROPPING EVENT  No active session! Event: - useAgentStream.ts:102', event.type);
      console.warn('[useAgentStream] This means the UI will be stuck. Ref was: - useAgentStream.ts:103', messageId);
      return;
    }

    setMessages((prev) => {
      // Find the message - if it doesn't exist yet (race condition), ignore this event
      const messageExists = prev.some(msg => msg.id === messageId);
      if (!messageExists) {
        console.log('[useAgentStream] Message not in state yet (race condition), ignoring event: - useAgentStream.ts:111', event.type);
        return prev;
      }

      return prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        // Add event to message
        const updatedMsg = {
          ...msg,
          events: [...msg.events, event],
        };

        // If done, extract answer and mark as complete
        if (event.type === 'done') {
          updatedMsg.answer = event.answer;
          updatedMsg.isProcessing = false;
        }

        // If error, mark as complete with error
        if (event.type === 'tool_error') {
          updatedMsg.error = event.error;
          updatedMsg.isProcessing = false;
        }

        return updatedMsg;
      });
    });

    // Stop processing when done (only if this is still the current message)
    if (event.type === 'done' || event.type === 'tool_error') {
      console.log('[useAgentStream] ✅ Session complete, clearing refs. Was:', messageId);

      // Only clear refs if this done event is for the current message
      // (prevents race condition where old done event clears new message's refs)
      if (currentMessageIdRef.current === messageId) {
        console.log('[useAgentStream] This is the current message, clearing refs');
        currentSessionIdRef.current = null;
        currentMessageIdRef.current = null;
        isProcessingRef.current = false;
        setIsProcessing(false);
        setCurrentSessionId(null);
      } else {
        console.log('[useAgentStream] Stale done event for old message, keeping current refs');
      }
    }
  }, []);

  // Set up VS Code messaging
  const { sendQuery: sendQueryToExtension, cancelQuery, clearHistory: clearHistoryInExtension } = useVSCodeMessaging({
    onMessage: handleExtensionMessage
  });

  // Cancel any running sessions and clear stuck state when webview first loads
  useEffect(() => {
    console.log('[useAgentStream] Webview mounted, cleaning up stale state - useAgentStream.ts:158');

    // Clear stuck processing state
    isProcessingRef.current = false;
    currentMessageIdRef.current = null;
    currentSessionIdRef.current = null;
    setIsProcessing(false);

    // Cancel any running extension sessions
    cancelQuery();

    console.log('[useAgentStream] Ready for new queries - useAgentStream.ts:168');
  }, []); // Empty deps = runs once on mount

  /**
   * Send a new message to the agent
   */
  const sendMessage = useCallback(async (query: string, userId?: string) => {
    console.log('[useAgentStream] ═══════════════════════════════════════ - useAgentStream.ts:175');
    console.log('[useAgentStream] 📤 sendMessage called - useAgentStream.ts:176');
    console.log('[useAgentStream]    Query: - useAgentStream.ts:177', query);
    console.log('[useAgentStream]    UserId: - useAgentStream.ts:178', userId || 'anonymous');
    console.log('[useAgentStream]    isProcessing (state): - useAgentStream.ts:179', isProcessing);
    console.log('[useAgentStream]    isProcessing (ref): - useAgentStream.ts:180', isProcessingRef.current);
    console.log('[useAgentStream] ═══════════════════════════════════════ - useAgentStream.ts:181');

    if (isProcessingRef.current) {
      console.error('[useAgentStream] ❌ Already processing (ref check) - useAgentStream.ts:184');
      throw new Error('Already processing a message');
    }

    if (!query.trim()) {
      console.error('[useAgentStream] ❌ Query is empty - useAgentStream.ts:188');
      throw new Error('Query cannot be empty');
    }

    isProcessingRef.current = true;
    setError(null);
    setIsProcessing(true);

    // Create new message
    const messageId = `msg-${Date.now()}`;
    const newMessage: Message = {
      id: messageId,
      query: query.trim(),
      userId: userId || 'anonymous',
      timestamp: Date.now(),
      events: [],
      isProcessing: true,
    };

    // Set ref BEFORE state to ensure it's available when events arrive
    currentMessageIdRef.current = messageId;
    setMessages((prev) => [...prev, newMessage]);

    console.log('[useAgentStream] ✅ Message created: - useAgentStream.ts:210', messageId);
    console.log('[useAgentStream] ✅ Ref set to: - useAgentStream.ts:211', currentMessageIdRef.current);

    try {
      // Send query to extension
      console.log('[useAgentStream] 🚀 Sending query to extension... - useAgentStream.ts:215');
      sendQueryToExtension(query.trim(), userId);
      console.log('[useAgentStream] ✅ Query sent to extension - useAgentStream.ts:217');
    } catch (err) {
      console.error('[useAgentStream] ❌ Failed to send query: - useAgentStream.ts:219', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      isProcessingRef.current = false;
      currentMessageIdRef.current = null;
      setError(errorMessage);
      setIsProcessing(false);
      setCurrentSessionId(null);

      // Update message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, error: errorMessage, isProcessing: false }
            : msg
        )
      );
    }
  }, [sendQueryToExtension]);

  /**
   * Cancel the current running message
   */
  const cancelMessage = useCallback(() => {
    console.log('[useAgentStream] Cancelling message - useAgentStream.ts:242');
    cancelQuery();
  }, [cancelQuery]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    console.log('[useAgentStream] Clearing messages - useAgentStream.ts:250');
    clearHistoryInExtension();
  }, [clearHistoryInExtension]);

  return {
    messages,
    isProcessing,
    error,
    sendMessage,
    cancelMessage,
    clearMessages,
  };
}
