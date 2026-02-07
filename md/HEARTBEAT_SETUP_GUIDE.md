# Heartbeat Setup Guide

Complete guide to configure and use the Heartbeat system in Clawdbot.

---

## 🎯 Overview

The **Heartbeat system** is Clawdbot's intelligent task monitoring mechanism that periodically checks for work to be done. It's designed to balance responsiveness with cost efficiency by skipping execution when there's nothing to do.

**Key Features:**
- Periodic task checking via cron jobs
- Intelligent idle detection to save API costs
- Configurable check intervals
- Integration with workspace tasks
- Automatic execution for events and cron jobs

---

## 📋 What is HEARTBEAT.md?

`HEARTBEAT.md` is a markdown file in your workspace that serves as a **task queue and status board** for the agent. The heartbeat system reads this file periodically to determine if there's work to be done.

### How It Works

```
1. Cron job triggers (every 15 minutes by default)
   ↓
2. Heartbeat runner reads HEARTBEAT.md
   ↓
3. Checks if file is "effectively empty"
   ↓
4. If empty → Skip (save API costs)
   If has tasks → Execute agent run
   ↓
5. Agent processes tasks and updates file
```

### "Effectively Empty" Detection

The system considers HEARTBEAT.md "effectively empty" if it only contains:
- Whitespace (spaces, tabs, newlines)
- Comments (lines starting with `#`)
- Empty markdown list items (`-` with no text)

**Example of "effectively empty" files:**

```markdown
# HEARTBEAT.md

## Notes
```

```markdown
# Tasks
-
-
```

**Example of files with content:**

```markdown
# HEARTBEAT.md

## Active Tasks

- Check for pending messages
- Review system health
```

---

## 🚀 Quick Setup

### Step 1: Create HEARTBEAT.md

Create the file in your workspace directory:

```bash
# Navigate to your workspace
cd ~/clawd

# Create HEARTBEAT.md with initial tasks
cat > HEARTBEAT.md << 'EOF'
# HEARTBEAT.md

## Active Tasks

- Check for any pending notifications or messages
- Review system status and health
- Process any queued items or pending work
- Monitor for important updates or alerts

## Notes
- This file is checked periodically by cron jobs
- Add specific tasks above when you want the agent to handle them
- Remove tasks when they're no longer needed
EOF
```

### Step 2: Verify Workspace Configuration

Check that your workspace is configured correctly:

```bash
# Check workspace path
pnpm clawdbot config get agents.defaults.workspace

# Should output something like: /Users/yourusername/clawd
```

If not set:

```bash
# Set workspace directory
pnpm clawdbot config set agents.defaults.workspace ~/clawd

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Step 3: Configure Heartbeat Target (Optional)

Configure where heartbeat results should be sent:

```bash
# Option 1: Send to Telegram (Recommended)
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@codeagent2026bot"

# Option 2: Send to Telegram chat ID
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "123456789"

# Option 3: Send to WhatsApp
pnpm clawdbot config set agents.defaults.heartbeat.target whatsapp
pnpm clawdbot config set agents.defaults.heartbeat.to "+1234567890"

# Set heartbeat interval (default: 15m, can use: 5m, 30m, 1h, etc.)
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Step 4: Enable and Test Heartbeat

Enable heartbeat and trigger a test run:

```bash
# Enable heartbeats
pnpm clawdbot system heartbeat enable

# Trigger a heartbeat immediately
pnpm clawdbot system event --text "Test heartbeat" --mode now

# Check last heartbeat status
pnpm clawdbot system heartbeat last
```

---

## 📱 Configuring Message Targets

### Supported Channels

Heartbeat can send results to any connected channel:

#### WhatsApp

```bash
# Send to WhatsApp number
pnpm clawdbot config set agents.defaults.heartbeat.target whatsapp
pnpm clawdbot config set agents.defaults.heartbeat.to "+1234567890"

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

#### Telegram (Recommended)

```bash
# Send to Telegram bot (most common)
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"

# Or send to specific chat ID
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "123456789"

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Finding Your Telegram Target:**

```bash
# View Telegram configuration
pnpm clawdbot config get channels.telegram

# Test message to see chat ID in logs
pnpm clawdbot message send --channel telegram --target @yourbotname --message "Test"
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep telegram
```

#### Other Channels

