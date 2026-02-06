# Text-to-Speech (TTS) Setup Guide

Complete guide to configure and use Text-to-Speech with Clawdbot.

---

## 🎯 Overview

Text-to-Speech (TTS) converts Clawdbot's text responses into voice messages. When enabled, your messages will be delivered as audio files that can be played directly in messaging apps.

**Supported Channels:**
- WhatsApp (voice notes)
- Telegram (voice messages)
- Discord (audio attachments)
- Slack (audio files)
- And more!

**Available TTS Providers:**
- **Azure OpenAI** - High-quality voices with managed identity (no API keys!)
- **OpenAI** - Premium quality, requires API key
- **ElevenLabs** - Ultra-realistic voices, requires API key
- **Edge TTS** - Free, good quality, no API key required

---

## 📋 Quick Start

### Enable TTS

```bash
# Turn on auto TTS for all messages
pnpm clawdbot config set messages.tts.auto always

# Restart gateway to apply
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Disable TTS

```bash
# Turn off auto TTS
pnpm clawdbot config set messages.tts.auto off

# Restart gateway to apply
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🎛️ TTS Modes

Clawdbot supports four auto-TTS modes:

### 1. **Off** - No Automatic TTS
```bash
pnpm clawdbot config set messages.tts.auto off
```
- No voice messages generated
- Text-only responses
- Use when you prefer reading messages

### 2. **Always** - TTS for All Messages
```bash
pnpm clawdbot config set messages.tts.auto always
```
- Every response becomes a voice message
- Great for hands-free operation
- **Recommended for voice-heavy workflows**

### 3. **Inbound** - TTS for Voice Replies Only
```bash
pnpm clawdbot config set messages.tts.auto inbound
```
- Only replies to voice messages with voice
- Text messages get text replies
- Best for mixed text/voice conversations

### 4. **Tagged** - TTS Only When Requested
```bash
pnpm clawdbot config set messages.tts.auto tagged
```
- TTS only when you include `@tts` in your message
- Example: "Explain quantum physics @tts"
- Maximum control over when voice is used

---

## 🎤 TTS Providers

### Azure OpenAI (Recommended)

**Pros:**
- High-quality voices
- Managed identity authentication (no API keys!)
- Integrated with your Azure setup
- Production-ready

**Setup:**
```bash
# Set provider
pnpm clawdbot config set messages.tts.provider azureopenai

# Configure endpoint and deployment
pnpm clawdbot config set messages.tts.azureopenai.endpoint https://YOUR-RESOURCE.openai.azure.com
pnpm clawdbot config set messages.tts.azureopenai.deployment gpt-4o-mini-tts-3
pnpm clawdbot config set messages.tts.azureopenai.apiVersion 2025-03-01-preview
pnpm clawdbot config set messages.tts.azureopenai.voice alloy

# Enable auto TTS
pnpm clawdbot config set messages.tts.auto always

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Available Voices:**
- `alloy` - Neutral, balanced
- `echo` - Warm, engaging
- `fable` - Expressive, storytelling
- `onyx` - Deep, authoritative
- `nova` - Bright, friendly
- `shimmer` - Soft, gentle

---

### OpenAI TTS

**Pros:**
- High-quality voices
- Fast processing
- Same voices as Azure OpenAI

**Cons:**
- Requires API key

**Setup:**
```bash
# Set provider
pnpm clawdbot config set messages.tts.provider openai

# Configure API key and voice
pnpm clawdbot config set messages.tts.openai.apiKey "sk-..."
pnpm clawdbot config set messages.tts.openai.voice alloy
pnpm clawdbot config set messages.tts.openai.model gpt-4o-mini-tts

# Enable auto TTS
pnpm clawdbot config set messages.tts.auto always

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### ElevenLabs

**Pros:**
- Ultra-realistic voices
- Extensive voice library
- Voice cloning capabilities
- Advanced voice settings

**Cons:**
- Requires API key
- Higher cost

