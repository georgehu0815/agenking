/**
 * WebSocket Gateway Agent for VSCode Extension
 *
 * This agent connects to the Gateway WebSocket server (replaces HTTP/SSE)
 * to access the full skill system and capabilities.
 *
 * Protocol migrated from SSE to WebSocket using the webapp client as source of truth.
 */

import type { AgentEvent } from '../shared/types.js';
import { GatewayClientNode } from '../gateway/gateway-client-node.js';
import type WebSocket from 'ws';

export interface HttpGatewayAgentConfig {
  gatewayUrl?: string; // Deprecated: HTTP URL for backward compatibility
  gatewayWsUrl?: string; // WebSocket URL (default: ws://localhost:18789)
  authToken?: string; // Gateway auth token (from ~/.clawdbot/clawdbot.json)
  signal?: AbortSignal;
  // For testing: allow injecting a mock WebSocket constructor
  WebSocketConstructor?: typeof WebSocket;
}

export class HttpGatewayAgent {
  private gatewayWsUrl: string;
  private authToken?: string;
  private signal?: AbortSignal;
  private WebSocketConstructor?: typeof WebSocket;

  constructor(config: HttpGatewayAgentConfig = {}) {
    // Prefer WebSocket URL, otherwise convert HTTP URL to WebSocket URL
    if (config.gatewayWsUrl) {
      this.gatewayWsUrl = config.gatewayWsUrl;
    } else if (config.gatewayUrl) {
      this.gatewayWsUrl = this.convertHttpToWsUrl(config.gatewayUrl);
    } else {
      this.gatewayWsUrl = 'ws://localhost:18789';
    }

    this.authToken = config.authToken;
    this.signal = config.signal;
    this.WebSocketConstructor = config.WebSocketConstructor;
  }

  static create(config: HttpGatewayAgentConfig = {}): HttpGatewayAgent {
    return new HttpGatewayAgent(config);
  }