```bash
# Discord
pnpm clawdbot config set agents.defaults.heartbeat.target discord
pnpm clawdbot config set agents.defaults.heartbeat.to "CHANNEL_ID"

# Slack
pnpm clawdbot config set agents.defaults.heartbeat.target slack
pnpm clawdbot config set agents.defaults.heartbeat.to "CHANNEL_ID"
```

### Verifying Target Configuration

```bash
# Check current target
pnpm clawdbot config get agents.defaults.heartbeat

# Test heartbeat delivery
pnpm clawdbot system event --text "Test heartbeat" --mode now

# Check logs
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep heartbeat
```

---

## ⚙️ Configuration Reference

### Core Settings

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/clawd",
      "heartbeat": {
        "every": "15m",
        "target": "telegram",
        "to": "@yourbotname",
        "prompt": "Check HEARTBEAT.md and process tasks",
        "ackMaxChars": 2000
      }
    }
  }
}
```

**Target Configuration:**
- `target`: Channel type (`telegram`, `whatsapp`, `discord`, `slack`)
- `to`: Address/ID for the channel
  - Telegram bot: `"@yourbotname"`
  - Telegram chat: `"123456789"`
  - WhatsApp: `"+1234567890"`
  - Discord: `"CHANNEL_ID"`
  - Slack: `"CHANNEL_ID"`

### Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `every` | - | Check interval (e.g., "15m", "30m", "1h") |
| `target` | - | Channel type (telegram, whatsapp, discord, slack) |
| `to` | - | Channel address (@botname, +phone, chat_id) |
| `prompt` | Default | Custom heartbeat prompt |
| `ackMaxChars` | `2000` | Max characters in acknowledgment |
| `model` | Default | Model to use for heartbeat |
| `session` | Default | Session key to use |

**Note:** Heartbeat is enabled/disabled via CLI: `pnpm clawdbot system heartbeat enable|disable`

---

## 📝 HEARTBEAT.md Format

### Basic Structure

```markdown
# HEARTBEAT.md

## Active Tasks

- Task 1 description
- Task 2 description
- Task 3 description

## Completed Tasks

- ✅ Completed task 1
- ✅ Completed task 2

## Notes

Additional context or reminders for the agent.
```

### Example Use Cases

#### 1. Message Monitoring

```markdown
# HEARTBEAT.md

## Active Tasks

- Check WhatsApp for any urgent messages from team
- Review Telegram for customer support requests
- Monitor Slack for mentions or DMs
```

#### 2. System Health Checks

```markdown
# HEARTBEAT.md

## Active Tasks

- Verify all channels are connected and healthy
- Check for any error logs in the past hour
- Ensure gateway is running properly
- Review API usage and rate limits
```

#### 3. Scheduled Reminders

```markdown
# HEARTBEAT.md

## Active Tasks

- Send daily standup reminder at 9 AM
- Check for pending code reviews
- Review calendar for today's meetings
- Send end-of-day summary at 5 PM
```

#### 4. Data Processing

```markdown
# HEARTBEAT.md

## Active Tasks

- Process any new files in ~/clawd/inbox/
- Generate daily report from latest data
- Backup important files to archive
- Clean up temp files older than 7 days
```

#### 5. Idle Mode (Cost Saving)

```markdown
# HEARTBEAT.md

## Notes

No active tasks right now. Heartbeat will skip execution to save API costs.
```

---

## 🔄 Heartbeat Execution Flow

### Automatic Execution (Cron)

```bash
# Heartbeat runs automatically via cron
# Default: Every 15 minutes

# Check cron schedule
crontab -l | grep clawdbot

# Expected output:
# */15 * * * * cd /path/to/clawdbot && pnpm clawdbot heartbeat run --reason "cron:scheduled"
```

### Manual Execution

```bash
# Run heartbeat immediately
pnpm clawdbot heartbeat run

# Run with specific reason
pnpm clawdbot heartbeat run --reason "manual-check"

# Run and deliver to specific target
pnpm clawdbot heartbeat run --target "telegram:@mybot"
```

### Event-Triggered Execution

The heartbeat can also be triggered by system events:

```bash
# Trigger on message received
pnpm clawdbot heartbeat run --reason "event:message-received"

# Trigger on channel connection
pnpm clawdbot heartbeat run --reason "event:channel-connected"
```

---

## 🎮 Managing Tasks

### Adding Tasks

Simply edit HEARTBEAT.md and add tasks to the "Active Tasks" section:

```bash
# Edit the file
nano ~/clawd/HEARTBEAT.md

