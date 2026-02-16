# Web UI to Gateway to Agent: Message Flow Design Guide

## Overview

This document describes the complete message flow architecture in Clawdbot, from the Web UI through the HTTP Gateway to the backend agent and tools/skills execution.

## Architecture Components

### 1. **Web UI / Control UI**
- Static web interface for user interaction
- Connects to Gateway via WebSocket
- Sends user messages and receives agent responses
- Client ID: `control-ui` or `webchat`

### 2. **HTTP Gateway**
- Central hub for all communication
- Runs on `127.0.0.1:18789` (default)
- Supports multiple protocols:
  - **WebSocket**: Primary protocol for real-time communication
  - **HTTP endpoints**: REST API for specific operations
    - `/v1/responses` (OpenResponses compatible)
    - `/tools/invoke` (Tool invocation)
    - `/openai/v1/chat/completions` (OpenAI compatible)
- Handles authentication, authorization, and device pairing
- Routes messages to appropriate agents based on configuration

### 3. **Backend Agent System**
- Pi Coding Agent embedded runner
- Processes user messages with LLM providers
- Executes tools and skills
- Streams responses back to gateway

### 4. **Tools & Skills System**
- Built-in tools (Bash, Read, Write, Edit, Grep, etc.)
- Custom skills (extensible via plugins)
- MCP server integration
- HTTP tool invocation endpoint

## Message Flow Diagrams

### Visual Diagram Files

High-resolution PNG diagrams are available in this directory:
- **[message-flow-sequence.png](./message-flow-sequence.png)** - Complete sequence diagram (5259×9696px)
- **[http-endpoints-flow.png](./http-endpoints-flow.png)** - HTTP API endpoints flow (9309×5013px)
- **[multi-agent-routing.png](./multi-agent-routing.png)** - Multi-agent routing logic (9552×7170px)
- **[tui-backend-services.png](./tui-backend-services.png)** - TUI and backend services architecture (9552×6669px)

### Complete Message Flow: Web UI → Gateway → Agent → Tools

```
┌─────────────┐         WebSocket           ┌──────────────────┐
│   Web UI    │◄──────────────────────────► │  HTTP Gateway    │
│ (Control UI)│         (Port 18789)        │   (server.ts)    │
└─────────────┘                             └──────────────────┘
                                                      │
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
                    ▼                                 ▼                                 ▼
            ┌───────────────┐              ┌──────────────────┐              ┌─────────────────┐
            │ Authentication│              │  Message Router  │              │  Session Store  │
            │   & Pairing   │              │  (agent-job.ts)  │              │ (sessions.ts)   │
            │  (auth.ts)    │              └──────────────────┘              └─────────────────┘
            └───────────────┘                        │
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  Agent Command     │
                                          │  (agent.ts)        │
                                          └────────────────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  Pi Agent Runner   │
                                          │  (agent-runner.ts) │
                                          └────────────────────┘
                                                     │
                    ┌────────────────────────────────┼────────────────────────────────┐
                    │                                │                                │
                    ▼                                ▼                                ▼
            ┌──────────────┐              ┌──────────────────┐              ┌──────────────────┐
            │ Built-in     │              │  Skills System   │              │  MCP Servers     │
            │ Tools        │              │  (skills/)       │              │  (mcp/)          │
            │ (Bash, Read, │              │  - Custom Skills │              │  - External      │
            │  Write, etc) │              │  - Plugins       │              │    Resources     │
            └──────────────┘              └──────────────────┘              └──────────────────┘
```

## Detailed Message Flow Steps

### Phase 1: Connection & Handshake

```
Web UI                    Gateway                     Backend
  │                         │                           │
  │──1. WebSocket Connect──►│                           │
  │                         │                           │
  │◄──2. Connect Challenge──│                           │
  │                         │                           │
  │──3. Connect Frame──────►│                           │
  │   (auth, device ID)     │                           │
  │                         │──4. Validate Auth────►    │
  │                         │                           │
  │                         │──5. Device Pairing───►    │
  │                         │   (if new device)         │
  │                         │                           │
  │◄──6. Hello-OK──────────│                            │
  │   (snapshot, features)  │                           │
  │                         │                           │
```

**Key Files:**
- `src/gateway/server/ws-connection/message-handler.ts` - WebSocket connection handler
- `src/gateway/auth.ts` - Authentication logic
- `src/gateway/protocol/schema/frames.ts` - Protocol frame definitions

### Phase 2: Message Send (User → Agent)

