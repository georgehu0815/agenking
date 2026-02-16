# Using HTTP Gateway Mode in VS Code Extension

The Dexter VS Code extension supports **two modes**:

## 🔀 Agent Modes

### 1. **Direct Mode** (Default)
- Runs a lightweight SimpleAgent directly in the extension host
- Fast startup, no external dependencies
- Limited to basic Azure OpenAI capabilities
- **Best for:** Quick queries, lightweight use

### 2. **Gateway Mode** (Full Power)
- Connects to the HTTP Gateway running on localhost:3000
- Access to the **full Dexter agent** with all skills
- Uses the same agent as the web interface
- **Best for:** Full capabilities, skill access, consistency

---

## 🚀 How to Switch to Gateway Mode

### Step 1: Start the HTTP Gateway

**Terminal 1:**
```bash
cd /Users/ghu/aiworker/dexter
npm run dev
```

Wait for:
```
[HTTP Gateway] 🚀 HTTP Server started
[HTTP Gateway]    Port: 3000
```

### Step 2: Configure VS Code Extension

**Method A: Using VS Code Settings UI**

1. Open VS Code Settings: **Cmd+,** (or **Ctrl+,**)
2. Search for: **"Dexter Agent Mode"**
3. Change **"Agent Mode"** from `direct` to `gateway`
4. Verify **"Gateway URL"** is `http://localhost:3000`

**Method B: Using settings.json**

1. **Cmd+Shift+P** → "Preferences: Open User Settings (JSON)"
2. Add these settings:

```json
{
  "dexter.agentMode": "gateway",
  "dexter.gatewayUrl": "http://localhost:3000"
}
```

### Step 3: Test It

1. Open Dexter chat in VS Code (click sidebar icon)
2. Send a query: "What is 2+2?"
3. Check the **Output panel**: **View → Output → Select "Dexter AI"**

You should see:
```
ℹ️ Creating HttpGatewayAgent (URL: http://localhost:3000)
ℹ️ Starting agent session...
```

---

## 📊 Mode Comparison

| Feature | Direct Mode | Gateway Mode |
|---------|-------------|--------------|
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡ Medium |
| **Startup** | Instant | Requires gateway |
| **Skills** | ❌ None | ✅ All skills |
| **Tools** | Basic | Web search, finance, browser |
| **Consistency** | Separate | Same as web UI |
| **Dependencies** | None | HTTP Gateway must run |
| **Use Case** | Quick queries | Full research |

---

## ⚙️ Configuration Options

### Available Settings

```json
{
  // Agent mode: "direct" or "gateway"
  "dexter.agentMode": "gateway",

  // HTTP Gateway URL (only used in gateway mode)
  "dexter.gatewayUrl": "http://localhost:3000",

  // Model (only used in direct mode)
  "dexter.model": "gpt-5.2",

  // Max iterations (only used in direct mode)
  "dexter.maxIterations": 10,

  // Enable debug logs
  "dexter.enableDebugLogs": true
}
```

### Custom Gateway URL

If running the gateway on a different port or host:

```json
{
  "dexter.gatewayUrl": "http://localhost:8080"
}
```

Or remote gateway:
```json
{
  "dexter.gatewayUrl": "https://your-server.com:3000"
}
```

---

## 🧪 Testing Gateway Mode

### 1. Verify Gateway is Running

```bash
curl http://localhost:3000/api/health
```

**Expected:**
```json
{"status":"ok","timestamp":1708000000,"uptime":123}
```

### 2. Send Test Query

In VS Code:
1. Open Dexter chat
2. Send: "Hello from gateway mode!"
3. Check Output panel for connection logs

### 3. Check Gateway Logs

**Terminal where gateway is running:**
```
[HTTP Gateway] 📥 NEW MESSAGE RECEIVED
[HTTP Gateway]    Session ID: session-...
[HTTP Gateway]    User ID:    vscode-extension
[HTTP Gateway]    Query:      "Hello from gateway mode!"
```

---

