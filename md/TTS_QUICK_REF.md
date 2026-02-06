# TTS Quick Reference Card

Quick commands for Text-to-Speech configuration in Clawdbot.

---

## 🔊 Enable/Disable TTS

```bash
# Enable TTS (all messages become voice)
pnpm clawdbot config set messages.tts.auto always
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Disable TTS (text only)
pnpm clawdbot config set messages.tts.auto off
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Voice replies only (reply to voice with voice)
pnpm clawdbot config set messages.tts.auto inbound
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# On-demand only (use @tts tag)
pnpm clawdbot config set messages.tts.auto tagged
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🎤 Provider Setup

### Azure OpenAI (Recommended)

```bash
pnpm clawdbot config set messages.tts.provider azureopenai
pnpm clawdbot config set messages.tts.azureopenai.endpoint https://datacopilothub8882317788.openai.azure.com
pnpm clawdbot config set messages.tts.azureopenai.deployment gpt-4o-mini-tts-3
pnpm clawdbot config set messages.tts.azureopenai.apiVersion 2025-03-01-preview
pnpm clawdbot config set messages.tts.azureopenai.voice alloy
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### OpenAI

```bash
pnpm clawdbot config set messages.tts.provider openai
pnpm clawdbot config set messages.tts.openai.apiKey "sk-..."
pnpm clawdbot config set messages.tts.openai.voice alloy
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### ElevenLabs

```bash
pnpm clawdbot config set messages.tts.provider elevenlabs
pnpm clawdbot config set messages.tts.elevenlabs.apiKey "your_api_key"
pnpm clawdbot config set messages.tts.elevenlabs.voiceId "pMsXgVXv3BLzUgSXRplE"
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Edge TTS (Free)

```bash
pnpm clawdbot config set messages.tts.provider edge
pnpm clawdbot config set messages.tts.edge.voice "en-US-JennyNeural"
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🎵 Change Voice

### Azure OpenAI / OpenAI

```bash
# Available voices: alloy, echo, fable, onyx, nova, shimmer
pnpm clawdbot config set messages.tts.azureopenai.voice nova
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Edge TTS

```bash
# Popular voices
pnpm clawdbot config set messages.tts.edge.voice "en-US-AriaNeural"
# or: en-US-JennyNeural, en-US-GuyNeural, en-GB-SoniaNeural
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🔍 Check Status

```bash
# View current TTS config
pnpm clawdbot config get messages.tts

# View specific setting
pnpm clawdbot config get messages.tts.auto
pnpm clawdbot config get messages.tts.provider

# Check gateway status
pnpm clawdbot gateway status
```

---

## ✅ Test TTS

```bash
# Test with WhatsApp
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Testing TTS"

# Test with Telegram
pnpm clawdbot message send --channel telegram --target @codeagent2026bot --message "Testing TTS"
```

---

## 🎯 TTS Modes

| Mode | Command | When Voice is Used |
|------|---------|-------------------|
| **Off** | `messages.tts.auto off` | Never |
| **Always** | `messages.tts.auto always` | Every message |
| **Inbound** | `messages.tts.auto inbound` | Reply to voice only |
| **Tagged** | `messages.tts.auto tagged` | When @tts used |

---

## 🎤 Available Voices

### Azure OpenAI / OpenAI

- `alloy` - Neutral, balanced (default)
- `echo` - Warm, engaging
- `fable` - Expressive, storytelling
- `onyx` - Deep, authoritative
- `nova` - Bright, friendly
- `shimmer` - Soft, gentle

### Edge TTS (Popular)

- `en-US-JennyNeural` - Female, friendly
- `en-US-GuyNeural` - Male, professional
- `en-US-AriaNeural` - Female, warm
- `en-GB-SoniaNeural` - British female
- `en-AU-NatashaNeural` - Australian female

---

## ⚙️ Advanced Settings

```bash
# Set max text length (default: 4000)
pnpm clawdbot config set messages.tts.maxTextLength 2000

# Set timeout (default: 30000ms)
pnpm clawdbot config set messages.tts.timeoutMs 45000

# Set TTS mode (final or all)
pnpm clawdbot config set messages.tts.mode final

# Restart gateway after changes
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🐛 Troubleshooting

### TTS Not Working

```bash
# 1. Check if TTS is enabled
pnpm clawdbot config get messages.tts.auto
# Should be: always, inbound, or tagged (not off)

# 2. Check provider is set
pnpm clawdbot config get messages.tts.provider
# Should be: azureopenai, openai, elevenlabs, or edge

# 3. Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# 4. Check gateway status
pnpm clawdbot gateway status
```

### Azure Authentication Issues

```bash
# For local development - login to Azure CLI
az login
az account show

# Verify config
pnpm clawdbot config get messages.tts.azureopenai
```

### Timeout Issues

```bash
# Increase timeout
pnpm clawdbot config set messages.tts.timeoutMs 60000

# Reduce max text length
pnpm clawdbot config set messages.tts.maxTextLength 2000

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 📊 Provider Comparison

| Provider | Quality | Cost | API Key Required | Best For |
|----------|---------|------|------------------|----------|
| **Azure OpenAI** | High | Paid | No (Managed ID) | Production |
| **OpenAI** | High | Paid | Yes | Quick setup |
| **ElevenLabs** | Ultra-high | Paid | Yes | Ultra-realistic |
| **Edge TTS** | Good | Free | No | Testing, budget |

---

## 🚀 One-Liner Setup

```bash
# Quick setup with Azure OpenAI
pnpm clawdbot config set messages.tts.provider azureopenai && \
pnpm clawdbot config set messages.tts.auto always && \
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Quick disable
pnpm clawdbot config set messages.tts.auto off && \
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 📚 Full Documentation

- [TTS Setup Guide](TTS_SETUP_GUIDE.md) - Complete setup instructions
- [Azure OpenAI TTS Setup](AZURE_OPENAI_TTS_SETUP.md) - Azure-specific setup
- [Voice Call Setup](VOICE_CALL_SETUP_GUIDE.md) - Phone call integration

---

## 💡 Pro Tips

1. **Hands-free mode**: Set `auto: always` for complete voice interaction
2. **Mixed mode**: Use `auto: inbound` to match input type
3. **On-demand**: Use `auto: tagged` with `@tts` for selective voice
4. **Free option**: Use `provider: edge` for testing or budget setups
5. **Best quality**: Use Azure OpenAI or ElevenLabs for production

---

**Ready to speak!** 🎤
