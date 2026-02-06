# Clawdbot Quick Start

Your complete guide to using Clawdbot with TUI, Gateway, and Skills.

## 🎯 Current Status

✅ **Gateway:** Running (PID 1173) on http://127.0.0.1:18789
✅ **Channels:** Telegram ✓, WhatsApp ✓
✅ **Skills:** 44 ready (including file-organizer)
✅ **TUI:** Ready to launch

---

## 🚀 Quick Commands

### **Launch Terminal UI (TUI)**

```bash
# Simple launch (connects to running gateway)
pnpm clawdbot tui

# Or use the convenience script
./launch-tui.sh

# With initial message
./launch-tui.sh -m "Organize my Downloads"

# Custom session
./launch-tui.sh -s my-project -t high
```

### **Organize Files**

```bash
# Organize Downloads
./use-file-organizer.sh

# Organize any folder
./use-file-organizer.sh ~/Documents

# Preview first (dry run)
./use-file-organizer.sh ~/Desktop --dry-run
```

### **Check Status**

```bash
# Comprehensive status check
./check-clawdbot-status.sh

# Gateway status
pnpm clawdbot gateway status

# Channel status
pnpm clawdbot channels status

# Full doctor check
pnpm clawdbot doctor
```

### **Gateway Management**

```bash
# Start gateway (if not running)
pnpm clawdbot gateway start

# Stop gateway
pnpm clawdbot gateway stop

# Restart gateway
pnpm clawdbot gateway restart

# Or use convenience scripts
./restart-gateway.sh              # Just restart gateway
./reboot-gateway-and-tui.sh       # Restart gateway + launch TUI

# View logs
pnpm clawdbot logs -f
```

---

## 📂 File Structure

Your Clawdbot workspace:

```
~/aiworker/clawdbot/
├── launch-tui.sh                  # Launch TUI with options
├── start-gateway-and-tui.sh       # Start both gateway + TUI
├── use-file-organizer.sh          # Organize files by type
├── check-clawdbot-status.sh       # Check system status
├── organize-files-direct.sh       # Direct file organization
├── TUI_GATEWAY_GUIDE.md           # Complete TUI + Gateway guide
├── FILE_ORGANIZER_QUICKSTART.md   # File organizer documentation
├── QUICK_START.md                 # This file
└── skills/
    └── file-organizer/            # File organization skill
        ├── SKILL.md               # Skill documentation
        ├── README.md              # Usage guide
        ├── organize.sh            # Organization script
        └── skill                  # Skill entrypoint
```

---

## 🎨 Using the TUI

### Launch Options

```bash
# Basic
pnpm clawdbot tui

# With thinking level
pnpm clawdbot tui --thinking high

# With initial message
pnpm clawdbot tui --message "Help me organize my files"

# Custom session
pnpm clawdbot tui --session project-alpha

# Enable delivery to channels
pnpm clawdbot tui --deliver
```

### TUI Features

- ✅ **Interactive chat** with your agent
- ✅ **Thinking visibility** (see agent reasoning)
- ✅ **Tool calls** shown inline
- ✅ **Skills available** (file-organizer, etc.)
- ✅ **Session persistence**
- ✅ **Real-time updates**

### TUI + Gateway Benefits

When you run TUI with the gateway:
- ✅ Telegram/WhatsApp messages still work
- ✅ All channels remain active
- ✅ Shared session state
- ✅ Web dashboard available
- ✅ Multiple clients can connect

---

## 🔧 Common Workflows

### 1. **Daily Interactive Use**

```bash
# Your gateway is already running as LaunchAgent
# Just launch the TUI
pnpm clawdbot tui
```

**What you get:**
- Interactive terminal chat
- All channels active (Telegram, WhatsApp)
- Background message processing

### 2. **Organize Files**

```bash
# Quick organize
./use-file-organizer.sh

# Or via TUI
pnpm clawdbot tui --message "Organize my Downloads folder"
```

### 3. **Check Everything**

