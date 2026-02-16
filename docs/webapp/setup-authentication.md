# WebApp Authentication Setup Guide

**Complete guide to configuring the webapp client with authentication in the gateway**

---

## Table of Contents

1. [Overview](#overview)
2. [Gateway Configuration](#gateway-configuration)
3. [WebApp Environment Setup](#webapp-environment-setup)
4. [Authentication Methods](#authentication-methods)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

---

## Overview

The webapp connects to the gateway using the WebSocket protocol and requires authentication to establish a secure connection. This guide covers how to configure both the gateway and webapp for authenticated communication.

### Architecture

```
┌─────────────────┐     WebSocket (ws://)      ┌──────────────┐
│  React WebApp   │ ─────────────────────────> │   Gateway    │
│  (Browser)      │  + Auth Token              │   Server     │
│                 │  + Client ID: "webapp"     │              │
└─────────────────┘                            └──────────────┘
```

### Authentication Flow

1. **Webapp** opens WebSocket connection to gateway
2. **Webapp** sends `connect` frame with:
   - Client information (id: "webapp", mode: "webapp")
   - Auth credentials (token)
3. **Gateway** validates auth token
4. **Gateway** responds with `hello-ok` on success
5. **Connection** established for bidirectional communication

---

## Gateway Configuration

### 1. Locate Gateway Config File

The gateway configuration is stored in:
```bash
~/.clawdbot/clawdbot.json
```

### 2. Check Current Gateway Settings

```bash
cat ~/.clawdbot/clawdbot.json | grep -A 10 '"gateway"'
```

**Example output:**
```json
"gateway": {
  "port": 18789,
  "mode": "local",
  "bind": "loopback",
  "auth": {
    "mode": "token",
    "token": "3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9"
  },
  "tailscale": {
    "mode": "off"
  }
}
```

### 3. Gateway Auth Configuration Options

#### Option A: Token-Based Authentication (Recommended)

**Configuration:**
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "YOUR_SECURE_TOKEN_HERE"
    }
  }
}
```

**Generate a secure token:**
```bash
# Generate 24-byte random hex token
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

**Example output:**
```
3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9
```

#### Option B: Password-Based Authentication

**Configuration:**
```json
{
  "gateway": {
    "auth": {
      "mode": "password",
      "password": "YOUR_SECURE_PASSWORD"
    }
  }
}
```

⚠️ **Note:** Token mode is recommended for webapp integrations as it's more secure for API-style access.

### 4. Apply Configuration Changes

After editing the config file, restart the gateway:

```bash
# Kill existing gateway process
pkill -f clawdbot-gateway

# Start gateway with new config
node scripts/run-node.mjs gateway --port 18789

# Or using npm
npm run dev:gateway
```

**Verify gateway is running:**
```bash
lsof -i :18789
```

---

## WebApp Environment Setup

### 1. WebApp Environment File

The webapp uses environment variables for configuration. Create or edit:

**File:** `src/webapp/client/.env`

```bash
# WebSocket Gateway URL
VITE_GATEWAY_URL=ws://localhost:18789

# Authentication Token (required)
VITE_GATEWAY_TOKEN=3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9

# Optional: Custom Client Display Name
VITE_CLIENT_NAME=My WebApp

# Legacy HTTP API (deprecated, for fallback only)
# VITE_API_BASE=http://localhost:3000/api
```

### 2. Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_GATEWAY_URL` | ✅ Yes | WebSocket gateway endpoint | `ws://localhost:18789` |
| `VITE_GATEWAY_TOKEN` | ✅ Yes | Auth token from gateway config | `3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9` |
| `VITE_CLIENT_NAME` | ❌ No | Custom display name in gateway | `Dexter Web App` |
| `VITE_API_BASE` | ❌ No | Legacy HTTP API (deprecated) | `http://localhost:3000/api` |

### 3. WebApp Client Configuration

The webapp automatically configures the client using these environment variables.

**File:** `src/webapp/client/src/components/ChatContainer.tsx`

```typescript
const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'ws://localhost:18789';
const authToken = import.meta.env.VITE_GATEWAY_TOKEN || '';

const { messages, connected, connecting, sendMessage } = useAgentStream({
  gatewayUrl,
  authToken,
});
```

### 4. Gateway Client Connection Code

**File:** `src/webapp/client/src/lib/gateway-client.ts`

The client sends the following connect frame:

```typescript
{
  type: 'req',
  id: 'connect',
  method: 'connect',
  params: {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: 'webapp',                    // Client type ID
      displayName: 'Dexter Web App',   // Display name
      version: '1.0.0',                // App version
      platform: 'browser',             // Platform type
      mode: 'webapp',                  // Client mode
    },
    auth: {
      token: authToken,                // Auth token from .env
    },
  },
}
```

### 5. Start WebApp with Configuration

```bash
cd src/webapp/client
npm run dev
```

**Expected output:**
```
VITE v7.3.1  ready in 373 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

If you modify `.env`, Vite will automatically detect the change and restart:
```
[vite] .env changed, restarting server...
[vite] server restarted.
```

---

## Authentication Methods

### Method 1: Token Authentication (Recommended)

**Best for:**
- Production deployments
- API-style integrations
- Multiple client applications

**Security:**
- ✅ Cryptographically random tokens
- ✅ Can be rotated without changing passwords
- ✅ Can be revoked individually
- ✅ No password exposure

**Setup:**

1. **Generate token:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```

2. **Add to gateway config:**
   ```json
   {
     "gateway": {
       "auth": {
         "mode": "token",
         "token": "GENERATED_TOKEN_HERE"
       }
     }
   }
   ```

3. **Add to webapp .env:**
   ```bash
   VITE_GATEWAY_TOKEN=GENERATED_TOKEN_HERE
   ```

### Method 2: Password Authentication

**Best for:**
- Development environments
- Simple deployments
- Single-user scenarios

**Security:**
- ⚠️ Less secure than tokens
- ⚠️ Password exposure risk
- ⚠️ Cannot be easily rotated

**Setup:**

1. **Set password in gateway config:**
   ```json
   {
     "gateway": {
       "auth": {
         "mode": "password",
         "password": "YourSecurePassword123!"
       }
     }
   }
   ```

2. **Update webapp connection code:**
   ```typescript
   // In gateway-client.ts
   auth: this.options.authPassword ? { password: this.options.authPassword } : undefined
   ```

### Method 3: Device Identity (Advanced)

**Best for:**
- Native applications (iOS, Android, macOS)
- High-security requirements
- Multi-device authentication

**Security:**
- ✅✅ Most secure option
- ✅✅ Public/private key cryptography
- ✅✅ Per-device authentication
- ✅✅ Cannot be intercepted or reused

**Note:** Device identity requires public/private key pair generation and is typically not used for browser-based webapps. See [Gateway Protocol Documentation](../gateway/protocol.md) for details.

---

## Security Best Practices

### 1. Token Security

**DO:**
- ✅ Generate tokens using cryptographically secure random generators
- ✅ Use minimum 24-byte (192-bit) tokens
- ✅ Store tokens in environment variables, never in source code
- ✅ Rotate tokens regularly (every 90 days recommended)
- ✅ Use different tokens for development and production

**DON'T:**
- ❌ Commit `.env` files to version control
- ❌ Share tokens via email or chat
- ❌ Hardcode tokens in source files
- ❌ Reuse tokens across different environments
- ❌ Use simple or predictable tokens

### 2. Environment Configuration

**Create `.env.example` template:**

```bash
# WebSocket Gateway URL
VITE_GATEWAY_URL=ws://localhost:18789

# Authentication Token (required)
# Generate with: node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
VITE_GATEWAY_TOKEN=

# Optional: Custom Client Display Name
VITE_CLIENT_NAME=
```

**Add to `.gitignore`:**
```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

### 3. Production Deployment

**For production, use secure WebSocket (WSS):**

```bash
# Production .env
VITE_GATEWAY_URL=wss://gateway.yourdomain.com
VITE_GATEWAY_TOKEN=<production-token>
```

**Gateway configuration:**
```json
{
  "gateway": {
    "port": 443,
    "bind": "0.0.0.0",
    "ssl": {
      "enabled": true,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    },
    "auth": {
      "mode": "token",
      "token": "<production-token>"
    }
  }
}
```

### 4. Network Security

**Localhost-only binding (development):**
```json
{
  "gateway": {
    "bind": "loopback"  // Only accepts connections from localhost
  }
}
```

**Public binding (production with SSL):**
```json
{
  "gateway": {
    "bind": "0.0.0.0",  // Accepts external connections
    "ssl": { "enabled": true }
  }
}
```

---

## Troubleshooting

### Issue 1: "device identity required"

**Error:**
```
Error: device identity required
```

**Cause:** Missing or invalid auth token in webapp .env file

**Solution:**
1. Check `.env` file has `VITE_GATEWAY_TOKEN` set
2. Verify token matches gateway config
3. Restart webapp after changing `.env`

```bash
# Verify token in gateway config
cat ~/.clawdbot/clawdbot.json | grep -A 3 '"auth"'

# Update webapp .env
echo "VITE_GATEWAY_TOKEN=YOUR_TOKEN_HERE" >> src/webapp/client/.env

# Restart webapp
cd src/webapp/client && npm run dev
```

### Issue 2: "invalid connect params"

**Error:**
```
invalid connect params: at /client/id: must be equal to constant
```

**Cause:** "webapp" client type not registered in gateway protocol

**Solution:**
Verify `src/gateway/protocol/client-info.ts` includes:

```typescript
export const GATEWAY_CLIENT_IDS = {
  // ... other IDs ...
  WEBAPP: "webapp",
} as const;

export const GATEWAY_CLIENT_MODES = {
  // ... other modes ...
  WEBAPP: "webapp",
} as const;
```

### Issue 3: Connection Timeout

**Error:**
```
WebSocket connection timeout
```

**Possible causes:**
1. Gateway not running
2. Wrong port number
3. Firewall blocking connection

**Solution:**
```bash
# Check if gateway is running
lsof -i :18789

# Check gateway logs
tail -f ~/.clawdbot/logs/gateway.log

# Verify gateway URL in .env
cat src/webapp/client/.env | grep VITE_GATEWAY_URL

# Test connection manually
wscat -c ws://localhost:18789
```

### Issue 4: Authentication Failed

**Error:**
```
Authentication failed: invalid token
```

**Solution:**
```bash
# Extract token from gateway config
GATEWAY_TOKEN=$(cat ~/.clawdbot/clawdbot.json | grep '"token"' | cut -d'"' -f4)

# Update webapp .env
echo "VITE_GATEWAY_TOKEN=$GATEWAY_TOKEN" > src/webapp/client/.env.new
cat src/webapp/client/.env.new

# Verify and apply
mv src/webapp/client/.env.new src/webapp/client/.env
```

---

## Advanced Configuration

### 1. Multiple Environment Configs

Create separate env files for different environments:

**Development (`.env.development`):**
```bash
VITE_GATEWAY_URL=ws://localhost:18789
VITE_GATEWAY_TOKEN=dev-token-12345
```

**Staging (`.env.staging`):**
```bash
VITE_GATEWAY_URL=wss://staging-gateway.example.com
VITE_GATEWAY_TOKEN=staging-token-67890
```

**Production (`.env.production`):**
```bash
VITE_GATEWAY_URL=wss://gateway.example.com
VITE_GATEWAY_TOKEN=prod-token-secure-xyz
```

**Run with specific environment:**
```bash
# Development
npm run dev

# Staging
vite build --mode staging

# Production
vite build --mode production
```

### 2. Custom Client Configuration

**Customize client display name and metadata:**

```typescript
// src/webapp/client/src/lib/gateway-client.ts

export interface GatewayClientOptions {
  url: string;
  clientId?: string;
  displayName?: string;
  version?: string;
  authToken?: string;
  // ... other options
}

// Usage in connect frame
params: {
  client: {
    id: this.options.clientId || 'webapp',
    displayName: this.options.displayName || 'Dexter Web App',
    version: this.options.version || '1.0.0',
    platform: 'browser',
    mode: 'webapp',
    metadata: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      // ... custom metadata
    },
  },
}
```

### 3. Token Rotation Strategy

**Implement automatic token rotation:**

```typescript
// Token rotation service
class TokenRotationService {
  private currentToken: string;
  private rotationInterval: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  async rotateToken() {
    // Generate new token
    const newToken = await this.generateSecureToken();

    // Update gateway config
    await this.updateGatewayConfig(newToken);

    // Update webapp environment
    await this.updateWebappToken(newToken);

    // Reconnect with new token
    await this.reconnectWebSocket(newToken);
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }
}
```

### 4. Connection Monitoring

**Monitor connection health:**

```typescript
// src/webapp/client/src/lib/connection-monitor.ts

