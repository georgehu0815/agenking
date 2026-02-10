# Anthropic Architecture Documentation

Complete documentation for the Anthropic integration architecture in clawdbot, with comparison to Azure OpenAI implementation.

---

## 📚 Documentation Index

### 1. [Anthropic Class Design](./anthropic-class-design.mermaid.md)
**Class structure and component relationships**

- Component diagrams (Mermaid)
- Detailed class descriptions
- Method signatures and responsibilities
- Authentication modes
- Configuration examples
- Comparison with Azure OpenAI classes

**Key Topics:**
- `AnthropicAuthManager` - API key and token management
- `AnthropicPayloadLogger` - Optional request/usage logging
- `StreamAdapter` - Default Pi AI integration
- `PiEmbeddedRunner` - Provider detection and routing
- Auth profiles and credential management

---

### 2. [Anthropic End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md)
**Complete request/response lifecycle**

- Sequence diagrams (Mermaid)
- Step-by-step flow from user to API
- Authentication resolution
- Streaming response handling
- Error handling scenarios
- Tool use flow
- Performance optimizations

**Key Topics:**
- User request → Gateway → Runner flow
- Auth mode selection (API key, token, OAuth)
- Stream function selection and wrapping
- Anthropic API call and streaming
- Progressive response updates
- Usage tracking and logging

---

### 3. [Azure vs Anthropic Comparison](./azure-vs-anthropic-comparison.mermaid.md)
**Side-by-side architecture comparison**

- Architecture diagrams (Mermaid)
- Component-by-component comparison tables
- Code examples for both implementations
- Pros/cons analysis
- Decision matrix (when to use which)
- Migration guides

**Key Topics:**
- Authentication differences (Managed Identity vs API key)
- Stream adapter comparison (custom vs default)
- Detection and routing logic
- Payload logging (Azure: no, Anthropic: optional)
- Configuration differences
- Hybrid approach (supporting both)

---

### 4. [Anthropic Architecture Summary](./anthropic-architecture-summary.md)
**Comprehensive overview and reference guide**

- Quick reference guide
- Architecture at a glance
- Component overview
- File organization
- Configuration examples
- Best practices
- Troubleshooting guide
- Security considerations

**Key Topics:**
- Quick links to all documentation
- Core components comparison table
- Authentication modes explained
- Testing strategies
- Monitoring and observability
- Cost optimization
- Future enhancements

---

## 🎯 Quick Start

### For Architects
1. Start with **[Architecture Summary](./anthropic-architecture-summary.md)** for overview
2. Review **[Comparison](./azure-vs-anthropic-comparison.mermaid.md)** for decision making
3. Deep dive into **[Class Design](./anthropic-class-design.mermaid.md)** for implementation details

### For Developers
1. Review **[End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md)** to understand request lifecycle
2. Check **[Class Design](./anthropic-class-design.mermaid.md)** for component details
3. Reference **[Summary](./anthropic-architecture-summary.md)** for configuration and troubleshooting

### For DevOps
1. Read **[Summary](./anthropic-architecture-summary.md)** for deployment and monitoring
2. Review **[Comparison](./azure-vs-anthropic-comparison.mermaid.md)** for infrastructure decisions
3. Check **[End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md)** for error handling

---

## 🔍 Key Differences: Azure OpenAI vs Anthropic

| Aspect | Azure OpenAI | Anthropic |
|--------|--------------|-----------|
| **Authentication** | Managed Identity / Azure CLI | API Key / Setup Token / OAuth |
| **Stream Adapter** | Custom native adapter | Default Pi AI adapter |
| **Complexity** | High (custom integration) | Low (standard integration) |
| **Security** | Keyless (most secure) | API key/token (standard) |
| **Setup Time** | Hours (Azure IAM, RBAC) | Minutes (API key) |
| **Dependencies** | +2 (azure/identity, azure/openai) | 0 (uses existing Pi AI) |
| **Maintenance** | Manual (custom adapter) | Automatic (library) |
| **Payload Logging** | ❌ Not available | ✅ Optional (via env var) |
| **Best For** | Enterprise Azure deployments | Multi-cloud, rapid development |

---

## 📖 Related Documentation

### Azure OpenAI Reference
- [Azure OpenAI Class Design](./azure-openai-class-design.mermaid.md) - Original reference architecture
- [Azure OpenAI Architecture](./azure-openai-architecture.mermaid.md) - System architecture

### System Architecture
- [Clawdbot System Architecture](./clawdbot-system-architecture.mermaid.md)
- [Clawdbot Agent Loop](./clawdbot-agent-loop.mermaid.md)
- [Clawdbot Tool Pipeline](./clawdbot-tool-pipeline.mermaid.md)

---

## 🎨 Diagram Formats

All diagrams are written in **Mermaid** format, which can be:
- Viewed directly on GitHub
- Rendered in VS Code (with Mermaid extension)
- Converted to PDF (using provided scripts)
- Exported to PNG/SVG

### Viewing Diagrams

**Option 1: GitHub**
- Open any `.mermaid.md` file on GitHub
- Diagrams render automatically

**Option 2: VS Code**
1. Install "Markdown Preview Mermaid Support" extension
2. Open file and use Markdown preview (Cmd+Shift+V)

**Option 3: Convert to PDF**
```bash
# Use the markdown-to-pdf skill
clawdbot skill markdown-to-pdf md/anthropic-class-design.mermaid.md
```

---

## 📝 Document Structure

Each document follows a consistent structure:

