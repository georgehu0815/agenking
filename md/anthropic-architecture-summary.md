# Anthropic Architecture Summary

## Overview

This document provides a comprehensive overview of the Anthropic integration architecture in clawdbot, comparing it with the Azure OpenAI implementation.

---

## Quick Links

- **[Class Design Diagram](./anthropic-class-design.mermaid.md)** - Class structure and relationships
- **[End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md)** - Complete request/response cycle
- **[Azure vs Anthropic Comparison](./azure-vs-anthropic-comparison.mermaid.md)** - Side-by-side architecture comparison
- **[Azure OpenAI Class Design](./azure-openai-class-design.mermaid.md)** - Reference architecture

---

## Architecture at a Glance

### Anthropic Integration

```
User Request
    ↓
Gateway (WhatsApp/Telegram/Discord/etc.)
    ↓
PiEmbeddedRunner (provider detection)
    ↓
AuthProfiles (load API key/token)
    ↓
StreamAdapter (default streamSimple)
    ↓
Optional: PayloadLogger (request/usage logging)
    ↓
Anthropic API (via @anthropic-ai/sdk)
    ↓
Streaming Response
    ↓
User
```

**Key Characteristic:** Simple, standard Pi AI integration with optional logging

---

### Azure OpenAI Integration (for comparison)

```
User Request
    ↓
Gateway
    ↓
PiEmbeddedRunner (provider + auth detection)
    ↓
Native Client Manager (credential selection)
    ↓
Azure Identity (Managed Identity / Azure CLI)
    ↓
Bearer Token Provider (automatic token refresh)
    ↓
Custom Stream Adapter (native OpenAI client)
    ↓
Azure OpenAI API
    ↓
Streaming Response
    ↓
User
```

**Key Characteristic:** Complex, custom native integration with keyless auth

---

## Core Components

### 1. Authentication

| Component | Azure OpenAI | Anthropic |
|-----------|--------------|-----------|
| **Method** | Managed Identity / Azure CLI | API Key / Setup Token / OAuth |
| **SDK** | @azure/identity | Auth Profiles (direct) |
| **Rotation** | Automatic | Manual |
| **Complexity** | High | Low |
| **Security** | Keyless (most secure) | API key/token (standard) |

---

### 2. Stream Adapter

| Component | Azure OpenAI | Anthropic |
|-----------|--------------|-----------|
| **Adapter** | Custom (`streamAzureOpenAINative`) | Default (`streamSimple`) |
| **Purpose** | Fix tool args bug, native SDK | Standard Pi AI integration |
| **Code** | ~200 lines custom | 0 lines (uses library) |
| **Maintenance** | Manual | Automatic (library) |

---

### 3. Detection Logic

#### Azure OpenAI
```typescript
const usesAzureManagedIdentity =
  normalizeProviderId(provider) === 'azureopenai' &&
  providerConfig.auth === 'managedidentity'

if (usesAzureManagedIdentity) {
  activeSession.agent.streamFn = streamAzureOpenAINative
}
```

#### Anthropic
```typescript
// Always use default (no special case)
activeSession.agent.streamFn = streamSimple

// Optional: wrap with logger
if (loggingEnabled) {
  activeSession.agent.streamFn = logger.wrapStreamFn(streamSimple)
}
```

---

### 4. Payload Logging

**Azure OpenAI:** ❌ Not available

**Anthropic:** ✅ Optional via env var

```bash
export CLAWDBOT_ANTHROPIC_PAYLOAD_LOG=true
export CLAWDBOT_ANTHROPIC_PAYLOAD_LOG_FILE=/logs/anthropic-payload.jsonl
```

Logs:
- Request payloads with SHA-256 digest
- Usage statistics (input/output tokens)
- Errors and metadata

---

## File Organization

