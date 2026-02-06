# Cron Heartbeat Fix: Bypassing Empty HEARTBEAT.md Check

**Status:** ✅ Fixed
**Date:** 2026-02-06
**Issue:** Cron jobs failing with "empty-heartbeat-file" error
**Root Cause:** Heartbeat runner skipped cron events when HEARTBEAT.md was empty
**Solution:** Bypass empty file check for cron events (like exec events)

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

When running cron jobs with system events:

```bash
pnpm clawdbot cron add \
  --name "Send reminder" \
  --at "2026-02-11T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

**Expected Behavior:** Cron job should execute and deliver the system event to the agent.

**Actual Behavior:** Cron job ran but was immediately skipped with error:
```json
{
  "status": "skipped",
  "error": "empty-heartbeat-file"
}
```

The run history showed **50+ failed attempts** in <100ms, all with the same error:
```json
{
  "action": "finished",
  "status": "skipped",
  "error": "empty-heartbeat-file",
  "durationMs": 0
}
```

### Impact

- Cron jobs created successfully but never executed
- System events never delivered to agents
- No error visible to user (silently failed)
- Cron scheduler working correctly, but heartbeat system blocking execution

---

## Symptoms

### Diagnostic Output

```bash
$ pnpm clawdbot cron run <job-id>
{
  "ok": true,
  "ran": true
}

