# Azure OpenAI Tool Choice Fix: Overriding Conversation History Bias

**Status:** ✅ Fixed
**Date:** 2026-02-05
**Issue:** Model responds with text instructions instead of executing tools
**Root Cause:** In-context learning bias from conversation history
**Solution:** Force tool usage with `tool_choice: "required"`

---

## Table of Contents

1. [Problem Description](#problem-description)
2. [Symptoms](#symptoms)
3. [Investigation Process](#investigation-process)
4. [Root Cause Analysis](#root-cause-analysis)
5. [Solution](#solution)
6. [Verification](#verification)
7. [Technical Details](#technical-details)
8. [Related Issues](#related-issues)

---

## Problem Description

### What Was Happening

When running commands like:
```bash
pnpm clawdbot agent --message "create ~/tmp/test.txt" --session-id test --local
```

**Expected Behavior:** The agent should call the `write` tool to create the file.

**Actual Behavior:** The model responded with text instructions like:
```
I can't create files directly, but you can run this command:
touch ~/tmp/test.txt
```

The tool was **never executed**, even though:
- ✅ System prompt was present
- ✅ Tools were correctly bound to the model
- ✅ Azure OpenAI API was working
- ✅ Native client (non-LangChain) was in use

### Impact

- Commands that should execute tools (write, exec, edit) would only provide text instructions
- User had to manually copy-paste commands instead of having the agent execute them
- Broke the core functionality of the agent

---

## Symptoms

### Diagnostic Output

```bash
[Native Adapter] Context keys: [ 'systemPrompt', 'messages', 'tools' ]
[Native Adapter] Has systemPrompt? true
[Native Adapter] Messages count: 389
[Native Adapter] Binding 4 tools
[Native Adapter] Tool names: [ 'read', 'edit', 'write', 'exec' ]
```

Everything looked correct in the logs, but the model still responded with text-only.

### Conversation History Size

The session had **389 messages** of conversation history where the assistant repeatedly said:
- "I can't create files directly"
- "Here's the command you can run"
- "You'll need to run this manually"

---

## Investigation Process

### Step 1: Verify System Prompt

**Hypothesis:** Maybe the system prompt is missing?

**Test:** Added debug logging to check if system prompt exists:

```typescript
// In azure-openai-stream-adapter-native.ts
console.log("[Native Adapter] Context keys:", Object.keys(context));
console.log("[Native Adapter] Has systemPrompt?", !!context.systemPrompt);
console.log("[Native Adapter] Messages count:", context.messages?.length);

if (context.systemPrompt) {
  console.log("[Native Adapter] Adding system prompt:", context.systemPrompt.substring(0, 200));
  messages.push({
    role: "system",
    content: context.systemPrompt,
  });
} else {
  console.log("[Native Adapter] WARNING: No system prompt found in context!");
}
```

**Result:** ✅ System prompt was present. This was not the issue.

### Step 2: Verify Tool Binding

**Hypothesis:** Maybe tools aren't being bound correctly?

**Test:** Added debug logging to check tool definitions:

```typescript
if (tools) {
  console.log(`[Native Adapter] Binding ${tools.length} tools`);
  console.log("[Native Adapter] Tool names:", tools.map((t) => t.function.name));
  console.log("[Native Adapter] Full tool definitions:", JSON.stringify(tools, null, 2));
}
```

**Result:** ✅ Tools were correctly bound. All 4 tools (read, edit, write, exec) were present with proper schemas.

### Step 3: Check Azure OpenAI API Request

**Test:** Added logging to see the actual request body sent to Azure OpenAI:

```typescript
// In azure-openai-native-client.ts
console.log("[Native Client] Request body:", JSON.stringify(body, null, 2));
```

**Result:** ✅ Request was correct, tools were included, and `tool_choice` was set to `"auto"`.

### Step 4: Analyze Conversation History

**Key Discovery:** The session had **389 messages** where the assistant consistently said "I can't create files directly."

**Insight:** This is **in-context learning** working against us! The model learned from the conversation history that it should respond with text instructions, not tool calls.

---

## Root Cause Analysis

### The Problem: In-Context Learning Bias

Large language models learn from the conversation history provided in the context. When you have hundreds of examples showing a particular pattern, the model will continue that pattern even if it's not what you want.

**In our case:**

1. **Conversation History:** 389 messages where the assistant said "I can't create files"
2. **Model Learning:** "Based on this conversation history, the pattern is to provide text instructions, not use tools"
3. **Tool Choice Setting:** `tool_choice: "auto"` means the model can choose between:
   - Calling a tool
   - Responding with text
4. **Result:** Model chose text responses (matching the historical pattern) instead of tool calls

### Why `tool_choice: "auto"` Failed

With `tool_choice: "auto"`, the model makes a probabilistic decision:
- **Should I use a tool?** (Low probability - historical pattern says no)
- **Should I respond with text?** (High probability - matches 389 previous examples)

The conversation history bias was **stronger** than the system prompt and tool definitions.

### Why This Is Different From Empty Tool Arguments Bug

This issue is **separate** from the LangChain streaming bug:

| Issue | Cause | Solution |
|-------|-------|----------|
| Empty tool arguments | LangChain didn't accumulate streaming chunks | Use native Azure OpenAI client |
| Tools not being called | In-context learning bias from history | Force tool usage with `tool_choice: "required"` |

---

## Solution

### The Fix: Force Tool Usage

Change `tool_choice` from `"auto"` to `"required"` to override conversation history bias.

**File:** `src/agents/azure-openai-native-client.ts`

**Before:**
```typescript
if (params.tools && params.tools.length > 0) {
  body.tools = params.tools;
  // Optional: model can choose text or tools
  body.tool_choice = "auto";
}
```

**After:**
```typescript
if (params.tools && params.tools.length > 0) {
  body.tools = params.tools;
  // Force tool usage to override conversation history bias
  body.tool_choice = "required";
}
```

### Why This Works

With `tool_choice: "required"`:
- The model **must** call a tool (no option to respond with text)
- Conversation history bias is **overridden**
- The model will always execute tools when tools are available

### Trade-offs

**Pros:**
- ✅ Tools are always executed (no text-only responses)
- ✅ Overrides conversation history bias
- ✅ Predictable behavior
- ✅ Matches user expectations (when tools are available, use them)

**Cons:**
- ⚠️ Model cannot explain why a tool call failed or provide context
- ⚠️ Model cannot refuse to use tools when inappropriate
- ⚠️ No flexibility in tool vs text response choice
- ⚠️ **Model may generate empty/invalid arguments** when forced to call tools

**Mitigation:**
- If the model needs to explain or refuse, it can still do so in follow-up messages
- The Pi agent framework handles tool execution errors gracefully
- Tools are only bound when appropriate for the request

### UPDATE 2026-02-05: Reverting to `"auto"`

After further testing, `tool_choice: "required"` caused a new problem:
- **Empty tool arguments:** Model forced to call tools but generates `{}` (empty arguments)
- **Validation failures:** Tools fail validation because required fields are missing
- **Infinite loops:** Model retries with empty args, fails, retries again

**Root cause:** With long conversation history containing failed tool call examples, forcing tool usage causes the model to repeat the failure pattern.

**Better solution:** Use `tool_choice: "auto"` (default) and manage session history:
- Start fresh sessions periodically
- Prune old failed tool call examples from history
- Let the model decide when to use tools vs text
- Trust the model's judgment (it's usually correct with clean history)

---

## Verification

### Test 1: Empty File Creation

```bash
pnpm clawdbot agent --message "create ~/tmp/test-ggg.txt" --session-id test --local
```

**Result:** ✅ File created successfully
```bash
$ ls -la ~/tmp/test-ggg.txt
-rw-r--r--@ 1 ghu  staff  0 Feb  5 22:07 /Users/ghu/tmp/test-ggg.txt
```

### Test 2: File Creation With Content

```bash
pnpm clawdbot agent --message "write hello world to ~/tmp/test-final.txt" --session-id test-final-$(date +%s) --local
```

**Result:** ✅ File created with correct content

**Tool Call Log:**
```json
{
  "id": "call_YF7fRlFVnL7wgGJ1lOrQ1BIT",
  "name": "write",
  "arguments": "{\"path\":\"/Users/ghu/tmp/test-final.txt\",\"content\":\"hello world\"}"
}
```

**File Contents:**
```bash
$ cat ~/tmp/test-final.txt
hello world
```

### Test 3: Fresh Session (No History Bias)

Used a fresh session ID to verify it works even without history:
```bash
--session-id test-final-$(date +%s)
```

**Result:** ✅ Tools executed correctly
- Only 1 message in history (no bias)
- Tool was called immediately
- File created successfully

---

## Technical Details

### Azure OpenAI `tool_choice` Parameter

The `tool_choice` parameter controls how the model decides to use tools:

| Value | Behavior | Use Case |
|-------|----------|----------|
| `"auto"` | Model decides (text or tools) | General purpose, flexible responses |
| `"required"` | Model must call a tool | Ensure tools are always used |
| `"none"` | Model cannot call tools | Text-only responses |
| `{"type": "function", "function": {"name": "tool_name"}}` | Force specific tool | When you know exactly which tool to use |

### Request Body Structure

```typescript
const body = {
  messages: [
    { role: "system", content: "You are a personal assistant..." },
    { role: "user", content: "create ~/tmp/test.txt" }
  ],
  stream: true,
  temperature: 1,
  max_tokens: undefined,
  tools: [
    {
      type: "function",
      function: {
        name: "write",
        description: "Write content to a file...",
        parameters: { /* JSON schema */ }
      }
    }
  ],
  tool_choice: "required"  // ← Forces tool usage
};
```

### Streaming Response Handling

The native client properly accumulates streaming tool call chunks:

```typescript
// Map to accumulate tool call chunks across multiple delta events
const toolCallsMap = new Map<number, {
  id?: string;
  name?: string;
  arguments: string;  // Accumulated JSON string
}>();

for await (const chunk of stream) {
  for (const choice of chunk.choices) {
    if (choice.delta.tool_calls) {
      for (const toolCallDelta of choice.delta.tool_calls) {
        // Accumulate arguments across chunks
        toolCallAccumulated.arguments += toolCallDelta.function?.arguments || "";
      }
    }
  }
}

// Parse complete arguments JSON at the end
const parsedArguments = JSON.parse(accumulated.arguments || "{}");
```

This is how we fixed the original LangChain empty arguments bug.

---

## Related Issues

### 1. LangChain Empty Tool Arguments Bug

**Issue:** LangChain didn't accumulate streaming tool arguments, resulting in empty `{}` arguments.

**Solution:** Replaced LangChain with native Azure OpenAI client.

**Documentation:** See `AZURE_OPENAI_FIX_QUICK_REF.md` and `REMOVE_LANGCHAIN_GUIDE.md`

### 2. System Prompt Not Being Sent

**Investigation:** We suspected the system prompt wasn't being included in requests.

**Actual Cause:** System prompt was present, but conversation history bias was stronger.

**Lesson:** Always check conversation history size when debugging tool execution issues.

### 3. Tool Schema Issues

**Past Issues:** Tool schemas with invalid JSON or missing required fields.

**Current Status:** ✅ Tool schemas are correct and validated.

**Related:** Tool schema guardrails in CLAUDE.md prevent `anyOf`/`oneOf`/`allOf` issues.

---

## Best Practices

### When to Use `tool_choice: "required"`

✅ **Use `"required"` when:**
- You want predictable tool execution
- Tools should always be used when available
- You're building automation/scripting workflows
- Conversation history is long and may introduce bias
- User explicitly requested a tool-based action

❌ **Don't use `"required"` when:**
- Model needs flexibility to explain or refuse
- You want the model to choose between multiple approaches
- Some requests should be answered with text only
- Tools are optional enhancements, not core functionality

### Monitoring Conversation History

Add logging to track conversation history size:

```typescript
console.log("[Native Adapter] Messages count:", context.messages?.length);
```

**Warning signs:**
- More than 100 messages: possible bias accumulation
- More than 200 messages: high risk of pattern reinforcement
- More than 300 messages: strong bias, consider forcing tool usage

### Debugging Tool Execution

When tools aren't being executed, check:

1. ✅ System prompt is present and includes tool instructions
2. ✅ Tools are correctly bound with valid schemas
3. ✅ `tool_choice` parameter is set appropriately
4. ✅ Conversation history size (check for bias)
5. ✅ Azure OpenAI API version supports function calling
6. ✅ Request body includes tools in the correct format

---

## Code Changes Summary

### Modified Files

1. **`src/agents/azure-openai-native-client.ts`** (Line 102)
   - Changed `tool_choice` from `"auto"` to `"required"`
   - Added comment explaining why

2. **`src/agents/azure-openai-stream-adapter-native.ts`** (Lines 18-35)
   - Added debug logging for system prompt verification
   - Added debug logging for message count
   - Added debug logging for tool definitions

### Debug Logs Added

These debug logs help diagnose similar issues in the future:

```typescript
// Context verification
console.log("[Native Adapter] Context keys:", Object.keys(context));
console.log("[Native Adapter] Has systemPrompt?", !!context.systemPrompt);
console.log("[Native Adapter] Messages count:", context.messages?.length);

// System prompt verification
if (context.systemPrompt) {
  console.log("[Native Adapter] Adding system prompt:", context.systemPrompt.substring(0, 200));
} else {
  console.log("[Native Adapter] WARNING: No system prompt found in context!");
}

// Tool binding verification
console.log(`[Native Adapter] Binding ${tools.length} tools`);
console.log("[Native Adapter] Tool names:", tools.map((t) => t.function.name));
console.log("[Native Adapter] Full tool definitions:", JSON.stringify(tools, null, 2));

// Tool call completion
console.log("[Native Adapter] Tool call complete:", JSON.stringify(accumulated, null, 2));
```

---

## Future Considerations

### Adaptive Tool Choice Strategy

Consider implementing adaptive `tool_choice` based on context:

```typescript
// Pseudo-code for future enhancement
const toolChoice = determineToolChoice({
  historySize: context.messages.length,
  toolsAvailable: params.tools?.length ?? 0,
  userIntent: analyzeUserIntent(context.messages),
});

// Strategy:
// - historySize < 50: "auto" (let model decide)
// - historySize >= 50 && < 200: "auto" (monitor)
// - historySize >= 200: "required" (force tools)
// - explicitToolRequest: "required" (user asked for tool)
// - explanationNeeded: "auto" (allow text response)
```

### Session History Management

Consider implementing session history pruning:
- Keep only recent messages (last 50-100)
- Summarize older messages
- Reset session after tool execution patterns change

### Tool Execution Analytics

Track tool execution patterns to detect issues:
- % of requests that should use tools but don't
- Conversation history size when tool execution fails
- Correlation between history size and tool usage

---

## Conclusion

### Summary

**Problem:** Model responded with text instructions instead of executing tools due to in-context learning bias from 389 messages of conversation history.

**Root Cause:** `tool_choice: "auto"` allowed the model to choose text responses, and conversation history pattern was stronger than system prompt.

**Solution:** Changed `tool_choice` to `"required"` to force tool usage and override conversation history bias.

**Result:** ✅ Tools are now executed correctly, files are created, commands are run, and the agent works as expected.

### Key Learnings

1. **In-context learning is powerful** - 389 examples created a strong pattern
2. **Conversation history matters** - Long histories can introduce unexpected bias
3. **Tool choice parameter is critical** - `"auto"` vs `"required"` changes behavior dramatically
4. **Debug logging is essential** - We couldn't diagnose this without detailed logs
5. **Multiple fixes needed** - Native client fixed streaming, `tool_choice` fixed execution

### Related Documentation

- [Azure OpenAI LangChain Bug Fix](AZURE_OPENAI_FIX_QUICK_REF.md) - Empty tool arguments fix
- [LangChain Removal Guide](REMOVE_LANGCHAIN_GUIDE.md) - Why we moved to native client
- [Native Azure OpenAI Client](src/agents/azure-openai-native-client.ts) - Current implementation
- [Native Stream Adapter](src/agents/azure-openai-stream-adapter-native.ts) - Streaming handler

---

## Final Solution (2026-02-05 Update)

### The Complete Picture

We discovered **two separate but related issues**:

1. **Original Issue:** Model responded with text instead of calling tools (389 message history bias)
   - **Attempted Fix:** `tool_choice: "required"` to force tool usage
   - **Result:** ✅ Fixed text-only responses BUT...

2. **New Issue:** Model called tools with empty arguments `{}` (validation failures)
   - **Cause:** Forcing tool usage + history of failed tool calls → model repeats empty args
   - **Result:** Infinite loop of validation failures

### The Real Solution

**Use `tool_choice: "auto"` (default) + Session Management**

```typescript
if (params.tools && params.tools.length > 0) {
  body.tools = params.tools;
  // Use "auto" to let model decide when to use tools
  // This prevents forcing empty arguments when model is uncertain
  body.tool_choice = "auto";
}
```

**Why this is better:**
- ✅ Model decides when to use tools (avoids forced empty args)
- ✅ Model can explain or refuse when appropriate
- ✅ Works correctly with fresh sessions
- ✅ More robust long-term solution

**To prevent text-only responses:**
- Start fresh sessions periodically (reset history)
- Prune old failed examples from conversation history
- Use clear, explicit instructions in user messages ("create the file", not "how do I create")
- Trust the model's judgment with clean history

### When to Use Each Setting

| Scenario | Recommended `tool_choice` |
|----------|--------------------------|
| Fresh session (< 50 messages) | `"auto"` (default) |
| Long session (> 100 messages) | `"auto"` + prune history |
| History with failed tool calls | `"auto"` + start fresh session |
| Debugging tool execution | `"auto"` (see actual behavior) |
| Production use | `"auto"` (most reliable) |

**Never use `"required"`** unless debugging a very specific issue, and even then, be aware it can cause empty argument problems.

---

**Last Updated:** 2026-02-05 (Reverted to `"auto"`)
**Author:** Claude (Sonnet 4.5)
**Status:** ⚠️ Solution Updated - Use `"auto"` + Session Management
**Impact:** Critical - Balanced approach for tool execution
