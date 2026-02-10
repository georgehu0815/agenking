# Clawdbot - System Architecture

```mermaid
graph TB
    %% Title
    title[<b>Clawdbot - System Architecture</b>]

    %% Layer 1: Messaging Channels (Input Layer)
    subgraph channels[" "]
        direction LR
        ch_title["<b>Messaging Channels 「Input Layer」</b>"]

        whatsapp["WhatsApp<br/>Baileys"]
        telegram["Telegram<br/>grammY"]
        discord["Discord<br/>discord.js"]
        slack["Slack<br/>Bolt"]
        signal["Signal<br/>signal-cli"]
        imessage["iMessage<br/>Native"]
        more["+ More:<br/>Google Chat, MS Teams,<br/>Matrix, Zalo, WebChat"]
    end

    %% Layer 2: Gateway (Control Plane)
    subgraph gateway[" "]
        direction LR
        gw_title["<b>Gateway 「Control Plane - ws://127.0.0.1:18789」</b>"]

        ws["<b>WebSocket Server</b><br/>• TypeBox validation<br/>• RPC protocol<br/>• Device pairing<br/>• Auth 「token/password」"]

        registry["<b>Chat Run Registry</b><br/>• Session queue<br/>• Agent event broadcast<br/>• Concurrent lanes<br/>• Rate limiting"]

        chanmgr["<b>Channel Manager</b><br/>• All channel instances<br/>• Health monitoring<br/>• Reconnection logic<br/>• Allowlists & policies"]

        subsys["<b>Subsystems</b><br/>• Cron scheduler • Browser manager<br/>• Canvas server • Discovery 「mDNS」<br/>• Tailscale • Webhooks<br/>• Maintenance 「pruning」"]
    end

    %% Layer 3: Agent Runtime
    subgraph runtime[" "]
        direction LR
        rt_title["<b>Agent Runtime 「Pi Embedded」</b>"]

        exec["<b>Execution Engine</b><br/>pi-embedded-runner/run.ts<br/>• Model invocation<br/>• Tool streaming<br/>• Failover logic<br/>• Context window guards"]

        tools["<b>Tool Pipeline</b><br/>channel-tools.ts<br/>• Browser, Canvas, Nodes<br/>• Sessions, Skills, Search<br/>• Messaging 「send」<br/>• Media processing"]

        models["<b>Model Auth & Providers</b><br/>model-auth.ts, azure-openai-runtime.ts<br/>• Anthropic, OpenAI, Google, Azure<br/>• OAuth & API key resolution<br/>• Managed identity 「Azure」<br/>• Failover routing"]
    end

    %% Layer 4: Routing & Session
    subgraph routing[" "]
        direction LR
        route_title["<b>Routing & Session Management</b>"]

        resolve["resolve-route.ts | bindings.ts | session-key.ts"]
        store["Session Store | SQLite + sessions.json | History"]
    end

    %% Layer 5: Support
    subgraph support[" "]
        direction TB
        sup_title["<b>Support Layers</b>"]

        config["Config: Zod validation | JSON5/YAML | Credentials"]
        media["Media: Audio | Image ops | PDF | Fetch | Store"]
        logging["Logging: tslog | Subsystem | Diagnostic events"]
        plugins["<b>Plugin System:</b><br/>Extensions 「channels, tools, memory」<br/>Manifest registry | Runtime isolation"]
    end

    %% Layer 6: Client Interfaces
    subgraph clients[" "]
        direction LR
        cli_title["<b>Client Interfaces</b>"]

        cli["CLI 「Commander」"]
        webui["Web UI 「React」"]
        macos["macOS App 「SwiftUI」"]
        ios["iOS App 「Swift」"]
        android["Android App 「Kotlin」"]
    end

    %% Flow connections
    channels --> gateway
    gateway --> runtime
    runtime --> routing
    routing --> clients

    support -.-> gateway
    support -.-> runtime

    %% Styling
    classDef channelStyle fill:#dbeafe,stroke:#1e40af,stroke-width:2px
    classDef gatewayStyle fill:#eff6ff,stroke:#3b82f6,stroke-width:2px
    classDef runtimeStyle fill:#f5f3ff,stroke:#8b5cf6,stroke-width:2px
    classDef routingStyle fill:#fffbeb,stroke:#f59e0b,stroke-width:2px
    classDef supportStyle fill:#ecfdf5,stroke:#10b981,stroke-width:2px
    classDef clientStyle fill:#eef2ff,stroke:#6366f1,stroke-width:2px

    class channels,whatsapp,telegram,discord,slack,signal,imessage,more channelStyle
    class gateway,ws,registry,chanmgr,subsys gatewayStyle
    class runtime,exec,tools,models runtimeStyle
    class routing,resolve,store routingStyle
    class support,config,media,logging,plugins supportStyle
    class clients,cli,webui,macos,ios,android clientStyle
```

## Architecture Overview

