# Azure OpenAI Implementation Reference

Technical documentation of Azure OpenAI GPT-5.2 integration with Microsoft Managed Identity.

## Overview

This document describes the implementation of Azure OpenAI support in Clawdbot, including:
- Model definitions and configuration
- Managed Identity authentication
- Provider integration
- Schema validation
- Runtime client initialization

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Model Selection Layer                           │
│   (src/agents/model-selection.ts)                              │
│   - Resolves "azureopenai/gpt-5.2" or alias "GPT"             │
│   - Normalizes provider ID                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Authentication Resolution                          │
│   (src/agents/model-auth.ts)                                   │
│   - Detects "managedidentity" auth mode                        │
│   - Selects credential based on NODE_ENV                       │
│   - Returns auth info (no API key needed)                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Runtime Client Initialization                      │
│   (src/agents/azure-openai-runtime.ts)                         │
│   - Creates ManagedIdentityCredential (prod)                   │
│   - or AzureCliCredential (dev)                                │
│   - Initializes AzureChatOpenAI with bearer token provider     │
│   - Caches client instance                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Azure OpenAI API                              │
│   endpoint: datacopilothub8882317788.cognitiveservices.azure...│
│   deployment: gpt-5.2-chat                                      │
│   api-version: 2024-12-01-preview                              │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
clawdbot/
├── src/
│   ├── agents/
│   │   ├── azure-openai-models.ts      # Model definitions & constants
│   │   ├── azure-openai-runtime.ts     # Runtime client initialization
│   │   ├── defaults.ts                 # Updated default provider/model
│   │   ├── model-auth.ts               # Managed identity auth logic
│   │   └── model-selection.ts          # Provider normalization
│   ├── commands/
│   │   ├── auth-choice-options.ts      # TUI provider options (UPDATED)
│   │   ├── auth-choice.apply.ts        # Auth handler registry (UPDATED)
│   │   ├── auth-choice.apply.azureopenai.ts # Azure auth handler (NEW)
│   │   ├── onboard-auth.ts             # Exports Azure config functions
│   │   ├── onboard-auth.config-azure.ts # Azure provider config helpers
│   │   ├── onboard-auth.config-core.ts # Core config helpers (UPDATED)
│   │   └── onboard-types.ts            # Auth choice types (UPDATED)
│   └── config/
│       ├── defaults.ts                 # Model aliases
│       ├── types.auth.ts               # Auth profile types (UPDATED)
│       ├── types.models.ts             # Type definitions
│       ├── zod-schema.ts               # Config validation schema
│       └── zod-schema.core.ts          # Core schema definitions
├── docs/
│   └── providers/
│       └── azureopenai.md              # User documentation (UPDATED)
├── AZURE_OPENAI_QUICKSTART.md          # Quick start guide (UPDATED)
├── AZURE_OPENAI_IMPLEMENTATION.md      # This file
└── package.json                        # Dependencies
```

## Key Components

### 1. Model Definitions

**File**: `src/agents/azure-openai-models.ts`

Defines Azure OpenAI configuration constants and model catalog:

```typescript
// Azure OpenAI endpoint and deployment
export const AZURE_OPENAI_ENDPOINT = "https://datacopilothub8882317788...";
export const AZURE_OPENAI_DEPLOYMENT = "gpt-5.2-chat";
export const AZURE_OPENAI_API_VERSION = "2024-12-01-preview";

// Managed Identity configuration
export const AZURE_OPENAI_SCOPE = "https://cognitiveservices.azure.com/.default";
export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "YOUR-MANAGED-IDENTITY-CLIENT-ID";

