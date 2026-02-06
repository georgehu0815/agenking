# Voice Call Plugin - Setup & Configuration Guide

Complete guide to set up voice calling with Clawdbot and use it from WhatsApp!

---

## 🎯 Overview

The **voice-call plugin** lets you:
- 📞 **Make outbound calls** (notify or conversation mode)
- 📥 **Receive inbound calls** (with allowlist/pairing)
- 🎙️ **Real-time conversations** with media streaming
- 📱 **Trigger calls from WhatsApp** using commands

**Supported Providers:**
- **Twilio** (Programmable Voice + Media Streams)
- **Telnyx** (Call Control v2)
- **Plivo** (Voice API + XML)
- **Mock** (local testing, no network)

---

## 📋 Prerequisites

### **1. Choose a Provider**
```sh
pnpm clawdbot voicecall call --to "+15559876543" --message "Server is down" --channel whatsapp
```
```sh
# WhatsApp message
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Hi"

# Telegram message
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Hi"
pnpm clawdbot message send --channel telegram --target @codeagent2026bot --message "Hi"

```
Pick one based on your needs:

| Provider | Best For | Setup Complexity | Cost |
|----------|----------|------------------|------|
| **Twilio** | Production, feature-rich | Medium | Pay-as-you-go |
| **Telnyx** | Cost-effective, global | Medium | Lower rates |
| **Plivo** | Simple API | Easy | Mid-range |
| **Mock** | Testing only | None | Free |

### **2. Get Credentials**

#### **For Twilio:**
1. Sign up at https://www.twilio.com
2. Get your **Account SID** and **Auth Token**
3. Buy a phone number with Voice capability
4. Note your **From Number** (+1XXX...)

#### **For Telnyx:**
1. Sign up at https://telnyx.com
2. Get your **API Key** and **Public Key**
3. Create a **Call Control Application**
4. Get a phone number

#### **For Plivo:**
1. Sign up at https://www.plivo.com
2. Get your **Auth ID** and **Auth Token**
3. Get a phone number

### **3. Public Webhook URL**

Voice providers need to send webhooks to your server. Choose one method:

**Option A: Tailscale Funnel** (Recommended)
- Stable, secure, free
- No changing URLs
- Built into Clawdbot

**Option B: ngrok**
- Quick setup
- Free tier available
- URLs change on restart (unless paid)

**Option C: Manual** (if you have a domain)
- Set up reverse proxy yourself
- Most control

---

## 🚀 Installation

### **Step 1: Re-enable the Plugin**

The plugin was moved to `.disabled-extensions/`. Let's install it properly:

```bash
cd ~/aiworker/clawdbot

# Install from local directory
pnpm clawdbot plugins install ./.disabled-extensions/voice-call
```

### **Step 2: Install Dependencies**

```bash
cd ~/.clawdbot/extensions/voice-call
pnpm install
```

### **Step 3: Verify Installation**

```bash
pnpm clawdbot plugins list | grep voice
```

Should show: `✓ voice-call`

---

## ⚙️ Configuration

### **Basic Setup (Mock Provider - Testing)**

Start with mock provider for testing:

```bash
# Enable the plugin
pnpm clawdbot config set plugins.entries.voice-call.enabled true

# Set provider to mock
pnpm clawdbot config set plugins.entries.voice-call.config.provider mock

# Set default numbers
pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber "+15550001234"
pnpm clawdbot config set plugins.entries.voice-call.config.toNumber "+15550005678"

# Set default mode (notify = one-way message, conversation = two-way)
pnpm clawdbot config set plugins.entries.voice-call.config.outbound.defaultMode notify
```

### **Production Setup (Twilio Example)**

```bash
# Enable and set provider
pnpm clawdbot config set plugins.entries.voice-call.enabled true
pnpm clawdbot config set plugins.entries.voice-call.config.provider twilio

# Set your Twilio credentials
pnpm clawdbot config set plugins.entries.voice-call.config.twilio.accountSid "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
pnpm clawdbot config set plugins.entries.voice-call.config.twilio.authToken "your_auth_token_here"

# Set phone numbers
pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber "+15551234567"
pnpm clawdbot config set plugins.entries.voice-call.config.toNumber "+15559876543"

# Webhook server settings
pnpm clawdbot config set plugins.entries.voice-call.config.serve.port 3334
pnpm clawdbot config set plugins.entries.voice-call.config.serve.path "/voice/webhook"

# Outbound mode
pnpm clawdbot config set plugins.entries.voice-call.config.outbound.defaultMode notify
```

### **Public URL Setup**

#### **Option A: Tailscale Funnel** (Recommended)

```bash
# Enable Tailscale funnel
pnpm clawdbot config set plugins.entries.voice-call.config.tailscale.mode funnel
pnpm clawdbot config set plugins.entries.voice-call.config.tailscale.path "/voice/webhook"
```

