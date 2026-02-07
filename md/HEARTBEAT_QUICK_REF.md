# Heartbeat Quick Reference Card

Quick commands for Heartbeat configuration in Clawdbot.

---

## ⚡ Quick Setup

### Enable Heartbeat with Telegram

```bash
# Create HEARTBEAT.md
cat > ~/clawd/HEARTBEAT.md << 'EOF'
# HEARTBEAT.md

## Active Tasks

- Check for pending work
- Monitor system health
EOF

# Configure
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"
pnpm clawdbot system heartbeat enable
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🎯 Set Target Channel

### Telegram (Recommended)

```bash
# Bot username
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"

# Or Chat ID
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "123456789"

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### WhatsApp

```bash
pnpm clawdbot config set agents.defaults.heartbeat.target whatsapp
pnpm clawdbot config set agents.defaults.heartbeat.to "+1234567890"
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Other Channels

```bash
# Discord
pnpm clawdbot config set agents.defaults.heartbeat.target discord
pnpm clawdbot config set agents.defaults.heartbeat.to "CHANNEL_ID"

# Slack
pnpm clawdbot config set agents.defaults.heartbeat.target slack
pnpm clawdbot config set agents.defaults.heartbeat.to "CHANNEL_ID"

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🔄 Enable/Disable

```bash
# Enable heartbeat
pnpm clawdbot system heartbeat enable

# Disable heartbeat
pnpm clawdbot system heartbeat disable

# Check status
pnpm clawdbot system heartbeat last

# Pause (clear tasks to save API costs, keep heartbeat enabled)
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md
echo "## Notes" >> ~/clawd/HEARTBEAT.md
echo "Paused - no active tasks" >> ~/clawd/HEARTBEAT.md
```

---

## ⏰ Set Check Frequency

```bash
# Every 5 minutes (high activity)
pnpm clawdbot config set agents.defaults.heartbeat.every "5m"

# Every 15 minutes (default, normal activity)
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"

# Every 30 minutes (low activity)
pnpm clawdbot config set agents.defaults.heartbeat.every "30m"

# Every hour (very low activity)
pnpm clawdbot config set agents.defaults.heartbeat.every "1h"

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 📝 Edit Tasks

```bash
# Edit HEARTBEAT.md
nano ~/clawd/HEARTBEAT.md

# Or use VS Code
code ~/clawd/HEARTBEAT.md

# Or use any editor
vi ~/clawd/HEARTBEAT.md

# No restart needed - changes apply on next heartbeat run
```

---

## 🔍 Check Status

```bash
# View heartbeat configuration
pnpm clawdbot config get agents.defaults.heartbeat

# Check last heartbeat
pnpm clawdbot system heartbeat last

# View target
pnpm clawdbot config get agents.defaults.heartbeat.target

# View interval
pnpm clawdbot config get agents.defaults.heartbeat.every

# Check HEARTBEAT.md content
cat ~/clawd/HEARTBEAT.md

# View recent logs
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep heartbeat
```

---

## ▶️ Manual Execution

```bash
# Trigger heartbeat immediately
pnpm clawdbot system event --text "Manual heartbeat check" --mode now

# Check last heartbeat result
pnpm clawdbot system heartbeat last

# View logs with verbose output
DEBUG=* pnpm clawdbot system event --text "Test heartbeat" --mode now
```

---

## 🔧 Cron Management

```bash
# Install cron job
pnpm clawdbot cron install

# Uninstall cron job
pnpm clawdbot cron uninstall

# View cron schedule
crontab -l | grep clawdbot

# Expected output:
# */15 * * * * cd /path/to/clawdbot && pnpm clawdbot heartbeat run --reason "cron:scheduled"
```

---

## 📋 HEARTBEAT.md Examples

### Minimal

```markdown
# HEARTBEAT.md

## Active Tasks

- Check for pending work
```

### Detailed

```markdown
# HEARTBEAT.md

## Active Tasks

- Check Telegram for new messages from team
- Review WhatsApp for customer inquiries
- Monitor system health and error logs
- Send daily summary at 5 PM

## Completed Tasks

- ✅ [2026-02-06 14:30] Processed customer inquiry
- ✅ [2026-02-06 12:15] Generated weekly report

## Notes

Last check: 2026-02-06 15:45
Status: All systems operational
```

### Empty (Paused)

```markdown
# HEARTBEAT.md

## Notes

Heartbeat paused - no active tasks
```

---

## 🐛 Quick Troubleshooting

### Heartbeat Always Skips

```bash
# Issue: empty-heartbeat-file error
# Solution: Add tasks to HEARTBEAT.md

cat >> ~/clawd/HEARTBEAT.md << 'EOF'

## Active Tasks

- Check for pending work
EOF

# No restart needed
```

---

### Messages Not Appearing in Telegram

```bash
# 1. Check channel status
pnpm clawdbot channels status

# 2. Verify target configuration
pnpm clawdbot config get agents.defaults.heartbeat
# Should show: target: telegram, to: @botname or chat_id

# 3. Test direct message
pnpm clawdbot message send --channel telegram --target @yourbotname --message "test"

# 4. Check logs
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i telegram

