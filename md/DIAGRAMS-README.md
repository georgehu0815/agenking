# Clawdbot Architecture Diagrams

This document describes the comprehensive architecture diagrams for the Clawdbot project, including both Azure OpenAI integration diagrams and complete system architecture diagrams.

## Files Created

### Azure OpenAI Integration

**Excalidraw Source Files (for editing):**
1. **azure-openai-system-architecture.excalidraw.md** - System-level architecture diagram
2. **azure-openai-class-design.excalidraw.md** - Class-level design diagram

**PDF Files (ready to view/share):**
1. **azure-openai-system-architecture.pdf** (423 KB) - System architecture rendered as PDF
2. **azure-openai-class-design.pdf** (347 KB) - Class design rendered as PDF

### Complete Clawdbot Project Architecture

**Excalidraw Source Files (for editing):**
3. **clawdbot-system-architecture.excalidraw.md** - Complete system architecture (6 layers)
4. **clawdbot-module-design.excalidraw.md** - Module and class-level design (9 components)

**PDF Files (ready to view/share):**
3. **clawdbot-system-architecture.pdf** (470 KB) - Full system architecture rendered as PDF
4. **clawdbot-module-design.pdf** (272 KB) - Module/class design rendered as PDF

## How to View

These are Excalidraw diagrams embedded in Markdown files for use with Obsidian.

### Option 1: View in Obsidian (Recommended)

1. Open the files in Obsidian
2. Click the "MORE OPTIONS" menu (three dots in the top right)
3. Select "Switch to EXCALIDRAW VIEW"
4. The diagram will render in full visual form

### Option 2: Export to PDF from Obsidian

1. Open in Excalidraw view (as above)
2. Use Excalidraw's export function:
   - Click the menu icon
   - Select "Export image" or "Export to PDF"
   - Save the PDF

### Option 3: Convert Using Online Tools

You can also upload the `.excalidraw.md` files to https://excalidraw.com to view and export them.

## Diagram Contents

### System Architecture Diagram

Shows the complete system with 6 layers:

1. **External Services Layer** (Blue)
   - Azure OpenAI Service
   - GPT-5.2 Deployment

2. **Authentication Layer** (Light Blue)
   - ManagedIdentityCredential (Production)
   - AzureCliCredential (Development)
   - Bearer Token Provider

3. **Integration Layer** (Purple)
   - LangChain Library
   - AzureChatOpenAI Client
   - Message conversion and streaming

4. **Clawdbot Core** (Orange/Gold)
   - Azure OpenAI Runtime (credential selection, caching)
   - Stream Adapter (Pi → LangChain conversion)
   - Pi Embedded Runner (detection and swapping)

5. **Configuration Layer** (Green)
   - Auth profiles (managedidentity mode)
   - Model providers
   - Agent defaults

6. **User Interfaces** (Indigo)
   - Control UI Dashboard
   - TUI Onboarding Wizard
   - CLI Commands

**Data Flow**: Shows the complete path from user message → gateway → runner → adapter → runtime → auth → Azure → streaming response

### Class Design Diagram

Shows detailed class structures and relationships:

1. **azure-openai-models.ts**
   - Configuration constants (endpoint, deployment, API version, scope, client ID)

2. **azure-openai-runtime.ts**
   - `getAzureOpenAIModelInstance()` function
   - Credential selection logic
   - Model caching
   - Token provider initialization

3. **azure-openai-stream-adapter.ts**
   - `streamAzureOpenAIManagedIdentity()` function
   - Context conversion (Pi → LangChain)
   - Event stream handling (start, text_delta, text_end, done)
   - Error handling

4. **pi-embedded-runner/run/attempt.ts**
   - Detection logic for Azure + managedidentity
   - Stream function swapping

5. **pi-embedded-runner/run.ts & compact.ts**
   - Auth bypass logic
   - Placeholder API key for Pi library compatibility

6. **Configuration Types**
   - AuthProfileConfig
   - ModelProviderAuthMode
   - ProviderConfig

7. **External Dependencies**
   - @azure/identity (ManagedIdentityCredential, AzureCliCredential, getBearerTokenProvider)
   - @langchain/openai (AzureChatOpenAI, message types)

**Relationships**: Shows how classes interact through function calls, configuration reads, credential provisioning, and library usage.

## Color Coding

- **Blue**: External services and authentication
- **Purple**: Integration layer
- **Orange/Gold**: Core Clawdbot components
- **Green**: Configuration
- **Indigo**: User interfaces
- **Red**: External dependencies

## Diagram Contents - Clawdbot Complete Architecture

### System Architecture Diagram

Shows the complete Clawdbot system with 6 layers:

