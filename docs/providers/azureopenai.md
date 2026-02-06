---
title: Azure OpenAI (Microsoft Managed Identity)
description: Configure Clawdbot to use Azure OpenAI GPT-5.2 with Managed Identity authentication
---

# Azure OpenAI with Managed Identity

Clawdbot supports Azure OpenAI with **Microsoft Managed Identity** authentication, eliminating the need to manage API keys. This guide walks you through setting up Azure OpenAI GPT-5.2 as your default model.

## Overview

- **Provider**: `azureopenai`
- **Default Model**: GPT-5.2 (128k context window)
- **Authentication**: Microsoft Managed Identity (production) or Azure CLI (development)
- **API Version**: 2024-12-01-preview

## Prerequisites

### 1. Azure Resources

You need:
- An Azure OpenAI resource deployed in your subscription
- A GPT-5.2 deployment configured
- Managed Identity configured with appropriate permissions

### 2. Authentication Setup

**For Development (local testing):**
```bash
# Install Azure CLI
brew install azure-cli  # macOS
# or visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Verify access
az account show
```

**For Production (Azure VM/Container/App Service):**
- Enable System-assigned or User-assigned Managed Identity on your Azure resource
- Grant the Managed Identity "Cognitive Services User" role on your Azure OpenAI resource

### 3. Install Dependencies

```bash
cd /path/to/clawdbot
pnpm install
```

This installs the required Azure packages:
- `@azure/identity` - Azure authentication
- `@langchain/openai` - Azure OpenAI integration
- `@langchain/core` - LangChain core

## Configuration

You can configure Azure OpenAI in three ways: via the TUI wizard, manually editing the config file, or using CLI commands.

### Option 1: TUI Onboarding Wizard (Recommended)

The easiest way to set up Azure OpenAI is through the interactive onboarding wizard:

```bash
pnpm clawdbot onboard
```

When prompted for "Model/auth provider", select:
```
  ○ Azure OpenAI (GPT-5.2 with Managed Identity)
```

Then select the auth method:
```
  ○ Azure OpenAI (Managed Identity)
```

The wizard will:
1. Configure the Azure OpenAI provider with managed identity
2. Set GPT-5.2 as your default model
3. Add the `azureopenai:default` auth profile
4. Display next steps for customizing your deployment settings

**After wizard completion**, update your Azure-specific settings in `src/agents/azure-openai-models.ts`:
```typescript
export const AZURE_OPENAI_ENDPOINT = "https://YOUR-RESOURCE.cognitiveservices.azure.com/";
export const AZURE_OPENAI_DEPLOYMENT = "your-deployment-name";
export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "your-client-id";
```

Then rebuild:
```bash
pnpm build
```

### Option 2: Manual Configuration

