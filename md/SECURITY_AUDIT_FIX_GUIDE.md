# Clawdbot Security Audit Fix Guide

> Complete guide to resolving Clawdbot security audit issues

## Table of Contents

1. [Overview](#overview)
2. [Running Security Audit](#running-security-audit)
3. [Critical Issues & Fixes](#critical-issues--fixes)
4. [Warning Issues & Fixes](#warning-issues--fixes)
5. [Verification](#verification)
6. [Preventive Measures](#preventive-measures)
7. [Security Best Practices](#security-best-practices)

---

## Overview

Clawdbot includes a built-in security auditing system that checks for common security misconfigurations. This guide shows how to identify and fix security issues.

### Security Levels

- **CRITICAL** 🔴 - Must be fixed immediately (high-impact security risks)
- **WARN** 🟡 - Should be reviewed and fixed if applicable
- **INFO** 🔵 - Informational, awareness only

---

## Running Security Audit

### Basic Audit

```bash
# Run standard security audit
pnpm clawdbot security audit

# Or use doctor command (includes security check)
pnpm clawdbot doctor
```

### Deep Audit

```bash
# More thorough security scan
pnpm clawdbot security audit --deep
```

### Example Output

```
Clawdbot security audit
Summary: 3 critical · 1 warn · 1 info

CRITICAL
config.world_readable Config file is world-readable
  /Users/user/.clawdbot/clawdbot.json mode=644; config can contain tokens.
  Fix: chmod 600 /Users/user/.clawdbot/clawdbot.json

CRITICAL
slack.open_group_policy Open groupPolicy with elevated tools enabled
  Found groupPolicy="open" at: channels.slack.groupPolicy
  Fix: Set groupPolicy="allowlist" and keep allowlists tight.

WARN
gateway.trusted_proxies_missing Reverse proxy headers not trusted
  gateway.bind is loopback and gateway.trustedProxies is empty.
  Fix: Set gateway.trustedProxies to proxy IPs or keep local-only.
```

---

## Critical Issues & Fixes

### Issue 1: Config File World-Readable

#### Problem

```
CRITICAL Config file is world-readable
/Users/user/.clawdbot/clawdbot.json mode=644
```

**Risk Level:** 🔴 **Critical**

**Impact:**
- Other users on the system can read your config file
- Exposes API keys, tokens, and private settings
- Could allow unauthorized access to your accounts

#### Check Current Permissions

```bash
ls -l ~/.clawdbot/clawdbot.json
```

**Insecure output:**
```
-rw-r--r--  1 user  staff  4300 Feb  1 17:18 /Users/user/.clawdbot/clawdbot.json
 ^^^  ^^^
 Owner can read/write
      Group and others can read (INSECURE!)
```

#### Fix

```bash
# Set secure permissions (owner read/write only)
chmod 600 ~/.clawdbot/clawdbot.json
```

#### Verify Fix

```bash
ls -l ~/.clawdbot/clawdbot.json
```

**Secure output:**
```
-rw-------  1 user  staff  4300 Feb  1 17:18 /Users/user/.clawdbot/clawdbot.json
 ^^^  ^^^
 Owner can read/write
      No access for group or others (SECURE!)
```

#### Automate for All Config Files

```bash
# Secure all config files in .clawdbot directory
chmod 600 ~/.clawdbot/*.json
chmod 600 ~/.clawdbot/**/*.json

# Verify
find ~/.clawdbot -name "*.json" -ls
```

---

### Issue 2: Open Group Policy with Elevated Tools

#### Problem

```
CRITICAL Open groupPolicy with elevated tools enabled
Found groupPolicy="open" at: channels.slack.groupPolicy
With tools.elevated enabled, prompt injection can become high-impact.
```

**Risk Level:** 🔴 **Critical**

**Impact:**
- Any Slack channel can trigger the bot (if bot is invited)
- Prompt injection attacks could execute privileged commands
- Potential for data exfiltration or system compromise

#### Check Current Configuration

```bash
cat ~/.clawdbot/clawdbot.json | jq '.channels.slack.groupPolicy'
```

**Insecure output:**
```json
"open"
```

#### Fix: Method 1 (Using jq)

```bash
# Change groupPolicy to allowlist
cat ~/.clawdbot/clawdbot.json | \
  jq '.channels.slack.groupPolicy = "allowlist"' > \
  /tmp/clawdbot-config-update.json

# Apply changes
mv /tmp/clawdbot-config-update.json ~/.clawdbot/clawdbot.json
```

#### Fix: Method 2 (Using CLI)

```bash
# Set groupPolicy to allowlist
clawdbot config set channels.slack.groupPolicy "allowlist"
```

#### Fix: Method 3 (Manual Edit)

```bash
# Edit config file
nano ~/.clawdbot/clawdbot.json
```

Find the Slack section and change:
```json
{
  "channels": {
    "slack": {
      "groupPolicy": "open"  // Change this
    }
  }
}
```

To:
```json
{
  "channels": {
    "slack": {
      "groupPolicy": "allowlist",
      "allowGroups": []  // Add specific channel IDs here
    }
  }
}
```

#### Configure Allowed Channels

```bash
# Get channel IDs from Slack:
# 1. Right-click channel in Slack
# 2. Select "View Channel Details"
# 3. Scroll down and copy Channel ID (e.g., C01ABC123)

# Add allowed channels
clawdbot config set channels.slack.allowGroups '["C01ABC123", "C02DEF456"]'
```

#### Verify Fix

```bash
cat ~/.clawdbot/clawdbot.json | jq '.channels.slack | {groupPolicy, allowGroups}'
```

**Secure output:**
```json
{
  "groupPolicy": "allowlist",
  "allowGroups": ["C01ABC123", "C02DEF456"]
}
```

---

### Issue 3: Slack Security Warning

#### Problem

```
CRITICAL Slack security warning
Slack channels: groupPolicy="open" with no channel allowlist
Any channel can trigger (mention-gated).
```

**Risk Level:** 🔴 **Critical**

**Impact:** Same as Issue 2 - this is a duplicate warning for the same issue.

#### Fix

Apply the same fix as Issue 2 (set `groupPolicy="allowlist"`).

---

### Issue 4: Similar Issues for Other Channels

If you see similar warnings for other channels (Discord, Telegram, etc.):

#### Telegram

```bash
# Set Telegram groupPolicy
clawdbot config set channels.telegram.groupPolicy "allowlist"

# Add allowed groups
clawdbot config set channels.telegram.allowGroups '[-1001234567890]'
```

#### Discord

```bash
# Set Discord groupPolicy
clawdbot config set channels.discord.groupPolicy "allowlist"

# Add allowed guilds/channels
clawdbot config set channels.discord.allowGroups '["1234567890"]'
```

#### WhatsApp

```bash
# Set WhatsApp groupPolicy
clawdbot config set channels.whatsapp.groupPolicy "allowlist"

# Add allowed groups (JIDs)
clawdbot config set channels.whatsapp.allowGroups '["1234567890-1234567890@g.us"]'
```

---

## Warning Issues & Fixes

### Issue: Reverse Proxy Headers Not Trusted

#### Problem

```
WARN Reverse proxy headers are not trusted
gateway.bind is loopback and gateway.trustedProxies is empty.
If you expose Control UI through reverse proxy, configure trusted proxies.
```

**Risk Level:** 🟡 **Warning**

**Impact:**
- Only relevant if using a reverse proxy
- Could allow IP spoofing if not configured correctly
- Local-only deployments are not affected

#### Check Current Configuration

```bash
cat ~/.clawdbot/clawdbot.json | jq '.gateway | {bind, trustedProxies}'
```

**Output:**
```json
{
  "bind": "loopback",
  "trustedProxies": null
}
```

#### When to Fix

**✅ Fix required if:**
- You're using nginx, Apache, Caddy, or other reverse proxy
- Gateway is exposed through a proxy to the internet
- You need to trust X-Forwarded-For headers

**❌ No fix needed if:**
- Running locally only (`bind: "loopback"`)
- Gateway not behind a reverse proxy
- Direct connections only

#### Fix (If Using Reverse Proxy)

```bash
# Add your reverse proxy IP addresses
clawdbot config set gateway.trustedProxies '["192.168.1.1", "10.0.0.1"]'

# Or add entire subnets
clawdbot config set gateway.trustedProxies '["192.168.1.0/24", "10.0.0.0/8"]'
```

#### Verify Fix

```bash
cat ~/.clawdbot/clawdbot.json | jq '.gateway.trustedProxies'
```

**Output:**
```json
["192.168.1.1", "10.0.0.1"]
```

#### Example: Nginx Reverse Proxy

If using nginx as reverse proxy:

**Nginx config:**
```nginx
location /clawdbot/ {
    proxy_pass http://127.0.0.1:18789/;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Clawdbot config:**
```bash
# Trust the nginx server IP
clawdbot config set gateway.trustedProxies '["127.0.0.1"]'
```

---

## Verification

### Run Complete Audit

After applying fixes, verify all issues are resolved:

```bash
# Run deep security audit
pnpm clawdbot security audit --deep
```

**Expected output (all fixed):**
```
Clawdbot security audit
Summary: 0 critical · 0 warn · 1 info

INFO
summary.attack_surface Attack surface summary
  groups: open=0, allowlist=3
  tools.elevated: enabled
  hooks: disabled
  browser control: enabled
```

### Check Doctor Status

```bash
pnpm clawdbot doctor
```

**Expected output:**
```
Security ─────────────────────────────────╮
│                                         │
│  - No channel security warnings.        │
│  - Run: clawdbot security audit --deep  │
│                                         │
├─────────────────────────────────────────╯
```

### Verify Specific Fixes

#### Config Permissions

```bash
ls -l ~/.clawdbot/clawdbot.json | awk '{print $1}'
# Should output: -rw-------
```

#### Slack Configuration

```bash
cat ~/.clawdbot/clawdbot.json | jq '.channels.slack | {enabled, groupPolicy, allowGroups}'
```

#### Gateway Configuration

```bash
cat ~/.clawdbot/clawdbot.json | jq '.gateway | {bind, trustedProxies}'
```

---

## Preventive Measures

### Automated Security Checks

Create a script to run regular security audits:

```bash
#!/bin/bash
# File: ~/check-clawdbot-security.sh

echo "Running Clawdbot security audit..."
cd ~/aiworker/clawdbot
pnpm clawdbot security audit --deep

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Security audit passed"
else
    echo "❌ Security issues detected"
    exit 1
fi
```

```bash
chmod +x ~/check-clawdbot-security.sh
```

### Cron Job (Optional)

Run security checks daily:

```bash
# Edit crontab
crontab -e

# Add line (run daily at 9 AM)
0 9 * * * cd ~/aiworker/clawdbot && pnpm clawdbot security audit --deep >> ~/clawdbot-security.log 2>&1
```

### Git Hook (Pre-Commit)

Prevent committing insecure configs:

```bash
# File: .git/hooks/pre-commit
#!/bin/bash

# Check config file permissions
if [ -f ~/.clawdbot/clawdbot.json ]; then
    perms=$(stat -f "%A" ~/.clawdbot/clawdbot.json 2>/dev/null || stat -c "%a" ~/.clawdbot/clawdbot.json 2>/dev/null)
    if [ "$perms" != "600" ]; then
        echo "❌ Config file has insecure permissions: $perms"
        echo "Fix: chmod 600 ~/.clawdbot/clawdbot.json"
        exit 1
    fi
fi

# Run security audit
cd ~/aiworker/clawdbot
pnpm clawdbot security audit > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Security audit failed"
    echo "Run: pnpm clawdbot security audit --deep"
    exit 1
fi

echo "✅ Security checks passed"
```

---

## Security Best Practices

### 1. Channel Policies

**✅ Recommended:**
```json
{
  "channels": {
    "slack": {
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist",
      "allowGroups": ["C01ABC123"]
    },
    "telegram": {
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist"
    },
    "discord": {
      "dmPolicy": "allowlist",
      "groupPolicy": "allowlist"
    }
  }
}
```

**❌ Avoid:**
```json
{
  "channels": {
    "slack": {
      "dmPolicy": "open",      // ❌ Anyone can DM
      "groupPolicy": "open"     // ❌ Works in any channel
    }
  }
}
```

### 2. Elevated Tools

If you don't need privileged commands:

```bash
# Disable elevated tools
clawdbot config set tools.elevated.enabled false
```

Or restrict to specific tools:

```json
{
  "tools": {
    "elevated": {
      "enabled": true,
      "allowlist": ["bash", "read", "write"]  // Only allow specific tools
    }
  }
}
```

### 3. File Permissions

Secure all sensitive files:

```bash
# Config files
chmod 600 ~/.clawdbot/*.json
chmod 600 ~/.clawdbot/agents/*/agent/auth-profiles.json

# Session files (if they contain sensitive data)
chmod 600 ~/.clawdbot/agents/*/sessions/sessions.json

# Log files (optional, for privacy)
chmod 600 ~/.clawdbot/*.log
```

### 4. Token Management

**✅ Do:**
- Store tokens in config file only
- Use environment variables for CI/CD
- Rotate tokens regularly
- Use read-only tokens when possible

**❌ Don't:**
- Commit config files to Git
- Share tokens in plaintext
- Use personal access tokens for bots
- Store tokens in code

### 5. Network Security

**Local-only (most secure):**
```json
{
  "gateway": {
    "bind": "loopback",
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "secure-random-token"
    }
  }
}
```

**Public-facing (requires extra security):**
```json
{
  "gateway": {
    "bind": "0.0.0.0",
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "secure-random-token"
    },
    "trustedProxies": ["nginx-proxy-ip"],
    "tls": {
      "enabled": true,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    }
  }
}
```

### 6. Monitoring & Auditing

Enable command logging:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "command-logger": {
          "enabled": true
        }
      }
    }
  }
}
```

Check logs regularly:

```bash
# View command history
tail -f ~/.clawdbot/logs/commands.log

# View security events
grep -i "security\|unauthorized\|denied" ~/.clawdbot/gateway.log
```

---

## Troubleshooting

### Issue: Audit Still Shows Errors After Fix

**Solution:** Restart Clawdbot to apply configuration changes:

```bash
# Kill gateway
pkill -f "clawdbot gateway"

# Restart
pnpm clawdbot gateway run --force

# Or restart macOS app
./scripts/restart-mac.sh
```

### Issue: Can't Change File Permissions

**Error:**
```
chmod: Unable to change file mode on .clawdbot.json: Operation not permitted
```

**Solution:**

1. Check file attributes:
   ```bash
   ls -lO ~/.clawdbot/clawdbot.json
   ```

2. Remove immutable flag (if present):
   ```bash
   chflags nouchg ~/.clawdbot/clawdbot.json
   ```

3. Try chmod again:
   ```bash
   chmod 600 ~/.clawdbot/clawdbot.json
   ```

### Issue: Allowlist Not Working

**Symptoms:** Bot responds in channels not in allowlist

**Solutions:**

1. **Verify configuration:**
   ```bash
   cat ~/.clawdbot/clawdbot.json | jq '.channels.slack'
   ```

2. **Check channel ID format:**
   ```bash
   # Slack channel IDs start with C
   "allowGroups": ["C01ABC123"]  # ✅ Correct
   "allowGroups": ["#general"]   # ❌ Wrong (use ID, not name)
   ```

3. **Restart gateway:**
   ```bash
   pkill -f "clawdbot gateway" && pnpm clawdbot gateway run --force
   ```

---

## Quick Reference

### Security Checklist

Before deploying to production:

- [ ] Config file permissions set to 600
- [ ] All channel policies set to allowlist or pairing
- [ ] Allowlists configured for all enabled channels
- [ ] Elevated tools disabled or restricted
- [ ] Trusted proxies configured (if using reverse proxy)
- [ ] Gateway auth token set
- [ ] Command logging enabled
- [ ] Security audit passes (0 critical, 0 warn)
- [ ] Regular audit schedule established

### Common Commands

```bash
# Run security audit
pnpm clawdbot security audit --deep

# Fix config permissions
chmod 600 ~/.clawdbot/clawdbot.json

# Set Slack to allowlist
clawdbot config set channels.slack.groupPolicy "allowlist"

# Add allowed channel
clawdbot config set channels.slack.allowGroups '["C01ABC123"]'

# Check configuration
cat ~/.clawdbot/clawdbot.json | jq '.channels.slack'

# Restart gateway
pkill -f "clawdbot gateway" && pnpm clawdbot gateway run --force
```

---

## Related Guides

- **[Slack Configuration Guide](SLACK_CONFIGURATION_GUIDE.md)** - Complete Slack setup
- **[Azure OpenAI Setup](AZURE_OPENAI_IMAGE_SETUP.md)** - Managed identity authentication
- **[Vector DB Guide](VECTOR_DB_COMPLETE_GUIDE.md)** - Memory system security

---

## Support

- **Security Issues**: Report privately to security@clawd.bot
- **Bug Reports**: https://github.com/clawdbot/clawdbot/issues
- **Documentation**: https://docs.clawd.bot

---

**Last Updated**: 2026-02-01
**Clawdbot Version**: 2026.1.25
**Security Audit Version**: Latest
