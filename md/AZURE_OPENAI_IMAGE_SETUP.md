# Azure OpenAI Image Understanding - Complete Setup

> Using Azure OpenAI GPT-5.2 with Managed Identity for image analysis (no API key required)

## Overview

This guide shows how to configure Clawdbot's `image` tool to use **Azure OpenAI GPT-5.2 with Managed Identity** for image understanding/analysis. No `OPENAI_API_KEY` required!

### What is the Image Tool?

The `image` tool allows the AI agent to **analyze and understand images**:
- Describe images
- Extract text from images (OCR)
- Answer questions about images
- Identify objects, people, scenes
- Analyze charts, diagrams, screenshots

**Note**: This is for **image understanding**, not image generation (DALL-E).

---

## Current Configuration

### ✅ Configuration Summary

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "azureopenai/gpt-5.2"
      },
      "imageModel": {
        "primary": "azureopenai/gpt-5.2"
      }
    }
  },
  "models": {
    "providers": {
      "azureopenai": {
        "baseUrl": "https://YOUR-RESOURCE.cognitiveservices.azure.com/",
        "auth": "managedidentity",
        "api": "openai-completions",
        "headers": {
          "api-version": "2025-01-01-preview"
        },
        "models": [
          {
            "id": "gpt-5.2",
            "input": ["text", "image"],
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
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
  }
}
```

### Key Components

| Component | Value | Purpose |
|-----------|-------|---------|
| **Image Model** | `azureopenai/gpt-5.2` | Model for image understanding |
| **Primary Model** | `azureopenai/gpt-5.2` | Default model for all tasks |
| **Auth Mode** | `managedidentity` | No API key required |
| **API Version** | `2025-01-01-preview` | Latest Azure OpenAI API |
| **Endpoint** | `YOUR-RESOURCE.cognitiveservices.azure.com` | Your Azure resource |
| **Deployment** | `gpt-5.2-chat` | Deployment name in Azure |
| **Managed Identity ID** | `YOUR-MANAGED-IDENTITY-CLIENT-ID` | Client ID for auth |

---

## How It Works

### Authentication Flow

```
1. Clawdbot needs to analyze an image
   ↓
2. Checks imageModel configuration → azureopenai/gpt-5.2
   ↓
3. Checks auth for azureopenai provider → managedidentity
   ↓
4. src/agents/azure-openai-runtime.ts acquires token:
   - Production: ManagedIdentityCredential (using client ID)
   - Development: AzureCliCredential (using `az login`)
   ↓
5. Creates Azure OpenAI client with token provider (no API key)
   ↓
6. Sends image + prompt to Azure OpenAI
   ↓
7. Returns analysis/description
```

### File Structure

```typescript
src/agents/
├── azure-openai-models.ts           # Azure OpenAI configuration
├── azure-openai-runtime.ts          # Managed identity authentication
├── azure-openai-stream-adapter.ts   # Stream handling for Azure OpenAI
└── tools/
    ├── image-tool.ts                # Image understanding tool
    └── image-tool.helpers.ts        # Image model configuration

src/commands/
├── onboard-auth.config-azure.ts     # Apply Azure OpenAI config
└── auth-choice.apply.azureopenai.ts # Auth choice handler
```

---

## Verification

### 1. Check Configuration

```bash
# Check image model configuration
pnpm clawdbot models status | grep -A 3 "Image"
```

**Expected Output:**
```
Image model   : azureopenai/gpt-5.2
Image fallbacks (0): -
```

### 2. Check Provider Configuration

```bash
cat ~/.clawdbot/clawdbot.json | jq '.models.providers.azureopenai'
```

**Expected Output:**
```json
{
  "baseUrl": "https://YOUR-RESOURCE.cognitiveservices.azure.com/",
  "auth": "managedidentity",
  "api": "openai-completions",
  "headers": {
    "api-version": "2025-01-01-preview"
  },
  "models": [...]
}
```

### 3. Check Auth Profile

```bash
cat ~/.clawdbot/clawdbot.json | jq '.auth.profiles["azureopenai:default"]'
```

**Expected Output:**
```json
{
  "provider": "azureopenai",
  "mode": "managedidentity"
}
```

### 4. Test Managed Identity (Development)

If you're developing locally, make sure Azure CLI is authenticated:

```bash
# Login to Azure CLI
az login

# Verify identity
az account show

# Check if you have access to the Azure OpenAI resource
az cognitiveservices account show \
  --name YOUR-RESOURCE-NAME \
  --resource-group <your-resource-group>
```

---

## Usage Examples

### Example 1: Analyze an Image URL

```bash
clawdbot agent --message "Analyze this image: https://example.com/screenshot.png" --deliver
```

The agent will:
1. Detect the image URL in the prompt
2. Use the `image` tool with `azureopenai/gpt-5.2`
3. Authenticate using managed identity
4. Return the analysis

### Example 2: Describe a Local Image

```bash
# First, save an image to your workspace
cp ~/Downloads/chart.png ~/clawd/chart.png

# Then ask the agent
clawdbot agent --message "Describe the chart in ~/clawd/chart.png" --deliver
```

### Example 3: Extract Text from Screenshot

```bash
clawdbot agent --message "Extract all text from this screenshot: ~/clawd/screenshot.png" --deliver
```

### Example 4: Compare Two Images

```bash
clawdbot agent --message "Compare these two images and tell me the differences: ~/clawd/before.png and ~/clawd/after.png" --deliver
```

### Example 5: Analyze Chart Data

```bash
clawdbot agent --message "What are the key insights from this sales chart? ~/clawd/sales-chart.png" --deliver
```

---

## Troubleshooting

### Issue: "No API key found for provider openai"

**Cause:** The image tool is trying to fall back to OpenAI instead of using Azure OpenAI.

**Solution:** Verify that `imageModel` is explicitly set to `azureopenai/gpt-5.2`:

```bash
# Set image model
pnpm clawdbot models set-image azureopenai/gpt-5.2

# Verify
pnpm clawdbot models status | grep "Image model"
```

---

### Issue: "Authentication failed" or "Unauthorized"

**Possible Causes:**

1. **Local Development - Azure CLI not authenticated:**
   ```bash
   # Login to Azure
   az login

   # Verify account
   az account show
   ```

2. **Production - Managed Identity not assigned:**
   - Ensure the Azure resource (VM/App Service/Container) has the managed identity assigned
   - Verify the managed identity has "Cognitive Services User" role on the Azure OpenAI resource

3. **Wrong Client ID:**
   Check that the client ID in [src/agents/azure-openai-models.ts](src/agents/azure-openai-models.ts#L9) matches your managed identity:
   ```typescript
   export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "YOUR-MANAGED-IDENTITY-CLIENT-ID";
   ```

   Get your managed identity client ID:
   ```bash
   az identity show --name <your-identity-name> --resource-group <your-rg> --query clientId -o tsv
   ```

---

### Issue: "Model not found" or "Deployment not found"

**Cause:** Deployment name mismatch.

**Solution:** Verify deployment name in Azure Portal matches [src/agents/azure-openai-models.ts:6](src/agents/azure-openai-models.ts#L6):

```typescript
export const AZURE_OPENAI_DEPLOYMENT = "gpt-5.2-chat";
```

Check your Azure OpenAI deployment:
```bash
az cognitiveservices account deployment list \
  --name YOUR-RESOURCE-NAME \
  --resource-group <your-rg>
```

---

### Issue: API Version Errors

**Cause:** API version not supported by your deployment.

**Current Version:** `2025-01-01-preview` (in config)

**Solution:** Update API version if needed:

```bash
# Edit config
nano ~/.clawdbot/clawdbot.json

# Change api-version under models.providers.azureopenai.headers
```

Or update the source file:
```bash
nano src/agents/azure-openai-models.ts
# Update AZURE_OPENAI_API_VERSION
```

Then rebuild:
```bash
pnpm build
```

---

### Issue: Image Tool Not Available

**Symptoms:**
- Agent doesn't have `image` tool
- Can't analyze images

**Solution:** The image tool requires an `agentDir` to be configured.

Check your agent workspace:
```bash
cat ~/.clawdbot/clawdbot.json | jq '.agents.defaults.workspace'
```

If not set:
```bash
# Set workspace
clawdbot config set agents.defaults.workspace ~/clawd
```

---

## Advanced Configuration

### Add Fallback Image Models

If you want to add fallback models for image understanding:

```bash
# Add OpenAI GPT-5 Mini as fallback (requires OPENAI_API_KEY)
clawdbot models image-fallbacks add openai/gpt-5-mini

# Or Anthropic Claude (requires ANTHROPIC_API_KEY)
clawdbot models image-fallbacks add anthropic/claude-opus-4-5

# Check configuration
pnpm clawdbot models status | grep -A 5 "Image"
```

**Configuration Result:**
```json
{
  "agents": {
    "defaults": {
      "imageModel": {
        "primary": "azureopenai/gpt-5.2",
        "fallbacks": ["openai/gpt-5-mini"]
      }
    }
  }
}
```

### Use Different Azure OpenAI Model

If you have a different Azure OpenAI deployment (e.g., GPT-4o):

1. **Add model to catalog** in [src/agents/azure-openai-models.ts](src/agents/azure-openai-models.ts#L29):

```typescript
export const AZURE_OPENAI_MODEL_CATALOG = [
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    reasoning: false,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 8192,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    reasoning: false,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 4096,
  },
] as const;
```

2. **Update configuration**:

```bash
pnpm build
pnpm clawdbot models set-image azureopenai/gpt-4o
```

### Custom Endpoint and Deployment

If you need to use a different Azure OpenAI resource:

1. **Update** [src/agents/azure-openai-models.ts](src/agents/azure-openai-models.ts#L5):

```typescript
export const AZURE_OPENAI_ENDPOINT = "https://your-resource.openai.azure.com/";
export const AZURE_OPENAI_DEPLOYMENT = "your-deployment-name";
export const AZURE_OPENAI_MANAGED_IDENTITY_CLIENT_ID = "your-client-id";
```

2. **Rebuild**:

```bash
pnpm build
```

---

## Cost and Performance

### Pricing

Azure OpenAI charges per token. Since you're using managed identity, there's no separate API key billing.

**Estimated costs for image understanding:**
- **Input tokens**: ~1000-2000 tokens per image (depending on resolution)
- **Output tokens**: Varies by analysis depth (100-500 tokens typical)

### Performance Tips

1. **Image Size**: Smaller images = fewer tokens = lower cost
   ```bash
   # Resize before analysis (optional)
   convert large-image.png -resize 1024x1024 resized-image.png
   ```

2. **Batch Analysis**: Analyze multiple images in one request when possible

3. **Specific Prompts**: More specific questions = shorter responses = lower cost
   ```bash
   # Less specific (longer response)
   "Describe this image"

   # More specific (shorter response)
   "What is the title of this chart?"
   ```

---

## Security Best Practices

### ✅ Do's

- **Use Managed Identity** in production (no credentials in code)
- **Limit permissions** to only what's needed (Cognitive Services User role)
- **Rotate credentials** if you ever need to use API keys temporarily
- **Monitor access logs** in Azure Portal

### ❌ Don'ts

- **Don't commit** managed identity client IDs to public repos (though they're not secrets, they identify your resource)
- **Don't use API keys** when managed identity is available
- **Don't share** Azure OpenAI endpoints publicly

---

## Testing Checklist

### Pre-Deployment

- [ ] Azure CLI authenticated (`az login`)
- [ ] Managed identity client ID correct
- [ ] Deployment name matches Azure Portal
- [ ] API version compatible
- [ ] Configuration file updated
- [ ] Code rebuilt (`pnpm build`)

### Post-Deployment

- [ ] Image model configured (`pnpm clawdbot models status`)
- [ ] Provider auth shows `managedidentity`
- [ ] Test image analysis with sample image
- [ ] Check Azure logs for successful requests
- [ ] Verify no authentication errors

---

## Summary

### ✅ What's Configured

```
Configuration Complete! 🎉

┌─────────────────────────────────────────┐
│ Azure OpenAI Image Understanding        │
├─────────────────────────────────────────┤
│ Image Model: azureopenai/gpt-5.2        │
│ Auth: Managed Identity (no API key)     │
│ Endpoint: YOUR-RESOURCE                 │
│ Deployment: gpt-5.2-chat                │
│ API Version: 2025-01-01-preview         │
│ Capabilities: text + image input        │
└─────────────────────────────────────────┘

✅ No OPENAI_API_KEY required!
✅ Uses Azure Managed Identity
✅ Ready for image understanding tasks
```

### Quick Test

```bash
# Test with a simple image analysis
echo "Test image URL: https://picsum.photos/800/600" > ~/clawd/test.md
clawdbot agent --message "Describe the image at https://picsum.photos/800/600" --deliver
```

---

## Related Files

- **Configuration**: [~/.clawdbot/clawdbot.json](~/.clawdbot/clawdbot.json)
- **Azure Models**: [src/agents/azure-openai-models.ts](src/agents/azure-openai-models.ts)
- **Runtime Auth**: [src/agents/azure-openai-runtime.ts](src/agents/azure-openai-runtime.ts)
- **Stream Adapter**: [src/agents/azure-openai-stream-adapter.ts](src/agents/azure-openai-stream-adapter.ts)
- **Image Tool**: [src/agents/tools/image-tool.ts](src/agents/tools/image-tool.ts)
- **Config Apply**: [src/commands/onboard-auth.config-azure.ts](src/commands/onboard-auth.config-azure.ts)

---

## Support

- **Azure OpenAI Docs**: https://learn.microsoft.com/en-us/azure/ai-services/openai/
- **Managed Identity Docs**: https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/
- **Clawdbot Issues**: https://github.com/clawdbot/clawdbot/issues

---

**Last Updated**: 2026-02-01
**Clawdbot Version**: 2026.1.25
**Azure OpenAI API Version**: 2025-01-01-preview