### Azure OpenAI
```
src/agents/
├── azure-openai-models.ts                    # Constants
├── azure-openai-native-client.ts             # Native client manager (cache, credentials)
├── azure-openai-stream-adapter-native.ts     # Custom stream adapter
└── pi-embedded-runner/run/attempt.ts         # Detection & routing
```

### Anthropic
```
src/agents/
├── anthropic-payload-log.ts                  # Optional payload logger
└── pi-embedded-runner/run/attempt.ts         # Standard routing

src/commands/
└── auth-choice.apply.anthropic.ts            # Auth management
```

---

## Configuration

### Azure OpenAI
```json
{
  "models": {
    "providers": {
      "azureopenai": {
        "auth": "managedidentity",
        "baseUrl": "https://your-instance.openai.azure.com",
        "api": "2024-12-01-preview",
        "deployment": "gpt-4",
        "managedIdentityClientId": "abc123..."
      }
    }
  }
}
```

Environment:
```bash
export AZURE_OPENAI_ENDPOINT=https://...
export AZURE_OPENAI_DEPLOYMENT=gpt-4
export MANAGED_IDENTITY_CLIENT_ID=abc123...
```

---

### Anthropic
```json
{
  "models": {
    "providers": {
      "anthropic": {
        "auth": "token",
        "baseUrl": "https://api.anthropic.com",
        "api": "anthropic-messages"
      }
    }
  }
}
```

Environment:
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

Or use setup-token:
```bash
# 1. Generate token
claude setup-token

# 2. Store in clawdbot
clawdbot onboard --provider anthropic --auth token
# Paste token when prompted
```

---

## Authentication Modes

### Azure OpenAI
1. **Managed Identity** (production)
   - Keyless authentication
   - Automatic token rotation
   - Azure AD integration
   - RBAC support

2. **Azure CLI** (development)
   - Uses `az login` credentials
   - No API keys needed
   - Easy local development

---

### Anthropic
1. **API Key** (`api_key`)
   - Direct API key from environment
   - Simple and straightforward
   - Standard approach

2. **Setup Token** (`token`)
   - Generated via `claude setup-token`
   - Stored in auth profiles
   - Named profiles support

3. **OAuth** (`oauth`)
   - OAuth-based authentication
   - Refresh token support
   - Future enhancement

---

## Streaming Flow

### Azure OpenAI (Custom Adapter)
```typescript
// Custom adapter with native client
export async function streamAzureOpenAINative(
  context: AgentMessage[],
  options?: StreamOptions,
): Promise<AssistantMessageEventStream> {
  const client = await getClientInstance()
  const messages = convertContextToMessages(context)

  const stream = await client.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    stream: true,
  })

  for await (const chunk of stream) {
    emitEvents(eventStream, chunk)
  }
}
```

---

### Anthropic (Default Adapter)
```typescript
// Uses streamSimple from Pi AI (no custom code)
import { streamSimple } from '@mariozechner/pi-ai'

activeSession.agent.streamFn = streamSimple

// SDK handles everything:
// - Context conversion
// - API authentication
// - Streaming
// - Event emission
```

---

## Key Metrics

| Metric | Azure OpenAI | Anthropic |
|--------|--------------|-----------|
| **Custom Code** | ~500 lines | ~300 lines (mostly optional logging) |
| **Dependencies** | +2 (azure/identity, azure/openai) | 0 (uses existing Pi AI) |
| **Complexity** | High | Low |
| **Setup Time** | Hours (Azure IAM, RBAC) | Minutes (API key) |
| **Maintenance** | Manual (custom adapter) | Automatic (library) |
| **Security** | Keyless (most secure) | API key (standard) |

---

## Decision Matrix

### Choose Azure OpenAI if:
- ✅ Already on Azure infrastructure
- ✅ Need keyless authentication
- ✅ Enterprise security requirements
- ✅ Need Azure AD integration
- ✅ Have dedicated Azure admins
- ✅ Regulated industry (finance, healthcare)