export class ConnectionMonitor {
  private pingInterval: number = 30000; // 30 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  startMonitoring(client: GatewayClient) {
    setInterval(() => {
      if (!client.isConnected()) {
        this.handleDisconnection(client);
      } else {
        this.sendPing(client);
      }
    }, this.pingInterval);
  }

  private async handleDisconnection(client: GatewayClient) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      await client.connect();
    } else {
      console.error('Max reconnection attempts reached');
      // Notify user, refresh token, etc.
    }
  }
}
```

---

## Quick Reference

### Complete Setup Checklist

- [ ] Generate secure auth token (24+ bytes hex)
- [ ] Add token to `~/.clawdbot/clawdbot.json` under `gateway.auth.token`
- [ ] Restart gateway server
- [ ] Create `src/webapp/client/.env` with `VITE_GATEWAY_TOKEN`
- [ ] Add `.env` to `.gitignore`
- [ ] Start webapp with `npm run dev`
- [ ] Verify connection in browser console
- [ ] Test sending a message
- [ ] Configure production SSL for deployment

### Useful Commands

```bash
# Generate auth token
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# Check gateway config
cat ~/.clawdbot/clawdbot.json | grep -A 5 '"auth"'

# View gateway logs
tail -f ~/.clawdbot/logs/gateway.log

# Check running processes
lsof -i :18789  # Gateway
lsof -i :5173   # Webapp

# Test WebSocket connection
wscat -c ws://localhost:18789

# Restart gateway
pkill -f clawdbot-gateway && node scripts/run-node.mjs gateway --port 18789

# Restart webapp
cd src/webapp/client && npm run dev
```

---

## Related Documentation

- [WebSocket Migration Guide](../../webapp/WEBSOCKET_MIGRATION.md)
- [Gateway Protocol Specification](../gateway/protocol.md)
- [Gateway Security Guide](../gateway/security.md)
- [Client API Reference](../../webapp/client/README.md)
- [Testing Guide](../../webapp/client/TESTING.md)

---

## Support

If you encounter issues not covered in this guide:

1. Check [Troubleshooting](#troubleshooting) section
2. Review gateway logs: `~/.clawdbot/logs/gateway.log`
3. Enable debug logging in browser console
4. Verify network connectivity with `wscat`
5. Consult [Gateway Protocol Documentation](../gateway/protocol.md)

---

**Last Updated:** 2026-02-15
**Version:** 1.0.0
**Status:** Production Ready ✅
