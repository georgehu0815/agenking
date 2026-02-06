# Azure OpenAI Tool Support Fix - Quick Reference

## 🚀 Quick Start

### Restart & Test
```bash
# Build
pnpm build

# Restart gateway
pkill -f clawdbot-gateway
pnpm clawdbot gateway run > /tmp/gateway.log 2>&1 &

# Test via TUI
pnpm clawdbot tui
# Send: "Create ~/tmp/test.txt with content 'Hello World'"
```

## ✅ Verify It's Working

### Check Logs
```bash
tail -f /tmp/gateway.log | grep "Binding"
```

**Expected:**
```
[Azure OpenAI Stream Adapter] Binding 12 tools to model
```

### Test File Creation
```bash
# Via TUI, send:
"Create ~/tmp/test123.txt with text 'Testing tools'"

# Verify:
cat ~/tmp/test123.txt
# Should output: Testing tools
```

## 🔧 What Was Fixed

| Before ❌ | After ✅ |
|----------|---------|
| No tool binding | Tools bound to model |
| No tool call handling | Tool calls detected & processed |
| No tool events | Proper toolcall_start/end events |
| Commands ignored | Commands execute successfully |

## 📊 Key Files Modified

1. **`src/agents/azure-openai-stream-adapter.ts`**
   - Lines 7-18: `convertPiToolsToLangChain()` function
   - Lines 84-95: Tool binding logic
   - Lines 185-251: Tool call event handling

## 🐛 Troubleshooting

### "Binding 0 tools"
→ Check config: `cat ~/.clawdbot/clawdbot.json`
→ Verify `"auth": "managedidentity"`

### "Tools not executing"
→ Restart gateway: `pkill -f clawdbot-gateway && pnpm clawdbot gateway run`

### "Build errors"
→ Clean: `rm -rf dist/ && pnpm build`

### "Auth errors"
**Production:**
```bash
az account show
```

**Development:**
```bash
az login
```

## 📝 Event Types (Pi Convention)

| Event | Type |
|-------|------|
| Start | `"start"` |
| Text | `"text_start"`, `"text_delta"`, `"text_end"` |
| Tools | `"toolcall_start"`, `"toolcall_end"` ← **underscore!** |
| Done | `"done"` with `reason: "toolUse"` ← **camelCase!** |

## 🔑 Important Type Conventions

```typescript
// ✅ Correct
type: "toolCall"        // camelCase
type: "toolcall_start"  // underscore
stopReason: "toolUse"   // camelCase
arguments: string       // not "input"

// ❌ Wrong
type: "tool_call"       // snake_case
type: "tool_call_start" // no underscore in middle
stopReason: "tool_use"  // snake_case
input: any              // wrong property name
```

## 📖 Full Documentation

See: [AZURE_OPENAI_TOOL_SUPPORT_FIX.md](AZURE_OPENAI_TOOL_SUPPORT_FIX.md)

## 🎯 Test Commands

```bash
# File creation
"Create ~/tmp/test.txt with 'Hello World'"

# File reading
"Read ~/tmp/test.txt"

# Command execution
"Run 'ls -la ~/tmp/*.txt' and show results"

# File modification
"Add 'New line' to ~/tmp/test.txt"
```

## 📍 Location in Code

```typescript
// src/agents/azure-openai-stream-adapter.ts

// 1. Convert tools (line 10)
function convertPiToolsToLangChain(tools: any[]): any[]

// 2. Bind tools (line 86)
if (context.tools && context.tools.length > 0) {
  const boundModel = model.bindTools(langchainTools);
}

// 3. Handle tool calls (line 186)
if (aiChunk.tool_calls && aiChunk.tool_calls.length > 0) {
  // Emit toolcall_start and toolcall_end events
}
```

## ⚡ Pro Tips

1. **Always check gateway logs first**
   ```bash
   tail -f /tmp/gateway.log
   ```

2. **Verify tool count in logs**
   - Should see: `Binding 12 tools to model` (or similar)
   - If `Binding 0 tools`, context.tools is empty

3. **Test incrementally**
   - Start with simple file creation
   - Then try file reading
   - Then command execution
   - Then complex multi-tool workflows

4. **Use verbose logging**
   ```bash
   DEBUG=* pnpm clawdbot gateway run
   ```

## 🔄 Recovery Steps

If things break:

1. **Clean slate:**
   ```bash
   pkill -f clawdbot-gateway
   rm -rf dist/
   pnpm install
   pnpm build
   pnpm clawdbot gateway run
   ```

2. **Verify config:**
   ```bash
   cat ~/.clawdbot/clawdbot.json | jq '.models.providers.azureopenai'
   ```

3. **Test auth:**
   ```bash
   az account show
   az cognitiveservices account list
   ```

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-05
