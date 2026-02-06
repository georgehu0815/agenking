# Cron Heartbeat Fix - Quick Reference

**Issue:** Cron jobs failing with "empty-heartbeat-file" error
**Cause:** Heartbeat runner skipped cron when HEARTBEAT.md was empty
**Fix:** Bypass empty file check for cron events (like exec events)

---

## The Problem

```bash
$ pnpm clawdbot cron runs --id <job-id>
{
  "status": "skipped",
  "error": "empty-heartbeat-file",  ← Cron jobs silently failing!
  "durationMs": 0
}
```

**Why:** Heartbeat runner checks if HEARTBEAT.md has content. If empty, it skips to save API costs. But cron system events need to be delivered regardless!

---

## The Fix

**File:** `src/infra/heartbeat-runner.ts:467`

**Added:**
```typescript
const isCronReason = typeof opts.reason === "string" && opts.reason.startsWith("cron:");
```

**Updated check:**
```typescript
// Before:
if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason) {
  return { status: "skipped", reason: "empty-heartbeat-file" };
}

// After:
if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason && !isCronReason) {
  return { status: "skipped", reason: "empty-heartbeat-file" };
}
```

---

## Verification

```bash
# Create test cron job
$ pnpm clawdbot cron add \
  --name "Test fix" \
  --at "2026-02-06T03:49:00Z" \
  --session main \
  --system-event "Test message" \
  --wake now \
  --delete-after-run

# Check run history
$ pnpm clawdbot cron runs --id <job-id>
{
  "status": "ok",          ← ✅ Not "skipped"!
  "durationMs": 4305       ← ✅ Actually executed!
}
```

---

## Why This Works

### Cron Reason Format

Cron passes reason: `"cron:JOB_ID"` or `"cron:JOB_ID:post"`

### Check Logic

```typescript
// Skip heartbeat ONLY if:
// 1. File is empty
// AND 2. NOT exec event
// AND 3. NOT cron event

if (isEmpty && !isExec && !isCron) {
  skip();
}
```

### Reason Types

| Reason | Skip Empty Check? | Why |
|--------|-------------------|-----|
| `"interval"` | ❌ No | Regular heartbeat - save API |
| `"exec-event"` | ✅ Yes | Has system events to process |
| `"cron:..."` | ✅ Yes (after fix) | Has system events to process |

---

## Quick Diagnosis

If cron jobs aren't working:

```bash
# 1. Check run history
pnpm clawdbot cron runs --id <job-id>

# Look for:
# - status: "skipped" (BAD)
# - error: "empty-heartbeat-file" (THIS BUG)

# 2. Check heartbeat reason format
grep "cron:.*reason" ~/.clawdbot/gateway.log

# Should see: reason="cron:JOB_ID"

# 3. Verify fix is applied
grep "isCronReason" dist/infra/heartbeat-runner.js

# Should show: const isCronReason = typeof...
```

---

## Code Locations

1. **Cron sends reason** - `src/cron/service/timer.ts:154`
   ```typescript
   const reason = `cron:${job.id}`;
   ```

2. **Heartbeat checks reason** - `src/infra/heartbeat-runner.ts:467`
   ```typescript
   const isCronReason = typeof opts.reason === "string" && opts.reason.startsWith("cron:");
   ```

3. **Empty file check** - `src/infra/heartbeat-runner.ts:472`
   ```typescript
   if (isEmpty && !isExecEventReason && !isCronReason) { skip(); }
   ```

---

## Before vs After

| Scenario | Before | After |
|----------|--------|-------|
| Cron + Empty HEARTBEAT.md | ❌ Skipped | ✅ Executes |
| Cron + Has content | ✅ Executes | ✅ Executes |
| Regular heartbeat + Empty | ✅ Skipped (saves API) | ✅ Skipped (unchanged) |
| Exec event + Empty | ✅ Executes (bypass) | ✅ Executes (unchanged) |

---

## Related Fixes

- **Exec Event Exception** - Already had bypass for `"exec-event"` reason
- **This Fix** - Added bypass for `"cron:*"` reason pattern
- **Pattern** - Any reason with system events should bypass empty check

---

## One-Line Summary

Added `isCronReason` check in `heartbeat-runner.ts:467` to bypass empty HEARTBEAT.md optimization for cron events (like exec events).

---

**Date:** 2026-02-06
**Status:** ✅ Fixed
**Files Modified:** `src/infra/heartbeat-runner.ts` (3 lines)
**Impact:** Critical - Cron jobs now work correctly