### Layer 1: Messaging Channels (Input Layer)
**Purpose**: Accept messages from various messaging platforms

**Channels**:
- **WhatsApp** (Baileys library)
- **Telegram** (grammY framework)
- **Discord** (discord.js)
- **Slack** (Bolt framework)
- **Signal** (signal-cli)
- **iMessage** (Native integration)
- **+ More**: Google Chat, MS Teams, Matrix, Zalo, WebChat

### Layer 2: Gateway (Control Plane)
**Purpose**: Central coordination and control plane
**Endpoint**: `ws://127.0.0.1:18789`

**Components**:

1. **WebSocket Server**
   - TypeBox validation for message schemas
   - RPC protocol implementation
   - Device pairing management
   - Authentication (token/password)

2. **Chat Run Registry**
   - Session queue management
   - Agent event broadcasting
   - Concurrent lane handling
   - Rate limiting enforcement

3. **Channel Manager**
   - Manages all channel instances
   - Health monitoring for channels
   - Automatic reconnection logic
   - Allowlist and policy enforcement

4. **Subsystems**
   - Cron scheduler for automated tasks
   - Browser automation manager
   - Canvas rendering server
   - mDNS-based service discovery
   - Tailscale VPN integration
   - Webhooks for external integrations
   - Maintenance tasks (log pruning, cleanup)

### Layer 3: Agent Runtime (Pi Embedded)
**Purpose**: Execute AI agent logic and tool calls

**Components**:

1. **Execution Engine** (`pi-embedded-runner/run.ts`)
   - Model invocation and response handling
   - Tool call streaming
   - Automatic failover logic
   - Context window management and guards

2. **Tool Pipeline** (`channel-tools.ts`)
   - Browser automation tools
   - Canvas rendering tools
   - Node.js execution environment
   - Session management tools
   - Skills execution framework
   - Web search integration
   - Message sending capabilities
   - Media processing (images, audio, video)

3. **Model Auth & Providers** (`model-auth.ts`, `azure-openai-runtime.ts`)
   - Multi-provider support: Anthropic, OpenAI, Google, Azure
   - OAuth and API key resolution
   - Azure Managed Identity support
   - Intelligent failover routing between providers

### Layer 4: Routing & Session Management
**Purpose**: Route messages and manage conversation state

**Components**:
- **Route Resolution** (`resolve-route.ts`, `bindings.ts`, `session-key.ts`)
  - Determines which agent handles which conversation
  - Manages channel-to-agent bindings
  - Session key generation and mapping

- **Session Store** (SQLite + `sessions.json`)
  - Persistent conversation history
  - Session state management
  - Message archival

### Layer 5: Support Layers
**Purpose**: Cross-cutting infrastructure services

**Services**:

1. **Configuration Management**
   - Zod schema validation
   - JSON5/YAML configuration parsing
   - Secure credential storage

2. **Media Processing**
   - Audio transcription and synthesis
   - Image manipulation and optimization
   - PDF generation and parsing
   - URL fetching and content extraction
   - Media storage and retrieval

3. **Logging System**
   - tslog-based structured logging
   - Per-subsystem log levels
   - Diagnostic event tracking

4. **Plugin System**
   - Extension points for channels, tools, and memory
   - Manifest-based plugin registry
   - Runtime isolation for security
   - Dynamic plugin loading

### Layer 6: Client Interfaces
**Purpose**: User-facing interfaces to interact with the system

**Interfaces**:
- **CLI** (Commander.js) - Command-line interface
- **Web UI** (React) - Browser-based interface
- **macOS App** (SwiftUI) - Native macOS application
- **iOS App** (Swift) - Native iPhone/iPad app
- **Android App** (Kotlin) - Native Android application

## Data Flow

```
User Message
    ↓
[Messaging Channel] → Receives message via platform SDK
    ↓
[Gateway] → Validates, authenticates, routes to agent
    ↓
[Agent Runtime] → Executes AI logic, calls tools
    ↓
[Routing & Session] → Updates session state, stores history
    ↓
[Client Interface] → Displays response (if applicable)
```

## Key Technologies

- **Language**: TypeScript, Swift, Kotlin
- **Runtime**: Node.js (Pi Embedded)
- **Communication**: WebSocket (RPC)
- **Storage**: SQLite, JSON files
- **AI Models**: Anthropic Claude, OpenAI GPT, Google Gemini, Azure OpenAI
- **Authentication**: OAuth 2.0, API keys, Azure Managed Identity
- **Validation**: TypeBox, Zod
- **Logging**: tslog

## Security Features

- Token/password authentication
- Allowlist-based access control
- Runtime isolation for plugins
- Secure credential storage
- Rate limiting
- Message validation

## Scalability Features

- Concurrent lane processing
- Session queue management
- Automatic failover routing
- Health monitoring and auto-reconnection
- Efficient context window management

---

**Architecture Version**: 1.0
**Last Updated**: 2026-02-07
**Document Type**: System Architecture Diagram