## 🔧 Troubleshooting

### Error: "Cannot connect to Dexter HTTP Gateway"

**Symptoms:**
```
Cannot connect to Dexter HTTP Gateway at http://localhost:3000

Please ensure the HTTP Gateway is running:
  cd /Users/ghu/aiworker/dexter
  npm run dev
```

**Solutions:**

1. **Start the gateway:**
   ```bash
   cd /Users/ghu/aiworker/dexter
   npm run dev
   ```

2. **Verify it's running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Check port:**
   ```bash
   lsof -i :3000
   ```

4. **Switch back to direct mode temporarily:**
   - VS Code Settings → Dexter Agent Mode → "direct"

### Error: "HTTP Gateway error: 500"

**Cause:** Gateway is running but agent failed

**Solutions:**

1. **Check gateway logs** in the terminal
2. **Verify API keys** in `.env` file:
   ```bash
   cat /Users/ghu/aiworker/dexter/.env | grep API_KEY
   ```
3. **Restart gateway:**
   ```bash
   # Kill and restart
   ps aux | grep "http-gateway" | awk '{print $2}' | xargs kill -9
   npm run dev
   ```

### Settings Not Taking Effect

**Solution: Reload VS Code**
```
Cmd+Shift+P → "Developer: Reload Window"
```

---

## 🎯 Best Practices

### When to Use Gateway Mode

✅ **Use Gateway Mode when:**
- You need web search capabilities
- You're doing financial research
- You want the same experience as web UI
- You're already running the gateway for web interface
- You need advanced skills/tools

✅ **Use Direct Mode when:**
- You want instant startup
- You only need basic Q&A
- You don't have the gateway running
- You want minimal dependencies
- You're doing simple code questions

### Recommended Workflow

1. **Start your dev session:**
   ```bash
   cd /Users/ghu/aiworker/dexter
   npm run dev
   ```
   This starts both CLI and HTTP gateway

2. **Configure VS Code to gateway mode:**
   - One-time setting change
   - Now you have full capabilities

3. **Use all three interfaces:**
   - VS Code extension (gateway mode)
   - Web browser (http://localhost:5173)
   - Terminal CLI

   All using the **same agent backend**!

---

## 📈 Performance Tips

### Speed Up Gateway Connection

The extension connects to the gateway for each query. To reduce latency:

1. **Run gateway locally** (not remote)
2. **Keep gateway running** (don't stop/start frequently)
3. **Use direct mode** for simple queries

### Monitor Performance

Enable debug logs to see timing:
```json
{
  "dexter.enableDebugLogs": true
}
```

Then check: **View → Output → Dexter AI**

---

## 🔄 Switching Between Modes

You can switch modes **anytime** without restarting VS Code:

```json
// Switch to gateway mode
{
  "dexter.agentMode": "gateway"
}

// Switch to direct mode
{
  "dexter.agentMode": "direct"
}
```

Save settings and send a new query. The next query will use the new mode!

---

## ✅ Quick Start Checklist

To use gateway mode right now:

- [ ] HTTP gateway is running (`npm run dev`)
- [ ] Gateway health check passes (`curl http://localhost:3000/api/health`)
- [ ] VS Code setting `dexter.agentMode` = `"gateway"`
- [ ] VS Code setting `dexter.gatewayUrl` = `"http://localhost:3000"`
- [ ] Reload VS Code window (`Cmd+Shift+P` → Reload Window)
- [ ] Send test query in Dexter chat
- [ ] Check Output panel for "Creating HttpGatewayAgent"
- [ ] Verify response appears in chat

---

## 🎉 You're Ready!

**Current Status:**
- ✅ HTTP Gateway running on port 3000
- ✅ VS Code extension supports gateway mode
- ✅ Just need to change one setting!

**To activate gateway mode:**

1. **Cmd+,** → Search "Dexter Agent Mode"
2. Change to **"gateway"**
3. Send a query!

---

**Now your VS Code extension will use the full Dexter agent with all skills! 🚀**