// Model catalog
export const AZURE_OPENAI_MODEL_CATALOG = [
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    reasoning: false,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 8192,
  },
];
```

**Key Functions**:
- `buildAzureOpenAIModelDefinition(entry)`: Builds model config from catalog entry

### 2. Runtime Client

**File**: `src/agents/azure-openai-runtime.ts`

Handles Azure OpenAI client initialization with managed identity:

```typescript
export async function getAzureOpenAIModelInstance(): Promise<AzureChatOpenAI> {
  // Select credential based on environment
  const credential = process.env.NODE_ENV === "production"
    ? new ManagedIdentityCredential(AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID)
    : new AzureCliCredential();

  // Create bearer token provider
  const azureADTokenProvider = getBearerTokenProvider(credential, AZURE_OPENAI_SCOPE);

  // Initialize AzureChatOpenAI with managed identity
  const model = new AzureChatOpenAI({
    model: AZURE_OPENAI_DEPLOYMENT,
    azureOpenAIApiVersion: AZURE_OPENAI_API_VERSION,
    azureOpenAIEndpoint: AZURE_OPENAI_ENDPOINT,
    azureADTokenProvider: azureADTokenProvider,
    // Note: azureOpenAIApiKey is required by SDK but not used
    azureOpenAIApiKey: "dummy-key-not-used",
  });

  return model;
}
```

**Key Features**:
- Environment-aware credential selection
- Client instance caching
- Automatic token refresh

### 3. Authentication

**File**: `src/agents/model-auth.ts`

Added managed identity auth support:

```typescript
// New type definition
export type ResolvedProviderAuth = {
  apiKey?: string;
  profileId?: string;
  source: string;
  mode: "api-key" | "oauth" | "token" | "aws-sdk" | "managedidentity";
};

// New auth info resolver
function resolveAzureManagedIdentityAuthInfo(): {
  mode: "managedidentity";
  source: string
} {
  const isProduction = process.env.NODE_ENV === "production";
  const source = isProduction ? "azure managed identity" : "azure cli credential";
  return { mode: "managedidentity", source };
}

// Updated provider resolver
export async function resolveApiKeyForProvider(params) {
  const authOverride = resolveProviderAuthOverride(cfg, provider);

  // Handle managed identity
  if (authOverride === "managedidentity") {
    return resolveAzureManagedIdentityAuthInfo();
  }

  // Default for azureopenai provider
  if (normalizeProviderId(provider) === "azureopenai") {
    return resolveAzureManagedIdentityAuthInfo();
  }

  // ... other auth methods
}
```

**Key Changes**:
1. Added `"managedidentity"` to auth mode types
2. Created `resolveAzureManagedIdentityAuthInfo()` function
3. Updated `resolveApiKeyForProvider()` to handle managed identity
4. Updated `resolveModelAuthMode()` to return `"managedidentity"`

### 4. Provider Normalization

**File**: `src/agents/model-selection.ts`

Added Azure OpenAI provider normalization:

```typescript
export function normalizeProviderId(provider: string): string {
  const normalized = provider.trim().toLowerCase();
  if (normalized === "z.ai" || normalized === "z-ai") return "zai";
  if (normalized === "opencode-zen") return "opencode";
  if (normalized === "qwen") return "qwen-portal";
  // New: Azure OpenAI normalization
  if (normalized === "azure-openai" || normalized === "azure_openai") {
    return "azureopenai";
  }
  return normalized;
}
```

**Purpose**: Handles various spellings of "azureopenai" provider name.

### 5. Default Configuration

**File**: `src/agents/defaults.ts`

Updated default provider and model:

```typescript
// Before:
export const DEFAULT_PROVIDER = "anthropic";
export const DEFAULT_MODEL = "claude-opus-4-5";
export const DEFAULT_CONTEXT_TOKENS = 200_000;

// After:
export const DEFAULT_PROVIDER = "azureopenai";
export const DEFAULT_MODEL = "gpt-5.2";
export const DEFAULT_CONTEXT_TOKENS = 128_000;
```

### 6. Model Aliases

**File**: `src/config/defaults.ts`

Updated model alias mappings:

```typescript
const DEFAULT_MODEL_ALIASES: Readonly<Record<string, string>> = {
  // Azure OpenAI (default)
  gpt: "azureopenai/gpt-5.2",

  // OpenAI (explicit)
  "openai-gpt": "openai/gpt-5.2",
  "gpt-mini": "openai/gpt-5-mini",

  // ... other providers
};
```

**Impact**: The `gpt` alias now points to Azure OpenAI instead of OpenAI API.

### 7. Onboarding Configuration

**File**: `src/commands/onboard-auth.config-azure.ts`

Configuration helpers for Azure OpenAI:

```typescript
export function applyAzureOpenAIProviderConfig(cfg: ClawdbotConfig): ClawdbotConfig {
  // Add model alias
  const models = { ...cfg.agents?.defaults?.models };
  models[AZURE_OPENAI_DEFAULT_MODEL_REF] = {
    alias: "GPT",
  };

  // Configure provider
  const providers = { ...cfg.models?.providers };
  providers.azureopenai = {
    baseUrl: AZURE_OPENAI_ENDPOINT,
    api: "openai-completions",
    auth: "managedidentity",
    headers: {
      "api-version": AZURE_OPENAI_API_VERSION,
    },
    models: azureModels,
  };

  return { ...cfg, agents, models };
}

