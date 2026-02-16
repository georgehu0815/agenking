# Webapp WebSocket Migration Guide

Last updated: 2026-02-15

This guide explains how to migrate the webapp from SSE (Server-Sent Events) to WebSocket Gateway protocol.

## Overview

**Current Architecture:**
```
React App (5173) --HTTP--> Express Server (3000) --SSE--> React App
```

**Target Architecture:**
```
React App (5173) --WebSocket--> Gateway Server (18789)
```

## Migration Steps

### Phase 1: Add WebSocket Client (Parallel)

Keep SSE working while adding WebSocket support.

#### 1.1 Install Dependencies

```bash
cd src/webapp/client
npm install # WebSocket is native in browsers
```

#### 1.2 Create WebSocket Client

**File:** `src/webapp/client/src/lib/gateway-client.ts`

```typescript
export type GatewayFrame =
  | { type: "req"; id: string; method: string; params?: any }
  | { type: "res"; id: string; ok: boolean; payload?: any; error?: any }
  | { type: "event"; event: string; payload: any; seq?: number };

export class GatewayClient {
  private ws: WebSocket | null = null;
  private requestCallbacks = new Map<string, (frame: any) => void>();
  private eventHandlers = new Map<string, Set<(payload: any) => void>>();
  private nextRequestId = 1;
  private connected = false;

  constructor(private url: string) {}

  async connect(clientInfo: {
    id: string;
    displayName?: string;
    version?: string;
    platform?: string;
    mode: "ui" | "webchat";
  }, auth?: { token?: string }) {
    return new Promise<any>((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[Gateway] WebSocket opened");
        this.send({
          type: "req",
          id: "connect",
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: clientInfo.id,
              displayName: clientInfo.displayName || "Web UI",
              version: clientInfo.version || "1.0.0",
              platform: clientInfo.platform || "browser",
              mode: clientInfo.mode,
            },
            auth,
          },
        });
      };

      this.ws.onmessage = (event) => {
        const frame: GatewayFrame = JSON.parse(event.data);

        if (frame.type === "res") {
          // Handle response
          const callback = this.requestCallbacks.get(frame.id);
          if (callback) {
            callback(frame);
            this.requestCallbacks.delete(frame.id);
          }

          // Special handling for connect response
          if (frame.id === "connect" && frame.ok) {
            this.connected = true;
            console.log("[Gateway] Connected:", frame.payload);
            resolve(frame.payload);
          }
        } else if (frame.type === "event") {
          // Handle event
          const handlers = this.eventHandlers.get(frame.event);
          if (handlers) {
            handlers.forEach(handler => handler(frame.payload));
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error("[Gateway] WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("[Gateway] WebSocket closed");
        this.connected = false;
      };
    });
  }

  private send(frame: GatewayFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    } else {
      throw new Error("WebSocket not connected");
    }
  }

  async request(method: string, params?: any): Promise<any> {
    if (!this.connected) {
      throw new Error("Not connected to gateway");
    }

    const id = `r${this.nextRequestId++}`;

    return new Promise((resolve, reject) => {
      this.requestCallbacks.set(id, (frame) => {
        if (frame.ok) {
          resolve(frame.payload);
        } else {
          reject(new Error(frame.error?.message || "Request failed"));
        }
      });

      this.send({ type: "req", id, method, params });

      // Timeout after 30s
      setTimeout(() => {
        if (this.requestCallbacks.has(id)) {
          this.requestCallbacks.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }

  on(event: string, handler: (payload: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (payload: any) => void) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  async sendChat(text: string, sessionKey?: string) {
    return this.request("chat.send", {
      idempotencyKey: `chat-${Date.now()}-${Math.random()}`,
      text,
      sessionKey,
    });
  }

  async getHistory(sessionKey?: string) {
    return this.request("chat.history", { sessionKey });
  }

  async health() {
    return this.request("health");
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}
```

#### 1.3 Update React Hook

**File:** `src/webapp/client/src/hooks/useGateway.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { GatewayClient } from "../lib/gateway-client";

export function useGateway(url: string = "ws://localhost:18789") {
  const [client, setClient] = useState<GatewayClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const gateway = new GatewayClient(url);

    gateway.connect(
      {
        id: "webchat-ui",
        displayName: "Dexter Web UI",
        mode: "ui",
      },
      {
        token: import.meta.env.VITE_GATEWAY_TOKEN,
      }
    )
      .then(() => {
        setConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setConnected(false);
      });

    setClient(gateway);

    return () => {
      gateway.disconnect();
    };
  }, [url]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!client) throw new Error("Not connected");
      return client.sendChat(text);
    },
    [client]
  );

  const getHistory = useCallback(async () => {
    if (!client) throw new Error("Not connected");
    return client.getHistory();
  }, [client]);

  return { client, connected, error, sendMessage, getHistory };
}
```

#### 1.4 Update React Component

**File:** `src/webapp/client/src/components/ChatContainer.tsx`

