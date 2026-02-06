# Azure OpenAI Tool Choice Fix - Quick Reference

**Issue:** Model responds with text instructions instead of executing tools
**Cause:** In-context learning bias from conversation history
**Fix:** Force tool usage with `tool_choice: "required"`

---

## The Problem

```bash
$ pnpm clawdbot agent --message "create ~/tmp/test.txt" --session-id test --local

# Expected: Creates file
# Actual: Model says "I can't create files directly, but here's the command..."
```

**Why it happened:**
- 389 messages in conversation history where assistant said "I can't create files"
- `tool_choice: "auto"` let the model choose between text and tool calls
- Conversation history pattern was stronger than system prompt
- Model learned to respond with text, not use tools

---

## The Fix

**File:** `src/agents/azure-openai-native-client.ts` (Line 102)

```typescript
if (params.tools && params.tools.length > 0) {
  body.tools = params.tools;
  // Force tool usage to override conversation history bias
  body.tool_choice = "required";  // ← Changed from "auto"
}
```

**What this does:**
- Forces the model to call a tool when tools are available
- Overrides conversation history bias
- No more text-only responses when tools should be used

---

## Verification

**Test 1: Empty file**
```bash
$ pnpm clawdbot agent --message "create ~/tmp/test-ggg.txt" --session-id test --local
$ ls -la ~/tmp/test-ggg.txt
-rw-r--r--@ 1 ghu  staff  0 Feb  5 22:07 /Users/ghu/tmp/test-ggg.txt
✅ File created!
```

**Test 2: File with content**
```bash
$ pnpm clawdbot agent --message "write hello world to ~/tmp/test.txt" --session-id test --local
$ cat ~/tmp/test.txt
hello world
✅ Content written!
```

**Tool call log:**
```json
{
  "name": "write",
  "arguments": "{\"path\":\"/Users/ghu/tmp/test.txt\",\"content\":\"hello world\"}"
}
```

---

## Quick Diagnosis

If tools aren't being executed, check:

```bash
# 1. Check conversation history size
grep "Messages count:" <log> | tail -1
# If > 200 messages: high risk of bias

# 2. Check system prompt
grep "Has systemPrompt?" <log>
# Should be: true

# 3. Check tools bound
grep "Binding.*tools" <log>
# Should show: "Binding 4 tools"

# 4. Check tool_choice setting
grep "tool_choice" <log>
# Should be: "required" (not "auto")
```

---

## tool_choice Values

| Value | Behavior |
|-------|----------|
| `"auto"` | Model decides (text or tools) - can be biased by history |
| `"required"` | Model MUST call a tool - overrides history |
| `"none"` | Model cannot call tools - text only |

**Recommendation:** Use `"required"` when:
- Long conversation history (>100 messages)
- Tools should always be used when available
- Building automation workflows
- User explicitly requested a tool-based action

---

## Debug Logs

Added debug logging to diagnose similar issues:

```typescript
// Context verification
console.log("[Native Adapter] Context keys:", Object.keys(context));
console.log("[Native Adapter] Has systemPrompt?", !!context.systemPrompt);
console.log("[Native Adapter] Messages count:", context.messages?.length);

// System prompt
if (context.systemPrompt) {
  console.log("[Native Adapter] Adding system prompt:", context.systemPrompt.substring(0, 200));
}

// Tools
console.log(`[Native Adapter] Binding ${tools.length} tools`);
console.log("[Native Adapter] Tool names:", tools.map(t => t.function.name));

// Tool calls
console.log("[Native Adapter] Tool call complete:", JSON.stringify(accumulated, null, 2));
```

---

## Related Fixes

1. **LangChain Empty Arguments Bug** - Fixed by native client
   - See: `AZURE_OPENAI_FIX_QUICK_REF.md`

2. **LangChain Removal** - Optional, not required
   - See: `REMOVE_LANGCHAIN_GUIDE.md`

3. **This Fix** - Forces tool execution
   - See: `AZURE_OPENAI_TOOL_CHOICE_FIX.md` (detailed guide)

---

## One-Line Summary

Changed `tool_choice` from `"auto"` to `"required"` in `azure-openai-native-client.ts:102` to force tool usage and override conversation history bias.

---

**Date:** 2026-02-05
**Status:** ✅ Fixed
**Files Modified:** `src/agents/azure-openai-native-client.ts`
**Impact:** Critical - Restored tool execution
