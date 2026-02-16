/**
 * WebSocket Gateway Client for Node.js (VSCode Extension)
 *
 * Connects to the gateway WebSocket server and handles:
 * - Protocol frames (req/res/event)
 * - Chat messages
 * - Agent events
 *
 * Ported from webapp client: /Users/ghu/aiworker/clawdbot/src/webapp/client/src/lib/gateway-client.ts
 */

import WebSocket from 'ws';

export type GatewayFrame =
  | { type: "req"; id: string; method: string; params?: any }
  | { type: "res"; id: string; ok: boolean; payload?: any; error?: any }
  | { type: "event"; event: string; payload: any; seq?: number };

export interface GatewayClientOptions {
  url: string;
  clientId?: string;
  displayName?: string;
  authToken?: string;
  onConnect?: (payload: any) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  // For testing: allow injecting a mock WebSocket constructor
  WebSocketConstructor?: typeof WebSocket;
}

export class GatewayClientNode {
  private ws: WebSocket | null = null;
  private requestCallbacks = new Map<string, (frame: any) => void>();
  private eventHandlers = new Map<string, Set<(payload: any) => void>>();
  private nextRequestId = 1;
  private connected = false;
  private reconnectTimeout?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private options: GatewayClientOptions;
  private WebSocketConstructor: typeof WebSocket;

  constructor(options: GatewayClientOptions) {
    this.options = options;
    this.WebSocketConstructor = options.WebSocketConstructor || WebSocket;
  }

  /**
   * Connect to the gateway
   */
  async connect(): Promise<any> {
    if (this.ws?.readyState === this.WebSocketConstructor.OPEN) {
      console.log("[GatewayClientNode] Already connected");
      return;
    }

    console.log("[GatewayClientNode] Connecting to:", this.options.url);

    return new Promise<any>((resolve, reject) => {
      try {
        this.ws = new this.WebSocketConstructor(this.options.url) as WebSocket;

        this.ws.on('open', () => {
          console.log("[GatewayClientNode] WebSocket opened, sending connect frame");
          this.sendConnectFrame();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          // Handle Node.js WebSocket.Data type (string | Buffer | ArrayBuffer | Buffer[])
          const message = typeof data === 'string' ? data : data.toString();
          const frame: GatewayFrame = JSON.parse(message);
          this.handleFrame(frame, resolve, reject);
        });

        this.ws.on('error', (error) => {
          console.error("[GatewayClientNode] WebSocket error:", error);
          this.options.onError?.(new Error("WebSocket connection error"));
          reject(new Error("WebSocket connection error"));
        });

        this.ws.on('close', () => {
          console.log("[GatewayClientNode] WebSocket closed");
          this.connected = false;
          this.options.onDisconnect?.();
          this.attemptReconnect();
        });
      } catch (error) {
        console.error("[GatewayClientNode] Failed to create WebSocket:", error);
        reject(error);
      }
    });
  }

  private sendConnectFrame() {
    this.send({
      type: "req",
      id: "connect",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: this.options.clientId || "webapp",
          displayName: this.options.displayName || "VSCode Extension",
          version: "1.0.0",
          platform: "browser",
          mode: "webapp",
        },
        auth: this.options.authToken ? { token: this.options.authToken } : undefined,
      },
    });
  }

  private handleFrame(
    frame: GatewayFrame,
    connectResolve?: (value: any) => void,
    connectReject?: (reason?: any) => void,
  ) {
    console.log("[GatewayClientNode] Received frame:", frame.type);

    if (frame.type === "res") {
      // Handle response
      const callback = this.requestCallbacks.get(frame.id);
      if (callback) {
        callback(frame);
        this.requestCallbacks.delete(frame.id);
      }

      // Special handling for connect response
      if (frame.id === "connect") {
        if (frame.ok) {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log("[GatewayClientNode] Connected successfully:", frame.payload);
          this.options.onConnect?.(frame.payload);
          connectResolve?.(frame.payload);
        } else {
          console.error("[GatewayClientNode] Connect failed:", frame.error);
          const error = new Error(frame.error?.message || "Connection failed");
          this.options.onError?.(error);
          connectReject?.(error);
        }
      }
    } else if (frame.type === "event") {
      // Handle event
      console.log("[GatewayClientNode] Event:", frame.event, frame.payload);
      const handlers = this.eventHandlers.get(frame.event);
      if (handlers) {
        handlers.forEach((handler) => handler(frame.payload));
      }
    }
  }

  private send(frame: GatewayFrame) {
    if (this.ws?.readyState === this.WebSocketConstructor.OPEN) {
      this.ws.send(JSON.stringify(frame));
    } else {
      console.error("[GatewayClientNode] Cannot send: WebSocket not open");
      throw new Error("WebSocket not connected");
    }
  }

  /**
   * Send a request and wait for response
   */
  async request(method: string, params?: any): Promise<any> {
    if (!this.connected) {
      throw new Error("Not connected to gateway");
    }

    const id = `r${this.nextRequestId++}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.requestCallbacks.has(id)) {
          this.requestCallbacks.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 30000);

      this.requestCallbacks.set(id, (frame) => {
        clearTimeout(timeout);
        if (frame.ok) {
          resolve(frame.payload);
        } else {
          reject(new Error(frame.error?.message || "Request failed"));
        }
      });

      this.send({ type: "req", id, method, params });
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (payload: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler: (payload: any) => void) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Send a chat message
   */
  async sendChat(message: string, sessionKey: string): Promise<any> {
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (!sessionKey || sessionKey.trim().length === 0) {
      throw new Error("Session key is required");
    }

    return this.request("chat.send", {
      sessionKey,
      message,
      idempotencyKey: `chat-${Date.now()}-${Math.random()}`,
    });
  }

  /**
   * Get chat history
   */
  async getHistory(sessionKey?: string): Promise<any> {
    return this.request("chat.history", { sessionKey });
  }

  /**
   * Abort a chat session
   */
  async abortChat(sessionKey: string, runId?: string): Promise<any> {
    const params: any = { sessionKey };
    if (runId) {
      params.runId = runId;
    }
    return this.request("chat.abort", params);
  }

  /**
   * Health check
   */
  async health(): Promise<any> {
    return this.request("health");
  }

  /**
   * Disconnect from gateway
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }

    this.requestCallbacks.clear();
    this.eventHandlers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === this.WebSocketConstructor.OPEN;
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[GatewayClientNode] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(
      `[GatewayClientNode] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((err) => {
        console.error("[GatewayClientNode] Reconnect failed:", err);
      });
    }, delay);
  }
}
