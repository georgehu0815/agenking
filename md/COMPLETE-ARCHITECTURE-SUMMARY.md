# Clawdbot Complete Architecture Documentation

This document provides a complete overview of all architecture diagrams created for the Clawdbot project.

## Overview

Four comprehensive architecture diagrams have been created to document both the Azure OpenAI integration and the complete Clawdbot system architecture:

1. **Azure OpenAI System Architecture** - External service integration
2. **Azure OpenAI Class Design** - Implementation details for Azure integration
3. **Clawdbot System Architecture** - Complete 6-layer system overview
4. **Clawdbot Module Design** - Detailed 9-component implementation structure

## Files Generated

### Source Files (Excalidraw format for Obsidian)
- `azure-openai-system-architecture.excalidraw.md`
- `azure-openai-class-design.excalidraw.md`
- `clawdbot-system-architecture.excalidraw.md`
- `clawdbot-module-design.excalidraw.md`

### Rendered PDFs (ready to view/share)
- `azure-openai-system-architecture.pdf` (423 KB)
- `azure-openai-class-design.pdf` (347 KB)
- `clawdbot-system-architecture.pdf` (470 KB)
- `clawdbot-module-design.pdf` (272 KB)

## Architecture Overview

### Clawdbot System Layers

The complete Clawdbot system is organized into 6 layers:

#### 1. Messaging Channels Layer
**Purpose**: Multi-channel message ingestion and delivery

**Core Channels**:
- WhatsApp (Baileys library)
- Telegram (grammY library)
- Discord (discord.js)
- Slack (Bolt framework)
- Signal (signal-cli)
- iMessage (Native integration)

**Extension Channels**:
- Google Chat, MS Teams, Matrix
- Zalo, WebChat, Voice Call

**Responsibilities**:
- Message event handling
- Bot instance management
- Health monitoring and reconnection
- Message sending/receiving

#### 2. Gateway Control Plane
**Purpose**: Central orchestration and control

**Components**:
- **WebSocket Server**: ws://127.0.0.1:18789
  - TypeBox validation
  - RPC protocol
  - Device pairing
- **Chat Run Registry**:
  - Session queue management
  - Agent event broadcast
  - Concurrent lane management
- **Channel Manager**:
  - Health monitoring
  - Reconnection logic
  - Allowlist management
- **Subsystems**:
  - Cron (scheduled tasks)
  - Browser (Playwright automation)
  - Canvas (A2UI interface)
  - Discovery (service detection)
  - Tailscale (network mesh)
  - Webhooks (HTTP callbacks)

#### 3. Agent Runtime Layer
**Purpose**: AI model execution and tool orchestration

**Components**:
- **Execution Engine** (pi-embedded-runner):
  - Model invocation (Anthropic, OpenAI, Google, Azure)
  - Tool streaming pipeline
  - Failover and retry logic
- **Tool Pipeline**:
  - Browser automation
  - Canvas rendering
  - Node.js execution
  - Session management
  - Skill invocation
  - Messaging tools
- **Model Authentication**:
  - OAuth flows
  - Managed Identity (Azure)
  - API key management
  - Token provider abstraction

#### 4. Routing & Session Management
**Purpose**: Message routing and conversation state

**Components**:
- **Route Resolution** (resolve-route.ts):
  - Pattern matching
  - Priority logic
  - Binding resolution
- **Session Management**:
  - Session key generation
  - SQLite storage
  - History persistence (sessions.json)
  - Context management
- **Bindings** (bindings.ts):
  - Channel → Agent mapping
  - Configuration resolution

#### 5. Support Layers
**Purpose**: Cross-cutting concerns

**Configuration**:
- Zod validation
- JSON5/YAML parsing
- Credential storage
- Profile management

**Media Pipeline**:
- Audio transcription
- Image operations (Sharp)
- PDF generation
- Media fetch and caching
- Storage management

**Logging**:
- tslog subsystem
- Diagnostic events
- Error tracking

**Plugin System**:
- Extension loader
- Manifest registry
- Runtime isolation (jiti)
- API bridge

#### 6. Client Interfaces
**Purpose**: User interaction surfaces

**Interfaces**:
- **CLI**: Commander-based terminal interface
- **Web UI**: React-based dashboard
- **macOS App**: SwiftUI native application
- **iOS App**: Swift mobile application
- **Android App**: Kotlin mobile application

### Module & Class Structure

The implementation is organized into 9 major component groups:

#### 1. Entry Points
- `src/entry.ts`: CLI bootstrap and exception handling
- `src/index.ts`: Module exports and public API

#### 2. CLI Layer
- `build-program.ts`: Commander program construction
- `command-registry.ts`: Command registration
- `register.*.ts`: Domain-specific command modules

#### 3. Gateway Server
- `server.impl.ts`: GatewayServer class implementation
- `server-chat.ts`: Chat message handling
- `server-channels.ts`: Channel management
- `server-methods.js`: RPC method registry

#### 4. Agent Runtime
- `pi-embedded-runner/run.ts`: Main execution engine
- `pi-embedded-runner/lanes.ts`: Concurrency management
- `pi-embedded-runner/history.ts`: Context preparation
- `pi-embedded-runner/attempt.ts`: Retry logic

#### 5. Channel Implementations
Each channel follows a consistent pattern:
- `bot/index.ts`: Bot instance setup
- `monitor/index.ts`: Event monitoring
- `send.ts`: Message sending logic

**Implemented Channels**:
- `src/telegram/`
- `src/discord/`
- `src/web/` (WhatsApp)
- `src/slack/`
- `src/signal/`
- `src/imessage/`

#### 6. Routing System
- `resolve-route.ts`: Message route resolution
- `bindings.ts`: Channel-Agent binding
- `session-key.ts`: Session identifier management

#### 7. Configuration
- `config/types.ts`: TypeScript interfaces
- `config/io.ts`: Config load/save operations
- `config/zod-schema.ts`: Validation schemas

#### 8. Media Pipeline
- `media/parse.ts`: Media type detection
- `media/audio.ts`: Audio transcription
- `media/image-ops.ts`: Image processing
- `media/fetch.ts`: Media fetching

#### 9. Plugin System
- `plugins/loader.ts`: Plugin loading
- `plugins/manifest-registry.ts`: Manifest validation
- `plugins/runtime/`: Sandbox execution

## Data Flow

### Message Processing Flow

1. **Message Arrives**:
   - Channel receives message
   - Bot/monitor extracts content
   - Event dispatched to Gateway

2. **Gateway Processing**:
   - WebSocket receives message
   - TypeBox validates structure
   - Route resolution determines agent
   - Session key generated/retrieved
   - Message queued in Chat Run Registry

3. **Agent Execution**:
   - Lane acquired from pool
   - History loaded from session
   - Context prepared
   - Model invoked via Pi runtime
   - Tools executed as needed
   - Events streamed back

4. **Response Delivery**:
   - Agent events broadcast via WebSocket
   - Channel-specific send logic invoked
   - Message formatted per platform
   - Delivered to user

### Configuration Flow

1. **Load Time**:
   - Multiple config sources merged (defaults, user, environment)
   - Zod validation ensures correctness
   - Credentials loaded from secure storage

2. **Runtime**:
   - Config accessed by all modules
   - Profile-based model selection
   - Channel-specific settings applied

### Media Processing Flow

1. **Input**:
   - Media URL or buffer received
   - Type detection (image, audio, PDF, etc.)
   - Metadata extraction

2. **Processing**:
   - Format conversion if needed
   - Transcription for audio
   - Resize/compress for images
   - Caching for efficiency

3. **Output**:
   - Processed media stored
   - URL/buffer returned to caller

## Azure OpenAI Integration

The Azure OpenAI integration adds managed identity authentication support:

### Authentication Flow

1. **Credential Selection**:
   - Production: ManagedIdentityCredential
   - Development: AzureCliCredential
   - Environment-based detection

2. **Token Provider**:
   - getBearerTokenProvider creates token provider
   - Automatic token refresh
   - Azure AD scope: `https://cognitiveservices.azure.com/.default`

3. **LangChain Integration**:
   - AzureChatOpenAI client initialization
   - Custom token provider passed
   - Streaming support maintained

### Implementation Components

- `azure-openai-models.ts`: Configuration constants
- `azure-openai-runtime.ts`: Model instance creation and caching
- `azure-openai-stream-adapter.ts`: Pi ↔ LangChain conversion
- Pi runner integration: Detection and stream swapping

## Technology Stack

### Core Dependencies

**Runtime**:
- Node.js 22+ (primary runtime)
- Bun (development and testing)

**Communication**:
- grammY (Telegram bot)
- discord.js (Discord bot)
- @slack/bolt (Slack bot)
- Baileys (WhatsApp web)
- WebSocket (control plane)