Edit `~/.clawdbot/clawdbot.json`:

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
  },
  "auth": {
    "profiles": {
      "azureopenai:default": {
        "provider": "azureopenai",
        "mode": "managedidentity"
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "azureopenai": {
        "baseUrl": "https://YOUR-RESOURCE-NAME.cognitiveservices.azure.com/",
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

**Important**: Replace `YOUR-RESOURCE-NAME` with your actual Azure OpenAI resource name.

After manual configuration, update deployment settings in `src/agents/azure-openai-models.ts` and rebuild.

### Option 3: Using CLI Commands

```bash
# Set primary model
pnpm clawdbot config set agents.defaults.model.primary azureopenai/gpt-5.2

# Verify configuration
pnpm clawdbot config get agents.defaults.model.primary
```

**Note**: CLI commands set the model but don't configure the provider. Use the TUI wizard or manual configuration for complete setup.

## Azure Resource Configuration

### Required Values

Update the following values in your configuration based on your Azure OpenAI resource:

| Field | Description | Example |
|-------|-------------|---------|
| `baseUrl` | Your Azure OpenAI endpoint | `https://your-resource.cognitiveservices.azure.com/` |
| `deployment` | Your GPT-5.2 deployment name | `gpt-5.2-chat` |
| `managedIdentityClientID` | User-assigned MI client ID (if applicable) | `YOUR-MANAGED-IDENTITY-CLIENT-ID` |

These values are configured in:
- [src/agents/azure-openai-models.ts](../../src/agents/azure-openai-models.ts) (code defaults)
- `~/.clawdbot/clawdbot.json` (runtime config)

## Authentication Modes

Clawdbot automatically selects the appropriate authentication method:

### Development Mode (Default)

Uses Azure CLI credentials:
```bash
export NODE_ENV=development  # or omit (default)
az login
```

**How it works:**
- Uses `AzureCliCredential` from `@azure/identity`
- Reads cached credentials from `~/.azure/`
- No code changes needed for local development

### Production Mode

Uses Managed Identity:
```bash
export NODE_ENV=production
```

**How it works:**
- Uses `ManagedIdentityCredential` with your specified client ID
- Automatically obtains tokens from Azure Instance Metadata Service (IMDS)
- No credentials stored in config or environment

## Verification

### 1. Check Configuration

```bash
pnpm clawdbot models status
```

Expected output:
```sh
Config        : ~/.clawdbot/clawdbot.json
Agent dir     : ~/.clawdbot/agents/main/agent
Default       : azureopenai/gpt-5.2
Aliases (1)   : GPT -> azureopenai/gpt-5.2

Auth overview
Auth store    : ~/.clawdbot/agents/main/agent/auth-profiles.json
- azureopenai effective=managedidentity
```

### 2. Test the Model

Send a test message:
```bash
pnpm clawdbot message send "Hello, test message" --channel telegram
pnpm clawdbot message send  "Hello, test message" --target +13522355298 --channel whatsapp
```

Or start the gateway:
```bash
pnpm gateway:watch
```

Check the logs for:
```
[gateway] agent model: azureopenai/gpt-5.2
[Runtime] Initializing Azure OpenAI with managed identity
[Runtime] Using credential: AzureCliCredential (or ManagedIdentityCredential)
```

### 3. Verify Model Usage

In your gateway logs, you should see:
```
00:29:57 [gateway] agent model: azureopenai/gpt-5.2
```

## Troubleshooting

### "Authentication failed" or "401 Unauthorized"

**Development:**
```bash
# Re-login to Azure CLI
az login

# Verify you're logged in
az account show

# Check access to Azure OpenAI
az cognitiveservices account show \
  --name YOUR-RESOURCE-NAME \
  --resource-group YOUR-RESOURCE-GROUP
```

**Production:**
1. Verify Managed Identity is enabled on your Azure resource
2. Check role assignments:
```bash
az role assignment list \
  --assignee YOUR-MANAGED-IDENTITY-CLIENT-ID \
  --scope /subscriptions/YOUR-SUBSCRIPTION-ID/resourceGroups/YOUR-RG/providers/Microsoft.CognitiveServices/accounts/YOUR-RESOURCE-NAME
```
3. Ensure the Managed Identity has "Cognitive Services User" or "Cognitive Services OpenAI User" role

### "No API key found for provider azureopenai"

This means the config isn't recognizing the managed identity auth. Verify:

1. Config has the auth profile:
```json
"auth": {
  "profiles": {
    "azureopenai:default": {
      "provider": "azureopenai",
      "mode": "managedidentity"
    }
  }
}
```

2. Provider config has auth mode:
```json
"models": {
  "providers": {
    "azureopenai": {
      "auth": "managedidentity",
      ...
    }
  }
}
```

### "Invalid deployment name"

Verify your deployment name matches what's configured in Azure:
```bash
az cognitiveservices account deployment list \
  --name YOUR-RESOURCE-NAME \
  --resource-group YOUR-RESOURCE-GROUP
```

Update the deployment name in [src/agents/azure-openai-models.ts](../../src/agents/azure-openai-models.ts):
```typescript
export const AZURE_OPENAI_DEPLOYMENT = "your-actual-deployment-name";
```

Then rebuild:
```bash
pnpm build
```

### "Config invalid" errors

If you see schema validation errors:
```bash
pnpm clawdbot doctor --fix
```

Or manually validate:
```bash
pnpm build  # Rebuilds with updated schema
pnpm clawdbot config get agents.defaults.model.primary
```

### Gateway not using new model

1. Stop all gateway processes:
```bash
pkill -9 -f gateway
```

2. Verify config is correct:
```bash
pnpm clawdbot config get agents.defaults.model.primary
# Should show: azureopenai/gpt-5.2
```

3. Restart gateway:
```bash
pnpm gateway:watch
```

## Usage Examples

### Using Model Aliases

The default alias is `GPT` for `azureopenai/gpt-5.2`:

```bash
# These are equivalent:
pnpm clawdbot message send "test" --model azureopenai/gpt-5.2
pnpm clawdbot message send "test" --model GPT
```

### Temporary Model Override

To use a different model for a single message:
```bash
pnpm clawdbot message send "test" --model zai/glm-4.7
```

### Per-Session Model Override

In chat, use the `/model` command:
```
/model opus
/model GPT
/model azureopenai/gpt-5.2
```

## Advanced Configuration

### Multiple Azure OpenAI Deployments

You can configure multiple deployments:

```json
{
  "models": {
    "providers": {
      "azureopenai": {
        "models": [
          {
            "id": "gpt-5.2",
            "name": "GPT-5.2",
            ...
          },
          {
            "id": "gpt-4o",
            "name": "GPT-4 Omni",
            "reasoning": false,
            "input": ["text", "image"],
            "contextWindow": 128000,
            "maxTokens": 4096
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "models": {
        "azureopenai/gpt-5.2": { "alias": "GPT5" },
        "azureopenai/gpt-4o": { "alias": "GPT4" }
      }
    }
  }
}
```

### Custom Managed Identity Client ID

If using a user-assigned managed identity, update the client ID in [src/agents/azure-openai-models.ts](../../src/agents/azure-openai-models.ts):

```typescript
export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "your-client-id-here";
```

Then rebuild:
```bash
pnpm build
```

### Environment-Specific Configuration

Use environment variables to override settings:

```bash
# Force production mode
export NODE_ENV=production

# Override deployment name (requires code changes)
# Edit src/agents/azure-openai-models.ts and rebuild
```

## Security Best Practices

### 1. Never Commit Credentials

The managed identity approach means:
- ✅ No API keys in config files
- ✅ No credentials in environment variables
- ✅ No secrets in code

### 2. Use Least Privilege

Grant only necessary permissions:
- "Cognitive Services OpenAI User" - for model inference only
- NOT "Cognitive Services Contributor" - too broad

### 3. Audit Access

Enable Azure Monitor logging:
```bash
az monitor diagnostic-settings create \
  --resource /subscriptions/YOUR-SUB/resourceGroups/YOUR-RG/providers/Microsoft.CognitiveServices/accounts/YOUR-RESOURCE \
  --name audit-logs \
  --logs '[{"category": "Audit", "enabled": true}]' \
  --workspace YOUR-LOG-ANALYTICS-WORKSPACE-ID
```

### 4. Rotate Managed Identities

For user-assigned identities, rotate them periodically:
1. Create new managed identity
2. Assign roles to new identity
3. Update client ID in config
4. Remove old identity

## Performance Considerations

### Caching

Azure OpenAI model instances are cached after first use:
- Reduces token acquisition overhead
- Improves response latency
- Automatically cleared on config changes

### Token Expiration

Tokens are automatically refreshed:
- Development: Azure CLI token (1 hour default)
- Production: Managed Identity token (handled by Azure SDK)

No manual token management required.

## Migration from Other Providers

### From API Key Auth

If migrating from OpenAI API key auth:

1. Update your config (as shown above)
2. Remove API key environment variables:
```bash
unset OPENAI_API_KEY
```
3. Restart gateway

### From Other Models

To keep other models as fallbacks:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "azureopenai/gpt-5.2",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "zai/glm-4.7"]
      }
    }
  }
}
```

## Related Documentation

- [Model Selection](/concepts/models) - How Clawdbot selects models
- [Model Failover](/concepts/model-failover) - Fallback strategies
- [OAuth Authentication](/concepts/oauth) - Other auth methods
- [Gateway Configuration](/gateway/configuration) - Gateway setup

## Support

If you encounter issues:

1. Check logs: `tail -f /tmp/clawdbot-gateway.log`
2. Verify config: `pnpm clawdbot models status`
3. Test Azure access: `az account show`
4. Run doctor: `pnpm clawdbot doctor --fix`
5. File an issue: https://github.com/clawdbot/clawdbot/issues
