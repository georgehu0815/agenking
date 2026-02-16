# Design Documentation

This directory contains architecture diagrams and design documentation for Clawdbot.

## Available Documents

### [webui-gateway-agent-flow.md](./webui-gateway-agent-flow.md)
Comprehensive design guide explaining the complete message flow from Web UI through the HTTP Gateway to backend agents and tools/skills execution. Includes:
- Architecture component overview
- Detailed message flow phases
- HTTP API endpoint documentation
- Security and authorization flows
- Protocol frame specifications
- Tool execution pipeline
- Configuration examples

## Visual Diagrams

All diagrams are available in high-resolution PNG format (3x scale, 3200px+ width) for presentations and documentation.

### 1. Message Flow Sequence Diagram
**File:** [message-flow-sequence.png](./message-flow-sequence.png)
**Resolution:** 5,259 × 9,696 pixels
**Source:** [message-flow-sequence.mmd](./message-flow-sequence.mmd)

Shows the complete sequence of interactions between:
- Web UI (Control UI)
- HTTP Gateway (Port 18789)
- Authentication & Pairing system
- Message Router
- Agent System
- Tools & Skills
- LLM Provider

**Includes 5 phases:**
1. Connection & Handshake (authentication, device pairing)
2. User Message Send (request routing, session resolution)
3. Agent Processing (LLM interaction, streaming)
4. Tool Execution (policy validation, tool calls)
5. Response Completion (streaming back to UI)

### 2. HTTP Endpoints Flow Diagram
**File:** [http-endpoints-flow.png](./http-endpoints-flow.png)
**Resolution:** 9,309 × 5,013 pixels
**Source:** [http-endpoints-flow.mmd](./http-endpoints-flow.mmd)

Illustrates the three main HTTP API endpoints and their flows:

**Endpoints:**
- `/v1/responses` - OpenResponses API (universal agent protocol)
- `/tools/invoke` - Direct tool invocation API
- `/openai/v1/chat/completions` - OpenAI-compatible API

**Shows:**
- Client connection paths
- Authentication layer
- Session resolution
- Backend processing pipeline
- Tool and skill execution
- Response formatting

### 3. Multi-Agent Routing Diagram
**File:** [multi-agent-routing.png](./multi-agent-routing.png)
**Resolution:** 9,552 × 7,170 pixels
**Source:** [multi-agent-routing.mmd](./multi-agent-routing.mmd)

Demonstrates how messages are routed to different agent workspaces:

**Components:**
- Message sources (Web UI, API, Chat Channels)
- Session key resolution logic
- Agent workspace configuration
- Context building and execution
- Identity injection
- Response routing

**Agent Examples:**
- Main agent (default, ~/clawd)
- Work agent (professional context)
- Personal agent (casual context)

### 4. TUI and Backend Services Architecture
**File:** [tui-backend-services.png](./tui-backend-services.png)
**Resolution:** 9,552 × 6,669 pixels
**Source:** [tui-backend-services.mmd](./tui-backend-services.mmd)

Comprehensive view of the Terminal UI and all backend services:

**Architecture Layers:**
1. **Client Layer**: TUI, CLI Commands, macOS App
2. **Gateway Service**: WebSocket/HTTP servers with handlers
3. **Backend Services**: Agent, Session, Tools, Skills systems
4. **Storage Layer**: SQLite, File System, Vector DB
5. **External Services**: LLM Providers, MCP Servers, Chat Platforms
6. **Monitoring**: Health checks, logging, metrics

**Shows:**
- Service communication patterns (sync, async, pub/sub)
- Data flow from TUI through all backend layers
- Tool and skill execution pipelines
- Storage and external service integrations
- Observability and monitoring infrastructure

## Editing Diagrams

The diagrams are written in [Mermaid](https://mermaid.js.org/) format (`.mmd` files). To regenerate PNG files after editing:

```bash
cd docs/design

# Regenerate a specific diagram
mmdc -i message-flow-sequence.mmd -o message-flow-sequence.png -w 3200 -s 3 -b white

# Regenerate all diagrams
for f in *.mmd; do
  mmdc -i "$f" -o "${f%.mmd}.png" -w 3200 -s 3 -b white
done
```

**Requirements:**
- Install Mermaid CLI: `npm install -g @mermaid-js/mermaid-cli`
- Or use Homebrew: `brew install mermaid-cli`

## Usage

These diagrams are designed for:
- **Documentation** - Technical specifications and architecture guides
- **Presentations** - High-resolution for slides and demos
- **Onboarding** - Helping new developers understand the system
- **Architecture Reviews** - Discussing system design and flows
- **Integration Guides** - Understanding API endpoints and protocols

## Related Documentation

- [Gateway Architecture](../concepts/architecture.md) - WebSocket gateway overview
- [Agent Loop](../concepts/agent-loop.md) - Agent execution details
- [Multi-Agent Routing](../concepts/multi-agent.md) - Multi-agent configuration
- [Session Management](../concepts/sessions.md) - Session and routing details
- [Gateway Protocol](../gateway/protocol.md) - Protocol specifications

## Contributing

When adding new diagrams:
1. Create the Mermaid source file (`.mmd`)
2. Generate high-resolution PNG (3x scale, white background)
3. Update this README with description and specifications
4. Link from relevant documentation pages

---

**Last Updated:** 2026-02-15
