/**
 * Unit tests for useAgentStream hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentStream } from '../../src/webview/hooks/useAgentStream';
import type { ExtensionToWebviewMessage } from '../../src/shared/types';

// Mock VS Code API
const mockPostMessage = vi.fn();
const mockGetState = vi.fn(() => ({}));
const mockSetState = vi.fn();

global.window = {
  acquireVsCodeApi: () => ({
    postMessage: mockPostMessage,
    getState: mockGetState,
    setState: mockSetState,
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

describe('useAgentStream', () => {
  let messageHandler: ((event: MessageEvent<ExtensionToWebviewMessage>) => void) | null = null;

  beforeEach(() => {
    // Reset mocks
    mockPostMessage.mockClear();
    mockGetState.mockClear();
    mockSetState.mockClear();
    messageHandler = null;

    // Capture message event listener
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler as any;
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAgentStream());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should send webviewReady message on mount', () => {
    renderHook(() => useAgentStream());

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'webviewReady' });
  });

  it('should send query to extension', async () => {
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage('What is the weather?');
    });

    // Should send query message
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'sendQuery',
      query: 'What is the weather?',
      userId: undefined,
    });

    // Should create message in state
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].query).toBe('What is the weather?');
    expect(result.current.messages[0].isProcessing).toBe(true);
  });

  it('should handle session started event', async () => {
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage('Test query');
    });

    // Simulate session started message
    act(() => {
      messageHandler!({
        data: {
          type: 'sessionStarted',
          sessionId: 'test-session-123',
        },
      } as MessageEvent<ExtensionToWebviewMessage>);
    });

    expect(result.current.isProcessing).toBe(true);
  });

  it('should handle agent events', async () => {
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage('Test query');
    });

    // Start session
    act(() => {
      messageHandler!({
        data: {
          type: 'sessionStarted',
          sessionId: 'test-session',
        },
      } as MessageEvent<ExtensionToWebviewMessage>);
    });

    // Thinking event
    act(() => {
      messageHandler!({
        data: {
          type: 'agentEvent',
          sessionId: 'test-session',
          event: {
            type: 'thinking',
            message: 'Processing your request...',
          },
        },
      } as MessageEvent<ExtensionToWebviewMessage>);
    });

    await waitFor(() => {
      expect(result.current.messages[0].events).toHaveLength(1);
      expect(result.current.messages[0].events[0].type).toBe('thinking');
    });

    // Done event
    act(() => {
      messageHandler!({
        data: {
          type: 'agentEvent',
          sessionId: 'test-session',
          event: {
            type: 'done',
            answer: 'Here is your answer',
            iterations: 2,
            totalTime: 3000,
          },
        },
      } as MessageEvent<ExtensionToWebviewMessage>);
    });

    await waitFor(() => {
      expect(result.current.messages[0].answer).toBe('Here is your answer');
      expect(result.current.messages[0].isProcessing).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });
  });

  it('should handle error event', async () => {
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage('Test query');
    });

    // Error event
    act(() => {
      messageHandler!({
        data: {
          type: 'error',
          error: 'Something went wrong',
        },
      } as MessageEvent<ExtensionToWebviewMessage>);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Something went wrong');
      expect(result.current.isProcessing).toBe(false);
    });
  });

  it('should cancel message', async () => {
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage('Test query');
    });

    act(() => {
      result.current.cancelMessage();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'cancelQuery' });
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useAgentStream());

    act(() => {
      result.current.clearMessages();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'clearHistory' });
  });

  it('should handle history cleared event', async () => {
    const { result } = renderHook(() => useAgentStream());

    // Add some messages
    await act(async () => {
      await result.current.sendMessage('First query');
    });

    expect(result.current.messages).toHaveLength(1);

    // Clear history
    act(() => {
      messageHandler!({
        data: {
          type: 'historyCleared',
        },
      } as MessageEvent<ExtensionToWebviewMessage>);
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(0);
    });
  });

  it('should prevent sending while processing', async () => {
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage('First query');
    });

    expect(result.current.isProcessing).toBe(true);

    // Try to send another message while processing
    await expect(async () => {
      await act(async () => {
        await result.current.sendMessage('Second query');
      });
    }).rejects.toThrow('Already processing a message');
  });

  it('should prevent sending empty query', async () => {
    const { result } = renderHook(() => useAgentStream());

    await expect(async () => {
      await act(async () => {
        await result.current.sendMessage('   ');
      });
    }).rejects.toThrow('Query cannot be empty');
  });
});