export function applyAzureOpenAIConfig(cfg: ClawdbotConfig): ClawdbotConfig {
  const next = applyAzureOpenAIProviderConfig(cfg);
  // Set as primary model
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          primary: AZURE_OPENAI_DEFAULT_MODEL_REF,
        },
      },
    },
  };
}
```

**Exported via**: `src/commands/onboard-auth.ts`

### 8. Type Definitions

**File**: `src/config/types.models.ts`

Extended auth mode type:

```typescript
// Before:
export type ModelProviderAuthMode = "api-key" | "aws-sdk" | "oauth" | "token";

// After:
export type ModelProviderAuthMode =
  | "api-key"
  | "aws-sdk"
  | "oauth"
  | "token"
  | "managedidentity";
```

### 9. Schema Validation

**Files**:
- `src/config/zod-schema.ts` (auth profiles schema)
- `src/config/zod-schema.core.ts` (provider schema)

Updated Zod schemas to accept "managedidentity":

```typescript
// Auth profiles schema (zod-schema.ts)
mode: z.union([
  z.literal("api_key"),
  z.literal("oauth"),
  z.literal("token"),
  z.literal("managedidentity"),  // Added
]),

// Provider auth schema (zod-schema.core.ts)
auth: z.union([
  z.literal("api-key"),
  z.literal("aws-sdk"),
  z.literal("oauth"),
  z.literal("token"),
  z.literal("managedidentity"),  // Added
]).optional(),
```

## Dependencies

**File**: `package.json`

Added Azure-related dependencies:

```json
{
  "dependencies": {
    "@azure/identity": "^4.7.0",
    "@langchain/core": "^0.3.53",
    "@langchain/openai": "^0.3.22",
    // ... existing dependencies
  }
}
```

**Package Purposes**:
- `@azure/identity`: Managed Identity and Azure CLI authentication
- `@langchain/openai`: Azure OpenAI integration
- `@langchain/core`: LangChain base library

## Configuration Schema

### Auth Profile

```json
{
  "auth": {
    "profiles": {
      "azureopenai:default": {
        "provider": "azureopenai",
        "mode": "managedidentity"
      }
    }
  }
}
```

### Provider Configuration

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "azureopenai": {
        "baseUrl": "https://RESOURCE.cognitiveservices.azure.com/",
        "api": "openai-completions",
        "auth": "managedidentity",
        "headers": {
          "api-version": "2024-12-01-preview"
        },
        "models": [
          {
            "id": "gpt-5.2",
            "name": "GPT-5.2",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

### Agent Configuration

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "azureopenai/gpt-5.2"
      },
      "models": {
        "azureopenai/gpt-5.2": {
          "alias": "GPT"
        }
      }
    }
  }
}
```

## Authentication Flow

### Development Mode

1. User runs `az login`
2. Azure CLI stores credentials in `~/.azure/`
3. `AzureCliCredential` reads cached credentials
4. Token is obtained for the specified scope
5. Token is used in Authorization header

### Production Mode

1. Azure resource has Managed Identity enabled
2. Application requests token from IMDS endpoint
3. `ManagedIdentityCredential` obtains token automatically
4. Token is refreshed before expiration
5. No credentials stored locally

## Token Management

### Token Acquisition

```typescript
const azureADTokenProvider = getBearerTokenProvider(
  credential,
  "https://cognitiveservices.azure.com/.default"
);
```

### Token Lifecycle

1. **Initial Request**: Token acquired on first API call
2. **Caching**: Token cached by Azure SDK
3. **Refresh**: Automatically refreshed before expiration
4. **Retry**: Failed requests trigger token refresh

### Token Expiration

- Development: Azure CLI tokens expire after 1 hour (default)
- Production: Managed Identity tokens expire after 1 hour
- Both are automatically refreshed by the SDK

## Error Handling

### Authentication Errors

**Scenario**: Managed Identity not configured
```
Error: No API key found for provider "azureopenai"
```

**Resolution**: Configure managed identity in `clawdbot.json`

### Authorization Errors

**Scenario**: Insufficient permissions
```
Error: 401 Unauthorized
```

**Resolution**: Grant "Cognitive Services User" role

### Configuration Errors

**Scenario**: Invalid auth mode
```
Error: auth.profiles.azureopenai:default.mode: Invalid input
```

**Resolution**: Rebuild with updated schema (`pnpm build`)

