# Cron Telegram Fix - Command Reference

Complete list of commands used to diagnose and fix the Telegram "chat not found" error for cron jobs.

**Issue:** Cron jobs failing with `Telegram send failed: chat not found (chat_id=@codeagent2026bot)`

**Root Cause:** Cannot send messages TO a bot - need to send to user's chat ID

**Fix:** Update heartbeat target from `@botname` to numeric chat ID

---

## 1. Initial Testing & Diagnosis

### Test cron job
```bash
pnpm clawdbot cron run 3d24355d-a58d-4df3-88ca-49c8b032a06a

Test: Cron job fix successful! Your chat ID (523504695) is now configured.

```

### List all cron jobs
```bash
pnpm clawdbot cron list
```

### Test Telegram message sending (this will fail with chat not found)
```bash
pnpm clawdbot message send --channel telegram --target @codeagent2026bot --message "Test: Cron job verification - checking bot connection"
```

**Expected Error:**
```
Error: Telegram send failed: chat not found (chat_id=@codeagent2026bot)
```

---

## 2. Investigation - Finding the Chat ID

### Check Telegram logs for chat ID
```bash
tail -100 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i "telegram.*from\|chat.*id\|message.*received" | tail -20
```

### Get Telegram bot token
```bash
pnpm clawdbot config get channels.telegram.botToken
```

### Query Telegram Bot API for updates
```bash
# Get bot token from config
BOT_TOKEN=$(pnpm clawdbot config get channels.telegram.botToken 2>&1 | grep -v '^>')
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | jq '.'
```

### Check full Telegram config
```bash
pnpm clawdbot config get channels.telegram
```

**Expected output:**
```json
{
  "enabled": true,
  "dmPolicy": "pairing",
  "botToken": "YOUR_BOT_TOKEN_HERE",
  "groupPolicy": "allowlist",
  "streamMode": "partial"
}
```

### Find Telegram-related files
```bash
find ~/.clawdbot -name "*telegram*" -o -name "*pairing*" 2>/dev/null
```

**Expected output:**
```
/Users/ghu/.clawdbot/telegram
/Users/ghu/.clawdbot/credentials/telegram-pairing.json
/Users/ghu/.clawdbot/credentials/telegram-allowFrom.json
```

### Read pairing requests (usually empty)
```bash
cat ~/.clawdbot/credentials/telegram-pairing.json
```

### ✅ Read allowFrom file (CONTAINS YOUR CHAT ID!)
```bash
cat ~/.clawdbot/credentials/telegram-allowFrom.json
```

**Expected output:**
```json
{
  "version": 1,
  "allowFrom": [
    "523504695"
  ]
}
```

**This is your chat ID: `523504695`**

---

## 3. Understanding Cron Configuration

### Find cron jobs file
```bash
find /Users/ghu/.clawdbot -type f -name "*.json" | xargs grep -l "3d24355d-a58d-4df3-88ca-49c8b032a06a"
```

**Result:** `/Users/ghu/.clawdbot/cron/jobs.json`

### Read cron job configuration
```bash
cat ~/.clawdbot/cron/jobs.json
```

**Key finding:** Cron uses `systemEvent` payload, which relies on the heartbeat target configuration.

---

## 4. The Fix - Update Configuration

### Update heartbeat target to use YOUR chat ID
```bash
pnpm clawdbot config set agents.defaults.heartbeat.to '"523504695"'
```

**Important:** The double quotes are required to preserve the value as a string!

**Alternative format (if above fails):**
```bash
pnpm clawdbot config set agents.defaults.heartbeat.to '523504695'
```

### Restart gateway to apply changes
```bash
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**Wait a few seconds for restart:**
```bash
sleep 3
```

---

## 5. Verification - Test the Fix

### Test sending message with numeric chat ID
```bash
pnpm clawdbot message send --channel telegram --target 523504695 --message "✅ Test: Cron job fix successful! Your chat ID (523504695) is now configured."
```

**Expected output:**
```
✅ Sent via Telegram. Message ID: 849
```

### Verify heartbeat configuration
```bash
pnpm clawdbot config get agents.defaults.heartbeat
```

**Expected output:**
```json
{
  "every": "15m",
  "target": "telegram",
  "to": "523504695"
}
```

### Check cron job status
```bash
pnpm clawdbot cron list
```

**Expected:** Cron job should now work when it runs!

### Check recent logs for errors
```bash
tail -50 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i telegram
```

---

## Quick Fix Commands (Copy-Paste)

For future reference, here's the minimal set of commands to fix this issue:

```bash
# 1. Find your chat ID
cat ~/.clawdbot/credentials/telegram-allowFrom.json