```
Web UI                    Gateway                     Agent System
  │                         │                           │
  │──1. Request Frame──────►│                           │
  │   {type:"req",          │                           │
  │    method:"agent",      │                           │
  │    params: {            │                           │
  │      message: "Hello",  │                           │
  │      sessionKey: "..."  │                           │
  │    }}                   │                           │
  │                         │                           │
  │                         │──2. Validate Request─►    │
  │                         │                           │
  │                         │──3. Resolve Session──►    │
  │                         │   Key & Agent ID          │
  │                         │                           │
  │                         │──4. Create Run ID────►    │
  │                         │                           │
  │◄──5. Response (ACK)─────│                           │
  │   {runId, status:       │                           │
  │    "accepted"}          │                           │
  │                         │                           │
  │                         │──6. Queue Agent Job──►    │
  │                         │                           │
  │                         │                           │──7. Load History──►
  │                         │                           │   (history.ts)
  │                         │                           │
  │                         │                           │◄──8. Build Context──
  │                         │                           │
  │                         │                           │──9. Call LLM Provider
  │                         │                           │   (Anthropic/OpenAI)
  │                         │                           │
```

**Key Files:**
- `src/gateway/server-methods/agent.ts` - Agent request handler
- `src/commands/agent.ts` - Agent command processing
- `src/auto-reply/reply/agent-runner.ts` - Agent execution
- `src/auto-reply/reply/history.ts` - Conversation history

### Phase 3: Agent Processing & Tool Execution

```
Agent System              Tool System               LLM Provider
  │                         │                           │
  │──1. Send Prompt────────────────────────────────────►│
  │   (with tools list)     │                           │
  │                         │                           │
  │◄──2. LLM Response───────────────────────────────────│
  │   (tool use request)    │                           │
  │                         │                           │
  │──3. Parse Tool Call────►│                           │
  │                         │                           │
  │                         │──4. Validate Tool─────►   │
  │                         │   Policy & Permissions    │
  │                         │                           │
  │                         │──5. Execute Tool──────►   │
  │                         │   (Bash/Read/Write/etc)   │
  │                         │                           │
  │                         │◄──6. Tool Result──────    │
  │◄──7. Tool Result────────│                           │
  │                         │                           │
  │──8. Send Tool Result───────────────────────────────►│
  │   to LLM                │                           │
  │                         │                           │
  │◄──9. Final Response─────────────────────────────────│
  │                         │                           │
```

**Key Files:**
- `src/agents/clawdbot-tools.ts` - Tool definitions
- `src/agents/pi-tools.policy.ts` - Tool policy enforcement
- `src/agents/tool-policy.ts` - Tool authorization
- `src/gateway/tools-invoke-http.ts` - HTTP tool invocation

### Phase 4: Streaming Response Back to Web UI

```
Agent System              Gateway                   Web UI
  │                         │                         │
  │──1. Event: agent.start─►│                         │
  │   {phase: "start"}      │                         │
  │                         │──2. Event Frame────────►│
  │                         │   {type: "event",       │
  │                         │    event: "agent"}      │
  │                         │                         │
  │──3. Event: agent.stream►│                         │
  │   {text chunk}          │                         │
  │                         │──4. Event Frame────────►│
  │                         │   (streaming text)      │
  │                         │                         │
  │──5. Event: agent.tool──►│                         │
  │   {tool call}           │                         │
  │                         │──6. Event Frame────────►│
  │                         │   (tool execution)      │
  │                         │                         │
  │──7. Event: agent.end───►│                         │
  │   {phase: "end"}        │                         │
  │                         │──8. Event Frame────────►│
  │                         │   (completion)          │
  │                         │                         │
  │                         │──9. Response Frame─────►│
  │                         │   {runId, status: "ok"} │
  │                         │                         │
```

**Key Files:**
- `src/gateway/server-methods/agent-job.ts` - Agent job tracking
- `src/infra/agent-events.ts` - Event system
- `src/gateway/server/ws-connection.ts` - WebSocket event streaming

## HTTP API Endpoints

### 1. OpenResponses API (`/v1/responses`)

Compatible with the OpenResponses protocol for universal agent integration.

**Request:**
```http
POST /v1/responses HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "optional-session-key",
  "items": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Hello, how are you?"}
      ]
    }
  ],
  "tools": [/* optional tool definitions */],
  "stream": true
}
```

**Response (SSE):**
```
event: response.start
data: {"type":"response.start","response_id":"..."}

event: output.start
data: {"type":"output.start","output_index":0,"item":{"type":"message","role":"assistant"}}

event: output.text.delta
data: {"type":"output.text.delta","text":"Hello!"}

event: output.end
data: {"type":"output.end"}

event: response.end
data: {"type":"response.end","usage":{...}}
```