Then expose it:
```bash
pnpm clawdbot voicecall expose --mode funnel
```

This will give you a stable public URL like:
```
https://your-machine.your-domain.ts.net/voice/webhook
```

#### **Option B: ngrok**

```bash
# Set tunnel provider
pnpm clawdbot config set plugins.entries.voice-call.config.tunnel.provider ngrok
pnpm clawdbot config set plugins.entries.voice-call.config.tunnel.allowNgrokFreeTier true

# Optional: add your ngrok auth token for custom domains
# pnpm clawdbot config set plugins.entries.voice-call.config.tunnel.ngrokAuthToken "your_token"
```

#### **Option C: Manual Public URL**

If you have your own domain/server:

```bash
pnpm clawdbot config set plugins.entries.voice-call.config.publicUrl "https://yourdomain.com/voice/webhook"
```

### **Inbound Calls (Optional)**

Enable receiving calls:

```bash
# Set inbound policy
pnpm clawdbot config set plugins.entries.voice-call.config.inboundPolicy allowlist

# Add allowed numbers
pnpm clawdbot config set plugins.entries.voice-call.config.allowFrom '["+15551234567"]'

# Set greeting
pnpm clawdbot config set plugins.entries.voice-call.config.inboundGreeting "Hello! This is Clawdbot. How can I help you?"
```

### **TTS Configuration (Optional)**

Configure text-to-speech for calls:

```bash
# Use OpenAI TTS
pnpm clawdbot config set plugins.entries.voice-call.config.tts.provider openai
pnpm clawdbot config set plugins.entries.voice-call.config.tts.openai.voice alloy
pnpm clawdbot config set plugins.entries.voice-call.config.tts.openai.model tts-1

# Or use ElevenLabs
# pnpm clawdbot config set plugins.entries.voice-call.config.tts.provider elevenlabs
# pnpm clawdbot config set plugins.entries.voice-call.config.tts.elevenlabs.voiceId "your_voice_id"
# pnpm clawdbot config set plugins.entries.voice-call.config.tts.elevenlabs.apiKey "your_api_key"
```

---

## 🔄 Restart Gateway

After configuration, restart the gateway to load the plugin:

```bash
# Use the convenience script
./restart-gateway.sh

# Or manually
pnpm clawdbot gateway restart
```

---

## ✅ Verify Setup

### **1. Check Plugin Status**

```bash
pnpm clawdbot plugins list | grep voice-call
```

Should show: `✓ voice-call`

### **2. Check Voice Call Commands**

```bash
pnpm clawdbot voicecall --help
```

Should list available commands.

### **3. Test with Mock Provider**

```bash
# Make a test call (mock provider)
pnpm clawdbot voicecall call --to "+15559876543" --message "Test call from Clawdbot"
```

---

## 📱 Using Voice Calls from WhatsApp

### **Method 1: Direct Command (via WhatsApp)**

Send a message to Clawdbot on WhatsApp:

```
Call +15559876543 and say "Your server is back online"
```

Or:

```
Make a voice call to +15559876543 with the message: "Emergency alert - server down"
```

### **Method 2: Via TUI**

```bash
# Launch TUI
./launch-tui.sh

# Then type:
# "Call +15559876543 and notify them about the deployment"
```

### **Method 3: Direct CLI**

```bash
# One-way notification call
pnpm clawdbot voicecall call --to "+15559876543" --message "The build is complete!"

# Two-way conversation call
pnpm clawdbot voicecall call --to "+15559876543" --message "Hello, do you have a moment?" --mode conversation
```

---

## 🎮 Usage Examples

### **Example 1: Emergency Notification**

Via WhatsApp:
```
Call my phone +15559876543 and say "Emergency: Database server is down"
```

### **Example 2: Scheduled Reminder**

Set up a reminder that calls you:
```
Remind me via phone call at 2 PM to "Join the team meeting"
```

### **Example 3: Status Update**

```
Call the team lead at +15551234567 and update them: "Deployment completed successfully at 3:45 PM"
```

### **Example 4: Two-Way Conversation**

```
Call +15559876543 in conversation mode and ask if they're available for a quick chat
```

---

## 🔧 Troubleshooting

### **Issue: Plugin not loading**

**Solution:**
```bash
# Check plugin status
pnpm clawdbot plugins list

# Reinstall if needed
pnpm clawdbot plugins install ~/.clawdbot/extensions/voice-call

# Restart gateway
./restart-gateway.sh
```

### **Issue: Webhook signature verification fails**

**Solution:**
```bash
# For testing only, skip verification
pnpm clawdbot config set plugins.entries.voice-call.config.skipSignatureVerification true

# For production, ensure publicUrl matches exactly
pnpm clawdbot config get plugins.entries.voice-call.config.publicUrl
```

### **Issue: Calls not connecting**