**AI/ML**:
- @anthropic-ai/sdk (Claude)
- openai (OpenAI/Azure)
- @google-ai/generativelanguage (Gemini)
- @langchain/openai (Azure integration)

**Authentication**:
- @azure/identity (managed identity)

**Validation**:
- @sinclair/typebox (TypeBox schemas)
- zod (configuration validation)

**Media**:
- sharp (image processing)
- playwright (browser automation)

**Storage**:
- better-sqlite3 (session storage)

**Logging**:
- tslog (structured logging)

**CLI**:
- commander (argument parsing)

**Build**:
- TypeScript (type checking)
- oxlint (linting)
- oxfmt (formatting)
- vitest (testing)

## Viewing the Diagrams

### Option 1: View PDFs
Simply open the PDF files in any PDF viewer. Recommended for quick viewing and sharing.

### Option 2: View in Obsidian (Recommended for Editing)

1. Open the `.excalidraw.md` file in Obsidian
2. Click the "MORE OPTIONS" menu (three dots, top right)
3. Select "Switch to EXCALIDRAW VIEW"
4. Full interactive diagram appears

### Option 3: View on Excalidraw.com

1. Visit https://excalidraw.com
2. Click "Open"
3. Upload the `.excalidraw.md` file
4. View and edit online

## Conversion Tools

### Python Script: convert-diagrams-to-pdf.py

Automated conversion pipeline:
- Extracts JSON from `.excalidraw.md` files
- Renders to HTML with SVG
- Uses Playwright to generate PDF
- A3 landscape format with margins

**Usage**:
```bash
python3 convert-diagrams-to-pdf.py
```

### HTML Template: render-diagram.html

Browser-based renderer:
- Converts Excalidraw JSON to SVG
- Supports rectangles, text, arrows
- Handles styling and colors
- Signals completion for automation

## Design Principles

### Color Coding

Consistent color scheme across all diagrams:
- **Blue (#1e40af)**: External services, entry points
- **Light Blue (#3b82f6)**: Gateway and control plane
- **Purple (#8b5cf6)**: Agent runtime and execution
- **Orange (#f59e0b)**: Routing and core logic
- **Green (#10b981)**: Support systems
- **Teal (#14b8a6)**: Configuration
- **Cyan (#06b6d4)**: Media pipeline
- **Indigo (#6366f1)**: Client interfaces, plugins

### Typography

All diagrams use:
- **Font**: Excalifont (hand-drawn style)
- **Sizes**:
  - Titles: 24-28px
  - Subtitles: 18-20px
  - Body: 14-16px
- **Line height**: 1.25

### Layout

- Canvas: 0-1500 x 0-900 pixels
- Clear component boundaries
- Hierarchical organization
- Arrows show data flow and dependencies

## Maintenance

### Updating Diagrams

1. Open `.excalidraw.md` file in Obsidian
2. Switch to EXCALIDRAW VIEW
3. Make modifications
4. Save file
5. Run `python3 convert-diagrams-to-pdf.py` to regenerate PDFs

### Adding New Diagrams

1. Create new `.excalidraw.md` file
2. Follow existing color scheme and typography
3. Add entry to `convert-diagrams-to-pdf.py`:
   ```python
   {
       'md': base_dir / 'new-diagram.excalidraw.md',
       'pdf': base_dir / 'new-diagram.pdf'
   }
   ```
4. Update this documentation

## Future Enhancements

Potential additions to the architecture diagrams:

1. **Sequence Diagrams**: Message flow timing
2. **Deployment Diagrams**: Infrastructure and hosting
3. **Security Diagrams**: Authentication and authorization flows
4. **Error Handling Diagrams**: Failure modes and recovery
5. **Performance Diagrams**: Bottlenecks and optimization points

## Related Documentation

- `DIAGRAMS-README.md`: Quick reference guide
- `docs/`: Full project documentation
- `CLAUDE.md`: Project guidelines for AI assistants
- `README.md`: Project overview

## Version History

- **2026-01-26**: Initial creation
  - Azure OpenAI integration diagrams (2 diagrams)
  - Complete Clawdbot architecture diagrams (2 diagrams)
  - PDF conversion pipeline
  - Comprehensive documentation

## Contact

For questions or suggestions about these diagrams:
- GitHub Issues: https://github.com/clawdbot/clawdbot/issues
- Project Documentation: https://docs.clawd.bot
