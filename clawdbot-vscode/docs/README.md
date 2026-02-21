# Clawdbot VS Code Extension - Documentation Index

## 📚 Architecture Documentation
```sh
This directory contains comprehensive system architecture documentation in multiple formats.
These are two different layers in the architecture:

gateway-client-node.ts - Transport Layer
Low-level WebSocket client library that handles:

Raw WebSocket connection management
Protocol frame handling (req/res/event frames)
Request/response pattern with callbacks
Event pub/sub system (on(), off())
Reconnection logic with exponential backoff
Specific RPC methods: sendChat(), getHistory(), abortChat(), health()
Generic, reusable WebSocket client
http-gateway-agent.ts - Application Layer
Higher-level agent wrapper that:

Uses GatewayClientNode internally
Provides the run(query) method that returns AsyncGenerator<AgentEvent>
Maps gateway events → AgentEvent types (thinking, tool_start, tool_end, done, etc.)
Manages the query lifecycle and event queue
Handles URL conversion (HTTP → WebSocket)
Implements the agent query pattern that VSCode extension expects
Relationship

VSCode Extension
     ↓
HttpGatewayAgent.run(query)  ← Application layer
     ↓
GatewayClientNode.sendChat() ← Transport layer
     ↓
WebSocket Server
In summary: gateway-client-node.ts is a reusable WebSocket client library, while http-gateway-agent.ts is a specialized wrapper that uses it to implement the agent query interface for the VSCode extension.

```
### 📄 Main Documents

#### [ARCHITECTURE.md](./ARCHITECTURE.md)
**Format:** Markdown with embedded Mermaid diagrams
**Best for:** Reading online, GitHub, Obsidian
**Features:**
- High-level system architecture overview
- Component details and responsibilities
- Data flow diagrams (connection, query, cancellation)
- Protocol specifications (WebSocket frames)
- Event mapping reference
- Testing guidelines
- Configuration examples

#### [ARCHITECTURE.pdf](./ARCHITECTURE.pdf)
**Format:** PDF (218KB)
**Best for:** Printing, presentations, offline reading
**Features:**
- Professional formatting with table of contents
- Section numbering for easy reference
- Rendered Mermaid diagrams embedded as high-quality images
- Unicode support (xelatex engine)
- 1-inch margins, 11pt font

### 🖼️ Diagram Files (PNG & PDF)

All diagrams are available in multiple formats:

#### [diagrams/system-architecture.png](./diagrams/system-architecture.png) (180KB)
**PDF Versions:**
- [system-architecture-hq.pdf](./diagrams/system-architecture-hq.pdf) (325KB, 300 DPI) - **Recommended for printing**
- [system-architecture.pdf](./diagrams/system-architecture.pdf) (192KB, standard quality)

**Shows:** Complete system overview
- VS Code Extension (Extension Host + Webview)
- Gateway Server components
- WebSocket communication flow
- Configuration sources
- Full user interaction cycle from input to display

#### [diagrams/connection-flow.png](./diagrams/connection-flow.png) (76KB)
**PDF Versions:**
- [connection-flow-hq.pdf](./diagrams/connection-flow-hq.pdf) (147KB, 300 DPI) - **Recommended for printing**
- [connection-flow.pdf](./diagrams/connection-flow.pdf) (91KB, standard quality)

**Shows:** WebSocket connection establishment
- Extension → HttpGatewayAgent → GatewayClientNode → WebSocket Server
- Authentication flow with token validation
- Connect frame handshake
- hello-ok response

#### [diagrams/query-flow.png](./diagrams/query-flow.png) (144KB)
**PDF Versions:**
- [query-flow-hq.pdf](./diagrams/query-flow-hq.pdf) (270KB, 300 DPI) - **Recommended for printing**
- [query-flow.pdf](./diagrams/query-flow.pdf) (164KB, standard quality)

**Shows:** End-to-end query execution
- User input → React UI → VS Code messaging → Extension → Agent → Gateway
- Event streaming loop (thinking, tool_start, tool_end)
- Final answer delivery back to UI

#### [diagrams/cancellation-flow.png](./diagrams/cancellation-flow.png) (76KB)
**PDF Versions:**
- [cancellation-flow-hq.pdf](./diagrams/cancellation-flow-hq.pdf) (149KB, 300 DPI) - **Recommended for printing**
- [cancellation-flow.pdf](./diagrams/cancellation-flow.pdf) (93KB, standard quality)

**Shows:** Query abort/cancellation
- User cancels → VS Code API → Extension abort signal
- chat.abort request to gateway
- Session cleanup and UI update

### 📁 Diagram Source Files (Mermaid)

Editable Mermaid source files are available in [`diagrams/`](./diagrams/):
- `system-architecture.mmd`
- `connection-flow.mmd`
- `query-flow.mmd`
- `cancellation-flow.mmd`

**Edit diagrams:**
```bash
# Edit the .mmd file
vim diagrams/system-architecture.mmd

# Re-render to PNG
cd diagrams
mmdc -i system-architecture.mmd -o system-architecture.png -b transparent -w 1920 -H 1080

# Re-generate PDF with updated diagrams
cd ..
~/.claude/skills/markdown-to-pdf/scripts/convert.sh ARCHITECTURE.md ARCHITECTURE.pdf \
  --render-mermaid --engine=xelatex --toc --number-sections
```