### Choose Anthropic if:
- ✅ Want simple integration
- ✅ Cloud-agnostic deployment
- ✅ Rapid development
- ✅ Multi-cloud strategy
- ✅ Small to medium team
- ✅ No Azure infrastructure

---

## Best Practices

### Azure OpenAI
1. **Production:** Use Managed Identity (keyless)
2. **Development:** Use Azure CLI credentials
3. **Testing:** Cache client instances
4. **Security:** Assign minimal RBAC roles
5. **Monitoring:** Use Azure Monitor

### Anthropic
1. **Production:** Use setup-token (more secure than raw API key)
2. **Development:** Use environment variable (`ANTHROPIC_API_KEY`)
3. **Testing:** Enable payload logging for debugging
4. **Security:** Rotate API keys regularly
5. **Monitoring:** Enable payload logging

---

## Migration Guide

### Azure OpenAI → Anthropic
1. Generate Anthropic API key or setup-token
2. Store in auth profile or environment
3. Update provider config
4. Test with default adapter
5. (Optional) Remove Azure dependencies

### Anthropic → Azure OpenAI
1. Set up Azure infrastructure
2. Configure Managed Identity + RBAC
3. Add Azure dependencies
4. Implement custom stream adapter
5. Update detection logic
6. Test with Azure CLI (dev)
7. Deploy with Managed Identity (prod)

---

## Testing

### Azure OpenAI
```bash
# Development (Azure CLI)
az login
export NODE_ENV=development
npm test

# Production (Managed Identity)
export NODE_ENV=production
# Assumes Azure VM/Container with Managed Identity
npm test
```

### Anthropic
```bash
# With API key
export ANTHROPIC_API_KEY=sk-ant-...
npm test

# With setup-token
claude setup-token
clawdbot onboard --provider anthropic --auth token
npm test

# With payload logging
export CLAWDBOT_ANTHROPIC_PAYLOAD_LOG=true
export CLAWDBOT_ANTHROPIC_PAYLOAD_LOG_FILE=./logs/test.jsonl
npm test
```

---

## Troubleshooting

### Azure OpenAI

**Issue:** "No credentials configured"
```bash
# Development: ensure Azure CLI login
az login

# Production: ensure Managed Identity is assigned
az identity show --ids /subscriptions/.../providers/Microsoft.ManagedIdentity/userAssignedIdentities/...
```

**Issue:** "RBAC permission denied"
```bash
# Assign Cognitive Services User role
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Cognitive Services User" \
  --scope /subscriptions/.../resourceGroups/.../providers/Microsoft.CognitiveServices/accounts/...
```

---

### Anthropic

**Issue:** "Authentication failed"
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Validate API key format (should start with sk-ant-)
claude setup-token  # Generate new token if needed
```

**Issue:** "Rate limit exceeded"
```bash
# Wait for rate limit to reset (check Retry-After header)
# Or upgrade to higher tier plan
```

**Issue:** "Payload logging not working"
```bash
# Ensure env var is set
export CLAWDBOT_ANTHROPIC_PAYLOAD_LOG=true

# Check log file path
export CLAWDBOT_ANTHROPIC_PAYLOAD_LOG_FILE=/path/to/logs/anthropic.jsonl

# Ensure directory exists
mkdir -p /path/to/logs