1. **Overview** - High-level summary
2. **Diagrams** - Visual representations (Mermaid)
3. **Detailed Explanations** - Component descriptions
4. **Code Examples** - Practical implementations
5. **Configuration** - Setup and config examples
6. **Best Practices** - Recommendations and tips
7. **Troubleshooting** - Common issues and solutions

---

## 🔧 Source Code References

### Anthropic Implementation
```
src/agents/
├── anthropic-payload-log.ts              # Payload logger
└── pi-embedded-runner/run/attempt.ts     # Provider routing

src/commands/
└── auth-choice.apply.anthropic.ts        # Auth management
```

### Azure OpenAI Implementation
```
src/agents/
├── azure-openai-models.ts                # Constants
├── azure-openai-native-client.ts         # Client manager
├── azure-openai-stream-adapter-native.ts # Stream adapter
└── pi-embedded-runner/run/attempt.ts     # Provider routing
```

---

## 🚀 Common Use Cases

### 1. Understanding the Architecture
→ Read [Architecture Summary](./anthropic-architecture-summary.md)

### 2. Implementing Anthropic Integration
→ Follow [Class Design](./anthropic-class-design.mermaid.md)
→ Reference [End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md)

### 3. Choosing Between Azure OpenAI and Anthropic
→ Review [Comparison](./azure-vs-anthropic-comparison.mermaid.md)
→ Use decision matrix in [Summary](./anthropic-architecture-summary.md#decision-matrix)

### 4. Debugging Issues
→ Check [End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md#error-handling)
→ Reference [Summary](./anthropic-architecture-summary.md#troubleshooting)

### 5. Enabling Payload Logging
→ See [Class Design](./anthropic-class-design.mermaid.md#anthropicpayloadlogger-payload-logger)
→ Follow [Summary](./anthropic-architecture-summary.md#payload-logging-optional)

### 6. Migration Between Providers
→ Follow [Comparison](./azure-vs-anthropic-comparison.mermaid.md#migration-path)
→ Use guides in [Summary](./anthropic-architecture-summary.md#migration-guide)

---

## 💡 Key Insights

### Simplicity vs Security
- **Azure OpenAI:** Maximum security (keyless), higher complexity
- **Anthropic:** Good security (API key/token), much simpler

### Standard vs Custom
- **Azure OpenAI:** Custom adapter to fix LangChain bug
- **Anthropic:** Standard Pi AI integration (no custom adapter)

### Enterprise vs Agile
- **Azure OpenAI:** Best for enterprise with Azure infrastructure
- **Anthropic:** Best for rapid development and multi-cloud

### Hybrid Approach
Both can coexist:
- Use Azure OpenAI in production (enterprise security)
- Use Anthropic in development (simplicity)
- Support both for vendor diversity and failover

---

## 🎓 Learning Path

### Beginner
1. Read [Summary](./anthropic-architecture-summary.md) - Overview
2. Review high-level diagrams in [Comparison](./azure-vs-anthropic-comparison.mermaid.md)
3. Try simple API key setup

### Intermediate
1. Study [Class Design](./anthropic-class-design.mermaid.md) - Components
2. Follow [End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md) - Request lifecycle
3. Enable payload logging
4. Experiment with setup-token auth

### Advanced
1. Compare with [Azure OpenAI Class Design](./azure-openai-class-design.mermaid.md)
2. Study custom adapter implementation
3. Implement hybrid approach
4. Build custom monitoring/alerting

---

## 📊 Document Statistics

- **Total Documents:** 4
- **Total Diagrams:** 3 (Mermaid)
- **Total Pages:** ~50 (estimated PDF)
- **Code Examples:** 20+
- **Configuration Examples:** 15+
- **Comparison Tables:** 10+

---

## 🤝 Contributing

To update these documents:

1. **Edit Mermaid diagrams** directly in `.mermaid.md` files
2. **Update code examples** to match latest implementation
3. **Add troubleshooting tips** as issues are discovered
4. **Keep comparison tables** current with latest features

### Document Maintenance Checklist
- [ ] Verify code examples match current implementation
- [ ] Update version numbers (API versions, SDK versions)
- [ ] Check all links work
- [ ] Ensure diagrams render correctly
- [ ] Update configuration examples
- [ ] Add new troubleshooting tips
- [ ] Review security best practices

---

## 📞 Support

For questions or issues:
1. Check **[Troubleshooting](./anthropic-architecture-summary.md#troubleshooting)** section
2. Review **[Error Handling](./anthropic-end-to-end-flow.mermaid.md#error-handling)** guide
3. Search for similar issues in codebase
4. Open GitHub issue with details

---

## 📅 Last Updated

**Date:** 2026-02-09

**Changes:**
- Initial documentation created
- Added comprehensive class diagrams
- Added end-to-end flow documentation
- Added Azure vs Anthropic comparison
- Added architecture summary and best practices

---

## 🔗 Quick Links

| Document | Purpose | Best For |
|----------|---------|----------|
| [Class Design](./anthropic-class-design.mermaid.md) | Component architecture | Developers, Architects |
| [End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md) | Request lifecycle | Developers, DevOps |
| [Comparison](./azure-vs-anthropic-comparison.mermaid.md) | Architecture comparison | Architects, Decision makers |
| [Summary](./anthropic-architecture-summary.md) | Quick reference | Everyone |
| [Azure OpenAI Class Design](./azure-openai-class-design.mermaid.md) | Reference implementation | Developers |

---

**Happy Building! 🚀**
