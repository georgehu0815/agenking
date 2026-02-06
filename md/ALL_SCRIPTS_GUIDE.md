# Clawdbot Convenience Scripts - Complete Guide

All your Clawdbot scripts in one place!

---

## 🚀 Launch Scripts

### **launch-tui.sh** - Launch TUI with Options

**Purpose:** Start the Terminal UI with custom configuration

**Basic Usage:**
```bash
./launch-tui.sh
```

**Advanced Options:**
```bash
# With initial message
./launch-tui.sh -m "Organize my Downloads"

# Custom session
./launch-tui.sh -s project-alpha

# High thinking level
./launch-tui.sh -t high

# Combined
./launch-tui.sh -s work -t high -m "Review my code"

# Check gateway first
./launch-tui.sh --check-gateway

# Start gateway if needed
./launch-tui.sh --start-gateway

# Enable delivery to channels
./launch-tui.sh -d
```

**Options:**
- `-h, --help` - Show help
- `-m, --message <text>` - Send initial message
- `-s, --session <name>` - Use specific session (default: main)
- `-t, --thinking <level>` - Thinking level (off|minimal|low|medium|high)
- `-d, --deliver` - Deliver replies to channels
- `--check-gateway` - Check if gateway is running
- `--start-gateway` - Start gateway if not running

---

### **start-gateway-and-tui.sh** - Start Both

**Purpose:** Start gateway (if not running) and launch TUI

**Usage:**
```bash
./start-gateway-and-tui.sh
```

**What it does:**
1. Checks if gateway is running
2. Starts gateway if needed
3. Shows gateway status
4. Launches TUI

**Use when:** First time launching, or gateway is stopped

---

### **reboot-gateway-and-tui.sh** - Restart + Launch ⭐

**Purpose:** Completely restart gateway and launch TUI

**Usage:**
```bash
./reboot-gateway-and-tui.sh
```

**What it does:**
1. Stops running gateway
2. Cleans up stray processes
3. Starts fresh gateway
4. Waits for gateway to be ready
5. Shows status
6. Launches TUI

**Use when:**
- Gateway is behaving strangely
- After config changes
- Need a clean start
- Troubleshooting issues

**Steps shown:**
```
Step 1: Checking current status
Step 2: Cleaning up processes
Step 3: Starting gateway
Step 4: Waiting for gateway
Step 5: Gateway status
Step 6: Launching TUI
```

---

## 🔧 Gateway Management

### **restart-gateway.sh** - Restart Gateway Only ⭐

**Purpose:** Restart gateway without launching TUI

**Usage:**
```bash
./restart-gateway.sh
```

**What it does:**
1. Stops gateway gracefully
2. Kills any stray processes
3. Starts gateway fresh
4. Waits for it to be ready
5. Shows status and quick actions

**Use when:**
- Need to restart gateway but not TUI
- After config changes
- Troubleshooting gateway issues
- Want to restart without interrupting workflow

**Output:**
```
🔄 Restarting Clawdbot Gateway

⏹️  Stopping gateway...
🧹 Cleaning up stray processes...
🚀 Starting gateway...
⏳ Waiting for gateway...
✓ Gateway is ready!

✓ Gateway restarted successfully!

Quick Actions:
  Launch TUI:     pnpm clawdbot tui
  View logs:      pnpm clawdbot logs -f
  Open dashboard: pnpm clawdbot dashboard
```

---

## 📊 Status & Monitoring

### **check-clawdbot-status.sh** - System Status

**Purpose:** Comprehensive status check of all Clawdbot components

**Usage:**
```bash
./check-clawdbot-status.sh
```

**What it checks:**
- ✅ Gateway status (running/stopped)
- ✅ Channel status (Telegram, WhatsApp, Slack)
- ✅ Skills (ready count, missing deps)
- ✅ Running processes (PIDs)
- ✅ Configuration (port, bind, paths)
- ✅ Quick actions (commands)
- ✅ Convenience scripts (available)

**Sample Output:**
```
╔═══════════════════════════════════════════╗
║   Clawdbot System Status Check          ║
╚═══════════════════════════════════════════╝

━━━ Gateway Status ━━━
✓ Gateway is running (PID 1173)

━━━ Channels Status ━━━
✓ Telegram: enabled, running
✓ WhatsApp: enabled, connected

━━━ Skills Status ━━━
  Ready skills: 44
  Missing deps: 11

━━━ Running Processes ━━━
  Gateway PIDs: 1173

━━━ Configuration ━━━
  Gateway: http://127.0.0.1:18789
  Bind: loopback
```

---

## 📁 File Organization

### **use-file-organizer.sh** - Organize Files

**Purpose:** Organize files by type into category folders

**Basic Usage:**
```bash
# Organize Downloads
./use-file-organizer.sh

# Organize custom folder
./use-file-organizer.sh ~/Documents

# Preview (dry run)
./use-file-organizer.sh ~/Desktop --dry-run
```

**What it does:**
1. Creates category folders
2. Moves files by extension
3. Skips name collisions
4. Reports results

**Categories:**
- Presentations (pptx, ppt, key)
- Documents (docx, doc, txt, md)
- Spreadsheets (xlsx, xls, csv)
- PDFs (pdf)
- Images (jpg, png, gif)
- Videos (mp4, mov)
- Audio (mp3, wav)
- Archives (zip, rar, 7z)
- Code (py, js, html)
- Misc (everything else)