## 🎯 Quick Reference

### For Developers
- **Understanding the system:** Start with [ARCHITECTURE.md](./ARCHITECTURE.md) sections 1-2
- **Implementing features:** Review Component Details (section 2) and Data Flow (section 3)
- **Debugging:** Check Protocol Details (section 4) and Error Handling (section 6)
- **Testing:** See Testing section (section 7) and Configuration (section 8)

### For Architects
- **System overview:** View [diagrams/system-architecture.png](./diagrams/system-architecture.png)
- **Data flows:** Review all sequence diagrams in [diagrams/](./diagrams/)
- **Protocol specs:** Read Protocol Details section in [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Print-ready:** Use [ARCHITECTURE.pdf](./ARCHITECTURE.pdf)

### For Presentations
- **Slide deck:** Use PNG diagrams from [diagrams/](./diagrams/)
- **Handout:** Print [ARCHITECTURE.pdf](./ARCHITECTURE.pdf)
- **Live demo:** Follow Manual Testing section in [ARCHITECTURE.md](./ARCHITECTURE.md#manual-testing)

## 🔄 WebSocket Migration

The extension was migrated from Server-Sent Events (SSE) to WebSocket protocol. Key documentation:

- **Migration plan:** See context in ARCHITECTURE.md introduction
- **Webapp reference:** [`/Users/ghu/aiworker/clawdbot/src/webapp/client`](file:///Users/ghu/aiworker/clawdbot/src/webapp/client) (source of truth)
- **Fix documentation:** [`/Users/ghu/aiworker/clawdbot/src/webapp/WEBSOCKET_FIX.md`](file:///Users/ghu/aiworker/clawdbot/src/webapp/WEBSOCKET_FIX.md)

## 📊 Document Statistics

| File | Format | Size | Content |
|------|--------|------|---------|
| ARCHITECTURE.md | Markdown | ~14KB | Full architecture with embedded Mermaid |
| ARCHITECTURE.pdf | PDF | 218KB | Rendered PDF with diagrams |
| system-architecture.png | PNG | 180KB | System overview diagram |
| system-architecture-hq.pdf | PDF (300 DPI) | 325KB | High-quality print version |
| system-architecture.pdf | PDF | 192KB | Standard quality |
| connection-flow.png | PNG | 76KB | Connection sequence |
| connection-flow-hq.pdf | PDF (300 DPI) | 147KB | High-quality print version |
| connection-flow.pdf | PDF | 91KB | Standard quality |
| query-flow.png | PNG | 144KB | Query execution flow |
| query-flow-hq.pdf | PDF (300 DPI) | 270KB | High-quality print version |
| query-flow.pdf | PDF | 164KB | Standard quality |
| cancellation-flow.png | PNG | 76KB | Cancellation sequence |
| cancellation-flow-hq.pdf | PDF (300 DPI) | 149KB | High-quality print version |
| cancellation-flow.pdf | PDF | 93KB | Standard quality |

**Total documentation size:** ~2.1MB

**Format Summary:**
- 1 comprehensive documentation (Markdown + PDF)
- 4 diagram types × 3 formats each (PNG, standard PDF, high-quality PDF)
- All PDFs optimized for both screen viewing and printing

## 🛠️ Regenerating Documents

### Update PDF from Markdown
```bash
cd /Users/ghu/aiworker/clawdbot/clawdbot-vscode/docs

# Full regeneration with mermaid rendering
~/.claude/skills/markdown-to-pdf/scripts/convert.sh \
  ARCHITECTURE.md ARCHITECTURE.pdf \
  --render-mermaid \
  --engine=xelatex \
  --toc \
  --number-sections \
  --variable=geometry:margin=1in \
  --variable=fontsize=11pt
```

### Render Individual Diagrams
```bash
cd /Users/ghu/aiworker/clawdbot/clawdbot-vscode/docs/diagrams

# Render single diagram
mmdc -i system-architecture.mmd -o system-architecture.png -b transparent -w 1920 -H 1080

# Render all diagrams
for file in *.mmd; do
  mmdc -i "$file" -o "${file%.mmd}.png" -b transparent -w 1920 -H 1080
done
```

## 📝 Contributing

When updating architecture:

1. **Edit [ARCHITECTURE.md](./ARCHITECTURE.md)** - Update text and Mermaid code
2. **Render diagrams** - Run mermaid CLI to generate PNGs
3. **Generate PDF** - Run convert.sh script with --render-mermaid
4. **Commit all formats** - Markdown, PNG diagrams, and PDF

## 🔗 Related Files

- **Extension code:** [`../src/extension.ts`](../src/extension.ts)
- **Gateway client:** [`../src/gateway/gateway-client-node.ts`](../src/gateway/gateway-client-node.ts)
- **HTTP agent:** [`../src/agent/http-gateway-agent.ts`](../src/agent/http-gateway-agent.ts)
- **React UI:** [`../src/webview/components/ChatContainer.tsx`](../src/webview/components/ChatContainer.tsx)
- **Tests:** [`../test/`](../test/)

## 📌 Version

- **Document version:** 1.0.0
- **Last updated:** 2026-02-16
- **Extension version:** 1.0.0
- **Protocol version:** 3

---

**Note:** All diagrams use transparent backgrounds and are optimized for both light and dark themes.