**Check:**
1. Gateway is running: `pnpm clawdbot gateway status`
2. Webhook server is accessible: `curl http://localhost:3334/voice/webhook`
3. Public URL is reachable (test with webhook.site)
4. Provider credentials are correct

### **Issue: No audio on calls**

**Solution:**
```bash
# Enable TTS
pnpm clawdbot config set plugins.entries.voice-call.config.tts.provider openai
pnpm clawdbot config set plugins.entries.voice-call.config.tts.openai.voice alloy

# Restart gateway
./restart-gateway.sh
```

---

## 📊 Provider Configuration Details

### **Twilio Configuration**

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "fromNumber": "+15551234567",
          "toNumber": "+15559876543",
          "twilio": {
            "accountSid": "ACxxxxxxxx",
            "authToken": "your_token"
          },
          "serve": {
            "port": 3334,
            "path": "/voice/webhook"
          },
          "tailscale": {
            "mode": "funnel",
            "path": "/voice/webhook"
          }
        }
      }
    }
  }
}
```

### **Telnyx Configuration**

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "telnyx",
          "fromNumber": "+15551234567",
          "telnyx": {
            "apiKey": "KEYxxxxxxxx",
            "connectionId": "your_connection_id",
            "publicKey": "your_public_key"
          }
        }
      }
    }
  }
}
```

---

## 🎯 Quick Setup Script

Save this as `setup-voice-call.sh`:

```bash
#!/bin/bash
# Quick voice-call plugin setup

echo "🎙️ Clawdbot Voice Call Setup"
echo ""

# Provider selection
echo "Select provider:"
echo "1) Mock (testing)"
echo "2) Twilio"
echo "3) Telnyx"
read -p "Choice (1-3): " provider_choice

case $provider_choice in
  1)
    PROVIDER="mock"
    ;;
  2)
    PROVIDER="twilio"
    ;;
  3)
    PROVIDER="telnyx"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# Enable plugin
pnpm clawdbot config set plugins.entries.voice-call.enabled true
pnpm clawdbot config set plugins.entries.voice-call.config.provider "$PROVIDER"

# Default numbers
read -p "From number (+15551234567): " from_number
read -p "To number (+15559876543): " to_number

pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber "$from_number"
pnpm clawdbot config set plugins.entries.voice-call.config.toNumber "$to_number"

# Provider-specific config
if [ "$PROVIDER" = "twilio" ]; then
  read -p "Twilio Account SID: " account_sid
  read -sp "Twilio Auth Token: " auth_token
  echo ""

  pnpm clawdbot config set plugins.entries.voice-call.config.twilio.accountSid "$account_sid"
  pnpm clawdbot config set plugins.entries.voice-call.config.twilio.authToken "$auth_token"
fi

if [ "$PROVIDER" = "telnyx" ]; then
  read -p "Telnyx API Key: " api_key
  read -p "Telnyx Connection ID: " connection_id
  read -p "Telnyx Public Key: " public_key

  pnpm clawdbot config set plugins.entries.voice-call.config.telnyx.apiKey "$api_key"
  pnpm clawdbot config set plugins.entries.voice-call.config.telnyx.connectionId "$connection_id"
  pnpm clawdbot config set plugins.entries.voice-call.config.telnyx.publicKey "$public_key"
fi

# Webhook settings
pnpm clawdbot config set plugins.entries.voice-call.config.serve.port 3334
pnpm clawdbot config set plugins.entries.voice-call.config.serve.path "/voice/webhook"

echo ""
echo "✅ Voice call plugin configured!"
echo ""
echo "Next steps:"
echo "1. Configure public URL (Tailscale funnel or ngrok)"
echo "2. Restart gateway: ./restart-gateway.sh"
echo "3. Test: pnpm clawdbot voicecall call --to \"$to_number\" --message \"Test\""
```

Make it executable:
```bash
chmod +x ~/aiworker/clawdbot/setup-voice-call.sh
```

---

## 📚 Additional Resources

- [Voice Call Plugin Docs](https://docs.clawd.bot/plugins/voice-call)
- [Twilio Docs](https://www.twilio.com/docs/voice)
- [Telnyx Docs](https://developers.telnyx.com)
- [Plivo Docs](https://www.plivo.com/docs/)

---

## ✅ Summary

**Setup Steps:**
1. ✅ Choose provider (Twilio/Telnyx/Mock)
2. ✅ Install plugin
3. ✅ Configure credentials
4. ✅ Set up public webhook URL
5. ✅ Restart gateway
6. ✅ Test with mock or real call

**WhatsApp Usage:**
- Send: `"Call +15559876543 and say 'Server is back online'"`
- Clawdbot will initiate the voice call

**CLI Usage:**
```bash
pnpm clawdbot voicecall call --to "+1555..." --message "Your message"
```

🎉 You're ready to use voice calls with Clawdbot!