$ pnpm clawdbot cron runs --id <job-id>
{
  "entries": [
    {
      "status": "skipped",
      "error": "empty-heartbeat-file",
      "durationMs": 0
    }
  ]
}
```

### Gateway Status

```bash
$ pnpm clawdbot gateway status
Listening: 127.0.0.1:18789
RPC probe: ok
```

Gateway was running correctly, but cron jobs still failed.

### Cron Status

```bash
$ pnpm clawdbot cron status
{
  "enabled": true,
  "jobs": 2,
  "nextWakeAtMs": 1770349440000
}
```

Cron system was enabled and functioning.

---

## Investigation Process

### Step 1: Search for Error Origin

**Hypothesis:** Find where "empty-heartbeat-file" error is generated.

**Test:**
```bash
grep -r "empty-heartbeat-file" src/
```

**Result:** Found in `src/infra/heartbeat-runner.ts`

### Step 2: Read Heartbeat Runner Code

**File:** [src/infra/heartbeat-runner.ts:463-482](src/infra/heartbeat-runner.ts#L463-L482)

**Code:**
```typescript
// Skip heartbeat if HEARTBEAT.md exists but has no actionable content.
// This saves API calls/costs when the file is effectively empty (only comments/headers).
// EXCEPTION: Don't skip for exec events - they have pending system events to process.
const isExecEventReason = opts.reason === "exec-event";
const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
const heartbeatFilePath = path.join(workspaceDir, DEFAULT_HEARTBEAT_FILENAME);
try {
  const heartbeatFileContent = await fs.readFile(heartbeatFilePath, "utf-8");
  if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason) {
    emitHeartbeatEvent({
      status: "skipped",
      reason: "empty-heartbeat-file",
      durationMs: Date.now() - startedAt,
    });
    return { status: "skipped", reason: "empty-heartbeat-file" };
  }
} catch {
  // File doesn't exist or can't be read - proceed with heartbeat.
}
```

**Key Finding:**
- There's an exception for `"exec-event"` reason
- But NO exception for cron events!

### Step 3: Find Cron Reason Format

**Hypothesis:** Cron must pass a reason when triggering heartbeats.

**Test:**
```bash
grep -r "requestHeartbeatNow\|runHeartbeatOnce" src/cron/
```

**Result:** Found in `src/cron/service/timer.ts:154`

**Code:**
```typescript
if (job.wakeMode === "now" && state.deps.runHeartbeatOnce) {
  const reason = `cron:${job.id}`;  // ← Cron passes reason!
  ...
}
```

### Step 4: Confirm the Gap

**Discovery:**
- ✅ Heartbeat runner has exception for `"exec-event"`
- ❌ No exception for cron events (reason starts with `"cron:"`)
- ✅ Gateway running correctly
- ✅ Cron system working correctly
- ❌ Heartbeat system blocking cron execution

---

## Root Cause Analysis

### The Problem: HEARTBEAT.md Empty File Check

The heartbeat runner has an optimization to skip API calls when `HEARTBEAT.md` exists but contains no actionable content (only comments/headers).

**Purpose:** Save API costs by not sending heartbeats when there's nothing to do.

**Implementation:**
```typescript
if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason) {
  return { status: "skipped", reason: "empty-heartbeat-file" };
}
```

### Why This Breaks Cron

**Cron System Event Flow:**

1. **Cron timer fires** → Job is due
2. **Enqueue system event** → Add event to queue (e.g., "Reminder: submit expense report")
3. **Request heartbeat** → Wake agent with reason `"cron:JOB_ID"`
4. **Heartbeat checks HEARTBEAT.md** → File is empty or has only comments
5. **Heartbeat skips** → Returns "empty-heartbeat-file" error
6. **System event never processed** → Agent never sees the cron message!

### Why exec-event Had an Exception

Exec events (background command completions) already had this exception because:
- Exec completion creates system events with command output
- These MUST be delivered even if HEARTBEAT.md is empty
- Exception added: `if (!isExecEventReason)`

### Why Cron Needs the Same Exception

Cron system events are exactly like exec events:
- Create system events (reminders, scheduled messages)
- MUST be delivered regardless of HEARTBEAT.md content
- Should bypass the empty file check

**The Gap:** Cron events weren't included in the exception list!

---

## Solution

### The Fix: Add Cron Exception

**File:** `src/infra/heartbeat-runner.ts`

**Location:** Lines 463-482

**Before:**
```typescript
// Skip heartbeat if HEARTBEAT.md exists but has no actionable content.
// This saves API calls/costs when the file is effectively empty (only comments/headers).
// EXCEPTION: Don't skip for exec events - they have pending system events to process.
const isExecEventReason = opts.reason === "exec-event";
const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
const heartbeatFilePath = path.join(workspaceDir, DEFAULT_HEARTBEAT_FILENAME);
try {
  const heartbeatFileContent = await fs.readFile(heartbeatFilePath, "utf-8");
  if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason) {
    emitHeartbeatEvent({
      status: "skipped",
      reason: "empty-heartbeat-file",
      durationMs: Date.now() - startedAt,
    });
    return { status: "skipped", reason: "empty-heartbeat-file" };
  }
} catch {
  // File doesn't exist or can't be read - proceed with heartbeat.
}
```

**After:**
```typescript
// Skip heartbeat if HEARTBEAT.md exists but has no actionable content.
// This saves API calls/costs when the file is effectively empty (only comments/headers).
// EXCEPTION: Don't skip for exec events or cron jobs - they have pending system events to process.
const isExecEventReason = opts.reason === "exec-event";
const isCronReason = typeof opts.reason === "string" && opts.reason.startsWith("cron:");
const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
const heartbeatFilePath = path.join(workspaceDir, DEFAULT_HEARTBEAT_FILENAME);
try {
  const heartbeatFileContent = await fs.readFile(heartbeatFilePath, "utf-8");
  if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason && !isCronReason) {
    emitHeartbeatEvent({
      status: "skipped",
      reason: "empty-heartbeat-file",
      durationMs: Date.now() - startedAt,
    });
    return { status: "skipped", reason: "empty-heartbeat-file" };
  }
} catch {
  // File doesn't exist or can't be read - proceed with heartbeat.
}
```

**Changes:**
1. Added line 467: `const isCronReason = typeof opts.reason === "string" && opts.reason.startsWith("cron:");`
2. Updated comment line 465: Added "or cron jobs"
3. Updated condition line 472: Added `&& !isCronReason`

### Why This Works

**Reason Format:**
- Exec events: `"exec-event"` (exact string)
- Cron events: `"cron:JOB_ID"` (prefix pattern)
- Interval heartbeats: `"interval"` (not bypassed - should check file)

**Check Logic:**
```typescript
// Only skip if:
// 1. File content is effectively empty
// AND 2. Reason is NOT exec-event
// AND 3. Reason does NOT start with "cron:"
if (isEmpty && !isExecEvent && !isCron) {
  skip();
}
```

**Result:**
- ✅ Cron events bypass empty check → execute normally
- ✅ Exec events bypass empty check → execute normally (unchanged)
- ✅ Regular heartbeats respect empty check → save API costs (unchanged)

---

## Verification

### Test 1: Create and Run Cron Job

```bash
$ pnpm clawdbot cron add \
  --name "Test heartbeat fix" \
  --at "2026-02-06T03:49:00Z" \
  --session main \
  --system-event "Test: Cron heartbeat fix working!" \
  --wake now \
  --delete-after-run

