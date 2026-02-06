# Azure OpenAI Tool Support Fix Guide

**Date:** February 5, 2026
**Issue:** Azure OpenAI Managed Identity stream adapter didn't support tool execution
**Status:** ✅ Fixed and tested

## 📋 Table of Contents

1. [Problem Summary](#problem-summary)
2. [Technical Details](#technical-details)
3. [What Was Fixed](#what-was-fixed)
4. [How It Works Now](#how-it-works-now)
5. [Testing Instructions](#testing-instructions)
6. [Troubleshooting](#troubleshooting)
7. [Architecture Reference](#architecture-reference)

---

## Problem Summary

### Symptom

When using Azure OpenAI with Managed Identity authentication, Clawdbot could only respond with text. It couldn't execute any tools:

- ❌ **Bash commands** wouldn't run
- ❌ **File operations** (Read/Write/Edit) didn't work
- ❌ **Any tool calls** were completely ignored
- ❌ Model would respond with text like "I'll create that file" but never actually do it

### Root Cause

The custom Azure OpenAI stream adapter (`src/agents/azure-openai-stream-adapter.ts`) was missing complete tool support:

1. **No tool binding** - Tools weren't passed to the LangChain model
2. **No tool call handling** - Stream didn't process `tool_calls` from the API response
3. **No event emission** - Tool execution events weren't emitted to the Pi agent loop

This meant the agentic loop never received tool calls, so commands were never executed.

---

## Technical Details

### Files Modified

- **`src/agents/azure-openai-stream-adapter.ts`** - Main fix location
  - Added tool conversion function
  - Added tool binding logic
  - Added tool call stream handling
  - Fixed event type naming conventions

### Key Changes

#### 1. Tool Conversion Function (Lines 7-18)

```typescript
function convertPiToolsToLangChain(tools: any[]): any[] {
  if (!tools || tools.length === 0) return [];

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || "",
    parameters: tool.input_schema || tool.parameters || {},
  }));
}
```

**Purpose:** Converts Pi's tool format to LangChain's expected format.

#### 2. Tool Binding (Lines 84-95)

```typescript
// Bind tools to the model if present in context
let stream;
if (context.tools && context.tools.length > 0) {
  const langchainTools = convertPiToolsToLangChain(context.tools);
  console.log(
    `[Azure OpenAI Stream Adapter] Binding ${langchainTools.length} tools to model`,
  );
  const boundModel = model.bindTools(langchainTools);
  stream = await boundModel.stream(messages);
} else {
  stream = await model.stream(messages);
}
```

**Purpose:** Binds tools to the model so Azure OpenAI knows what functions are available.

#### 3. Tool Call Handling (Lines 185-251)

```typescript
// Handle tool calls
if (aiChunk.tool_calls && aiChunk.tool_calls.length > 0) {
  for (const toolCall of aiChunk.tool_calls) {
    const toolCallIndex = toolCalls.length;

    // Create tool call content item
    const toolCallContent = {
      type: "toolCall" as const,
      id: toolCall.id || `tool_${toolCallIndex}`,
      name: toolCall.name,
      arguments: JSON.stringify(toolCall.args || {}) || {},
    };

    toolCalls.push(toolCallContent);

    // Emit toolcall_start event
    eventStream.push({
      type: "toolcall_start" as const,
      contentIndex: toolCallIndex + (accumulatedText ? 1 : 0),
      partial: {
        role: "assistant" as const,
        content: accumulatedText
          ? [{ type: "text" as const, text: accumulatedText }, toolCallContent]
          : [toolCallContent],
        // ... rest of event data
        stopReason: "toolUse" as const,
      },
    });

    // Emit toolcall_end event
    eventStream.push({
      type: "toolcall_end" as const,
      contentIndex: toolCallIndex + (accumulatedText ? 1 : 0),
      toolCall: toolCallContent,
      // ... rest of event data
      stopReason: "toolUse" as const,
    });
  }
}
```

**Purpose:** Detects tool calls in the stream and emits proper events for the Pi agent loop.

---

## What Was Fixed

### Before ❌

```typescript
// OLD CODE - No tool support
const stream = await model.stream(messages);

// Only handled text content
for await (const chunk of stream) {
  const delta = chunk.content as string;
  if (delta) {
    accumulatedText += delta;
    // Emit text events only
  }
}
```

**Result:** Model couldn't call any tools.

### After ✅

```typescript
// NEW CODE - Full tool support
let stream;
if (context.tools && context.tools.length > 0) {
  const langchainTools = convertPiToolsToLangChain(context.tools);
  const boundModel = model.bindTools(langchainTools);
  stream = await boundModel.stream(messages);
} else {
  stream = await model.stream(messages);
}

// Handle both text and tool calls
for await (const chunk of stream) {
  // Handle text content
  if (aiChunk.content && typeof aiChunk.content === "string") {
    // ... emit text events
  }

  // Handle tool calls
  if (aiChunk.tool_calls && aiChunk.tool_calls.length > 0) {
    // ... emit tool events
  }
}
```

**Result:** Model can now call tools and execute commands!

---

## How It Works Now

### Flow Diagram

```
User Input
    ↓
Gateway receives message
    ↓
Pi Embedded Runner detects Azure OpenAI + Managed Identity
    ↓
Swaps stream function to streamAzureOpenAIManagedIdentity()
    ↓
Stream Adapter:
  1. ✅ Extracts tools from context
  2. ✅ Converts tools to LangChain format
  3. ✅ Binds tools to model
  4. ✅ Sends request to Azure OpenAI with tools
    ↓
Azure OpenAI API responds with:
  - Text chunks (streamed)
  - Tool calls (when needed)
    ↓
Stream Adapter processes response:
  - Emits text events (text_start, text_delta, text_end)
  - Emits tool events (toolcall_start, toolcall_end)
    ↓
Pi Agent Loop:
  - Executes tool calls (e.g., Bash, Read, Write)
  - Gets tool results
  - Continues conversation with results
    ↓
Final response delivered to user
```

### Event Types

The adapter now emits these Pi-compatible events:

| Event Type | When | Purpose |
|------------|------|---------|
| `start` | Stream begins | Initialize message |
| `text_start` | First text chunk | Begin text content |
| `text_delta` | Each text chunk | Stream text incrementally |
| `text_end` | Text complete | Finalize text content |
| `toolcall_start` | Tool call detected | Signal tool execution start |
| `toolcall_end` | Tool call complete | Signal tool ready for execution |
| `done` | Stream ends | Finalize with `stopReason: "toolUse"` or `"stop"` |

### Stop Reasons

- **`"stop"`** - Normal completion (no tools called)
- **`"toolUse"`** - Model called tools (execution needed)
- **`"error"`** - Error occurred during streaming

---

## Testing Instructions

### 1. Build the Project

```bash
cd /Users/ghu/aiworker/clawdbot
pnpm build
```

**Expected output:**
```
✅ Build successful!
```

### 2. Restart Gateway

Stop any running gateway and start fresh:

```bash
# Kill existing gateway
pkill -f clawdbot-gateway

# Start gateway with logging
pnpm clawdbot gateway run --bind loopback --port 18789 > /tmp/gateway.log 2>&1 &

# Verify it's running
ss -ltnp | grep 18789
```

### 3. Test via TUI

Open TUI in a new terminal:

```bash
pnpm clawdbot tui
```

Send test messages:

#### Test 1: File Creation

**Message:**
```
Create a file called test123.txt in ~/tmp with the content "Hello from Azure OpenAI!"
```

**Expected behavior:**
- ✅ You see tool execution logs
- ✅ File `~/tmp/test123.txt` is created
- ✅ Content matches what you requested

**Verification:**
```bash
cat ~/tmp/test123.txt
# Should output: Hello from Azure OpenAI!
```

#### Test 2: File Reading

**Message:**
```
Read the contents of ~/tmp/test123.txt
```

**Expected behavior:**
- ✅ Tool call to Read
- ✅ Correct file contents displayed

#### Test 3: Command Execution

**Message:**
```
Run 'ls -la ~/tmp/*.txt' and show me the results
```

**Expected behavior:**
- ✅ Bash tool executes
- ✅ Command output displayed
- ✅ File list shown

### 4. Check Gateway Logs

```bash
tail -f /tmp/gateway.log
```

**What to look for:**

✅ **Success indicators:**
```
[Azure OpenAI Stream Adapter] Binding 12 tools to model
[Tool Execution] Running Bash: touch ~/tmp/test123.txt
[Tool Execution] Tool completed successfully
```

❌ **Problem indicators:**
```
[Azure OpenAI Stream Adapter] Binding 0 tools to model  # NO TOOLS!
[Azure OpenAI Stream Adapter] Error: ...                # ERRORS!
```

---

## Troubleshooting

### Issue 1: "No tools being bound"

**Symptom:** Log shows `Binding 0 tools to model`

**Cause:** Tools aren't being passed in the context

**Fix:**
1. Check that you're using Azure OpenAI with managed identity
2. Verify config in `~/.clawdbot/clawdbot.json`:
```json
{
  "models": {
    "providers": {
      "azureopenai": {
        "auth": "managedidentity",
        "baseUrl": "https://your-endpoint.openai.azure.com",
        "api": "2024-12-01-preview"
      }
    }
  }
}
```

### Issue 2: "Tools not executing"

**Symptom:** Model says it will do something but nothing happens

**Possible causes:**

1. **Gateway not restarted**
   ```bash
   # Restart gateway to pick up new code
   pkill -f clawdbot-gateway
   pnpm clawdbot gateway run
   ```

2. **Old build still running**
   ```bash
   # Rebuild and restart
   pnpm build
   pkill -f clawdbot-gateway
   pnpm clawdbot gateway run
   ```

3. **Tool permissions issue**
   - Check sandbox settings
   - Verify file/directory permissions

### Issue 3: "TypeScript errors on build"

**Symptom:** `pnpm build` fails with type errors

**Fix:**
```bash
# Clean and rebuild
rm -rf dist/
pnpm build
```

If errors persist, check [azure-openai-stream-adapter.ts:195](src/agents/azure-openai-stream-adapter.ts#L195) for correct property names:
- ✅ `type: "toolCall"` (camelCase)
- ✅ `arguments: JSON.stringify(...)` (not `input`)
- ✅ Event types: `"toolcall_start"`, `"toolcall_end"` (underscore)
- ✅ Stop reason: `"toolUse"` (camelCase)

### Issue 4: "Authentication errors"

**Symptom:** `Error: Unauthorized` or credential failures

**For Production (Managed Identity):**
```bash
# Verify managed identity is configured
az account show
az identity list

# Check the client ID matches in azure-openai-models.ts
```

**For Development (Azure CLI):**
```bash
# Login with Azure CLI
az login

# Verify you have access
az cognitiveservices account list
```

### Issue 5: "Tool calls coming back malformed"

**Symptom:** Tool call events but tools don't execute

**Debug steps:**

1. **Check tool call format:**
```typescript
// In azure-openai-stream-adapter.ts line 191-196
const toolCallContent = {
  type: "toolCall" as const,          // Must be "toolCall" not "tool_call"
  id: toolCall.id || `tool_${toolCallIndex}`,
  name: toolCall.name,
  arguments: JSON.stringify(toolCall.args || {}) || {},  // Must be "arguments"
};
```

2. **Verify event types:**
```typescript
// Correct event types
type: "toolcall_start"  // Not "tool_call_start"
type: "toolcall_end"    // Not "tool_call_end"
stopReason: "toolUse"   // Not "tool_use"
```

---

## Architecture Reference

### Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (TUI / Web / Telegram)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Gateway / Router                          │
│              Routes message to appropriate agent                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Pi Embedded Runner                            │
│  • Detects Azure OpenAI + Managed Identity                     │
│  • Swaps streamFn to streamAzureOpenAIManagedIdentity          │
│  • Provides tools from Pi Coding Agent                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│            Azure OpenAI Stream Adapter (FIXED!)                 │
│  1. Extract tools from context                                 │
│  2. Convert Pi → LangChain format                              │
│  3. Bind tools to model                                        │
│  4. Stream from Azure OpenAI                                   │
│  5. Handle tool_calls in response                              │
│  6. Emit toolcall events                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Azure OpenAI Runtime                            │
│  • Manages model instance (cached)                             │
│  • Handles credential selection                                │
│  • Provides bearer token for auth                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LangChain (@langchain/openai)                │
│  • AzureChatOpenAI client                                      │
│  • Message format conversion                                   │
│  • Tool binding via bindTools()                                │
│  • Streaming support                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              Azure Identity (@azure/identity)                   │
│  • ManagedIdentityCredential (production)                      │
│  • AzureCliCredential (development)                            │
│  • Bearer token provider                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                Azure OpenAI Service (Cloud)                     │
│  • GPT-5.2 Deployment                                          │
│  • API: 2024-12-01-preview                                     │
│  • Tool calling support                                        │
│  • Streaming responses                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow for Tool Execution

```
1. User: "Create file test.txt"
   ↓
2. Gateway → Pi Runner (detects Azure + MI)
   ↓
3. Pi Runner → Stream Adapter
   - context.tools = [Bash, Read, Write, ...]
   - context.messages = [user message]
   ↓
4. Stream Adapter → LangChain
   - convertPiToolsToLangChain(context.tools)
   - model.bindTools(langchainTools)
   - model.stream(messages)
   ↓
5. LangChain → Azure OpenAI API
   - POST /openai/deployments/gpt-5.2/chat/completions
   - Include: messages, tools, stream=true
   ↓
6. Azure OpenAI → Response Stream
   {
     "choices": [{
       "delta": {
         "tool_calls": [{
           "id": "call_abc123",
           "type": "function",
           "function": {
             "name": "Bash",
             "arguments": "{\"command\":\"touch test.txt\"}"
           }
         }]
       }
     }]
   }
   ↓
7. Stream Adapter → Events
   - toolcall_start (signals tool detected)
   - toolcall_end (tool ready to execute)
   ↓
8. Pi Agent Loop → Tool Execution
   - Detects stopReason: "toolUse"
   - Executes Bash tool
   - Gets result
   - Adds toolResult to context
   ↓
9. Pi Agent Loop → Next Turn
   - Sends tool result back to model
   - Model responds with final answer
   ↓
10. User receives: "✓ Created test.txt"
```

---

## Related Files

### Core Implementation
- `src/agents/azure-openai-stream-adapter.ts` - Main adapter (tool support added)
- `src/agents/azure-openai-runtime.ts` - Model instance management
- `src/agents/azure-openai-models.ts` - Configuration constants
- `src/agents/pi-embedded-runner/run/attempt.ts` - Stream function swapping

### Configuration
- `~/.clawdbot/clawdbot.json` - Provider config
- `.env` - Environment variables (if needed)

### Documentation
- `AZURE_OPENAI_IMPLEMENTATION.md` - Full implementation guide
- `azure-openai-system-architecture.excalidraw.md` - System architecture diagram
- `azure-openai-class-design.excalidraw.md` - Class design diagram

---

## Summary

✅ **What's Fixed:**
- Tool binding to Azure OpenAI model
- Tool call detection in stream
- Proper event emission for agent loop
- Correct Pi event type naming

✅ **What Now Works:**
- Bash command execution
- File operations (Read/Write/Edit)
- All Pi Coding Agent tools
- Full agentic loop with Azure OpenAI

✅ **Testing Confirmed:**
- Build succeeds with no TypeScript errors
- Tools are bound to model (visible in logs)
- Commands execute successfully
- Files created/modified as expected

---

## Quick Reference

### Check if fix is active:
```bash
grep "Binding.*tools to model" /tmp/gateway.log
```

### Verify tool execution:
```bash
# Send test message
echo "Create ~/tmp/test.txt" | pnpm clawdbot message send --stdin

# Check result
ls -la ~/tmp/test.txt
```

### Debug logs:
```bash
tail -f /tmp/gateway.log | grep -i "tool\|azure"
```

---

## Support

If you encounter issues not covered in this guide:

1. Check gateway logs: `tail -f /tmp/gateway.log`
2. Verify configuration: `cat ~/.clawdbot/clawdbot.json`
3. Test with standard provider: Switch to `openai` or `anthropic` temporarily
4. Re-read this guide: Most issues are covered in Troubleshooting

---

**Last Updated:** 2026-02-05
**Version:** 1.0
**Status:** Production Ready ✅
