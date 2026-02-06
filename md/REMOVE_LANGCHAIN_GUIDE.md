# LangChain Removal Guide

**Status:** Optional - LangChain is no longer used at runtime
**Created:** 2026-02-06
**Safe to Remove:** ✅ Yes (with caveats)

---

## Table of Contents

1. [Why LangChain Can Be Removed](#why-langchain-can-be-removed)
2. [Current State](#current-state)
3. [Pre-Removal Checklist](#pre-removal-checklist)
4. [Removal Steps](#removal-steps)
5. [Verification](#verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Considerations](#considerations)

---

## Why LangChain Can Be Removed

### Background

**Before Fix:**
- Azure OpenAI used LangChain's `@langchain/openai` package
- LangChain had a bug: streaming tool call arguments weren't accumulated
- Result: All tool executions failed (empty arguments)

**After Fix:**
- Implemented native Azure OpenAI client (bypasses LangChain)
- Other providers use `streamSimple` from `@mariozechner/pi-ai` (not LangChain)
- **LangChain is no longer used at runtime**

### Files That Reference LangChain

Only 2 files still import LangChain:

1. **`src/agents/azure-openai-stream-adapter.ts`**
   - The OLD broken adapter
   - ❌ Not used at runtime
   - Kept for debugging/comparison

2. **`src/agents/azure-openai-runtime.ts`**
   - LangChain model instance
   - ❌ Not used at runtime
   - Kept for potential fallback

---

## Current State

### Runtime Flow (Azure OpenAI)

```
User Request
    ↓
Agent Command
    ↓
Pi Embedded Runner
    ↓
Check: Azure OpenAI + Managed Identity?
    ↓ YES
streamAzureOpenAINative (NO LangChain)
    ↓
azure-openai-native-client.ts (NO LangChain)
    ↓
Direct REST API call
    ↓
✅ Tools work!
```

### Runtime Flow (Other Providers)

```
User Request
    ↓
Agent Command
    ↓
Pi Embedded Runner
    ↓
streamSimple from @mariozechner/pi-ai (NO LangChain)
    ↓
✅ Tools work!
```

### Dependencies in package.json

```json
{
  "dependencies": {
    "@langchain/core": "^0.3.53",      // ← Can be removed
    "@langchain/openai": "^1.2.5"      // ← Can be removed
  }
}
```

---

## Pre-Removal Checklist

Before removing LangChain, verify:

### ✅ 1. Verify Native Adapter is Working

```bash
# Test Azure OpenAI tool execution
pnpm clawdbot agent --message "create ~/tmp/test-ggg.txt" --session-id test --local

# Should see:
# [Native Client] Using AzureCliCredential
# [Native Adapter] Binding 4 tools
# ✅ Done. Created ~/tmp/test.txt

# Verify file exists
ls -la ~/tmp/test.txt
```

**Expected:** File created successfully ✅

### ✅ 2. Check No Other Files Import LangChain

```bash
# Search for LangChain imports
grep -r "from.*@langchain\|import.*@langchain" src/ --include="*.ts" --include="*.js"

# Should only show:
# src/agents/azure-openai-stream-adapter.ts
# src/agents/azure-openai-runtime.ts
```

**Expected:** Only the 2 known files ✅

### ✅ 3. Test Other Providers Still Work

```bash
# If you have other providers configured (Anthropic, OpenAI, etc.)
# Test that they still work (they use streamSimple, not LangChain)
pnpm clawdbot agent --message "test" --session-id test-other
```

**Expected:** Should work normally ✅

### ✅ 4. Backup Current State

```bash
# Create a git branch for the removal
git checkout -b remove-langchain

# Create backup of package.json
cp package.json package.json.backup

# Note current commit for rollback
git rev-parse HEAD > .langchain-removal-rollback
```

---

## Removal Steps

### Step 1: Remove LangChain Dependencies

```bash
# Remove from package.json
pnpm remove @langchain/core @langchain/openai

# This will update package.json and pnpm-lock.yaml
```

**Verify:**
```bash
# Check package.json - should not have @langchain entries
grep "@langchain" package.json
# Expected: No output
```

### Step 2: Remove Old LangChain Files (Optional)

**Option A: Delete Files (Recommended for clean codebase)**

```bash
# Remove the old adapters that used LangChain
rm src/agents/azure-openai-stream-adapter.ts
rm src/agents/azure-openai-runtime.ts

# Rebuild to verify no imports are broken
pnpm build
```

**Option B: Keep Files but Comment Out Imports (Safer)**

Edit `src/agents/azure-openai-stream-adapter.ts`:
```typescript
// DEPRECATED - Kept for reference only
// This adapter used LangChain which had a bug with tool arguments
// See: azure-openai-stream-adapter-native.ts for the working version

// import { AzureChatOpenAI } from "@langchain/openai";
// ... rest of imports

// export function streamAzureOpenAIManagedIdentity(...) {
//   throw new Error("This adapter is deprecated. Use streamAzureOpenAINative instead.");
// }
```

Edit `src/agents/azure-openai-runtime.ts`:
```typescript
// DEPRECATED - Kept for reference only
// This runtime used LangChain which had a bug with tool arguments

// import { AzureChatOpenAI } from "@langchain/openai";
// ... rest of imports

// export async function getAzureOpenAIModelInstance() {
//   throw new Error("This function is deprecated. Use AzureOpenAINativeClient instead.");
// }
```

### Step 3: Rebuild and Test

```bash
# Clean build
rm -rf dist/
pnpm build

# Should build successfully with no errors
```

**Expected Output:**
```
[copy-hook-metadata] Done
```

No TypeScript errors about missing `@langchain` imports.

### Step 4: Run Tests

```bash
# Run unit tests
pnpm test

# Run live tests (if configured)
CLAWDBOT_LIVE_TEST=1 pnpm test:live
```

**Expected:** All tests pass ✅

### Step 5: Test Tool Execution

```bash
# Test basic tool execution
pnpm clawdbot agent --message "create ~/tmp/langchain-removed.txt" --session-id test --local

# Test complex command
pnpm clawdbot agent --message "run: ls -la ~/tmp | wc -l" --session-id test --local

# Test other tools
pnpm clawdbot agent --message "read package.json" --session-id test --local
```

**Expected:** All tools work correctly ✅

---

## Verification

### After Removal, Verify:

#### 1. Package Size Reduced

```bash
# Check node_modules size before removal (with LangChain)
du -sh node_modules/

# After removal, should be slightly smaller
# (LangChain + its dependencies removed)
```

#### 2. No LangChain References in Build Output

```bash
# Search build output for LangChain
grep -r "@langchain" dist/

# Expected: No matches (or only in old commented files if kept)
```

#### 3. Production Build Works

```bash
# Create production build
NODE_ENV=production pnpm build

# Test with production build
NODE_ENV=production pnpm clawdbot agent --message "test" --session-id prod-test --local
```

#### 4. Gateway Still Works

```bash
# If using gateway mode
pnpm clawdbot gateway status

# Test via gateway (non-local)
pnpm clawdbot agent --message "create ~/tmp/gateway-test.txt" --session-id gateway-test
```

---

## Rollback Procedure

If something breaks after removal:

### Quick Rollback (Restore Dependencies)

```bash
# Restore package.json from backup
cp package.json.backup package.json

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

### Full Rollback (Git Revert)

```bash
# Get the commit hash before removal
ROLLBACK_COMMIT=$(cat .langchain-removal-rollback)

# Revert all changes
git checkout $ROLLBACK_COMMIT -- package.json pnpm-lock.yaml
git checkout $ROLLBACK_COMMIT -- src/agents/azure-openai-stream-adapter.ts
git checkout $ROLLBACK_COMMIT -- src/agents/azure-openai-runtime.ts

# Reinstall and rebuild
pnpm install
pnpm build
```

### Restore Old Adapter (Emergency)

If you need to temporarily use the old LangChain adapter:

```typescript
// In src/agents/pi-embedded-runner/run/attempt.ts

// Change:
import { streamAzureOpenAINative } from "../../azure-openai-stream-adapter-native.js";

// To:
import { streamAzureOpenAIManagedIdentity } from "../../azure-openai-stream-adapter.js";

// And:
return streamAzureOpenAINative(context, options);

// To:
return streamAzureOpenAIManagedIdentity(context, options);
```

**Note:** This will bring back the empty tool arguments bug!

---

## Considerations

### Reasons to Keep LangChain

1. **Debugging Reference**
   - Useful to compare native vs LangChain behavior
   - Can help troubleshoot issues

2. **Easy Rollback**
   - If native client has issues, quick to switch back
   - Low cost to keep as dependency

3. **Future Use**
   - Might want to use LangChain for other providers
   - Easier to have it already installed

4. **Documentation Value**
   - Shows the evolution of the codebase
   - Helps new developers understand why native was needed

### Reasons to Remove LangChain

1. **Cleaner Dependencies**
   - Reduces node_modules size
   - Fewer security audit issues
   - Faster installs

2. **No Runtime Use**
   - It's dead code
   - Confusing for new developers

3. **Avoid Version Conflicts**
   - LangChain updates frequently
   - Can cause breaking changes

4. **Explicit Architecture**
   - Makes it clear we're using native implementation
   - No ambiguity about which adapter is used

### Recommendation

**For Production:** Keep LangChain for now
- Low cost to keep
- Easy rollback if issues
- Useful for debugging

**For Development:** Remove if you want
- Cleaner codebase
- Explicit architecture
- Can always re-add later

**For New Projects:** Don't add LangChain
- Start with native client only
- No need for the dependency

---

## Alternative: Conditional Import

If you want to keep LangChain but make removal easier in the future:

### Move to Optional Dependency

```json
{
  "optionalDependencies": {
    "@langchain/core": "^0.3.53",
    "@langchain/openai": "^1.2.5"
  }
}
```

### Add Runtime Check

```typescript
// In azure-openai-stream-adapter.ts
let langchainAvailable = false;
try {
  require("@langchain/openai");
  langchainAvailable = true;
} catch {
  // LangChain not installed
}

export function streamAzureOpenAIManagedIdentity(...) {
  if (!langchainAvailable) {
    throw new Error("LangChain is not installed. Use streamAzureOpenAINative instead.");
  }
  // ... rest of implementation
}
```

This way:
- Users can remove LangChain without breaking builds
- Old code still exists but won't load if LangChain is removed
- Clear error message if someone tries to use it

---

## Summary Checklist

Before removing LangChain:

- [ ] ✅ Native Azure OpenAI adapter tested and working
- [ ] ✅ Other providers still work (use streamSimple)
- [ ] ✅ Verified only 2 files import LangChain
- [ ] ✅ Created git branch for removal
- [ ] ✅ Created package.json backup
- [ ] ✅ Saved rollback commit hash

After removing LangChain:

- [ ] ✅ Dependencies removed from package.json
- [ ] ✅ Old files deleted or commented out
- [ ] ✅ Build succeeds with no errors
- [ ] ✅ Unit tests pass
- [ ] ✅ Tool execution works
- [ ] ✅ Gateway works (if used)
- [ ] ✅ Production build works

If everything passes: ✅ Safe to merge!

---

## Related Documentation

- [Azure OpenAI LangChain Bug Fix](AZURE_OPENAI_LANGCHAIN_BUG_FIX.md) - Why we moved away from LangChain
- [Azure OpenAI Fix Quick Ref](AZURE_OPENAI_FIX_QUICK_REF.md) - Quick reference for the fix
- [Native Azure OpenAI Client](src/agents/azure-openai-native-client.ts) - The replacement implementation

---

## Final Notes

**Decision Matrix:**

| Scenario | Recommendation |
|----------|----------------|
| Production deployment | Keep for now (low risk) |
| Active development | Keep for debugging |
| New installation | Skip LangChain entirely |
| Code cleanup sprint | Remove (with testing) |
| CI/CD optimization | Remove (faster installs) |
| Sensitive environment | Remove (fewer dependencies) |

**Bottom Line:**
- ✅ Safe to remove technically
- ⚠️ Keep for convenience/rollback
- 🎯 Your choice based on priorities

---

**Last Updated:** 2026-02-06
**Author:** Claude (Sonnet 4.5)
**Status:** Reference Guide - Optional Removal