1. **Messaging Channels Layer** (Blue)
   - Core channels: WhatsApp (Baileys), Telegram (grammY), Discord (discord.js)
   - Slack (Bolt), Signal (signal-cli), iMessage (Native)
   - Extensions: Google Chat, MS Teams, Matrix, Zalo, WebChat, Voice Call
   - Message ingestion and event handling

2. **Gateway Control Plane** (Light Blue)
   - WebSocket Server (ws://127.0.0.1:18789)
   - TypeBox validation and RPC protocol
   - Chat Run Registry with session queue
   - Channel Manager with health monitoring
   - Subsystems: Cron, Browser, Canvas, Discovery, Tailscale, Webhooks

3. **Agent Runtime Layer** (Purple)
   - Pi Embedded Execution Engine (model invocation, tool streaming, failover)
   - Tool Pipeline: Browser, Canvas, Nodes, Sessions, Skills, Messaging tools
   - Model Providers: Anthropic, OpenAI, Google, Azure with OAuth and Managed Identity

4. **Routing & Session Management** (Orange)
   - Route resolution (resolve-route.ts)
   - Session binding (bindings.ts)
   - Session key generation (session-key.ts)
   - Session Store (SQLite + sessions.json)

5. **Support Layers** (Green)
   - Configuration: Zod validation, JSON5/YAML, Credentials
   - Media Pipeline: Audio, Image ops, PDF, Fetch, Store
   - Logging: tslog with subsystem and diagnostic events
   - Plugin System: Extensions, Manifest registry, Runtime isolation

6. **Client Interfaces** (Indigo)
   - CLI (Commander)
   - Web UI (React)
   - macOS App (SwiftUI)
   - iOS App (Swift)
   - Android App (Kotlin)

**Data Flow**: Shows the complete path from channels → gateway → agent runtime → tools → streaming responses

### Module & Class Design Diagram

Shows detailed implementation structure with 9 component groups:

1. **Entry Points & Initialization**
   - src/entry.ts: main(), setupExceptionHandlers()
   - src/index.ts: Module exports and public API

2. **CLI Layer**
   - build-program.ts: buildProgram(deps): Command
   - command-registry.ts: registerCommands()
   - register.*.ts: Command registration per domain

3. **Gateway Server Modules**
   - server.impl.ts: GatewayServer class with start/stop methods
   - server-chat.ts: handleChatMessage(), queueChatRun()
   - server-channels.ts: registerChannel(), getChannelStatus()
   - server-methods.js: RPC method registry with TypeBox validation

4. **Agent Runtime Components**
   - pi-embedded-runner/run.ts: run(context, options): AsyncIterator
   - pi-embedded-runner/lanes.ts: LaneManager for concurrency
   - pi-embedded-runner/history.ts: prepareHistory() for context
   - pi-embedded-runner/attempt.ts: attemptRun() with retry logic

5. **Channel Implementations**
   - Telegram: bot/index.ts, monitor/index.ts, send.ts
   - Discord: bot/index.ts, monitor/index.ts, send.ts
   - WhatsApp: connection.ts, monitor.ts, send.ts
   - Similar structure for Slack, Signal, iMessage

6. **Routing System**
   - resolve-route.ts: resolveRoute(message): Route
   - bindings.ts: Channel → Agent mapping
   - session-key.ts: generateSessionKey()

7. **Configuration Management**
   - config/types.ts: ClawdbotConfig, GatewayConfig, ChannelConfig
   - config/io.ts: loadConfig(), saveConfig()
   - config/zod-schema.ts: configSchema with validation

8. **Media Pipeline**
   - media/parse.ts: parseMedia(input): MediaInfo
   - media/audio.ts: transcribeAudio(), format conversion
   - media/image-ops.ts: resizeImage(), compressImage()
   - media/fetch.ts: fetchMedia(url): Buffer

9. **Plugin System**
   - plugins/loader.ts: loadPlugin(path): Plugin
   - plugins/manifest-registry.ts: registerManifest()
   - plugins/runtime/: isolate.ts, bridge.ts, api.ts

**Relationships**: Shows dependencies: Entry → CLI → Gateway → Runtime, with Configuration feeding all modules, Media supporting Runtime, and Plugin System extending Gateway + Runtime

## Technical Details Captured

### Azure OpenAI Integration Diagrams

Both diagrams document:
- Complete authentication flow (managed identity vs CLI credential)
- Data transformation pipeline (Pi Context → LangChain messages)
- Configuration structure (managedidentity mode, auth profiles)
- Error handling and fallback mechanisms
- Stream event lifecycle
- All major classes, functions, and their relationships

### Clawdbot Complete Architecture Diagrams

Both diagrams document:
- Complete system architecture (all 6 layers)
- Channel implementations and message routing
- Gateway control plane and WebSocket protocol
- Agent runtime and tool pipeline
- Configuration and session management
- Media processing pipeline
- Plugin system and extension architecture
- All major modules, classes, and function signatures
- Data flow and dependency relationships
