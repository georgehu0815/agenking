/**
 * Shared types between VS Code extension host and webview
 */

/**
 * Agent event types (matching backend)
 */
export type AgentEventType =
  | 'thinking'
  | 'tool_start'
  | 'tool_progress'
  | 'tool_end'
  | 'tool_error'
  | 'tool_limit'
  | 'context_cleared'
  | 'answer_start'
  | 'done';

export interface BaseAgentEvent {
  type: AgentEventType;
}

export interface ThinkingEvent extends BaseAgentEvent {
  type: 'thinking';
  message: string;
}

export interface ToolStartEvent extends BaseAgentEvent {
  type: 'tool_start';
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolProgressEvent extends BaseAgentEvent {
  type: 'tool_progress';
  tool: string;
  message: string;
}

export interface ToolEndEvent extends BaseAgentEvent {
  type: 'tool_end';
  tool: string;
  result: string;
  duration: number;
}

export interface ToolErrorEvent extends BaseAgentEvent {
  type: 'tool_error';
  tool: string;
  error: string;
}

export interface ToolLimitEvent extends BaseAgentEvent {
  type: 'tool_limit';
  tool: string;
  message: string;
}

export interface ContextClearedEvent extends BaseAgentEvent {
  type: 'context_cleared';
  message: string;
  clearedCount?: number;
  keptCount?: number;
}

export interface AnswerStartEvent extends BaseAgentEvent {
  type: 'answer_start';
}

export interface DoneEvent extends BaseAgentEvent {
  type: 'done';
  answer: string;
  iterations: number;
  totalTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  tokensPerSecond?: number;
}

export type AgentEvent =
  | ThinkingEvent
  | ToolStartEvent
  | ToolProgressEvent
  | ToolEndEvent
  | ToolErrorEvent
  | ToolLimitEvent
  | ContextClearedEvent
  | AnswerStartEvent
  | DoneEvent;

/**
 * Message in chat history
 */
export interface Message {
  id: string;
  query: string;
  userId: string;
  timestamp: number;
  events: AgentEvent[];
  answer?: string;
  isProcessing: boolean;
  error?: string;
}

/**
 * Messages sent from webview to extension
 */
export type WebviewToExtensionMessage =
  | { type: 'sendQuery'; query: string; userId?: string }
  | { type: 'cancelQuery' }
  | { type: 'clearHistory' }
  | { type: 'webviewReady' };

/**
 * Messages sent from extension to webview
 */
export type ExtensionToWebviewMessage =
  | { type: 'agentEvent'; event: AgentEvent; sessionId: string }
  | { type: 'error'; error: string }
  | { type: 'sessionStarted'; sessionId: string }
  | { type: 'sessionCancelled'; sessionId: string }
  | { type: 'historyCleared' };
