# Azure OpenAI TTS Setup Guide

This guide shows you how to configure Clawdbot to use Azure OpenAI TTS with managed identity authentication.

## ✅ What Was Added

Azure OpenAI TTS support with:
- **Managed Identity Authentication** (no API keys needed)
- **Azure CLI Credential** for local development
- **Full integration** with voice-call plugin and all TTS features

## 🔧 Configuration

### Step 1: Set Azure OpenAI as TTS Provider

```bash
# Set Azure OpenAI as the TTS provider
pnpm clawdbot config set messages.tts.provider azureopenai

# Configure Azure OpenAI endpoint and deployment
pnpm clawdbot config set messages.tts.azureopenai.endpoint "https://datacopilothub8882317788.openai.azure.com"
pnpm clawdbot config set messages.tts.azureopenai.deployment "gpt-4o-mini-tts-3"
pnpm clawdbot config set messages.tts.azureopenai.apiVersion "2025-03-01-preview"

# Optional: Set voice (defaults to "alloy")
pnpm clawdbot config set messages.tts.azureopenai.voice "alloy"

# Optional: Set managed identity client ID (has a default)
pnpm clawdbot config set messages.tts.azureopenai.managedIdentityClientId "YOUR-MANAGED-IDENTITY-CLIENT-ID"
```

### Step 2: Configure for Voice-Call Plugin

The voice-call plugin can override TTS settings. To use Azure OpenAI for voice calls:

```bash
# Option 1: Use the core TTS settings (already configured above)
# No additional configuration needed - voice-call will use messages.tts settings

# Option 2: Override TTS specifically for voice calls
pnpm clawdbot config set plugins.entries.voice-call.config.tts.provider azureopenai
pnpm clawdbot config set plugins.entries.voice-call.config.tts.azureopenai.endpoint "https://datacopilothub8882317788.openai.azure.com"
pnpm clawdbot config set plugins.entries.voice-call.config.tts.azureopenai.deployment "gpt-4o-mini-tts-3"
pnpm clawdbot config set plugins.entries.voice-call.config.tts.azureopenai.apiVersion "2025-03-01-preview"
pnpm clawdbot config set plugins.entries.voice-call.config.tts.azureopenai.voice "alloy"
```

### Step 3: Restart Gateway

```bash
# Restart the gateway to load the new configuration
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Or use the convenience script
./restart-gateway.sh
```

## 🔐 Authentication

### Production (Managed Identity)

When `NODE_ENV=production`, the system uses `ManagedIdentityCredential`:
- Authenticates using Azure managed identity
- No API keys or secrets needed
- Perfect for Azure VM, App Service, Functions, etc.

### Development (Azure CLI)

When `NODE_ENV` is not production, the system uses `AzureCliCredential`:
- Uses your local Azure CLI authentication
- Make sure you're logged in: `az login`
- Perfect for local development

## 📋 Configuration Reference

### Core TTS Configuration

```json
{
  "messages": {
    "tts": {
      "provider": "azureopenai",
      "auto": "always",
      "mode": "final",
      "azureopenai": {
        "endpoint": "https://datacopilothub8882317788.openai.azure.com",
        "deployment": "gpt-4o-mini-tts-3",
        "apiVersion": "2025-03-01-preview",
        "voice": "alloy",
        "useManagedIdentity": true,
        "managedIdentityClientId": "YOUR-MANAGED-IDENTITY-CLIENT-ID"
      }
    }
  }
}
```

### Voice-Call Plugin Override

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "mock",
          "tts": {
            "provider": "azureopenai",
            "azureopenai": {
              "endpoint": "https://datacopilothub8882317788.openai.azure.com",
              "deployment": "gpt-4o-mini-tts-3",
              "apiVersion": "2025-03-01-preview",
              "voice": "alloy"
            }
          }
        }
      }
    }
  }
}
```

## 🎯 Available Voices

Azure OpenAI TTS supports the same voices as OpenAI:
- `alloy` (default)
- `echo`
- `fable`
- `onyx`
- `nova`
- `shimmer`

Example:
```bash
pnpm clawdbot config set messages.tts.azureopenai.voice "nova"
```

## ✅ Testing

### Test TTS with a Message

```bash
# Send a test message to WhatsApp with TTS
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Testing Azure OpenAI TTS"
```

### Test Voice Call

```bash
# Make sure voice-call plugin is configured (see VOICE_CALL_SETUP_GUIDE.md)
# Then send a WhatsApp message:
# "Call +15559876543 and say 'Testing Azure OpenAI voice call'"
```

## 🔍 Verify Configuration

```bash
# View current TTS config
pnpm clawdbot config get messages.tts

# View voice-call plugin TTS config
pnpm clawdbot config get plugins.entries.voice-call.config.tts

# Check gateway status
pnpm clawdbot gateway status
```

## 🐛 Troubleshooting

### Issue: Authentication Failed

**Solution:**
```bash
# For local development, ensure you're logged into Azure CLI
az login

# Verify your account
az account show

# If in production, verify managed identity is configured correctly
```

### Issue: Deployment Not Found

**Solution:**
- Verify the endpoint URL is correct
- Ensure the deployment name matches exactly
- Check the API version is supported

### Issue: Voice Not Working

**Solution:**
- Restart the gateway after configuration changes
- Check gateway logs: `tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log`
- Verify the voice-call plugin is enabled and configured

## 📚 Related Documentation

- [Voice Call Setup Guide](VOICE_CALL_SETUP_GUIDE.md)
- [Voice Call Quick Reference](VOICE_CALL_QUICK_REF.md)
- [Using Voice Calls from WhatsApp](USE_VOICE_CALL_FROM_WHATSAPP.md)

## 🎉 You're Ready!

Azure OpenAI TTS is now configured with managed identity authentication. Your voice calls will use high-quality Azure OpenAI TTS without needing API keys.