## Performance Considerations

### Client Caching

```typescript
let cachedModel: AzureChatOpenAI | null = null;

export async function getAzureOpenAIModelInstance() {
  if (cachedModel) return cachedModel;

  // Initialize client
  cachedModel = new AzureChatOpenAI({ ... });
  return cachedModel;
}
```

**Benefits**:
- Reduces initialization overhead
- Reuses token provider
- Improves response latency

### Token Caching

The Azure SDK caches tokens automatically:
- Reduces token acquisition calls
- Refreshes before expiration
- No manual management needed

## Testing

### Local Development

```bash
# Ensure Azure CLI is logged in
az login
az account show

# Run in development mode
NODE_ENV=development pnpm gateway:watch
```

### Production Testing

```bash
# Enable Managed Identity on Azure VM/Container
az vm identity assign --name VM_NAME --resource-group RG_NAME

# Grant permissions
az role assignment create \
  --assignee MANAGED_IDENTITY_CLIENT_ID \
  --role "Cognitive Services User" \
  --scope AZURE_OPENAI_RESOURCE_ID

# Run in production mode
NODE_ENV=production pnpm gateway:watch
```

## Deployment

### Azure VM

1. Enable System or User Managed Identity
2. Grant role assignment
3. Set `NODE_ENV=production`
4. Deploy application

### Azure Container Instances

```yaml
properties:
  containers:
  - name: clawdbot
    properties:
      image: clawdbot:latest
      environmentVariables:
      - name: NODE_ENV
        value: production
  identity:
    type: UserAssigned
    userAssignedIdentities:
      /subscriptions/.../managedIdentities/clawdbot-identity: {}
```

### Azure App Service

1. Enable Managed Identity in portal
2. Add RBAC role assignment
3. Set application settings:
   - `NODE_ENV=production`
4. Deploy

## Security

### Credentials

- ✅ No API keys in code
- ✅ No secrets in environment variables
- ✅ No credentials in config files
- ✅ Tokens obtained dynamically

### Permissions

Least privilege approach:
- Use "Cognitive Services OpenAI User" role (not Contributor)
- Scope to specific resource
- Audit access logs

### Network

Consider:
- Private endpoints for Azure OpenAI
- Virtual network integration
- Network security groups

## Monitoring

### Logs

Application logs:
```
[Runtime] Initializing Azure OpenAI with managed identity
[Runtime] ENV: production - Using ManagedIdentityCredential
[Runtime] Using credential: ManagedIdentityCredential
[Runtime] Azure OpenAI client initialized for deployment: gpt-5.2-chat
```

### Metrics

Monitor:
- Token acquisition time
- API response latency
- Authentication failures
- Rate limits

### Azure Monitor

Enable diagnostic logs:
```bash
az monitor diagnostic-settings create \
  --resource AZURE_OPENAI_RESOURCE_ID \
  --name audit-logs \
  --logs '[{"category": "Audit", "enabled": true}]'
```

## Migration Path

### From OpenAI API

1. Update endpoint in `azure-openai-models.ts`
2. Rebuild: `pnpm build`
3. Update config: `~/.clawdbot/clawdbot.json`
4. Remove `OPENAI_API_KEY` environment variable
5. Restart gateway

### From Anthropic

1. Keep Anthropic as fallback:
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "azureopenai/gpt-5.2",
        "fallbacks": ["anthropic/claude-sonnet-4-5"]
      }
    }
  }
}
```

2. Test Azure OpenAI
3. Remove Anthropic fallback when ready

## Future Enhancements

Potential improvements:
- Support for multiple Azure OpenAI resources
- Regional failover
- Cost tracking and budgets
- Model version pinning
- Deployment slot support

## References

- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [LangChain Azure OpenAI](https://js.langchain.com/docs/integrations/chat/azure)
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [Managed Identity Overview](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)

## TUI Integration

### Onboarding Wizard Support

Azure OpenAI is now fully integrated into the interactive onboarding wizard (`clawdbot onboard`).

#### New Files

**`src/commands/auth-choice.apply.azureopenai.ts`**: Handler for Azure OpenAI auth choice

```typescript
export async function applyAuthChoiceAzureOpenAI(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "azure-openai-managedidentity") {
    return null;
  }

  // Apply Azure OpenAI configuration
  let nextConfig = applyAzureOpenAIConfig(params.config);

  // Add auth profile
  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "azureopenai:default",
    provider: "azureopenai",
    mode: "managedidentity",
  });

  // Display setup instructions
  await params.prompter.note(/* ... */);

  return { config: nextConfig };
}
```

#### Updated Files

**`src/commands/onboard-types.ts`**: Added auth choice type
```typescript
export type AuthChoice =
  | "azure-openai-managedidentity"  // New
  | "openai-codex"
  | "openai-api-key"
  // ... other choices
