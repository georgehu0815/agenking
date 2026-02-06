# Clawdbot TUI + Gateway Setup Guide

This guide shows you how to run Clawdbot with both the **Terminal UI (TUI)** and the **Gateway** simultaneously.

## 🎯 Overview

- **Gateway**: Runs in the background, handles channels (Telegram, WhatsApp, Slack), webhook endpoints, and multi-user sessions
- **TUI**: Interactive terminal interface connected to the gateway for direct chat with your agent

**You can have BOTH running at the same time!**

---

## ✅ Current Status

Your gateway is **already running**:

```
Service: LaunchAgent (loaded)
Runtime: running (pid 1030, 1173)
Gateway: http://127.0.0.1:18789
Bind: loopback (local only)
Port: 18789
Auth: token-based
```

---

## 🚀 How to Use TUI + Gateway

### **Option 1: Launch TUI (Gateway Already Running)**

Since your gateway is already running, just open the TUI:

```bash
# Basic TUI (connects to running gateway)
pnpm clawdbot tui

# Or from anywhere after installing globally
clawdbot tui
```

**That's it!** The TUI automatically connects to your local gateway at `ws://127.0.0.1:18789`.

### **Option 2: Manual Gateway + TUI**

If you need to restart the gateway manually:

```bash
# Terminal 1: Start gateway
pnpm clawdbot gateway run --port 18789 --bind loopback

# Terminal 2: Start TUI
pnpm clawdbot tui
```

### **Option 3: Background Gateway + TUI**

Keep gateway running in the background (already your setup):

```bash
# Check gateway status
pnpm clawdbot gateway status

# If not running, start it
pnpm clawdbot gateway start

# Launch TUI
pnpm clawdbot tui
```

---

## 🎨 TUI Options

### Basic Usage

```bash
# Default connection
pnpm clawdbot tui

# Send initial message
pnpm clawdbot tui --message "Hello, organize my Downloads"

# Custom session
pnpm clawdbot tui --session my-project

# With thinking level
pnpm clawdbot tui --thinking high
```

### Advanced Options

```bash
# Connect to remote gateway
pnpm clawdbot tui --url ws://your-server:18789 --token YOUR_TOKEN

# Enable message delivery (send replies to channels)
pnpm clawdbot tui --deliver

# Custom history limit
pnpm clawdbot tui --history-limit 500

# Custom timeout
pnpm clawdbot tui --timeout-ms 300000
```

---

## 🔧 Gateway Management

### Check Status

```bash
pnpm clawdbot gateway status
```

### Start/Stop Gateway

```bash
# Start (if not running)
pnpm clawdbot gateway start

# Stop
pnpm clawdbot gateway stop

# Restart
pnpm clawdbot gateway restart

# Run in foreground (for debugging)
pnpm clawdbot gateway run --port 18789 --bind loopback
```

### View Logs

```bash
# Tail gateway logs
pnpm clawdbot logs -f

# View specific log file
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

---

## 📊 Check What's Running

```bash
# Gateway status
pnpm clawdbot gateway status

# Channel status
pnpm clawdbot channels status

# All channels (detailed)
pnpm clawdbot status --all

# System status
pnpm clawdbot doctor
```

---

## 🎮 Common Workflows

### 1. **Interactive Chat + Channels**

Best for: Using TUI while still receiving messages from Telegram/WhatsApp

```bash
# Gateway runs in background (already running)
# Just launch TUI
pnpm clawdbot tui
```

**What you get:**
- ✅ Interactive terminal chat with your agent
- ✅ Telegram messages still arrive and are processed
- ✅ WhatsApp messages still arrive and are processed
- ✅ All channels remain active

### 2. **Debug Mode** (Foreground Gateway)

Best for: Debugging gateway issues, seeing real-time logs

```bash
# Terminal 1: Run gateway in foreground
pnpm clawdbot gateway run --port 18789 --bind loopback --force

