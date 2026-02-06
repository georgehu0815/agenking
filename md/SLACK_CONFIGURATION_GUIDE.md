# Clawdbot Slack Configuration Guide

> Complete guide to configuring, disabling, and troubleshooting Slack integration in Clawdbot

## Table of Contents

1. [Overview](#overview)
2. [Quick Disable (Fix Auth Errors)](#quick-disable-fix-auth-errors)
3. [Configuration Structure](#configuration-structure)
4. [Complete Setup Guide](#complete-setup-guide)
5. [Troubleshooting](#troubleshooting)
6. [Re-enabling Slack](#re-enabling-slack)
7. [Advanced Configuration](#advanced-configuration)

---

## Overview

Clawdbot supports Slack integration in two modes:
- **Socket Mode** (recommended): Uses WebSocket connection, no public endpoint needed
- **Webhook Mode**: Requires publicly accessible webhook endpoint

### Common Use Cases

- **Disable Slack**: Fix authentication errors or remove unwanted channel
- **Configure Slack**: Set up proper credentials for Slack workspace
- **Manage Policies**: Control who can use the bot in DMs and groups

---

## Quick Disable (Fix Auth Errors)

### Problem

You're seeing this error:
```
22:12:19 [slack] [default] starting provider
22:12:19 [clawdbot] Unhandled promise rejection: Error: An API error occurred: invalid_auth
```

### Solution: Disable Slack

**Method 1: Using jq (Quick)**

```bash
# Disable Slack
cat ~/.clawdbot/clawdbot.json | jq '.channels.slack.enabled = false' > /tmp/clawdbot-config-update.json
mv /tmp/clawdbot-config-update.json ~/.clawdbot/clawdbot.json

# Verify
cat ~/.clawdbot/clawdbot.json | jq '.channels.slack.enabled'
# Should output: false
```

**Method 2: Using CLI**

```bash
# Disable Slack
clawdbot config set channels.slack.enabled false

# Verify
clawdbot config get channels.slack.enabled
```

**Method 3: Manual Edit**

```bash
# Edit config file
nano ~/.clawdbot/clawdbot.json

# Find the slack section and change:
"slack": {
  "enabled": false  # Change from true to false
}

# Save and exit (Ctrl+X, Y, Enter)
```

### Apply Changes

After disabling, restart Clawdbot:

**Option A: Gateway Process**
```bash
# Find and kill the gateway
pkill -f "clawdbot gateway"

# Restart
pnpm clawdbot gateway run --force
```

**Option B: macOS App**
```bash
# Restart via menubar app or use script
./scripts/restart-mac.sh
```

**Option C: Systemd/Service (Linux)**
```bash
sudo systemctl restart clawdbot-gateway
```

### Verification

Check that Slack is no longer trying to start:

```bash
# Check logs (should not see Slack errors anymore)
tail -f ~/.clawdbot/gateway.log | grep slack

# Check channel status
clawdbot channels status
```

---

## Configuration Structure

### Full Configuration Example

```json
{
  "channels": {
    "slack": {
      "enabled": false,
      "mode": "socket",
      "webhookPath": "/slack/events",
      "botToken": "xoxb-your-bot-token",
      "appToken": "xapp-your-app-token",
      "userTokenReadOnly": true,
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist",
      "allowFrom": [],
      "streamMode": "partial"
    }
  }
}
```

### Configuration Options Explained

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable Slack integration |
| `mode` | string | `"socket"` | Connection mode: `"socket"` or `"webhook"` |
| `webhookPath` | string | `"/slack/events"` | Webhook endpoint path (webhook mode only) |
| `botToken` | string | - | Slack Bot Token (starts with `xoxb-`) |
| `appToken` | string | - | Slack App Token (starts with `xapp-`, socket mode only) |
| `userTokenReadOnly` | boolean | `true` | Use read-only user token for additional context |
| `dmPolicy` | string | `"pairing"` | DM access policy: `"open"`, `"pairing"`, `"allowlist"`, `"disabled"` |
| `groupPolicy` | string | `"allowlist"` | Group/channel policy: `"open"`, `"allowlist"`, `"disabled"` |
| `allowFrom` | array | `[]` | List of allowed user IDs (for allowlist policy) |
| `streamMode` | string | `"partial"` | Response streaming: `"full"`, `"partial"`, `"none"` |

---

## Complete Setup Guide

### Prerequisites

1. **Slack Workspace**: Admin access to create Slack apps
2. **Clawdbot**: Installed and configured
3. **Tokens**: Bot token and App token from Slack

### Step 1: Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app name (e.g., "Clawdbot")
5. Select your workspace
6. Click **"Create App"**

### Step 2: Configure OAuth & Permissions

1. Navigate to **"OAuth & Permissions"** in the sidebar
2. Scroll to **"Bot Token Scopes"**
3. Add the following scopes:

   **Required Scopes:**
   - `app_mentions:read` - View mentions
   - `channels:history` - View messages in public channels
   - `channels:read` - View basic channel info
   - `chat:write` - Send messages
   - `groups:history` - View messages in private channels
   - `groups:read` - View basic private channel info
   - `im:history` - View messages in DMs
   - `im:read` - View basic DM info
   - `im:write` - Start DMs
   - `users:read` - View user info

   **Optional Scopes:**
   - `files:read` - Access file information
   - `files:write` - Upload files
   - `reactions:read` - View reactions
   - `reactions:write` - Add reactions

4. Click **"Install to Workspace"**
5. Authorize the app
6. **Copy the Bot User OAuth Token** (starts with `xoxb-`)

### Step 3: Enable Socket Mode (Recommended)

1. Navigate to **"Socket Mode"** in the sidebar
2. Toggle **"Enable Socket Mode"** to ON
3. Give the token a name (e.g., "Clawdbot Socket")
4. **Copy the App Token** (starts with `xapp-`)

### Step 4: Subscribe to Events

1. Navigate to **"Event Subscriptions"** in the sidebar
2. Toggle **"Enable Events"** to ON

**For Socket Mode:**
- No Request URL needed

**For Webhook Mode:**
- Enter Request URL: `https://your-domain.com/slack/events`
- Verify the URL

3. Under **"Subscribe to bot events"**, add:
   - `app_mention` - Mentioned in channel
   - `message.channels` - Message posted to public channel
   - `message.groups` - Message posted to private channel
   - `message.im` - Message posted in DM

4. Click **"Save Changes"**

### Step 5: Configure Clawdbot

**Using CLI:**

```bash
# Set bot token
clawdbot config set channels.slack.botToken "xoxb-your-actual-token"

# Set app token (socket mode)
clawdbot config set channels.slack.appToken "xapp-your-actual-token"

# Set mode
clawdbot config set channels.slack.mode "socket"

# Set policies
clawdbot config set channels.slack.dmPolicy "pairing"
clawdbot config set channels.slack.groupPolicy "allowlist"

# Enable Slack
clawdbot config set channels.slack.enabled true
```

**Or edit config directly:**

```bash
nano ~/.clawdbot/clawdbot.json
```

```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "mode": "socket",
      "botToken": "xoxb-1234567890-1234567890-abcdefghijklmnopqrstuvwx",
      "appToken": "xapp-1-A0XXXXXXXXX-1234567890-abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz",
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist"
    }
  }
}
```

### Step 6: Restart Clawdbot

```bash
# Restart gateway
pkill -f "clawdbot gateway" && pnpm clawdbot gateway run --force

# Or restart macOS app
./scripts/restart-mac.sh
```

### Step 7: Test Integration

1. **Invite bot to channel:**
   ```
   /invite @Clawdbot
   ```

2. **Mention bot in channel:**
   ```
   @Clawdbot hello
   ```

3. **Send DM to bot:**
   - Go to Apps section in Slack
   - Find Clawdbot
   - Send message: `hello`

4. **Check logs:**
   ```bash
   tail -f ~/.clawdbot/gateway.log | grep slack
   ```

---

## Troubleshooting

### Issue: "invalid_auth" Error

**Error:**
```
Error: An API error occurred: invalid_auth
```

**Causes & Solutions:**

1. **Invalid Bot Token**
   ```bash
   # Verify token format
   cat ~/.clawdbot/clawdbot.json | jq -r '.channels.slack.botToken'
   # Should start with: xoxb-

   # Update token
   clawdbot config set channels.slack.botToken "xoxb-correct-token"
   ```

2. **Token Revoked**
   - Go to Slack App settings
   - Navigate to "OAuth & Permissions"
   - Reinstall the app to get a new token
   - Update Clawdbot config with new token

3. **Wrong Workspace**
   - Verify the token is for the correct Slack workspace
   - Check if the app is still installed in the workspace

### Issue: "missing_scope" Error

**Error:**
```
Error: An API error occurred: missing_scope
```

**Solution:**

1. Go to Slack App settings → "OAuth & Permissions"
2. Add the missing scope (check error message for specific scope)
3. Reinstall the app to apply new scopes
4. Update bot token in Clawdbot config

### Issue: Socket Connection Failed

**Error:**
```
Error: WebSocket connection failed
```

**Solutions:**

1. **Check App Token:**
   ```bash
   cat ~/.clawdbot/clawdbot.json | jq -r '.channels.slack.appToken'
   # Should start with: xapp-
   ```

2. **Verify Socket Mode Enabled:**
   - Go to Slack App settings → "Socket Mode"
   - Ensure it's toggled ON
   - Regenerate app token if needed

3. **Check Network/Firewall:**
   ```bash
   # Test Slack API connectivity
   curl -I https://slack.com/api/auth.test
   ```

### Issue: Bot Not Responding

**Possible causes:**

1. **Not invited to channel:**
   ```
   /invite @Clawdbot
   ```

2. **Policy blocking:**
   ```bash
   # Check policies
   cat ~/.clawdbot/clawdbot.json | jq '.channels.slack | {dmPolicy, groupPolicy}'

   # For testing, set to open
   clawdbot config set channels.slack.dmPolicy "open"
   clawdbot config set channels.slack.groupPolicy "open"
   ```

3. **Event subscriptions missing:**
   - Verify bot events are subscribed in Slack App settings

4. **Gateway not running:**
   ```bash
   # Check if gateway is running
   ps aux | grep "clawdbot gateway"

   # Check logs
   tail -f ~/.clawdbot/gateway.log
   ```

### Issue: Webhook Mode Not Working

**Error:**
```
Error: url_verification failed
```

**Solutions:**

1. **Check webhook endpoint is accessible:**
   ```bash
   curl -I https://your-domain.com/slack/events
   ```

2. **Verify SSL certificate:**
   - Slack requires HTTPS with valid SSL
   - Test SSL: https://www.ssllabs.com/ssltest/

3. **Check gateway binding:**
   ```bash
   # Gateway must bind to public interface
   clawdbot gateway run --bind 0.0.0.0 --port 443
   ```

4. **Firewall/NAT configuration:**
   - Ensure port is open and forwarded
   - Verify Slack IPs are not blocked

---

## Re-enabling Slack

### When You're Ready to Enable

1. **Obtain valid credentials** (see [Complete Setup Guide](#complete-setup-guide))

2. **Update configuration:**
   ```bash
   # Update tokens
   clawdbot config set channels.slack.botToken "xoxb-your-token"
   clawdbot config set channels.slack.appToken "xapp-your-token"

   # Enable Slack
   clawdbot config set channels.slack.enabled true
   ```

3. **Verify configuration:**
   ```bash
   cat ~/.clawdbot/clawdbot.json | jq '.channels.slack'
   ```

4. **Restart gateway:**
   ```bash
   pkill -f "clawdbot gateway" && pnpm clawdbot gateway run --force
   ```

5. **Test connection:**
   ```bash
   # Check logs for successful connection
   tail -f ~/.clawdbot/gateway.log | grep slack

   # Should see:
   # [slack] [default] connected to workspace
   ```

---

## Advanced Configuration

### DM Policies

**Open** - Anyone can DM the bot:
```json
{
  "channels": {
    "slack": {
      "dmPolicy": "open"
    }
  }
}
```

**Pairing** - Users must pair first:
```json
{
  "channels": {
    "slack": {
      "dmPolicy": "pairing"
    }
  }
}
```

Users pair by sending: `!pair <code>`

**Allowlist** - Only approved users:
```json
{
  "channels": {
    "slack": {
      "dmPolicy": "allowlist",
      "allowFrom": ["U01ABC123", "U02DEF456"]
    }
  }
}
```

Get user IDs:
```bash
# From Slack: Right-click user → View Profile → More → Copy Member ID
```

**Disabled** - No DMs allowed:
```json
{
  "channels": {
    "slack": {
      "dmPolicy": "disabled"
    }
  }
}
```

### Group/Channel Policies

**Open** - Bot responds in any channel it's invited to:
```json
{
  "channels": {
    "slack": {
      "groupPolicy": "open"
    }
  }
}
```

**Allowlist** - Only specific channels (by ID):
```json
{
  "channels": {
    "slack": {
      "groupPolicy": "allowlist",
      "allowGroups": ["C01ABC123", "C02DEF456"]
    }
  }
}
```

Get channel IDs:
```bash
# From Slack: Right-click channel → View Channel Details → Copy ID
```

**Disabled** - Bot doesn't respond in channels:
```json
{
  "channels": {
    "slack": {
      "groupPolicy": "disabled"
    }
  }
}
```

### Stream Modes

Control how responses are delivered:

**Full** - Complete response at once:
```json
{
  "channels": {
    "slack": {
      "streamMode": "full"
    }
  }
}
```

**Partial** - Progressive updates (recommended):
```json
{
  "channels": {
    "slack": {
      "streamMode": "partial"
    }
  }
}
```

**None** - No streaming, wait for complete response:
```json
{
  "channels": {
    "slack": {
      "streamMode": "none"
    }
  }
}
```

### Multiple Slack Workspaces

Configure multiple Slack workspaces:

```json
{
  "channels": {
    "slack": {
      "instances": {
        "workspace1": {
          "enabled": true,
          "mode": "socket",
          "botToken": "xoxb-workspace1-token",
          "appToken": "xapp-workspace1-token",
          "dmPolicy": "open"
        },
        "workspace2": {
          "enabled": true,
          "mode": "socket",
          "botToken": "xoxb-workspace2-token",
          "appToken": "xapp-workspace2-token",
          "dmPolicy": "pairing"
        }
      }
    }
  }
}
```

---

## Security Best Practices

### Token Management

✅ **Do:**
- Store tokens in config file only
- Use environment variables for CI/CD
- Rotate tokens periodically
- Use read-only user tokens when possible

❌ **Don't:**
- Commit tokens to Git
- Share tokens in plaintext
- Use admin tokens when bot tokens suffice
- Leave unused apps installed

### Access Control

✅ **Do:**
- Use `pairing` or `allowlist` policies in production
- Regularly review allowlists
- Monitor bot usage in logs
- Restrict bot to specific channels

❌ **Don't:**
- Use `open` policy in production
- Grant excessive OAuth scopes
- Allow bot in sensitive channels without review

### Monitoring

```bash
# Monitor Slack activity
tail -f ~/.clawdbot/gateway.log | grep slack

# Check connection status
clawdbot channels status | grep -A 5 slack

# View recent messages (if logging enabled)
tail -f ~/.clawdbot/logs/slack-messages.log
```

---

## CLI Reference

### Common Commands

```bash
# Get current Slack config
clawdbot config get channels.slack

# Set configuration
clawdbot config set channels.slack.enabled true
clawdbot config set channels.slack.botToken "xoxb-token"
clawdbot config set channels.slack.appToken "xapp-token"

# Check channel status
clawdbot channels status

# View logs
tail -f ~/.clawdbot/gateway.log | grep slack

# Restart gateway
pkill -f "clawdbot gateway" && pnpm clawdbot gateway run --force
```

---

## Related Files

- **Configuration**: `~/.clawdbot/clawdbot.json`
- **Slack Provider**: `src/slack/monitor/provider.ts`
- **Slack Events**: `src/slack/events.ts`
- **Channel Docs**: `docs/channels/slack.md`
- **Gateway Logs**: `~/.clawdbot/gateway.log`

---

## Support

- **Slack API Docs**: https://api.slack.com/docs
- **Socket Mode Guide**: https://api.slack.com/apis/connections/socket
- **OAuth Scopes**: https://api.slack.com/scopes
- **Clawdbot Issues**: https://github.com/clawdbot/clawdbot/issues

---

## Summary

### Quick Reference Card

```
┌─────────────────────────────────────────────┐
│ Slack Configuration Quick Reference         │
├─────────────────────────────────────────────┤
│ Disable:                                    │
│   clawdbot config set channels.slack.       │
│     enabled false                           │
│                                             │
│ Enable:                                     │
│   clawdbot config set channels.slack.       │
│     enabled true                            │
│                                             │
│ Set Token:                                  │
│   clawdbot config set channels.slack.       │
│     botToken "xoxb-..."                     │
│                                             │
│ Check Status:                               │
│   clawdbot channels status                  │
│                                             │
│ View Config:                                │
│   cat ~/.clawdbot/clawdbot.json |          │
│     jq '.channels.slack'                    │
│                                             │
│ Restart:                                    │
│   pkill -f "clawdbot gateway"              │
│   pnpm clawdbot gateway run --force        │
└─────────────────────────────────────────────┘
```

---

**Last Updated**: 2026-02-01
**Clawdbot Version**: 2026.1.25
**Slack API Version**: Latest