```

**`src/commands/auth-choice-options.ts`**: Added provider group and option
```typescript
export type AuthChoiceGroupId =
  | "azureopenai"  // New
  | "openai"
  | "anthropic"
  // ... other groups

const AUTH_CHOICE_GROUP_DEFS = [
  {
    value: "azureopenai",
    label: "Azure OpenAI",
    hint: "GPT-5.2 with Managed Identity",
    choices: ["azure-openai-managedidentity"],
  },
  // ... other groups
];
```

**`src/commands/auth-choice.apply.ts`**: Registered handler
```typescript
import { applyAuthChoiceAzureOpenAI } from "./auth-choice.apply.azureopenai.js";

const handlers = [
  applyAuthChoiceOpenAI,
  applyAuthChoiceAzureOpenAI,  // Added
  applyAuthChoiceOAuth,
  // ... other handlers
];
```

**`src/config/types.auth.ts`**: Extended auth profile mode
```typescript
export type AuthProfileConfig = {
  provider: string;
  mode: "api_key" | "oauth" | "token" | "managedidentity";  // Added managedidentity
  email?: string;
};
```

**`src/commands/onboard-auth.config-core.ts`**: Updated config function signature
```typescript
export function applyAuthProfileConfig(
  cfg: ClawdbotConfig,
  params: {
    profileId: string;
    provider: string;
    mode: "api_key" | "oauth" | "token" | "managedidentity";  // Added
    email?: string;
    preferProfileFirst?: boolean;
  },
): ClawdbotConfig
```

### User Experience

When users run `clawdbot onboard`, they see:

```
Model/auth provider
  ○ OpenAI (Codex OAuth + API key)
  ● Azure OpenAI (GPT-5.2 with Managed Identity)  ← New option
  ○ Anthropic
  ○ MiniMax
  [... other providers ...]
```

After selecting Azure OpenAI:
```
Azure OpenAI auth method
  ● Azure OpenAI (Managed Identity)
  ○ Back
```

The wizard then displays:
```
┌  Azure OpenAI Setup
│
│  Azure OpenAI with Managed Identity authentication
│
│  For development: Run `az login` to authenticate
│  For production: Ensure Managed Identity is configured
│
│  Make sure your Azure OpenAI deployment is configured in:
│    src/agents/azure-openai-models.ts
│
└

┌  Model configured
│
│  Default model set to azureopenai/gpt-5.2 (GPT-5.2)
│
└

┌  Configuration complete
│
│  Azure OpenAI configured successfully!
│
│  Next steps:
│  1. Update your Azure OpenAI endpoint and deployment in:
│     src/agents/azure-openai-models.ts
│  2. Run `pnpm build` to apply changes
│  3. For production, set NODE_ENV=production
│
└
```

## Change Summary

| Component | Change Type | Description |
|-----------|------------|-------------|
| `azure-openai-models.ts` | **New** | Model definitions and constants |
| `azure-openai-runtime.ts` | **New** | Runtime client initialization |
| `onboard-auth.config-azure.ts` | **New** | Onboarding config helpers |
| `auth-choice.apply.azureopenai.ts` | **New** | TUI auth handler |
| `model-auth.ts` | **Modified** | Added managed identity auth |
| `model-selection.ts` | **Modified** | Provider normalization |
| `defaults.ts` (agents) | **Modified** | Default provider/model |
| `defaults.ts` (config) | **Modified** | Model aliases |
| `types.auth.ts` | **Modified** | Auth profile types |
| `types.models.ts` | **Modified** | Auth mode types |
| `auth-choice-options.ts` | **Modified** | TUI provider options |
| `auth-choice.apply.ts` | **Modified** | Handler registry |
| `onboard-types.ts` | **Modified** | Auth choice types |
| `onboard-auth.config-core.ts` | **Modified** | Config function signature |
| `zod-schema.ts` | **Modified** | Config validation |
| `zod-schema.core.ts` | **Modified** | Provider schema |
| `package.json` | **Modified** | Azure dependencies |

Total: 17 files modified/created (7 new, 10 modified)