{
  "id": "448448aa-d962-4ca5-b8c1-be4a76dd085e",
  "name": "Test heartbeat fix",
  "enabled": true,
  "deleteAfterRun": true
}
```

### Test 2: Check Run History

```bash
$ pnpm clawdbot cron runs --id 448448aa-d962-4ca5-b8c1-be4a76dd085e

{
  "entries": [
    {
      "ts": 1770349855570,
      "jobId": "448448aa-d962-4ca5-b8c1-be4a76dd085e",
      "action": "finished",
      "status": "ok",               ← ✅ Not "skipped"!
      "summary": "Test: Cron heartbeat fix working!",
      "runAtMs": 1770349851265,
      "durationMs": 4305            ← ✅ Actually executed (4.3 seconds)
    }
  ]
}
```

**No `error` field!** Status is `"ok"` instead of `"skipped"`!

### Test 3: Real-World Cron Job

```bash
$ pnpm clawdbot cron add \
  --name "Send reminder" \
  --at "2026-02-11T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run

$ pnpm clawdbot cron list
ID                                   Name           Schedule              Next    Status
3d24355d-a58d-4df3-88ca-49c8b032a06a Send reminder  at 2026-02-11 18:00Z  in 6d   idle
```

**Result:** ✅ Job scheduled and will execute when due!

---

## Technical Details

### Heartbeat Reason Types

| Reason | Format | Source | Skip Empty Check? |
|--------|--------|--------|-------------------|
| `"interval"` | Exact string | Regular heartbeat timer | ❌ No - check file |
| `"exec-event"` | Exact string | Background command completion | ✅ Yes - has system events |
| `"cron:JOB_ID"` | Prefix pattern | Cron job execution | ✅ Yes (after fix) |
| `"cron:job-123:post"` | Prefix pattern | Cron post-execution wake | ✅ Yes (after fix) |

### Cron Wake Flow

```
┌─────────────────┐
│  Cron Timer     │
│  Job is due     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Enqueue System  │
│ Event to Queue  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Request         │
│ Heartbeat Now   │
│ reason="cron:ID"│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Heartbeat       │◄─── BEFORE FIX: Skipped here!
│ Runner          │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Check           │
│ HEARTBEAT.md    │◄─── Empty file check
└────────┬────────┘
         │
         ├─ Empty + Not Exec ──► SKIP (Before)
         │
         ├─ Empty + Is Cron ───► PROCEED (After Fix)
         │
         ↓
