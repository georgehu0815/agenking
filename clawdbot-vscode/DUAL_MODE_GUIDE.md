# Dexter VSCode Extension - Dual Mode Guide

The Dexter VSCode extension now supports **two modes** for running queries:

## 🔧 Mode 1: Gateway Mode (Default)

**Full Dexter capabilities with complete skill system**

- ✅ All Dexter skills (web search, file operations, code generation, etc.)
- ✅ Tool use and agentic workflows
- ✅ Full LangChain capabilities
- ✅ Shared with parent Dexter project
- ⚠️ Requires HTTP Gateway to be running
- ⚠️ Slightly higher latency (localhost network call)

**Best for**: Complex tasks requiring skills, research, multi-step workflows

**How to use**: It's enabled by default! Start the HTTP gateway (`npm run dev` in parent project), then press F5 and start chatting.

---

## 🚀 Mode 2: Direct Mode

**Fast, lightweight, no setup required**

- ✅ Direct calls to Azure OpenAI
- ✅ Minimal latency
- ✅ Built-in authentication (Azure CLI or Managed Identity)
- ✅ No external dependencies
- ❌ No skill system
- ❌ No tool use capabilities

**Best for**: Quick queries, code explanations, general Q&A

---

## 🎮 How to Switch Modes

### Option 1: VSCode Settings UI

1. Open **Settings** (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. Search for "**Dexter Agent Mode**"
3. Choose:
   - **gateway** - Full skill system (default)
   - **direct** - Fast, lightweight

### Option 2: settings.json
package.json
 "configuration": {
      "title": "Dexter AI",
      "properties": {
        "dexter.agentMode": {
          "type": "string",
          "enum": ["direct", "gateway"],
          "default": "gateway",
          "description": "Agent mode: 'direct' for lightweight agent with direct Azure calls, 'gateway' for full skill system via HTTP gateway"
        },

Add to your workspace or user `settings.json`:

```json
{
  "dexter.agentMode": "gateway",
  "dexter.gatewayUrl": "http://localhost:3000"
}
```
I've created .vscode/settings.json with:


{
  "dexter.agentMode": "gateway",
  "dexter.gatewayUrl": "http://localhost:3000",
  "dexter.enableDebugLogs": true
}
---

## 🏃 Starting the HTTP Gateway

To use **Gateway Mode**, you need the HTTP Gateway running:

### Terminal 1: Start HTTP Gateway
```bash
cd /Users/ghu/aiworker/dexter
npm run dev
```

**Expected output:**
```
Server listening on http://localhost:3000
HTTP channel enabled on port 3000
```

### Terminal 2: Start VSCode Extension
```bash
cd /Users/ghu/aiworker/dexter/dexter-vscode
# Press F5 in VSCode to launch Extension Development Host
```

---

## 📊 Mode Comparison

| Feature | Direct Mode | Gateway Mode |
|---------|-------------|--------------|
| **Setup** | None | Requires `npm run dev` |
| **Speed** | Very Fast | Fast |
| **Skills** | ❌ None | ✅ All skills |
| **Tools** | ❌ None | ✅ Full tool system |
| **Authentication** | Azure CLI/MI | Azure CLI/MI (via gateway) |
| **API Calls** | Direct to Azure | Via Express server |
| **Use Case** | Quick queries | Complex tasks |

---

## 🔍 Troubleshooting Gateway Mode

### Error: "Cannot connect to Dexter HTTP Gateway"

**Solution**: Make sure the HTTP Gateway is running:
```bash
cd /Users/ghu/aiworker/dexter
npm run dev
```

**Verify it's running**:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### Error: Port 3000 already in use

**Solution**: Change the gateway port in `.env`:
```bash
HTTP_CHANNEL_PORT=3001
```

And update VSCode settings:
```json
{
  "dexter.gatewayUrl": "http://localhost:3001"
}
```

---

## 🎯 When to Use Each Mode

### Use **Direct Mode** when:
- ✅ You need quick answers
- ✅ Simple code explanations
- ✅ Q&A without tools
- ✅ Working offline (with cached Azure token)

### Use **Gateway Mode** when:
- ✅ You need web search
- ✅ Complex multi-step tasks
- ✅ File operations and code generation
- ✅ Testing new skills
- ✅ Debugging with full Dexter capabilities

---

## 🔄 Switching Modes On-The-Fly

You can switch between modes without restarting VSCode:

1. Change the setting: `dexter.agentMode`
2. Reload the extension: `Cmd+R` in Extension Development Host
3. Send a new query

The extension will automatically use the new mode!

---

## 🛠️ Configuration Reference

All settings are under `dexter.*`:

```json
{
  // Agent mode: 'direct' or 'gateway'
  "dexter.agentMode": "direct",

  // HTTP Gateway URL (gateway mode only)
  "dexter.gatewayUrl": "http://localhost:3000",

  // AI model (direct mode only)
  "dexter.model": "gpt-5.2",

  // Max iterations (direct mode only)
  "dexter.maxIterations": 10,

  // Enable debug logging
  "dexter.enableDebugLogs": true
}
```

---

## 📈 Performance Tips

### For fastest performance:
- Use **Direct Mode** for simple queries
- Keep HTTP Gateway running in the background
- Switch to **Gateway Mode** only when you need skills

### For best capabilities:
- Use **Gateway Mode** by default
- Keep HTTP Gateway running in a terminal
- Monitor gateway logs for debugging

---

## 🎉 Quick Start

### Try Direct Mode (Default)
```
1. Press F5 in VSCode
2. Click Dexter icon
3. Type: "What is async/await?"
4. Get instant response!
```

### Try Gateway Mode (With Skills)
```
1. Start gateway: cd ../dexter && npm run dev
2. Change setting: "dexter.agentMode": "gateway"
3. Press F5 in VSCode
4. Click Dexter icon
5. Type: "Search the web for latest TypeScript news"
6. Get response with web search results!
```

---

**Questions?** Check the [Architecture Diagram](dexter-vscode-architecture.png) to see how both modes work under the hood!
