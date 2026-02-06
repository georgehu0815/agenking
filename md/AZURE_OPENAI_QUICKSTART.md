# Azure OpenAI GPT-5.2 Quick Start Guide

Get Clawdbot running with Azure OpenAI GPT-5.2 in 5 minutes.

## Prerequisites

- Azure OpenAI resource with GPT-5.2 deployment
- Azure CLI installed and logged in (for local development)

## Quick Setup (Using TUI Wizard)

### 1. Install Dependencies

```bash
cd /path/to/clawdbot
pnpm install
```

### 2. Login to Azure (Development Only)

```bash
az login
az account show  # Verify login
```

### 3. Run Onboarding Wizard

```bash
pnpm clawdbot onboard
```

Select:
- **Model/auth provider**: `Azure OpenAI (GPT-5.2 with Managed Identity)`
- **Azure OpenAI auth method**: `Azure OpenAI (Managed Identity)`

The wizard will configure everything automatically!

### 4. Configure Your Deployment

Update `src/agents/azure-openai-models.ts` with your Azure OpenAI details:

```typescript
export const AZURE_OPENAI_ENDPOINT = "https://YOUR-RESOURCE.cognitiveservices.azure.com/";
export const AZURE_OPENAI_DEPLOYMENT = "your-deployment-name";
export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "your-client-id";
```

### 5. Rebuild

```bash
pnpm build
```

### 6. Verify Configuration

```bash
pnpm clawdbot models status
```

Expected output:
```
Default       : azureopenai/gpt-5.2
```

### 7. Start Gateway

```bash
pnpm gateway:watch
```

Look for these logs:
```
[gateway] agent model: azureopenai/gpt-5.2
[Runtime] Initializing Azure OpenAI with managed identity
```

### 8. Test

Send a test message via your configured channel!

---

## Manual Setup (Alternative)

If you prefer manual configuration instead of the wizard:

### 1. Install Dependencies

```bash
cd /path/to/clawdbot
pnpm install
```

### 2. Login to Azure (Development Only)

```bash
az login
az account show  # Verify login
```

### 3. Configure Azure OpenAI

Update `src/agents/azure-openai-models.ts` with your Azure OpenAI details:

```typescript
export const AZURE_OPENAI_ENDPOINT = "https://YOUR-RESOURCE.cognitiveservices.azure.com/";
export const AZURE_OPENAI_DEPLOYMENT = "your-deployment-name";
export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "your-client-id";
```

### 4. Rebuild

```bash
pnpm build
```

### 5. Update Configuration

Edit `~/.clawdbot/clawdbot.json`:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "azureopenai/gpt-5.2"
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
    "providers": {
      "azureopenai": {
        "baseUrl": "https://YOUR-RESOURCE.cognitiveservices.azure.com/",
        "auth": "managedidentity",
        "api": "openai-completions"
      }
    }
  }
}
```

### 6. Verify Configuration

```bash
pnpm clawdbot models status
```

Expected output:
```
Default       : azureopenai/gpt-5.2
```

### 7. Start Gateway

```bash
pnpm gateway:watch
```

Look for these logs:
```
[gateway] agent model: azureopenai/gpt-5.2
[Runtime] Initializing Azure OpenAI with managed identity
```

### 8. Test

Send a test message via your configured channel!

## Production Deployment

For production (Azure VM/Container/App Service):

1. Enable Managed Identity on your Azure resource
2. Grant "Cognitive Services OpenAI User" role
3. Set environment variable:
```bash
export NODE_ENV=production
```
4. Start gateway

## Troubleshooting

### "Authentication failed"
```bash
az login  # Re-login
```

### Gateway using wrong model
```bash
pkill -9 -f gateway  # Stop gateway
pnpm clawdbot config get agents.defaults.model.primary  # Verify config
pnpm gateway:watch  # Restart
```

### Config validation errors
```bash
pnpm build  # Rebuild with updated schema
pnpm clawdbot doctor --fix
```

## Configuration Files Reference

| File | Purpose |
|------|---------|
| `~/.clawdbot/clawdbot.json` | Runtime configuration |
| `src/agents/azure-openai-models.ts` | Azure OpenAI constants |
| `src/agents/azure-openai-runtime.ts` | Runtime client initialization |
| `src/config/defaults.ts` | Default model aliases |

## Key Values to Update

| Value | Location | Description |
|-------|----------|-------------|
| Endpoint | `azure-openai-models.ts`, `clawdbot.json` | Azure OpenAI resource URL |
| Deployment | `azure-openai-models.ts` | GPT-5.2 deployment name |
| Client ID | `azure-openai-models.ts` | Managed Identity client ID |

## Authentication Flow

**Development (`NODE_ENV=development` or unset):**
1. Uses `AzureCliCredential`
2. Reads cached credentials from `~/.azure/`
3. Requires `az login`

**Production (`NODE_ENV=production`):**
1. Uses `ManagedIdentityCredential`
2. Obtains tokens from Azure IMDS
3. No credentials needed

## Next Steps

- Read the [full documentation](docs/providers/azureopenai.md)
- Configure [model fallbacks](/concepts/model-failover)
- Set up [multiple deployments](docs/providers/azureopenai.md#multiple-azure-openai-deployments)

## Support

- Detailed guide: [docs/providers/azureopenai.md](docs/providers/azureopenai.md)
- Issues: https://github.com/clawdbot/clawdbot/issues
- Check logs: `tail -f /tmp/clawdbot-gateway.log`