```bash
# One command status check
./check-clawdbot-status.sh
```

### 4. **Debugging**

```bash
# Terminal 1: Watch logs
pnpm clawdbot logs -f

# Terminal 2: Use TUI
pnpm clawdbot tui
```

---

## 🌐 Web Dashboard

Access the Control UI in your browser:

```bash
# Open dashboard
pnpm clawdbot dashboard

# Or manually
open http://127.0.0.1:18789/
```

**Dashboard features:**
- 🎛️ Gateway status
- 📊 Channel monitoring
- 🔍 Session viewer
- ⚙️ Configuration
- 📝 Logs

---

## 🛠️ Convenience Scripts

### **launch-tui.sh** - TUI Launcher

```bash
# Basic
./launch-tui.sh

# With message
./launch-tui.sh -m "Organize files"

# Custom session + thinking
./launch-tui.sh -s project1 -t high

# Check gateway first
./launch-tui.sh --check-gateway

# Start gateway if needed
./launch-tui.sh --start-gateway

# Help
./launch-tui.sh --help
```

### **use-file-organizer.sh** - File Organizer

```bash
# Organize Downloads
./use-file-organizer.sh

# Custom folder
./use-file-organizer.sh ~/Documents

# Dry run
./use-file-organizer.sh ~/Desktop --dry-run

# Help
./use-file-organizer.sh --help
```

### **check-clawdbot-status.sh** - Status Check

```bash
# Full status
./check-clawdbot-status.sh
```

Shows:
- Gateway status
- Channel status
- Skills count
- Running processes
- Quick actions
- Convenience scripts

### **start-gateway-and-tui.sh** - Combined Launcher

```bash
# Start both if needed
./start-gateway-and-tui.sh
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [TUI_GATEWAY_GUIDE.md](TUI_GATEWAY_GUIDE.md) | Complete TUI + Gateway guide |
| [FILE_ORGANIZER_QUICKSTART.md](FILE_ORGANIZER_QUICKSTART.md) | File organizer skill guide |
| [QUICK_START.md](QUICK_START.md) | This quick reference |
| [skills/file-organizer/SKILL.md](skills/file-organizer/SKILL.md) | Skill documentation |
| [skills/file-organizer/README.md](skills/file-organizer/README.md) | File organizer README |

---

## 🐛 Troubleshooting

### TUI won't connect

```bash
# Check gateway
pnpm clawdbot gateway status

# Restart if needed
pnpm clawdbot gateway restart
```

### Channels not working

```bash
# Run doctor
pnpm clawdbot doctor

# Check channels
pnpm clawdbot channels status --probe
```

### Gateway issues

```bash
# View logs
pnpm clawdbot logs -f

# Check processes
ps aux | grep clawdbot

# Restart gateway
pnpm clawdbot gateway restart
```

### Skills not showing

```bash
# List skills
pnpm clawdbot skills list

# Check file-organizer
pnpm clawdbot skills list | grep file-organizer
```

---

## 🎓 Pro Tips

1. **Keep gateway running** - It's already configured as LaunchAgent
2. **Use TUI for interactive** - Best for exploratory work
3. **Use CLI for automation** - `clawdbot agent --local` for scripts
4. **Check logs when debugging** - `pnpm clawdbot logs -f`
5. **Use convenience scripts** - Faster than typing full commands

---

## ✅ Your Setup is Ready!

Everything is configured and running. To start using Clawdbot:

### **Option 1: Launch TUI** (Recommended)

```bash
pnpm clawdbot tui
```

### **Option 2: Use Convenience Script**

```bash
./launch-tui.sh
```

### **Option 3: Organize Files**

```bash
./use-file-organizer.sh
```

### **Option 4: Check Status**

```bash
./check-clawdbot-status.sh
```

---

## 🎉 Happy Clawdbotting!

Your gateway is running, channels are active, skills are ready, and TUI is waiting for you.

**Start chatting:**
```bash
pnpm clawdbot tui
```

🦞 Welcome to Clawdbot!