# 2. Update config with YOUR chat ID (replace 523504695 with your actual ID)
pnpm clawdbot config set agents.defaults.heartbeat.to '"523504695"'

# 3. Restart gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway

# 4. Test the fix
pnpm clawdbot message send --channel telegram --target 523504695 --message "Test: cron fix working!"

# 5. Verify config
pnpm clawdbot config get agents.defaults.heartbeat
```

---

## Understanding the Problem

### ❌ Wrong Configuration
```bash
pnpm clawdbot config set agents.defaults.heartbeat.to "@codeagent2026bot"
```
- Trying to send TO the bot itself
- Bots **cannot receive** messages
- Results in: `chat not found` error

### ✅ Correct Configuration
```bash
pnpm clawdbot config set agents.defaults.heartbeat.to '"523504695"'
```
- Sending to YOUR chat with the bot
- You receive the message in Telegram
- Works correctly!

---

## Additional Useful Commands

### View all Telegram config
```bash
pnpm clawdbot config get channels.telegram
```

### Check channel status
```bash
pnpm clawdbot channels status
```

### View cron job runs history
```bash
pnpm clawdbot cron runs --id 3d24355d-a58d-4df3-88ca-49c8b032a06a
```

### Manually trigger a cron job
```bash
pnpm clawdbot cron run 3d24355d-a58d-4df3-88ca-49c8b032a06a
```

### Check gateway status
```bash
pnpm clawdbot gateway status
```

### View recent gateway logs
```bash
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

### Filter logs for Telegram errors
```bash
tail -100 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i "telegram\|error"
```

---

## Troubleshooting

### If message still fails after fix:

1. **Verify config was saved:**
   ```bash
   pnpm clawdbot config get agents.defaults.heartbeat.to
   ```
   Should show: `"523504695"` (your chat ID)

2. **Check if gateway restarted:**
   ```bash
   pnpm clawdbot gateway status
   ```
   Should show: `Listening: 127.0.0.1:18789`

3. **Try restarting gateway manually:**
   ```bash
   launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
   sleep 5
   pnpm clawdbot gateway status
   ```

4. **Test direct message to verify chat ID works:**
   ```bash
   pnpm clawdbot message send --channel telegram --target 523504695 --message "Direct test"
   ```

5. **Check for other config issues:**
   ```bash
   pnpm clawdbot config get agents.defaults.heartbeat
   ```
   Verify all fields are correct:
   - `target`: should be `"telegram"`
   - `to`: should be your numeric chat ID as a string
   - `every`: should be a duration like `"15m"`

---

## Key Learnings

1. **Bots cannot receive messages** - They can only send messages to users
2. **Use numeric chat ID** - Not bot username (`@botname`)
3. **Chat ID location** - Stored in `~/.clawdbot/credentials/telegram-allowFrom.json`
4. **Quotes matter** - Chat ID must be a string in config: `'"523504695"'`
5. **Gateway restart required** - Config changes need gateway restart to take effect

---

## Related Documentation

- [HEARTBEAT_QUICK_REF.md](md/HEARTBEAT_QUICK_REF.md) - Updated with this fix
- [HEARTBEAT_SETUP_GUIDE.md](md/HEARTBEAT_SETUP_GUIDE.md) - Comprehensive guide
- [CRON_HEARTBEAT_FIX.md](CRON_HEARTBEAT_FIX.md) - Empty HEARTBEAT.md fix

---

**Date:** 2026-02-07
**Issue:** Telegram "chat not found" error for cron jobs
**Solution:** Use numeric chat ID instead of bot username
**Status:** ✅ Fixed and Verified