**Setup:**
```bash
# Set provider
pnpm clawdbot config set messages.tts.provider elevenlabs

# Configure API key and voice
pnpm clawdbot config set messages.tts.elevenlabs.apiKey "your_api_key"
pnpm clawdbot config set messages.tts.elevenlabs.voiceId "pMsXgVXv3BLzUgSXRplE"
pnpm clawdbot config set messages.tts.elevenlabs.modelId "eleven_multilingual_v2"

# Optional: Voice settings
pnpm clawdbot config set messages.tts.elevenlabs.voiceSettings.stability 0.5
pnpm clawdbot config set messages.tts.elevenlabs.voiceSettings.similarityBoost 0.75

# Enable auto TTS
pnpm clawdbot config set messages.tts.auto always

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### Edge TTS (Free)

**Pros:**
- Completely free
- No API key required
- Good quality
- Many voices available

**Cons:**
- Lower quality than premium providers
- Limited voice customization

**Setup:**
```bash
# Set provider
pnpm clawdbot config set messages.tts.provider edge

# Configure voice (optional, has good defaults)
pnpm clawdbot config set messages.tts.edge.voice "en-US-JennyNeural"
pnpm clawdbot config set messages.tts.edge.lang "en-US"

# Enable auto TTS
pnpm clawdbot config set messages.tts.auto always

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Popular Edge Voices:**
- `en-US-JennyNeural` - Female, friendly
- `en-US-GuyNeural` - Male, professional
- `en-US-AriaNeural` - Female, warm
- `en-GB-SoniaNeural` - British female
- `en-AU-NatashaNeural` - Australian female

---

## ⚙️ Advanced Configuration

### TTS Mode: Final vs All

Control when TTS is applied during agent responses:

```bash
# Final - Only apply TTS to the final response (default, recommended)
pnpm clawdbot config set messages.tts.mode final

# All - Apply TTS to all responses including tool outputs
pnpm clawdbot config set messages.tts.mode all
```

### Text Length Limits

Control the maximum text length for TTS:

```bash
# Set max characters (default: 4000)
pnpm clawdbot config set messages.tts.maxTextLength 2000
```

### Request Timeout

Set TTS API timeout:

```bash
# Set timeout in milliseconds (default: 30000)
pnpm clawdbot config set messages.tts.timeoutMs 45000
```

---

## 🔍 Check Current Settings

View your complete TTS configuration:

```bash
# View all TTS settings
pnpm clawdbot config get messages.tts
```

Example output:
```json
{
  "provider": "azureopenai",
  "auto": "always",
  "mode": "final",
  "azureopenai": {
    "endpoint": "https://YOUR-RESOURCE.openai.azure.com",
    "deployment": "gpt-4o-mini-tts-3",
    "apiVersion": "2025-03-01-preview",
    "voice": "alloy"
  },
  "maxTextLength": 4000,
  "timeoutMs": 30000
}
```

---

## ✅ Testing TTS

### Test with WhatsApp

```bash
# Send a test message (should receive voice note if TTS is enabled)
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Testing TTS feature"
```

### Test with Telegram

```bash
# Send a test message to Telegram
pnpm clawdbot message send --channel telegram --target @codeagent2026bot --message "Testing TTS feature"
```

### Test Different Voices

```bash
# Change voice
pnpm clawdbot config set messages.tts.azureopenai.voice nova

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Send test message
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Testing Nova voice"
```

---

## 🎯 Use Cases

### 1. Hands-Free Operation

Perfect when you can't read messages:
```bash
pnpm clawdbot config set messages.tts.auto always
pnpm clawdbot config set messages.tts.provider azureopenai
```

### 2. Accessibility

Great for users with visual impairments:
```bash
pnpm clawdbot config set messages.tts.auto always
pnpm clawdbot config set messages.tts.azureopenai.voice echo  # Clear, engaging voice
```

### 3. Language Learning

Use TTS for pronunciation practice:
```bash
pnpm clawdbot config set messages.tts.auto tagged
# Then: "Translate 'Hello, how are you?' to Spanish @tts"
```

### 4. Voice-Only Workflows

Reply to voice messages with voice:
```bash
pnpm clawdbot config set messages.tts.auto inbound
```

---

## 🐛 Troubleshooting

### Issue: No Voice Messages Generated

