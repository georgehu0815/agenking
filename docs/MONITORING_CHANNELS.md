# Clawdbot Channel & Queue Monitoring Guide

Quick reference for monitoring channel activity, queue status, and message flow in clawdbot.

## Quick Status Check

```bash
# One-liner status check
/tmp/check-queue.sh
```

**Output:**
- 📋 Recent queue activity (enqueue/dequeue operations)
- 💬 Active sessions (processing/idle states)
- 📱 Recent channel messages
- 🔄 Gateway status

## Real-time Monitoring

### Live Queue Monitor

```bash
# Start live monitoring
/tmp/channel-status.sh

# Or manually:
tail -f /tmp/clawdbot/clawdbot-*.log | grep --line-buffered "queue\|session state\|channel"
```

**What you'll see:**
```
[QUEUE] lane enqueue: lane=session:agent:main:main queueSize=1
[SESSION] session state: sessionId=xxx prev=idle new=processing
[MESSAGE] messageChannel=telegram
[QUEUE] lane dequeue: lane=main waitMs=0 queueSize=0
```

## Understanding Queue Metrics

### Queue Status Fields

| Field | Meaning | Example |
|-------|---------|---------|
| `queueSize` | Number of messages waiting | `queueSize=0` (empty) |
| `active` | Tasks currently processing | `active=1` |
| `queued` | Tasks waiting to process | `queued=3` |
| `waitMs` | How long task waited in queue | `waitMs=14` (14ms) |

### Session States

| State | Meaning |
|-------|---------|
| `idle` | Session waiting for messages |
| `processing` | Agent currently handling request |
| `run_started` | New agent run beginning |
| `run_completed` | Agent run finished |

## Common Monitoring Scenarios

### 1. Check if Messages Are Queuing Up

```bash
# Look for increasing queueSize
tail -n 50 /tmp/clawdbot/clawdbot-*.log | grep "queueSize" | grep -v "queueSize=0"
```

**Healthy:** `queueSize=0` or small numbers
**Problem:** `queueSize=10+` and growing

### 2. Monitor Specific Channel Activity

```bash
# Monitor Telegram
tail -f /tmp/clawdbot/clawdbot-*.log | grep "telegram"

# Monitor WhatsApp
tail -f /tmp/clawdbot/clawdbot-*.log | grep "whatsapp"

# Monitor Slack
tail -f /tmp/clawdbot/clawdbot-*.log | grep "slack"
```

### 3. Check Session Processing Time

```bash
# Look for slow sessions
tail -n 100 /tmp/clawdbot/clawdbot-*.log | \
  grep "lane task done" | \
  jq -r '"Duration: " + (.["1"] | split(" ") | .[-4])'
```

**Output:**
```
Duration: durationMs=13301
Duration: durationMs=11196
```

**Healthy:** < 30 seconds
**Slow:** > 60 seconds
**Problem:** > 120 seconds

### 4. Check for Errors

```bash
# Recent errors
tail -n 100 /tmp/clawdbot/clawdbot-*.log | grep "ERROR" | jq -r '."0"' | tail -n 5
```

### 5. Monitor Gateway Health

```bash
# Check if gateway is running
pgrep -fa clawdbot-gateway

# Check gateway port
netstat -an | grep 19001 || lsof -i :19001

# Gateway uptime
ps -p $(pgrep -f clawdbot-gateway) -o etime=
```

## Channel Configuration Status

### Check Active Channels

From config file:
```bash
cat ~/.clawdbot/clawdbot.json | jq '.channels | to_entries[] | select(.value.enabled != false) | .key'
```

### Check Channel Policies

```bash
# Telegram policy
cat ~/.clawdbot/clawdbot.json | jq '.channels.telegram.dmPolicy'

# WhatsApp policy
cat ~/.clawdbot/clawdbot.json | jq '.channels.whatsapp.dmPolicy'
```

## Log Files Location

- **Main log:** `/tmp/clawdbot/clawdbot-2026-02-07.log` (date-based)
- **Gateway output:** Check background task output files
- **Error logs:** Same as main log, filter by ERROR level

## Useful Commands Reference

### Quick Status

```bash
# Is gateway running?
pgrep clawdbot-gateway && echo "✅ Running" || echo "❌ Stopped"

# Current queue size
tail -n 20 /tmp/clawdbot/clawdbot-*.log | grep "queueSize" | tail -n 1

# Last message channel
tail -n 50 /tmp/clawdbot/clawdbot-*.log | grep "messageChannel" | tail -n 1 | jq -r '."1"'

# Active sessions
tail -n 50 /tmp/clawdbot/clawdbot-*.log | grep "processing" | wc -l
```

