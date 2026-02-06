# Voice Call - Quick Reference Card

Quick commands and examples for Clawdbot voice calls.

---

## 🚀 Setup

```bash
# Run interactive setup
./setup-voice-call.sh

# Or manual setup (Mock provider)
pnpm clawdbot config set plugins.entries.voice-call.enabled true
pnpm clawdbot config set plugins.entries.voice-call.config.provider mock
pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber '"+15551234567"'
pnpm clawdbot config set plugins.entries.voice-call.config.toNumber '"+15559876543"'

# Restart gateway
./restart-gateway.sh
```

---

## 📞 CLI Commands

### **Make Calls**

```bash
# Simple notification call
pnpm clawdbot voicecall call --to "+15559876543" --message "Hello from Clawdbot"

# Conversation mode (two-way)
pnpm clawdbot voicecall call --to "+15559876543" --message "Are you available?" --mode conversation

# Use default number
pnpm clawdbot voicecall call --message "Quick update"
```

### **Manage Calls**

```bash
# Continue existing call
pnpm clawdbot voicecall continue --call-id <id> --message "Any questions?"

# Speak during call
pnpm clawdbot voicecall speak --call-id <id> --message "One moment please"

# End call
pnpm clawdbot voicecall end --call-id <id>

# Check status
pnpm clawdbot voicecall status --call-id <id>

# View recent calls
pnpm clawdbot voicecall tail
```

### **Webhook Exposure**

```bash
# Expose via Tailscale Funnel
pnpm clawdbot voicecall expose --mode funnel

# Check webhook status
curl http://localhost:3334/voice/webhook
```

---

## 📱 WhatsApp Usage

Send messages to Clawdbot on WhatsApp:

### **Basic Call**
```
Call +15559876543 and say "The server is back online"
```

### **Emergency Alert**
```
Make an urgent call to +15551234567: "Emergency - database is down"
```

### **Status Update**
```
Call the team at +15559876543 and notify them: "Deployment completed successfully"
```

### **Two-Way Conversation**
```
Call +15559876543 in conversation mode and ask if they're available
```

---

## ⚙️ Configuration

### **View Current Config**

```bash
pnpm clawdbot config get plugins.entries.voice-call
```

### **Update Settings**

```bash
# Change provider
pnpm clawdbot config set plugins.entries.voice-call.config.provider twilio

# Update phone numbers
pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber "+15551111111"
pnpm clawdbot config set plugins.entries.voice-call.config.toNumber "+15552222222"

# Set call mode (notify or conversation)
pnpm clawdbot config set plugins.entries.voice-call.config.outbound.defaultMode notify

# Enable/disable
pnpm clawdbot config set plugins.entries.voice-call.enabled true
```

### **Twilio Credentials**

```bash
pnpm clawdbot config set plugins.entries.voice-call.config.twilio.accountSid "ACxxxx"
pnpm clawdbot config set plugins.entries.voice-call.config.twilio.authToken "your_token"
```

### **Public URL**

```bash
# Tailscale Funnel
pnpm clawdbot config set plugins.entries.voice-call.config.tailscale.mode funnel
pnpm clawdbot config set plugins.entries.voice-call.config.tailscale.path "/voice/webhook"

# Manual URL
pnpm clawdbot config set plugins.entries.voice-call.config.publicUrl "https://your-domain.com/voice/webhook"

# ngrok
pnpm clawdbot config set plugins.entries.voice-call.config.tunnel.provider ngrok
```

### **TTS (Text-to-Speech)**

```bash
# OpenAI TTS
pnpm clawdbot config set plugins.entries.voice-call.config.tts.provider openai
pnpm clawdbot config set plugins.entries.voice-call.config.tts.openai.voice alloy

# ElevenLabs TTS
pnpm clawdbot config set plugins.entries.voice-call.config.tts.provider elevenlabs
pnpm clawdbot config set plugins.entries.voice-call.config.tts.elevenlabs.voiceId "your_voice_id"
pnpm clawdbot config set plugins.entries.voice-call.config.tts.elevenlabs.apiKey "your_api_key"
```

### **Inbound Calls**

```bash
# Enable inbound with allowlist
pnpm clawdbot config set plugins.entries.voice-call.config.inboundPolicy allowlist
pnpm clawdbot config set plugins.entries.voice-call.config.allowFrom '["+15551234567"]'
pnpm clawdbot config set plugins.entries.voice-call.config.inboundGreeting "Hello from Clawdbot"
```

---

## 🔍 Troubleshooting

### **Check Plugin Status**

```bash
pnpm clawdbot plugins list | grep voice-call
```

### **Check Gateway Logs**

```bash
pnpm clawdbot logs -f | grep voice
```

### **Test Webhook**

```bash
curl http://localhost:3334/voice/webhook
```

### **Reinstall Plugin**

```bash
pnpm clawdbot plugins install ~/.clawdbot/extensions/voice-call
./restart-gateway.sh
```

---

## 📊 Call Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **notify** | One-way message | Alerts, notifications |
| **conversation** | Two-way interactive | Discussions, Q&A |

---

## 🎯 Common Use Cases

### **1. Server Alerts**

WhatsApp: `"Call ops at +15551234567: Server CPU at 95%"`

CLI:
```bash
pnpm clawdbot voicecall call --to "+15551234567" --message "Alert: Server CPU at 95%"
```

### **2. Deployment Notifications**

WhatsApp: `"Notify team via call: Deployment to production complete"`

CLI:
```bash
pnpm clawdbot voicecall call --to "+15559876543" --message "Deployment to production completed at $(date)"
```

### **3. Meeting Reminders**

WhatsApp: `"Call me at +15551234567 in 5 minutes: Team standup starting"`

### **4. Two-Way Check-in**

CLI:
```bash
pnpm clawdbot voicecall call --to "+15559876543" --message "Quick check-in: Are you available?" --mode conversation
```

---

## 🛠️ Quick Scripts

### **Emergency Alert Script**

```bash
#!/bin/bash
# emergency-call.sh
pnpm clawdbot voicecall call \
  --to "+15559876543" \
  --message "EMERGENCY: $1" \
  --mode conversation
```

Usage: `./emergency-call.sh "Database is down"`

### **Status Call Script**

```bash
#!/bin/bash
# status-call.sh
STATUS="$1"
pnpm clawdbot voicecall call \
  --message "Status update: $STATUS at $(date '+%I:%M %p')"
```

Usage: `./status-call.sh "Build successful"`

---

## 📚 Resources

- **Full Guide:** [VOICE_CALL_SETUP_GUIDE.md](VOICE_CALL_SETUP_GUIDE.md)
- **Setup Script:** `./setup-voice-call.sh`
- **Official Docs:** https://docs.clawd.bot/plugins/voice-call
- **Provider Docs:**
  - [Twilio](https://www.twilio.com/docs/voice)
  - [Telnyx](https://developers.telnyx.com/docs/v2/voice)
  - [Plivo](https://www.plivo.com/docs/voice/)

---

## ✅ Quick Checklist

- [ ] Plugin installed and enabled
- [ ] Provider configured (Twilio/Telnyx/Mock)
- [ ] Phone numbers set
- [ ] Webhook server configured
- [ ] Public URL exposed (if not Mock)
- [ ] Gateway restarted
- [ ] Test call successful

**Ready to call!** 📞