**Check TTS is enabled:**
```bash
pnpm clawdbot config get messages.tts.auto
# Should show "always", "inbound", or "tagged" (not "off")
```

**Check provider is configured:**
```bash
pnpm clawdbot config get messages.tts.provider
# Should show "azureopenai", "openai", "elevenlabs", or "edge"
```

**Restart gateway:**
```bash
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### Issue: TTS Timeout Errors

**Increase timeout:**
```bash
pnpm clawdbot config set messages.tts.timeoutMs 60000
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Reduce text length:**
```bash
pnpm clawdbot config set messages.tts.maxTextLength 2000
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### Issue: Azure OpenAI Authentication Failed

**For local development:**
```bash
# Login to Azure CLI
az login

# Verify account
az account show
```

**For production:**
- Ensure managed identity is configured
- Verify the client ID is correct
- Check Azure permissions

---

### Issue: Poor Voice Quality

**Switch to a premium provider:**
```bash
# Use Azure OpenAI or OpenAI
pnpm clawdbot config set messages.tts.provider azureopenai

# Or try ElevenLabs for ultra-realistic voices
pnpm clawdbot config set messages.tts.provider elevenlabs
```

**Try a different voice:**
```bash
# Azure OpenAI/OpenAI voices
pnpm clawdbot config set messages.tts.azureopenai.voice nova
# or: alloy, echo, fable, onyx, shimmer

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 📊 TTS Mode Comparison

| Mode | When TTS Applies | Use Case | Example |
|------|------------------|----------|---------|
| **Off** | Never | Text-only | Reading on the go |
| **Always** | Every message | Hands-free | Driving, cooking |
| **Inbound** | Reply to voice only | Mixed conversations | Some voice, some text |
| **Tagged** | When @tts used | On-demand | "Explain this @tts" |

---

## 🎤 Voice Comparison

### Azure OpenAI / OpenAI Voices

| Voice | Character | Best For |
|-------|-----------|----------|
| **alloy** | Neutral, balanced | General purpose, default |
| **echo** | Warm, engaging | Storytelling, casual conversation |
| **fable** | Expressive, dynamic | Narration, content creation |
| **onyx** | Deep, authoritative | Professional, formal |
| **nova** | Bright, friendly | Upbeat content, tutorials |
| **shimmer** | Soft, gentle | Calm explanations, meditation |

### Edge TTS Voices (Popular)

| Voice | Character | Region |
|-------|-----------|--------|
| **en-US-JennyNeural** | Female, friendly | US English |
| **en-US-GuyNeural** | Male, professional | US English |
| **en-US-AriaNeural** | Female, warm | US English |
| **en-GB-SoniaNeural** | Female, professional | British English |
| **en-AU-NatashaNeural** | Female, casual | Australian English |

---

## 🔄 Switching Between Providers

You can easily switch TTS providers:

```bash
# Switch to Azure OpenAI
pnpm clawdbot config set messages.tts.provider azureopenai

# Switch to OpenAI
pnpm clawdbot config set messages.tts.provider openai

# Switch to ElevenLabs
pnpm clawdbot config set messages.tts.provider elevenlabs

# Switch to Edge (free)
pnpm clawdbot config set messages.tts.provider edge

# Always restart after switching
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 📚 Related Documentation

- [Azure OpenAI TTS Setup](AZURE_OPENAI_TTS_SETUP.md) - Detailed Azure setup
- [Voice Call Setup Guide](VOICE_CALL_SETUP_GUIDE.md) - Phone call integration
- [Voice Call Quick Reference](VOICE_CALL_QUICK_REF.md) - Quick commands

---

## 🎉 Summary

**Quick Enable:**
```bash
# Enable TTS with Azure OpenAI
pnpm clawdbot config set messages.tts.provider azureopenai
pnpm clawdbot config set messages.tts.auto always
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Quick Disable:**
```bash
# Disable TTS
pnpm clawdbot config set messages.tts.auto off
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Check Status:**
```bash
# View current config
pnpm clawdbot config get messages.tts
```

You're all set! Clawdbot will now speak your messages. 🎤