# Terminal 2: Run TUI
pnpm clawdbot tui
```

**What you get:**
- ✅ See all gateway logs in real-time
- ✅ Debug channel connections
- ✅ Monitor webhook requests

### 3. **TUI Only** (No Gateway)

Best for: Quick local agent without channels

```bash
# Use local agent (no gateway needed)
pnpm clawdbot agent --local --message "Your question"
```

**What you get:**
- ✅ Quick agent responses
- ✅ No gateway overhead
- ❌ No channel connections
- ❌ No TUI interface

---

## 🛠️ Configuration

Your current gateway config:

```json
{
  "port": 18789,
  "mode": "local",
  "bind": "loopback",
  "auth": {
    "mode": "token",
    "token": "3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9"
  }
}
```

### Change Gateway Settings

```bash
# Change port
pnpm clawdbot config set gateway.port 18790

# Change bind address (loopback, any, or IP)
pnpm clawdbot config set gateway.bind loopback

# View all gateway settings
pnpm clawdbot config get gateway
```

---

## 🌐 Access Gateway Features

While TUI is running, you can also:

### **Control UI** (Web Dashboard)

```bash
# Open dashboard in browser
pnpm clawdbot dashboard

# Or manually open
open http://127.0.0.1:18789/
```

### **Send Messages from CLI**

```bash
# Send to Telegram
pnpm clawdbot message send --channel telegram --target @codeagent2026bot --message "Hello"

# Send to WhatsApp
pnpm clawdbot message send --channel whatsapp --target +13522355298 --message "Test"
```

### **Check Channels**

```bash
# List all channels
pnpm clawdbot channels list

# Probe channel status
pnpm clawdbot channels status --probe
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Launch TUI | `pnpm clawdbot tui` |
| TUI with message | `pnpm clawdbot tui --message "Organize files"` |
| Check gateway | `pnpm clawdbot gateway status` |
| Start gateway | `pnpm clawdbot gateway start` |
| Stop gateway | `pnpm clawdbot gateway stop` |
| View logs | `pnpm clawdbot logs -f` |
| Open dashboard | `pnpm clawdbot dashboard` |
| Check channels | `pnpm clawdbot channels status` |
| Doctor check | `pnpm clawdbot doctor` |

---

## 🐛 Troubleshooting

### TUI won't connect

```bash
# Check if gateway is running
pnpm clawdbot gateway status

# If not running, start it
pnpm clawdbot gateway start

# Check for port conflicts
lsof -i :18789
```

### Gateway won't start

```bash
# Check for existing process
ps aux | grep clawdbot

# Kill old processes
pkill -f clawdbot-gateway

# Start fresh
pnpm clawdbot gateway start
```

### Channels not working

```bash
# Run doctor
pnpm clawdbot doctor

# Check channel status
pnpm clawdbot channels status --probe

# View gateway logs
pnpm clawdbot logs -f
```

### Port already in use

```bash
# Find what's using port 18789
lsof -i :18789

# Kill the process (if safe)
kill -9 <PID>

# Or use a different port
pnpm clawdbot config set gateway.port 18790
pnpm clawdbot gateway restart
```

---

## 🎓 TUI Tips

### Keyboard Shortcuts (in TUI)

- `Ctrl+C` or `Esc` - Exit TUI
- `Enter` - Send message
- `↑` / `↓` - Navigate history
- Type naturally - The TUI is conversational!

### TUI Features

- ✅ **Real-time chat** with your agent
- ✅ **Thinking visibility** (see agent reasoning)
- ✅ **Tool calls** shown inline
- ✅ **Multi-turn** conversations
- ✅ **Session persistence** (messages saved to gateway)
- ✅ **Skills** available (file-organizer, etc.)

---

## 📚 Additional Resources

- **Gateway docs:** https://docs.clawd.bot/gateway
- **TUI docs:** https://docs.clawd.bot/cli/tui
- **Channel setup:** https://docs.clawd.bot/channels
- **Skills:** https://docs.clawd.bot/skills

---

## ✅ Ready to Go!

Your setup is **already configured** and **running**. Just launch the TUI:

```bash
pnpm clawdbot tui
```

Or with an initial message:

```bash
pnpm clawdbot tui --message "Organize my Downloads folder using the file-organizer skill"
```

The gateway will handle channels in the background while you chat in the TUI! 🚀