**Key File:**
- `src/gateway/openresponses-http.ts` - OpenResponses handler

### 2. Tool Invocation API (`/tools/invoke`)

Direct HTTP endpoint for invoking specific tools without agent interaction.

**Request:**
```http
POST /tools/invoke HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json
X-Clawdbot-Message-Channel: whatsapp
X-Clawdbot-Account-Id: user@example.com

{
  "tool": "Bash",
  "action": "execute",
  "args": {
    "command": "ls -la",
    "description": "List files"
  },
  "sessionKey": "main"
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "stdout": "...",
    "stderr": "",
    "exitCode": 0
  }
}
```

**Key File:**
- `src/gateway/tools-invoke-http.ts` - Tool HTTP handler

### 3. OpenAI Compatible API (`/openai/v1/chat/completions`)

OpenAI-compatible endpoint for drop-in replacement.

**Request:**
```http
POST /openai/v1/chat/completions HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "model": "claude-sonnet-4-5",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}
```

**Key File:**
- `src/gateway/openai-http.ts` - OpenAI compatibility handler

## Security & Authorization Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Gateway Authentication                               │
│     ├─ Token-based (gateway.auth.token)                 │
│     ├─ Password-based (gateway.auth.password)           │
│     └─ Tailscale integration                            │
│                                                          │
│  2. Device Pairing                                       │
│     ├─ Device identity verification                     │
│     ├─ Public key cryptography                          │
│     ├─ Local trust (loopback auto-approve)              │
│     └─ Remote pairing approval required                 │
│                                                          │
│  3. Tool Policy Enforcement                              │
│     ├─ Global tool policy                               │
│     ├─ Agent-specific policy                            │
│     ├─ Session-based policy                             │
│     ├─ Profile-based policy                             │
│     └─ Permission checks before execution               │
│                                                          │
│  4. Session Isolation                                    │
│     ├─ Session key routing                              │
│     ├─ Agent workspace isolation                        │
│     └─ Multi-agent support                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Files:**
- `src/gateway/auth.ts` - Gateway authentication
- `src/infra/device-pairing.ts` - Device pairing system
- `src/agents/tool-policy.ts` - Tool policy management

## Protocol Frames

The gateway uses a typed frame protocol over WebSocket:

### Request Frame
```typescript
{
  type: "req",
  id: string,        // unique request ID
  method: string,    // "agent", "send", "health", etc.
  params?: unknown   // method-specific parameters
}
```

### Response Frame
```typescript
{
  type: "res",
  id: string,        // matches request ID
  ok: boolean,       // success/failure
  payload?: unknown, // response data
  error?: {          // if ok=false
    code: string,
    message: string,
    details?: unknown
  }
}
```

### Event Frame
```typescript
{
  type: "event",
  event: string,        // "agent", "presence", "tick", etc.
  payload?: unknown,    // event-specific data
  seq?: number,         // sequence number
  stateVersion?: string // state version for sync
}
```

**Key File:**
- `src/gateway/protocol/schema/frames.ts` - Frame definitions

## Agent Event Streams

The agent system emits various event streams:

### 1. **Lifecycle Events**
- `phase: "start"` - Agent run started
- `phase: "end"` - Agent run completed
- `phase: "error"` - Agent run failed

### 2. **Streaming Events**
- Text chunks as they arrive from LLM
- Tool calls and results
- Progress updates

### 3. **State Events**
- Presence updates
- Health checks
- System status changes

**Key Files:**
- `src/infra/agent-events.ts` - Event emitter system
- `src/gateway/server-methods/agent-job.ts` - Event tracking

## Session & Agent Routing