# Add your task
## Active Tasks

- Check for new emails
- Process webhook queue
```

**No restart needed!** The file is read at runtime.

### Completing Tasks

Move completed tasks to a "Completed" section or remove them:

```markdown
## Active Tasks

- Process webhook queue

## Completed Tasks

- ✅ Check for new emails (processed at 2:30 PM)
```

### Pausing Heartbeat (Cost Savings)

To stop heartbeat from executing without disabling cron:

```bash
# Option 1: Empty the HEARTBEAT.md file
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md
echo "" >> ~/clawd/HEARTBEAT.md
echo "## Notes" >> ~/clawd/HEARTBEAT.md
echo "Heartbeat paused - no active tasks" >> ~/clawd/HEARTBEAT.md

# Option 2: Disable in config
pnpm clawdbot config set infra.heartbeat.enabled false
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Resuming Heartbeat

```bash
# Add tasks to HEARTBEAT.md
nano ~/clawd/HEARTBEAT.md

# Or re-enable in config
pnpm clawdbot config set infra.heartbeat.enabled true
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 🔍 Monitoring and Debugging

### Check Heartbeat Status

```bash
# View heartbeat configuration
pnpm clawdbot config get infra.heartbeat

# Check last heartbeat run
pnpm clawdbot heartbeat status

# View heartbeat logs
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i heartbeat
```

### Common Status Messages

| Status | Meaning | Action |
|--------|---------|--------|
| `success` | Executed successfully | None needed |
| `skipped:empty-heartbeat-file` | No tasks to process | Add tasks or ignore |
| `error:workspace-not-found` | Workspace not configured | Set workspace path |
| `error:rate-limit` | Azure API rate limit | Wait or increase quota |

---

## 🐛 Troubleshooting

### Issue: Heartbeat Always Skips with "empty-heartbeat-file"

**Symptom:**
```json
{"status":"skipped","reason":"empty-heartbeat-file"}
```

**Cause:** HEARTBEAT.md contains only comments or empty list items.

**Solution:**
```bash
# Add actual tasks to the file
cat >> ~/clawd/HEARTBEAT.md << 'EOF'

## Active Tasks

- Check for pending work
EOF
```

---

### Issue: Heartbeat Not Running

**Symptom:** No cron executions showing in logs.

**Possible Causes:**

1. **Heartbeat disabled:**
   ```bash
   # Check last heartbeat status
   pnpm clawdbot system heartbeat last

   # Enable heartbeats if disabled
   pnpm clawdbot system heartbeat enable
   ```

2. **Cron not configured:**
   ```bash
   # Check crontab
   crontab -l | grep clawdbot

   # If missing, add it:
   pnpm clawdbot cron install
   ```

3. **Gateway not running:**
   ```bash
   # Check gateway status
   pnpm clawdbot gateway status

   # If not running, start it:
   pnpm clawdbot gateway start
   ```

---

### Issue: Workspace Not Found

**Symptom:**
```
Error: Workspace directory not found: /path/to/workspace
```

**Solution:**
```bash
# Create workspace directory
mkdir -p ~/clawd

# Set workspace in config
pnpm clawdbot config set agents.defaults.workspace ~/clawd

# Create HEARTBEAT.md
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### Issue: Rate Limit Errors

**Symptom:**
```
Error: RateLimitReached - Requests to the model exceeded token rate limit
```

**Solution:**
```bash
# Option 1: Reduce heartbeat frequency
pnpm clawdbot config set infra.heartbeat.intervalMinutes 30
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Option 2: Pause heartbeat temporarily
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md
echo "## Notes" >> ~/clawd/HEARTBEAT.md
echo "Paused due to rate limits" >> ~/clawd/HEARTBEAT.md

# Option 3: Request Azure quota increase
# Visit: https://aka.ms/oai/quotaincrease
```

---

### Issue: Heartbeat Runs But Doesn't Process Tasks

**Symptom:** Heartbeat executes but tasks in HEARTBEAT.md are not processed.

**Debugging Steps:**

```bash
# 1. Check the file content
cat ~/clawd/HEARTBEAT.md

# 2. Run heartbeat with verbose logging
DEBUG=* pnpm clawdbot heartbeat run

# 3. Check agent logs
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log

# 4. Verify workspace path matches
pnpm clawdbot config get agents.defaults.workspace
ls -la ~/clawd/HEARTBEAT.md
```

