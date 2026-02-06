# Using Voice Calls from WhatsApp - Quick Start

The voice-call plugin is now installed and ready! You can trigger voice calls by sending messages to Clawdbot on WhatsApp.

## ✅ Current Status

- Gateway: Running (pid 3908)
- Voice Call Plugin: Loaded
- Webhook Server: http://127.0.0.1:3334/voice/webhook
- Provider: Mock (for testing)

## 📱 How to Use from WhatsApp

### Basic Voice Call Request

Send any of these messages to Clawdbot on WhatsApp:

```
Call +15559876543 and say "The server is back online"
```

```
Make a voice call to +15559876543 with the message: "Emergency - database down"
```

```
Phone +15559876543 and notify them: "Deployment completed successfully"
```

## 🎯 What Happens

1. You send a message to Clawdbot on WhatsApp
2. The agent recognizes your intent to make a voice call
3. The agent uses the `voice_call` tool
4. The voice-call plugin initiates the call via the configured provider
5. The call connects and speaks your message

## ⚙️ Current Configuration

Your voice-call plugin is configured with:
- **Provider:** mock (testing/development)
- **From Number:** Set in config
- **Default To Number:** Set in config
- **Mode:** notify (one-way message delivery)

## 🔄 Switching to Real Calls

To make actual phone calls, configure a real provider:

### Option 1: Twilio (Recommended)
```bash
# Set provider to Twilio
pnpm clawdbot config set plugins.entries.voice-call.config.provider twilio

# Add your Twilio credentials
pnpm clawdbot config set plugins.entries.voice-call.config.twilio.accountSid "ACxxxx"
pnpm clawdbot config set plugins.entries.voice-call.config.twilio.authToken "your_token"

# Set your Twilio phone number
pnpm clawdbot config set plugins.entries.voice-call.config.fromNumber '"+15551234567"'

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Option 2: Run Setup Script
```bash
cd ~/aiworker/clawdbot
./setup-voice-call.sh
```

## 📖 Full Documentation

- [Setup Guide](VOICE_CALL_SETUP_GUIDE.md) - Complete setup instructions
- [Quick Reference](VOICE_CALL_QUICK_REF.md) - Command cheat sheet
- [Plugin Docs](docs/plugins/voice-call.md) - Technical details

## 🧪 Testing with Mock Provider

The mock provider simulates calls without actually dialing. It's perfect for:
- Testing the integration
- Verifying WhatsApp triggers work
- Developing without spending money on real calls

When you're ready for real calls, switch to Twilio/Telnyx/Plivo.

## 🎉 You're Ready!

Send a message to Clawdbot on WhatsApp like:
```
Call +15559876543 and say "Testing voice call feature"
```

The agent will recognize this and use the voice_call tool to initiate the call!