```
┌──────────────────────────────────────────────────────┐
│           Session Key Resolution                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Client Request                                       │
│      │                                                │
│      ├─► sessionKey provided?                        │
│      │       │                                        │
│      │       ├─ Yes ─► Use provided sessionKey       │
│      │       │                                        │
│      │       └─ No ──► Use "main" session            │
│      │                                                │
│      ├─► Resolve Agent ID from sessionKey            │
│      │   (agents.list[].workspace mapping)           │
│      │                                                │
│      ├─► Load Agent Configuration                    │
│      │   - System prompt                             │
│      │   - Tool policy                               │
│      │   - Model preferences                         │
│      │   - Identity (name, avatar, theme)            │
│      │                                                │
│      └─► Execute in Agent Context                    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Key Files:**
- `src/config/sessions.ts` - Session resolution
- `src/routing/session-key.ts` - Session key utilities
- `src/config/zod-schema.agents.ts` - Agent configuration

## Tool Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│              Tool Execution Pipeline                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Tool Call from LLM                                   │
│     └─► Parse tool name and arguments                   │
│                                                          │
│  2. Tool Resolution                                      │
│     ├─► Check built-in tools (Bash, Read, Write, etc.)  │
│     ├─► Check skills (custom/plugins)                   │
│     └─► Check MCP servers                               │
│                                                          │
│  3. Policy Validation                                    │
│     ├─► Global tool policy                              │
│     ├─► Agent tool policy                               │
│     ├─► Session tool policy                             │
│     ├─► Profile-based policy                            │
│     └─► Permission approval (if required)               │
│                                                          │
│  4. Argument Validation                                  │
│     └─► Validate against tool schema                    │
│                                                          │
│  5. Tool Execution                                       │
│     ├─► Built-in: Direct execution                      │
│     ├─► Skill: Call skill handler                       │
│     └─► MCP: Call MCP server                            │
│                                                          │
│  6. Result Processing                                    │
│     ├─► Format result for LLM                           │
│     ├─► Handle errors/failures                          │
│     └─► Return to agent                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Files:**
- `src/agents/clawdbot-tools.ts` - Built-in tools
- `src/agents/pi-tools.policy.ts` - Policy enforcement
- `src/skills/` - Skills system
- `src/mcp/` - MCP server integration

## Canvas System (A2UI)

For interactive UI elements, Clawdbot includes a Canvas Host:

```
Agent                     Canvas Host              Web Browser
  │                         │                           │
  │──1. Generate HTML──────►│                           │
  │   (A2UI components)     │                           │
  │                         │──2. Serve HTML──────────►│
  │                         │   (port 18793)            │
  │                         │                           │
  │                         │◄──3. User Interaction─────│
  │                         │   (form submit, etc.)     │
  │                         │                           │
  │◄──4. Event Callback─────│                           │
  │   (user action)         │                           │
  │                         │                           │
```

**Default Port:** `18793`

## Configuration

Key configuration sections affecting message flow:

### Gateway Configuration
```json5
{
  "gateway": {
    "bind": "127.0.0.1:18789",
    "auth": {
      "token": "secret-token",     // or
      "password": "secret-password"
    },
    "trustedProxies": ["127.0.0.1"],
    "http": {
      "enabled": true,
      "responses": {
        "enabled": true,
        "maxBodyBytes": 20971520
      }
    }
  }
}
```

### Agent Configuration
```json5
{
  "agents": {
    "list": [
      {
        "id": "main",
        "workspace": "~/clawd",
        "identity": {
          "name": "Clawd",
          "theme": "helpful assistant",
          "emoji": "🦞"
        },
        "tools": {
          "policy": "default",
          "allow": ["Bash", "Read", "Write"]
        }
      }
    ]
  }
}
```

## Error Handling

```
┌─────────────────────────────────────────────────────────┐
│                 Error Flow                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Connection Errors                                       │
│    ├─► Authentication failure → Close connection        │
│    ├─► Invalid frame → Error response + close           │
│    └─► Protocol mismatch → Error response + close       │
│                                                          │
│  Request Errors                                          │
│    ├─► Validation error → Error response                │
│    ├─► Authorization error → Error response             │
│    └─► Internal error → Error response with retry info  │
│                                                          │
│  Agent Errors                                            │
│    ├─► LLM error → Event with error phase               │
│    ├─► Tool error → Continue with error result          │
│    └─► Timeout → Event with timeout error               │
│                                                          │
│  Recovery                                                │
│    ├─► Retryable errors include retryAfterMs            │
│    ├─► Idempotency keys prevent duplicate requests      │
│    └─► Client can retry with same idempotency key       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Connection Pooling
- Single WebSocket per client
- Multiplexed requests over single connection
- Server push for real-time events

### Streaming
- Progressive text streaming from LLM
- Tool results streamed incrementally
- Backpressure handling with buffered bytes limit

### Caching
- Agent run cache (10 min TTL)
- Health snapshot cache
- Model catalog cache

### Limits
- Max payload: 10 MB (configurable)
- Max buffered bytes: 16 MB
- Tick interval: 30s

**Key File:**
- `src/gateway/server-constants.ts` - Configuration limits

## Monitoring & Observability

### Health Checks
```
GET /health (if HTTP enabled)
WS method: "health"
```

Returns:
- Gateway status
- Provider connectivity
- Active connections
- System resources