---

### Issue: Cron Job Telegram Error "chat not found"

**Symptom:** Cron jobs or heartbeats fail with error:
```
Error: Telegram send failed: chat not found (chat_id=@codeagent2026bot).
Likely: bot not started in DM, bot removed from group/channel, group migrated (new -100… id), or wrong bot token.
```

**Root Cause:**

The heartbeat target is set to `@botname` (the bot itself), but **bots cannot receive messages** - they can only SEND messages to users. You need to send to YOUR chat ID, not the bot's username.

**Solution:**

```bash
# Step 1: Find your Telegram chat ID
cat ~/.clawdbot/credentials/telegram-allowFrom.json

# Output example:
# {
#   "version": 1,
#   "allowFrom": ["523504695"]  ← Your chat ID
# }

# Step 2: Update heartbeat target to YOUR chat ID (not @botname)
pnpm clawdbot config set agents.defaults.heartbeat.to '"523504695"'

# Step 3: Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Step 4: Test the fix
pnpm clawdbot message send --channel telegram --target 523504695 --message "✅ Test: Cron fix working!"

# Should see: ✅ Sent via Telegram. Message ID: XXX
```

**Why This Works:**

| Configuration | What It Means | Result |
|---------------|---------------|--------|
| ❌ `--to "@codeagent2026bot"` | Send TO the bot itself | ❌ Fails - bots can't receive messages |
| ✅ `--to "523504695"` | Send to YOUR chat with the bot | ✅ Works - you receive the message |

**Important Notes:**
- The chat ID must be wrapped in quotes when setting config to preserve it as a string
- Your chat ID is stored in `~/.clawdbot/credentials/telegram-allowFrom.json` after you first paired with the bot
- The bot username (like `@codeagent2026bot`) is only used for users to find and start the bot, not for sending messages

**Verification:**

```bash
# Check the updated config
pnpm clawdbot config get agents.defaults.heartbeat

# Should show:
# {
#   "every": "15m",
#   "target": "telegram",
#   "to": "523504695"  ← Your chat ID, not @botname
# }

# Test cron job (if you have one)
pnpm clawdbot cron list
pnpm clawdbot cron run <job-id>

# Check for errors
tail -20 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i telegram
```

---

### Issue: Messages Not Appearing in Telegram

**Symptom:** Heartbeat runs successfully but no messages appear in Telegram.

**Debugging Steps:**

```bash
# 1. Verify Telegram channel is connected
pnpm clawdbot channels status

# Should show: telegram: connected

# 2. Check target format is correct
pnpm clawdbot config get infra.heartbeat.target

# Should be: telegram:@botname or telegram:123456789

# 3. Test direct message sending
pnpm clawdbot message send --channel telegram --target @yourbotname --message "Heartbeat test"

# 4. Check logs for Telegram errors
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i "telegram\|heartbeat"
```

**Common Solutions:**

```bash
# Solution 1: Wrong bot username format
# Correct: telegram:@botname (with @)
# Wrong: telegram:botname (without @)
pnpm clawdbot config set infra.heartbeat.target "telegram:@yourbotname"

# Solution 2: Use chat ID instead of username
# First, send a message and check logs for chat ID
pnpm clawdbot message send --channel telegram --target @yourbotname --message "test"
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep "chat.*id"

# Then use the chat ID
pnpm clawdbot config set infra.heartbeat.target "telegram:123456789"

# Solution 3: Restart Telegram channel
pnpm clawdbot channels restart telegram

# Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

### Issue: Finding Telegram Chat ID

**How to find your Telegram chat ID:**

**Method 1: From Logs**
```bash
# Send a test message
pnpm clawdbot message send --channel telegram --target @yourbotname --message "test"

# Check logs for chat ID
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i "chat"
```

**Method 2: From Config**
```bash
# View Telegram configuration
pnpm clawdbot config get channels.telegram

# Look for chatId or userId fields
```

**Method 3: From Allowlist (Fastest)**
```bash
# Check your Telegram allowlist for paired chat IDs
cat ~/.clawdbot/credentials/telegram-allowFrom.json

# Example output:
# {
#   "version": 1,
#   "allowFrom": ["523504695"]
# }
```

**Method 4: Use Bot API**
```bash
# Get updates from Telegram
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates

# Look for "chat":{"id": in the response
```

---

## 🎯 Best Practices

### 1. Keep Tasks Specific and Actionable

**Good:**
```markdown
- Check WhatsApp for messages from John about the Q4 report
- Generate sales summary for the past 7 days
- Send reminder to team about tomorrow's standup at 9 AM
```

**Avoid:**
```markdown
- Check stuff
- Do things
- Monitor
```

### 2. Archive Completed Tasks

Don't delete completed tasks immediately - move them to a "Completed" section:

```markdown
## Active Tasks

- Current task 1

## Completed Tasks

- ✅ [2026-02-06 14:30] Sent Q4 report to stakeholders
- ✅ [2026-02-06 12:15] Generated weekly analytics summary
```

### 3. Use Comments for Context

Add notes to help the agent understand the context:

```markdown
## Active Tasks

- Check for responses to yesterday's email about budget approval
  <!-- Sent to finance@company.com at 3:45 PM on 2026-02-05 -->
  <!-- Need approval by end of week -->
```

### 4. Adjust Frequency Based on Workload

- **High activity**: Every 5-10 minutes
- **Normal activity**: Every 15 minutes (default)
- **Low activity**: Every 30-60 minutes

```bash
# High activity (every 10 minutes)
pnpm clawdbot config set agents.defaults.heartbeat.every "10m"

# Normal activity (every 15 minutes, default)
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"

# Low activity (every hour)
pnpm clawdbot config set agents.defaults.heartbeat.every "1h"

# Always restart after config changes
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### 5. Pause When Not Needed

Save API costs by clearing tasks when you don't need active monitoring:

```markdown
# HEARTBEAT.md

## Notes

Currently on vacation - no active monitoring needed.
Will resume on 2026-02-20.
```

---

## 📊 Heartbeat Modes

### Mode 1: Always Active

```markdown
# HEARTBEAT.md

## Active Tasks

- Monitor all channels continuously
- Process any incoming requests immediately
- Send alerts for urgent items
```

**Best for:** Production bots, customer support, critical monitoring

**Frequency:** 5-15 minutes

---

### Mode 2: Scheduled Tasks

```markdown
# HEARTBEAT.md

## Active Tasks

- Send morning briefing at 9 AM
- Generate end-of-day report at 5 PM
- Weekly team summary on Fridays at 4 PM
```

**Best for:** Reports, scheduled notifications, periodic checks

**Frequency:** 15-30 minutes

---

### Mode 3: On-Demand Only

```markdown
# HEARTBEAT.md

## Notes

No active tasks. Use manual commands or events to trigger agent.
```

**Best for:** Development, testing, low-activity scenarios

**Frequency:** Can be set to 60+ minutes or disabled

---

## 🔐 Security Considerations

### Don't Store Sensitive Data

**Avoid:**
```markdown
## Active Tasks

- Send password "mySecretPass123" to user
- Process credit card 1234-5678-9012-3456
```

**Instead:**
```markdown
## Active Tasks

- Send credential reset link to user
- Process pending payment transactions
```

### Use Secure Channels for Results

```bash
# Configure secure target for sensitive results
pnpm clawdbot config set infra.heartbeat.target "telegram:@private_secure_bot"
```

---

## 📚 Integration Examples

### Example 1: Customer Support Bot

```markdown
# HEARTBEAT.md

## Active Tasks

- Check WhatsApp support channel for new customer inquiries
- Review unresolved tickets from yesterday
- Escalate tickets open > 24 hours to human agent
- Send daily support summary to team Slack

## Stats

- Last check: 2026-02-06 14:30
- New tickets today: 5
- Resolved: 4
- Pending: 1
```

### Example 2: DevOps Monitoring

```markdown
# HEARTBEAT.md

## Active Tasks

- Check GitHub for new PRs requiring review
- Monitor production error logs for critical issues
- Verify all services are healthy (API, DB, Cache)
- Send alert if error rate exceeds threshold

## Thresholds

- Error rate: < 1% (Alert if higher)
- Response time: < 500ms (Alert if higher)
- Uptime: > 99.9% (Alert if lower)
```

### Example 3: Personal Assistant

```markdown
# HEARTBEAT.md

## Active Tasks

- Check calendar for upcoming meetings today
- Review email inbox for urgent messages
- Send reminders for pending tasks
- Prepare briefing for tomorrow's schedule

## Today's Schedule

- 10:00 AM - Team standup
- 2:00 PM - Client call with Acme Corp
- 4:00 PM - Code review session
```