  /**
   * Convert HTTP URL to WebSocket URL
   * http://localhost:3000 → ws://localhost:18789
   * https://example.com → wss://example.com:18789
   */
  private convertHttpToWsUrl(httpUrl: string): string {
    try {
      const url = new URL(httpUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      // Default WebSocket port is 18789 per webapp client
      return `${wsProtocol}//${url.hostname}:18789`;
    } catch {
      // Fallback if URL parsing fails
      return 'ws://localhost:18789';
    }
  }

  /**
   * Run query through WebSocket Gateway
   * Replaces SSE with WebSocket protocol
   */
  async *run(query: string): AsyncGenerator<AgentEvent> {
    const startTime = Date.now();
    let client: GatewayClientNode | null = null;

    // Event queue to bridge WebSocket events → async generator
    const eventQueue: AgentEvent[] = [];
    let done = false;
    let error: Error | null = null;
    let fullAnswer = '';

    try {
      // Yield thinking event
      yield {
        type: 'thinking',
        message: 'Connecting to Gateway...'
      };

      console.log('[HttpGatewayAgent] Connecting to WebSocket:', this.gatewayWsUrl);

      // Create WebSocket client
      client = new GatewayClientNode({
        url: this.gatewayWsUrl,
        displayName: 'VSCode Extension',
        authToken: this.authToken,
        WebSocketConstructor: this.WebSocketConstructor,
        onConnect: (payload) => {
          console.log('[HttpGatewayAgent] WebSocket connected:', payload);
        },
        onDisconnect: () => {
          console.log('[HttpGatewayAgent] WebSocket disconnected');
          if (!done) {
            done = true;
          }
        },
        onError: (err) => {
          console.error('[HttpGatewayAgent] WebSocket error:', err);
          error = err;
          done = true;
        }
      });

      // Connect to gateway
      await client.connect();

      // Generate session key: agent:main:vscode-{timestamp}
      const sessionKey = `agent:main:vscode-${Date.now()}`;

      // Subscribe to agent events (tool execution events)
      client.on('agent', (payload) => {
        console.log('[HttpGatewayAgent] Agent event:', payload);
        const event = this.mapGatewayEventToAgentEvent(payload);
        if (event) {
          eventQueue.push(event);
        }
      });

      // Subscribe to chat events (final answer)
      client.on('chat', (payload) => {
        console.log('[HttpGatewayAgent] Chat event:', payload);
        const event = this.mapChatEventToAgentEvent(payload);
        if (event) {
          // Store answer for done event
          if ('answer' in event && event.answer) {
            fullAnswer = event.answer;
          }
          eventQueue.push(event);

          // Mark as done if this is a final chat event
          if (event.type === 'done') {
            done = true;
          }
        }
      });

      // Send chat message
      yield {
        type: 'answer_start'
      };

      console.log('[HttpGatewayAgent] Sending chat message...');
      const response = await client.sendChat(query, sessionKey);
      console.log('[HttpGatewayAgent] Chat sent:', response);

      // Stream events from queue until done
      while (!done || eventQueue.length > 0) {
        // Check abort signal
        if (this.signal?.aborted) {
          console.log('[HttpGatewayAgent] Abort requested');
          await client.abortChat(sessionKey);
          client.disconnect();
          throw new Error('Aborted');
        }

        // Yield events from queue
        if (eventQueue.length > 0) {
          const event = eventQueue.shift()!;
          yield event;

          // Stop if done event received
          if (event.type === 'done') {
            break;
          }
        } else {
          // Wait for more events
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // If we didn't get a done event, create one
      if (!eventQueue.some(e => e.type === 'done')) {
        const totalTime = Date.now() - startTime;
        yield {
          type: 'done',
          answer: fullAnswer,
          iterations: 1,
          totalTime
        };
      }

      console.log('[HttpGatewayAgent] Stream completed');

      if (error) {
        throw error;
      }

    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Aborted') {
          throw err;
        }

        // Check if it's a connection error
        if (err.message.includes('WebSocket connection error') ||
            err.message.includes('ECONNREFUSED') ||
            err.message.includes('Not connected to gateway')) {
          throw new Error(
            `Cannot connect to WebSocket Gateway at ${this.gatewayWsUrl}\n\n` +
            `Please ensure the gateway is running with WebSocket support:\n` +
            `  cd /Users/ghu/aiworker/clawdbot\n` +
            `  npm run dev\n\n` +
            `Expected WebSocket endpoint: ws://localhost:18789\n\n` +
            `Or switch to Direct Mode in VSCode settings.`
          );
        }
      }

      throw err;
    } finally {
      // Clean up WebSocket connection
      if (client) {
        client.disconnect();
      }
    }
  }

  /**
   * Map gateway agent events to AgentEvent types
   * Based on webapp's useAgentStream.ts mapGatewayEvent function
   */
  private mapGatewayEventToAgentEvent(payload: any): AgentEvent | null {
    const stream = payload.stream;
    const data = payload.data || {};

    // Handle different stream types
    if (stream === "assistant") {
      // Ignore assistant stream - we'll use chat events for final text
      return null;
    }

    if (stream === "tool") {
      const phase = data.phase;
      const name = data.name || "unknown";

      if (phase === "start") {
        return {
          type: "tool_start",
          tool: name,
          args: data.args || {},
        };
      }

      if (phase === "end") {
        return {
          type: "tool_end",
          tool: name,
          result: data.result || data.output || "",
          duration: data.duration || 0,
        };
      }

      if (data.isError) {
        return {
          type: "tool_error",
          tool: name,
          error: data.error || data.message || "Tool error",
        };
      }

      // Tool progress
      return {
        type: "tool_progress",
        tool: name,
        message: data.meta || data.message || "Processing...",
      };
    }

    if (stream === "lifecycle") {
      const phase = data.phase;

      if (phase === "start") {
        return {
          type: "thinking",
          message: "Starting...",
        };
      }

      if (phase === "end") {
        return {
          type: "thinking",
          message: "Finishing...",
        };
      }

      if (phase === "error") {
        return {
          type: "tool_error",
          tool: "agent",
          error: data.error || "An error occurred",
        };
      }

      // Other lifecycle events
      return {
        type: "thinking",
        message: phase || "Processing...",
      };
    }

    // Unknown stream type
    console.warn('[HttpGatewayAgent] Unknown stream type:', stream, data);
    return null;
  }

  /**
   * Map gateway chat events to AgentEvent types
   * Based on webapp's useAgentStream.ts handleChatEvent function
   */
  private mapChatEventToAgentEvent(payload: any): AgentEvent | null {
    const state = payload.state;

    // Extract text from message.content[0].text
    let text = "";
    if (typeof payload.message === "string") {
      text = payload.message;
    } else if (payload.message?.content && Array.isArray(payload.message.content)) {
      const textContent = payload.message.content.find((c: any) => c.type === "text");
      text = textContent?.text || "";
    }

    if (!text) {
      return null;
    }

    // If final, create done event
    if (state === "final") {
      return {
        type: "done",
        answer: text,
        iterations: 1,
        totalTime: 0 // Will be set by caller
      };
    }

    // For delta (streaming), we could create answer_start events
    // For now, we'll just handle final state
    return null;
  }
}