# 5. Fix target if needed
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### Find Telegram Chat ID

```bash
# Method 1: From allowlist file (fastest)
cat ~/.clawdbot/credentials/telegram-allowFrom.json

# Method 2: From logs
pnpm clawdbot message send --channel telegram --target @yourbotname --message "test"
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep "chat.*id"

# Method 3: From config
pnpm clawdbot config get channels.telegram

# Method 4: Using Bot API
BOT_TOKEN=$(pnpm clawdbot config get channels.telegram.botToken 2>&1 | grep -v '^>')
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | jq -r '.result[].message.chat.id' | tail -1
```

---

### Cron Job Error: "chat not found (chat_id=@botname)"

**Symptom:** Cron jobs fail with error:
```
Telegram send failed: chat not found (chat_id=@codeagent2026bot)
```

**Root Cause:** You can't send messages TO a bot. The target `@botname` is the BOT itself, but bots send messages to USERS, not to other bots.

**Fix:** Use your personal chat ID instead of the bot username.

```bash
# 1. Find your chat ID
cat ~/.clawdbot/credentials/telegram-allowFrom.json
# Output: { "allowFrom": ["523504695"] }

# 2. Update heartbeat target with YOUR chat ID
pnpm clawdbot config set agents.defaults.heartbeat.to '"523504695"'

# 3. Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# 4. Test the fix
pnpm clawdbot message send --channel telegram --target 523504695 --message "Test: cron fix working!"
```

**Why this works:**
- ❌ Wrong: `--to "@codeagent2026bot"` (trying to send TO the bot)
- ✅ Correct: `--to "523504695"` (sending to YOUR chat with the bot)

**Note:** The chat ID must be in quotes when setting config to preserve it as a string.

---

### Rate Limit Errors

```bash
# Solution 1: Reduce frequency
pnpm clawdbot config set agents.defaults.heartbeat.every "30m"
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Solution 2: Pause temporarily
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md
echo "## Notes" >> ~/clawd/HEARTBEAT.md
echo "Paused due to rate limits" >> ~/clawd/HEARTBEAT.md

# Solution 3: Disable heartbeats completely
pnpm clawdbot system heartbeat disable
```

---

## 📊 Frequency Guidelines

| Workload | Interval | Use Case |
|----------|----------|----------|
| **High** | 5-10 min | Customer support, critical monitoring |
| **Normal** | 15 min | General purpose (default) |
| **Low** | 30-60 min | Scheduled tasks, periodic checks |
| **Minimal** | 60+ min | Development, testing |

---

## 🎯 Target Format Reference

Configuration uses two separate settings:
- `target`: Channel type
- `to`: Channel address

| Channel | target value | to value | Example |
|---------|-------------|----------|---------|
| **Telegram bot** | `telegram` | `@botname` | `@codeagent2026bot` |
| **Telegram chat** | `telegram` | `CHAT_ID` | `123456789` |
| **WhatsApp** | `whatsapp` | `+PHONE` | `+1234567890` |
| **Discord** | `discord` | `CHANNEL_ID` | `1234567890` |
| **Slack** | `slack` | `CHANNEL_ID` | `C1234567890` |

---

## 🚀 Common Workflows

### Start Monitoring

```bash
# 1. Create tasks
cat > ~/clawd/HEARTBEAT.md << 'EOF'
# HEARTBEAT.md

## Active Tasks

- Monitor channels for new messages
- Check system health
EOF

# 2. Configure Telegram
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"

# 3. Enable heartbeats and restart
pnpm clawdbot system heartbeat enable
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# 4. Test immediately
pnpm clawdbot system event --text "Test heartbeat" --mode now
```

---

### Stop Monitoring

```bash
# Option 1: Clear tasks (recommended - saves API costs, keeps heartbeat enabled)
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md

# Option 2: Disable heartbeats completely
pnpm clawdbot system heartbeat disable

# Option 3: Remove cron job (stops scheduled execution)
pnpm clawdbot cron uninstall
```

---

### Change Target Channel

```bash
# Switch from WhatsApp to Telegram
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Test new target
pnpm clawdbot system event --text "Test new target" --mode now
```

---

## 💡 Pro Tips

1. **Cost Savings**: Clear HEARTBEAT.md when idle to skip execution and save API costs
2. **Telegram Recommended**: More reliable than WhatsApp for automated notifications
3. **No Restart for Tasks**: Editing HEARTBEAT.md doesn't require gateway restart
4. **Use Chat ID**: More stable than bot username for Telegram targets
5. **Test First**: Use `pnpm clawdbot heartbeat run` to test before waiting for cron
6. **Monitor Logs**: Keep an eye on logs for rate limits and errors
7. **Adjust Frequency**: Match interval to your actual monitoring needs

---

## 📚 Full Documentation

- [Heartbeat Setup Guide](HEARTBEAT_SETUP_GUIDE.md) - Complete setup instructions
- [TTS Quick Reference](TTS_QUICK_REF.md) - Voice message configuration
- [Voice Call Setup Guide](VOICE_CALL_SETUP_GUIDE.md) - Phone call integration

---

**Ready to monitor!** 🤖