**Configuration for Telegram Delivery:**
```bash
# Set Telegram as heartbeat target for personal notifications
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@your_personal_bot"
pnpm clawdbot config set agents.defaults.heartbeat.every "30m"
pnpm clawdbot system heartbeat enable
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

### Example 4: Multi-Channel Monitoring (Telegram + WhatsApp)

```markdown
# HEARTBEAT.md

## Active Tasks

- Monitor Telegram support channel (@support_bot) for urgent messages
- Check WhatsApp business line (+1234567890) for VIP customers
- Review all unread messages across both channels
- Send hourly summary to team Telegram channel

## Channel Health

- Telegram: Connected, 3 unread
- WhatsApp: Connected, 1 unread
- Last sync: 2026-02-06 15:45
```

**Configuration for Telegram Team Notifications:**
```bash
# Send heartbeat results to team Telegram channel
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@team_notifications_bot"
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"
pnpm clawdbot system heartbeat enable
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

---

## 📖 Command Reference

### Heartbeat Commands

```bash
# Enable heartbeats
pnpm clawdbot system heartbeat enable

# Disable heartbeats
pnpm clawdbot system heartbeat disable

# Check last heartbeat
pnpm clawdbot system heartbeat last

# Trigger heartbeat immediately
pnpm clawdbot system event --text "Test heartbeat" --mode now

# View heartbeat configuration
pnpm clawdbot config get agents.defaults.heartbeat
```

### Configuration Commands

```bash
# Enable/disable heartbeats
pnpm clawdbot system heartbeat enable
pnpm clawdbot system heartbeat disable

# Set interval (duration format: 5m, 15m, 30m, 1h, etc.)
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"

# Set target channel
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@mybot"

# Set workspace
pnpm clawdbot config set agents.defaults.workspace ~/clawd

# Set custom prompt
pnpm clawdbot config set agents.defaults.heartbeat.prompt "Your custom heartbeat prompt"
```

### Cron Management

```bash
# Install cron job
pnpm clawdbot cron install

# Remove cron job
pnpm clawdbot cron uninstall

# View cron schedule
crontab -l | grep clawdbot
```

### Gateway Control

```bash
# Restart gateway (after config changes)
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# Check gateway status
pnpm clawdbot gateway status

# Stop gateway
pnpm clawdbot gateway stop

# Start gateway
pnpm clawdbot gateway start
```

---

## 🎉 Summary

**Quick Enable (with Telegram):**
```bash
# 1. Create HEARTBEAT.md
cat > ~/clawd/HEARTBEAT.md << 'EOF'
# HEARTBEAT.md

## Active Tasks

- Check for pending work
- Monitor system health
EOF

# 2. Configure heartbeat with Telegram target
pnpm clawdbot config set agents.defaults.heartbeat.every "15m"
pnpm clawdbot config set agents.defaults.heartbeat.target telegram
pnpm clawdbot config set agents.defaults.heartbeat.to "@yourbotname"

# 3. Enable heartbeats
pnpm clawdbot system heartbeat enable

# 4. Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# 5. Test immediately
pnpm clawdbot system event --text "Test heartbeat" --mode now
```

**Quick Enable (with WhatsApp):**
```bash
# Same as above, but set WhatsApp target instead
pnpm clawdbot config set agents.defaults.heartbeat.target whatsapp
pnpm clawdbot config set agents.defaults.heartbeat.to "+1234567890"
```

**Quick Disable:**
```bash
# Option 1: Clear tasks (save API costs, keep heartbeat enabled)
echo "# HEARTBEAT.md" > ~/clawd/HEARTBEAT.md

# Option 2: Disable heartbeats completely
pnpm clawdbot system heartbeat disable
```

**Check Status:**
```bash
# View heartbeat configuration
pnpm clawdbot config get agents.defaults.heartbeat

# Check last heartbeat
pnpm clawdbot system heartbeat last

# Check recent runs in logs
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i heartbeat
```

---

## 📚 Related Documentation

- [TTS Quick Reference](TTS_QUICK_REF.md) - Voice message configuration
- [Voice Call Setup Guide](VOICE_CALL_SETUP_GUIDE.md) - Phone call integration
- [Azure OpenAI Setup](AZURE_OPENAI_IMAGE_SETUP.md) - Azure configuration

---

**Ready to automate!** 🤖 Your heartbeat is now configured and monitoring your tasks.