┌─────────────────┐
│ Process System  │
│ Events          │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Deliver to      │
│ Agent Session   │
└─────────────────┘
```

### Code Locations

1. **Cron Service Timer** - [src/cron/service/timer.ts:154](src/cron/service/timer.ts#L154)
   ```typescript
   const reason = `cron:${job.id}`;
   await state.deps.runHeartbeatOnce({ reason });
   ```

2. **Heartbeat Runner Fix** - [src/infra/heartbeat-runner.ts:467](src/infra/heartbeat-runner.ts#L467)
   ```typescript
   const isCronReason = typeof opts.reason === "string" && opts.reason.startsWith("cron:");
   ```

3. **Empty Check** - [src/infra/heartbeat-runner.ts:472](src/infra/heartbeat-runner.ts#L472)
   ```typescript
   if (isHeartbeatContentEffectivelyEmpty(heartbeatFileContent) && !isExecEventReason && !isCronReason) {
   ```

### Why Use `startsWith("cron:")` Instead of Exact Match?

Cron can pass different reason formats:
- `"cron:JOB_ID"` - Initial execution
- `"cron:JOB_ID:post"` - Post-execution wake

Using `startsWith("cron:")` catches all cron-related reasons with a single check.

### HEARTBEAT.md Purpose

The `HEARTBEAT.md` file in agent workspaces serves as a **persistent todo list** for the agent:

- **Location:** `~/.clawdbot/agents/<agent-id>/HEARTBEAT.md`
- **Purpose:** Agent can write tasks/reminders to itself
- **Check:** If empty (only comments/headers), skip regular heartbeats to save API costs
- **Exception:** System events (exec, cron) must be delivered regardless

**Example HEARTBEAT.md:**
```markdown
# Agent Tasks

## Pending
- Follow up on bug report #123
- Check server status at 3pm

## Completed
- ~~Sent meeting reminder~~
```

If file has no tasks (empty or only headers), regular heartbeats are skipped. But cron events still process!

---

## Related Issues

### 1. Exec Event Exception (Existing)

**Similar Issue:** Background command completions were being skipped.

**Solution:** Added `isExecEventReason` exception (already in code).

**Code:**
```typescript
const isExecEventReason = opts.reason === "exec-event";
if (isEmpty && !isExecEventReason) { skip(); }
```

### 2. This Fix (New)

**Issue:** Cron jobs were being skipped.

**Solution:** Added `isCronReason` exception (this PR).

**Code:**
```typescript
const isCronReason = typeof opts.reason === "string" && opts.reason.startsWith("cron:");
if (isEmpty && !isExecEventReason && !isCronReason) { skip(); }
```

### 3. Heartbeat Optimization (Context)

**Background:** Empty file check was added to save API costs.

**Trade-off:**
- ✅ Saves money by not calling API when nothing to do
- ⚠️ Must have exceptions for system events (exec, cron)

**Pattern:** Any reason with pending system events should bypass empty check.

---

## Best Practices

### When Adding New Event Types

If you add a new event type that enqueues system events, remember to:

1. **Check if it needs empty file bypass**
   - Does it create system events?
   - Must these events be delivered regardless of HEARTBEAT.md content?

2. **Add exception to heartbeat runner**
   ```typescript
   const isNewEventReason = opts.reason === "new-event-type";
   if (isEmpty && !isExecEvent && !isCron && !isNewEvent) { skip(); }
   ```

3. **Document the reason format**
   - Exact string match? Use `opts.reason === "exact"`
   - Prefix pattern? Use `opts.reason.startsWith("prefix:")`

4. **Test the bypass**
   - Ensure events are delivered even when HEARTBEAT.md is empty
   - Verify regular heartbeats still respect empty check

### When to Bypass Empty Check

✅ **Bypass when:**
- Event creates system events (exec results, cron messages)
- Event must be delivered regardless of file content
- Event is user-triggered (not automatic interval)

❌ **Don't bypass when:**
- Regular scheduled heartbeat
- No pending system events
- Optimization would save significant API costs

---

## Comparison: Before vs After

### Before Fix

| Scenario | HEARTBEAT.md | Cron Event | Result |
|----------|--------------|------------|--------|
| Regular heartbeat | Empty | N/A | ✅ Skipped (saves API) |
| Regular heartbeat | Has tasks | N/A | ✅ Executes |
| Exec completion | Empty | N/A | ✅ Executes (bypasses check) |
| Exec completion | Has tasks | N/A | ✅ Executes |
| **Cron job** | **Empty** | **Yes** | **❌ SKIPPED (BUG!)** |
| **Cron job** | **Has tasks** | **Yes** | **✅ Executes** |

### After Fix

| Scenario | HEARTBEAT.md | Cron Event | Result |
|----------|--------------|------------|--------|
| Regular heartbeat | Empty | N/A | ✅ Skipped (saves API) |
| Regular heartbeat | Has tasks | N/A | ✅ Executes |
| Exec completion | Empty | N/A | ✅ Executes (bypasses check) |
| Exec completion | Has tasks | N/A | ✅ Executes |
| **Cron job** | **Empty** | **Yes** | **✅ Executes (bypasses check)** |
| **Cron job** | **Has tasks** | **Yes** | **✅ Executes** |

---

## Summary

### The Fix in One Line

Added `isCronReason` check to bypass empty HEARTBEAT.md optimization for cron events, just like exec events.

### Files Changed

- [src/infra/heartbeat-runner.ts](src/infra/heartbeat-runner.ts#L467) (3 lines)
  - Line 465: Updated comment
  - Line 467: Added `const isCronReason = ...`
  - Line 472: Added `&& !isCronReason`

### Impact

- ✅ Cron jobs now execute correctly even when HEARTBEAT.md is empty
- ✅ System events delivered to agents as expected
- ✅ No breaking changes to existing functionality
- ✅ Regular heartbeats still optimized (skip when empty)

### Verification Steps

1. Create cron job with system event
2. Run the job (manually or wait for schedule)
3. Check run history shows `status: "ok"` (not "skipped")
4. Verify no `error: "empty-heartbeat-file"` field

---

**Last Updated:** 2026-02-06
**Author:** Claude (Sonnet 4.5)
**Status:** ✅ Fixed and Verified
**Impact:** Critical - Restored cron job execution functionality
