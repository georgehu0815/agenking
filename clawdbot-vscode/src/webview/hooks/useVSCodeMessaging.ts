/**
 * Hook for VS Code message passing (replaces useSSE)
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage, VSCodeAPI } from '../types';

// Acquire VS Code API once
let vscodeApi: VSCodeAPI | undefined;

function getVSCodeAPI(): VSCodeAPI {
  if (!vscodeApi) {
    vscodeApi = window.acquireVsCodeApi();
  }
  return vscodeApi;
}

export interface UseVSCodeMessagingOptions {
  onMessage: (message: ExtensionToWebviewMessage) => void;
}

/**
 * Hook for managing VS Code message passing
 */
export function useVSCodeMessaging({ onMessage }: UseVSCodeMessagingOptions) {
  const onMessageRef = useRef(onMessage);

  // Keep ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Set up message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      const message = event.data;
      console.log('[useVSCodeMessaging] Received message:', message.type);
      onMessageRef.current(message);
    };

    window.addEventListener('message', handleMessage);

    // Notify extension that webview is ready
    postMessage({ type: 'webviewReady' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Send message to extension
   */
  const postMessage = useCallback((message: WebviewToExtensionMessage) => {
    console.log('[useVSCodeMessaging] Sending message:', message.type);
    getVSCodeAPI().postMessage(message);
  }, []);

  /**
   * Send query to extension
   */
  const sendQuery = useCallback((query: string, userId?: string) => {
    postMessage({ type: 'sendQuery', query, userId });
  }, [postMessage]);

  /**
   * Cancel current query
   */
  const cancelQuery = useCallback(() => {
    postMessage({ type: 'cancelQuery' });
  }, [postMessage]);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    postMessage({ type: 'clearHistory' });
  }, [postMessage]);

  return {
    sendQuery,
    cancelQuery,
    clearHistory
  };
}

/**
 * Hook for managing persistent state in VS Code
 */
export function useVSCodeState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const api = getVSCodeAPI();

  const getState = useCallback((): T => {
    const state = api.getState();
    return state?.[key] ?? defaultValue;
  }, [key, defaultValue]);

  const setState = useCallback((value: T) => {
    const currentState = api.getState() || {};
    api.setState({
      ...currentState,
      [key]: value
    });
  }, [key]);

  return [getState(), setState];
}