```typescript
import { useGateway } from "../hooks/useGateway";

export function ChatContainer() {
  const { client, connected, error, sendMessage } = useGateway();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!client) return;

    // Listen for agent events
    const handleAgentEvent = (payload: any) => {
      console.log("[Agent Event]", payload);
      // Update UI based on agent events (thinking, tool_start, etc.)
    };

    client.on("agent", handleAgentEvent);

    return () => {
      client.off("agent", handleAgentEvent);
    };
  }, [client]);

  const handleSend = async (text: string) => {
    try {
      const response = await sendMessage(text);
      console.log("[Chat Response]", response);
      // Update messages state
    } catch (err) {
      console.error("[Chat Error]", err);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!connected) return <div>Connecting to gateway...</div>;

  return (
    <div>
      {/* Your chat UI */}
      <MessageList messages={messages} />
      <InputBox onSend={handleSend} />
    </div>
  );
}
```

### Phase 2: Update Configuration

#### 2.1 Environment Variables

**File:** `src/webapp/client/.env`

```bash
# WebSocket Gateway
VITE_GATEWAY_URL=ws://localhost:18789
VITE_GATEWAY_TOKEN=your-auth-token

# Optional: Keep SSE as fallback
VITE_USE_WEBSOCKET=true
```

#### 2.2 Gateway Server Configuration

Ensure gateway is running with proper CORS for browser clients:

**File:** `.env` (project root)

```bash
# Gateway WebSocket
GATEWAY_PORT=18789
GATEWAY_HOST=0.0.0.0

# Auth
GATEWAY_AUTH_MODE=token
GATEWAY_AUTH_TOKEN=your-auth-token

# CORS (if needed for HTTP endpoints)
GATEWAY_CORS_ORIGINS=http://localhost:5173
```

### Phase 3: Add Client Type (Optional)

If you want a dedicated "webapp" client type:

#### 3.1 Update client-info.ts

**File:** `src/gateway/protocol/client-info.ts`

```typescript
export const GATEWAY_CLIENT_IDS = {
  // ... existing ...
  WEBAPP: "webapp" as const,
} as const;

export const GATEWAY_CLIENT_MODES = {
  // ... existing ...
  WEBAPP: "webapp" as const,
} as const;
```

#### 3.2 Use in client

```typescript
gateway.connect(
  {
    id: "webapp",
    mode: "webapp",
  },
  // ... auth
);
```

### Phase 4: Testing

#### 4.1 Start Services

```bash
# Terminal 1: Start Gateway
npm run dev

# Terminal 2: Start React App
cd src/webapp/client
npm run dev
```

#### 4.2 Test Connection

Open browser console at http://localhost:5173 and verify:

```
[Gateway] WebSocket opened
[Gateway] Connected: { type: 'hello-ok', protocol: 3, ... }
```

#### 4.3 Test Chat

Send a message and verify:
- Request frame sent
- Response frame received
- Agent events received (if applicable)

### Phase 5: Remove SSE (Cleanup)

Once WebSocket is working:

1. Remove Express HTTP server from `src/gateway/channels/http/`
2. Remove SSE-related code from React app
3. Update documentation
4. Remove old environment variables

## Comparison: SSE vs WebSocket

| Feature | SSE (Current) | WebSocket (Target) |
|---------|---------------|-------------------|
| Protocol | HTTP + SSE | WebSocket |
| Direction | Server → Client only | Bidirectional |
| Connection | Separate HTTP endpoint | Single WS connection |
| Events | Custom SSE format | Gateway protocol frames |
| Auth | HTTP headers | Connect frame |
| State | Stateless HTTP | Stateful connection |
| Features | Chat only | Full gateway access |

## Benefits

1. **Unified Protocol** - Same as TUI, macOS app, CLI
2. **Real-time Events** - Presence, health, tick, etc.
3. **Multi-agent Support** - Session routing to different agents
4. **Better Performance** - Native bidirectional, less overhead
5. **Type Safety** - TypeBox validation on all frames

## Troubleshooting

### WebSocket Connection Refused

**Problem:** `ERR_CONNECTION_REFUSED` at ws://localhost:18789

**Solution:**
- Ensure gateway server is running: `npm run dev`
- Check gateway port in `.env`: `GATEWAY_PORT=18789`
- Verify firewall allows WebSocket connections

### Authentication Failed

**Problem:** `{ ok: false, error: { code: "AUTH_FAILED", ... } }`

**Solution:**
- Check auth token matches gateway configuration
- Verify auth mode is "token" or "none" in gateway
- Ensure token is passed in connect params

### Frame Validation Errors

**Problem:** `{ ok: false, error: { code: "INVALID_FRAME", ... } }`

**Solution:**
- Verify frame structure matches TypeBox schemas
- Check protocol version compatibility (use 3)
- Ensure all required fields are present

### Events Not Received

**Problem:** Agent events not appearing in UI

**Solution:**
- Verify event handler is registered before events fire
- Check event name matches exactly ("agent", "chat", etc.)
- Ensure WebSocket connection is still open

## References

- [Gateway Protocol Documentation](../concepts/typebox.md)
- [Gateway Architecture](../concepts/architecture.md)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [TypeBox Schemas](../../src/gateway/protocol/schema.ts)
- [Test Examples](../../src/gateway/protocol/typebox-docs.test.ts)

---

**Status:** Ready for implementation
**Estimated Effort:** 1-2 days
**Risk:** Low (can run in parallel with SSE)