### Monitoring Scripts

All scripts created in `/tmp/`:
- `/tmp/check-queue.sh` - Quick status snapshot
- `/tmp/channel-status.sh` - Real-time monitoring

## Interpreting Queue Activity

### Normal Flow

```
lane enqueue: queueSize=1     ← Message arrives
lane dequeue: waitMs=2        ← Message picked up (2ms wait)
session state: idle→processing ← Agent starts working
session state: processing→idle ← Agent finishes
lane task done: durationMs=5000 ← Took 5 seconds
```

### Backlog Building

```
lane enqueue: queueSize=5     ← 5 messages waiting!
lane enqueue: queueSize=6     ← Growing...
lane dequeue: waitMs=30000    ← 30 second wait time
```

**Action:** Check if agent is stuck or tasks are too slow.

## Troubleshooting

### Queue Not Moving

```bash
# Check for stuck sessions
tail -n 100 /tmp/clawdbot/clawdbot-*.log | grep "session state" | grep "processing"

# Look for errors
tail -n 100 /tmp/clawdbot/clawdbot-*.log | grep "ERROR"
```

### No Channel Activity

```bash
# Verify channels are enabled
cat ~/.clawdbot/clawdbot.json | jq '.channels | to_entries[] | {key: .key, enabled: .value.enabled}'

# Check gateway is actually running
ps aux | grep clawdbot-gateway | grep -v grep
```

### High Queue Times

```bash
# Check recent processing times
tail -n 100 /tmp/clawdbot/clawdbot-*.log | grep "durationMs" | tail -n 10
```

If processing times are consistently high:
1. Check model performance (Azure OpenAI response times)
2. Look for slow tool executions
3. Check for rate limiting

## Dashboard View (Manual)

Create a simple dashboard:

```bash
watch -n 2 '/tmp/check-queue.sh'
```

Updates every 2 seconds showing:
- Current queue size
- Active sessions
- Recent messages
- Gateway status

## Advanced: JSON Log Queries

The logs are in JSON format. Query them with `jq`:

```bash
# Get all telegram messages in last 100 lines
tail -n 100 /tmp/clawdbot/clawdbot-*.log | \
  jq -r 'select(."1" | contains("telegram")) | ."1"'

# Average wait time
tail -n 100 /tmp/clawdbot/clawdbot-*.log | \
  jq -r 'select(."1" | contains("waitMs")) | ."1" | split(" ") | .[-2] | ltrimstr("waitMs=")' | \
  awk '{sum+=$1; count++} END {print "Average wait:", sum/count, "ms"}'

# Count messages by channel
tail -n 500 /tmp/clawdbot/clawdbot-*.log | \
  jq -r 'select(."1" | contains("messageChannel=")) | ."1"' | \
  grep -oP 'messageChannel=\K\w+' | \
  sort | uniq -c | sort -rn
```

## API/Programmatic Access

For programmatic monitoring, you can:

1. **Parse log files** (as shown above)
2. **Watch log file with Node.js:**
   ```javascript
   import { watch } from 'fs';
   watch('/tmp/clawdbot/clawdbot-*.log', (event, filename) => {
     // Parse and process logs
   });
   ```
3. **Gateway WebSocket** (if you have the gateway connection)

## Best Practices

1. ✅ **Monitor regularly** - Run `/tmp/check-queue.sh` periodically
2. ✅ **Set up alerts** - Alert on high queue sizes or errors
3. ✅ **Log rotation** - Logs are dated, old ones can be cleaned
4. ✅ **Check processing times** - Slow tasks can cause backlog
5. ✅ **Monitor channel policies** - Ensure channels are configured correctly

## Quick Reference Card

| Task | Command |
|------|---------|
| Quick status | `/tmp/check-queue.sh` |
| Live monitor | `/tmp/channel-status.sh` |
| Current queue | `tail /tmp/clawdbot/*.log \| grep queueSize \| tail -n 1` |
| Gateway running? | `pgrep clawdbot-gateway` |
| Recent errors | `tail /tmp/clawdbot/*.log \| grep ERROR` |
| Channel activity | `tail /tmp/clawdbot/*.log \| grep telegram` |
| Processing times | `tail /tmp/clawdbot/*.log \| grep durationMs` |

---

**Tip:** Keep these scripts handy for quick troubleshooting and monitoring!