### Logging
- WebSocket frame logging (optional)
- Agent execution logs
- Tool execution logs
- Error tracking

### Metrics
- Request/response latency
- Tool execution time
- LLM token usage
- Error rates

**Key Files:**
- `src/gateway/server/health-state.ts` - Health tracking
- `src/gateway/ws-log.ts` - WebSocket logging

## TUI and Backend Services Architecture

### Overview

The TUI (Terminal User Interface) provides an interactive shell interface for Clawdbot, connecting to the same backend services as the Web UI. The architecture features clear separation of concerns across multiple service layers.

**Architecture Diagram:** [tui-backend-services.png](./tui-backend-services.png)

### Architecture Layers

#### 1. Client Layer
- **TUI**: Interactive terminal shell with WebSocket connection, streaming responses, rich rendering
- **CLI Commands**: One-shot HTTP requests (`clawdbot agent`, `clawdbot message`)
- **macOS App**: Native desktop client with same WebSocket protocol

#### 2. Gateway Service (Port 18789)
**WebSocket Server:**
- Connection Handler: Handshake, authentication, device pairing
- Message Handler: Frame processing and routing
- Event Emitter: Real-time server-push events

**HTTP Server:**
- `/v1/responses`: OpenResponses API
- `/tools/invoke`: Direct tool execution
- `/openai/v1/chat/completions`: OpenAI-compatible endpoint

#### 3. Backend Services

**Agent Service:**
- Agent Command Handler: Request validation and routing
- Pi Agent Runner: LLM interaction and streaming
- Job Queue: Asynchronous processing

**Session Service:**
- Session Store: SQLite-backed conversation history
- Session Resolver: Multi-agent routing
- Context Builder: History + memory integration

**Tools & Skills Service:**
- Tool Registry: Built-in and custom tools
- Policy Engine: Multi-level authorization
- Tool Executor: Sandboxed execution
- Skill Loader/Runner: Plugin system
- MCP Adapter: External tool integration

#### 4. Storage Layer
- **SQLite**: Sessions, messages, runs, approvals, device pairing
- **File System**: Workspaces, config, skills, logs
- **Vector DB**: Embeddings for RAG and memory search

#### 5. External Services
- **LLM Providers**: Anthropic, OpenAI, Azure, Vertex AI, Bedrock
- **MCP Servers**: File system, GitHub, search, databases
- **Chat Platforms**: WhatsApp, Telegram, Slack, Discord, Signal

#### 6. Monitoring
- **Health Check**: Service status and connectivity
- **Logger**: Structured logging with subsystem tagging
- **Metrics**: Latency, usage, errors, throughput

### Data Flow: TUI Message Example

```
User → TUI → Gateway (WebSocket) → Agent Command Handler →
Session Resolver → Job Queue → Agent Runner → Context Builder →
LLM Provider (streaming) → [Tool Call] → Tool Registry →
Policy Engine → Tool Executor → Tool Result → LLM (final) →
Session Store (save) → Gateway (events) → TUI (display)
```

### Service Communication Patterns

**Synchronous**: CLI → Gateway, Gateway → Session Resolver, Tool Registry → Policy Engine

**Asynchronous**: Gateway → TUI (events), Agent Runner → Event Emitter, Job Queue → Agent Runner

**Pub/Sub**: Agent lifecycle events, presence updates, system events

### Key Features

- **Multi-tenancy**: Multiple isolated agent workspaces
- **Streaming**: Real-time response chunks for immediate feedback
- **Tool Sandboxing**: Isolated execution with resource limits
- **Policy Enforcement**: Multi-level authorization (global, agent, session, profile)
- **Observability**: Comprehensive logging, metrics, and health checks
- **Extensibility**: Plugin system for custom skills and MCP servers

## Related Documentation

- [Gateway Architecture](../concepts/architecture.md)
- [Agent Loop](../concepts/agent-loop.md)
- [Multi-Agent Routing](../concepts/multi-agent.md)
- [Session Management](../concepts/sessions.md)
- [Gateway Protocol](../gateway/protocol.md)

## Summary

The message flow in Clawdbot follows a clear path:

1. **Web UI** connects to **Gateway** via WebSocket
2. **Gateway** authenticates and validates the connection
3. User sends a message through **agent request**
4. **Gateway** routes to appropriate **agent** via session key
5. **Agent** processes message with **LLM provider**
6. **LLM** may request **tool execution**
7. **Tools** are validated, executed, and results returned
8. **Agent** streams response back through **Gateway**
9. **Web UI** receives and displays the response

All communication is secured, validated, and can be monitored through the comprehensive event system.