# Check file permissions
ls -la /path/to/logs/anthropic.jsonl
```

---

## Performance Considerations

### Azure OpenAI
- **Caching:** Client instances are cached (singleton pattern)
- **Token refresh:** Automatic via bearer token provider
- **Latency:** +50ms (token acquisition on first request)
- **Throughput:** Limited by Azure quotas

### Anthropic
- **Caching:** Session managers are cached
- **Token management:** Static (no refresh needed)
- **Latency:** Standard API latency
- **Throughput:** Limited by Anthropic rate limits

---

## Security Considerations

### Azure OpenAI
- ✅ **Keyless:** No API keys in code/env
- ✅ **Azure AD:** Enterprise identity management
- ✅ **RBAC:** Fine-grained permissions
- ✅ **Audit logs:** Azure Monitor integration
- ⚠️ **Complexity:** Requires Azure expertise

### Anthropic
- ⚠️ **API keys:** Must be stored securely
- ✅ **Setup tokens:** More secure than raw API keys
- ✅ **OAuth:** Future-proof authentication
- ✅ **Simple:** Easy to audit and rotate
- ⚠️ **Manual rotation:** No automatic key rotation

---

## Monitoring & Observability

### Azure OpenAI
- **Azure Monitor:** Built-in metrics and logs
- **Application Insights:** Distributed tracing
- **Custom metrics:** Token usage, latency
- **Alerts:** Resource health, quota exceeded

### Anthropic
- **Payload logging:** Request/usage tracking (opt-in)
- **JSONL format:** Easy to parse and analyze
- **Custom metrics:** Parse logs for insights
- **Alerts:** Implement custom alerting on logs

---

## Cost Optimization

### Azure OpenAI
- Use correct instance size (SKU)
- Monitor token usage via Azure Monitor
- Set quota alerts
- Use reserved capacity for predictable workloads

### Anthropic
- Enable payload logging to track usage
- Use prompt caching for repeated context
- Monitor token consumption via logs
- Consider different model tiers (Haiku vs Sonnet vs Opus)

---

## Future Enhancements

### Azure OpenAI
- [ ] Support for multiple Azure regions (failover)
- [ ] Custom prompt caching strategy
- [ ] Enhanced error recovery
- [ ] Performance monitoring dashboard

### Anthropic
- [ ] OAuth implementation (ready for future)
- [ ] Enhanced payload logging (structured metrics)
- [ ] Automatic API key rotation (via vault)
- [ ] Multi-region support

---

## Additional Resources

### Documentation
- [Azure OpenAI Class Design](./azure-openai-class-design.mermaid.md)
- [Azure OpenAI Architecture](./azure-openai-architecture.mermaid.md)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference)
- [Pi AI Framework](https://github.com/mariozechner/pi-ai)

### Source Code
- Azure OpenAI Native Client: `src/agents/azure-openai-native-client.ts`
- Azure OpenAI Stream Adapter: `src/agents/azure-openai-stream-adapter-native.ts`
- Anthropic Payload Logger: `src/agents/anthropic-payload-log.ts`
- Anthropic Auth: `src/commands/auth-choice.apply.anthropic.ts`
- Pi Embedded Runner: `src/agents/pi-embedded-runner/run/attempt.ts`

---

## Summary

Both **Azure OpenAI** and **Anthropic** integrations serve different needs:

| Aspect | Azure OpenAI | Anthropic |
|--------|--------------|-----------|
| **Philosophy** | Enterprise, keyless, custom | Simple, standard, flexible |
| **Best For** | Azure deployments, regulated industries | Multi-cloud, rapid development |
| **Complexity** | High (custom adapter) | Low (standard integration) |
| **Security** | Keyless (most secure) | API key/token (standard) |
| **Maintenance** | Manual (custom code) | Automatic (library) |
| **Cost** | Infrastructure + usage | Usage only |

**Recommendation:**
- Start with **Anthropic** for simplicity and flexibility
- Migrate to **Azure OpenAI** when enterprise security requirements demand keyless authentication
- Support **both** for maximum flexibility and vendor diversity

---

## Questions?

For implementation details, see:
1. [Class Design Diagram](./anthropic-class-design.mermaid.md) - Component architecture
2. [End-to-End Flow](./anthropic-end-to-end-flow.mermaid.md) - Request lifecycle
3. [Comparison](./azure-vs-anthropic-comparison.mermaid.md) - Side-by-side analysis

For Azure OpenAI reference, see:
1. [Azure OpenAI Class Design](./azure-openai-class-design.mermaid.md)
2. [Azure OpenAI Architecture](./azure-openai-architecture.mermaid.md)