**Options:**
- `--dry-run` - Show what would be done without making changes
- `--help` - Show help

**Sample Output:**
```
📁 File Organizer
Folder: /Users/ghu/Downloads
Mode: EXECUTE (will move files)

📊 Results:
  Moved: 116 files
  Skipped: 3 files (name collisions)

📂 Categories:
  Presentations: 36 files
  Documents: 53 files
  Spreadsheets: 19 files
  ...
```

---

## 🗂️ Script Reference Table

| Script | Use Case | When to Use |
|--------|----------|-------------|
| **launch-tui.sh** | Launch TUI with options | Daily use, custom sessions |
| **start-gateway-and-tui.sh** | Start both if needed | First launch, gateway stopped |
| **reboot-gateway-and-tui.sh** ⭐ | Full restart + TUI | Troubleshooting, config changes |
| **restart-gateway.sh** ⭐ | Restart gateway only | Quick restart without TUI |
| **check-clawdbot-status.sh** | System health check | Diagnose issues, quick overview |
| **use-file-organizer.sh** | Organize files | Clean Downloads, organize folders |

⭐ = New scripts

---

## 🔄 Common Workflows

### **Workflow 1: Daily Start**

```bash
# Gateway already running? Just launch TUI
./launch-tui.sh
```

### **Workflow 2: Fresh Start**

```bash
# Start everything fresh
./start-gateway-and-tui.sh
```

### **Workflow 3: Something's Wrong**

```bash
# Check status first
./check-clawdbot-status.sh

# If issues, full reboot
./reboot-gateway-and-tui.sh
```

### **Workflow 4: Config Changed**

```bash
# Restart gateway to pick up changes
./restart-gateway.sh

# Then launch TUI
./launch-tui.sh
```

### **Workflow 5: Quick File Cleanup**

```bash
# Organize Downloads
./use-file-organizer.sh

# Or via TUI
./launch-tui.sh -m "Organize my Downloads"
```

---

## 📋 Quick Command Reference

### Launch Commands
```bash
./launch-tui.sh                    # Basic TUI launch
./launch-tui.sh -m "Hello"         # With message
./launch-tui.sh -s work -t high    # Custom session + thinking
./start-gateway-and-tui.sh         # Start both
./reboot-gateway-and-tui.sh        # Full restart + TUI ⭐
```

### Gateway Commands
```bash
./restart-gateway.sh               # Restart gateway only ⭐
pnpm clawdbot gateway start        # Start gateway
pnpm clawdbot gateway stop         # Stop gateway
pnpm clawdbot gateway status       # Check gateway
```

### Status Commands
```bash
./check-clawdbot-status.sh         # Full status
pnpm clawdbot doctor               # Health check
pnpm clawdbot channels status      # Channels
pnpm clawdbot logs -f              # Watch logs
```

### File Commands
```bash
./use-file-organizer.sh            # Organize Downloads
./use-file-organizer.sh ~/Docs     # Custom folder
./use-file-organizer.sh --dry-run  # Preview only
```

---

## 🎓 Pro Tips

1. **Use reboot script for troubleshooting** - When in doubt, `./reboot-gateway-and-tui.sh`

2. **Check status first** - Run `./check-clawdbot-status.sh` before reporting issues

3. **Restart gateway after config** - Use `./restart-gateway.sh` after changing settings

4. **Daily workflow is simple** - Just `./launch-tui.sh` if gateway is already running

5. **File organization is safe** - Always runs with collision detection, no overwrites

6. **Watch logs when debugging** - `pnpm clawdbot logs -f` in a separate terminal

7. **Use dry run** - Test file organization with `--dry-run` first

---

## 🐛 Troubleshooting

### Issue: TUI won't connect

**Solution:**
```bash
# Check gateway
./check-clawdbot-status.sh

# Restart if needed
./restart-gateway.sh
```

### Issue: Gateway stuck or behaving oddly

**Solution:**
```bash
# Full reboot
./reboot-gateway-and-tui.sh
```

### Issue: Not sure what's wrong

**Solution:**
```bash
# Check everything
./check-clawdbot-status.sh

# View logs
pnpm clawdbot logs -f
```

### Issue: Config changes not taking effect

**Solution:**
```bash
# Restart gateway
./restart-gateway.sh
```

---

## 📚 Additional Resources

- [QUICK_START.md](QUICK_START.md) - Quick reference guide
- [TUI_GATEWAY_GUIDE.md](TUI_GATEWAY_GUIDE.md) - Complete TUI + Gateway documentation
- [FILE_ORGANIZER_QUICKSTART.md](FILE_ORGANIZER_QUICKSTART.md) - File organizer guide

---

## ✅ Summary

All scripts are designed to be:
- ✅ **Self-contained** - Just run them, they handle everything
- ✅ **Safe** - Check status before actions, handle errors gracefully
- ✅ **Informative** - Show progress and results clearly
- ✅ **Convenient** - Shorter than typing full commands

**Most common uses:**
```bash
./launch-tui.sh                    # Daily use
./reboot-gateway-and-tui.sh        # When troubleshooting ⭐
./restart-gateway.sh               # Quick gateway restart ⭐
./check-clawdbot-status.sh         # Check health
./use-file-organizer.sh            # Organize files
```

🦞 Happy scripting!
