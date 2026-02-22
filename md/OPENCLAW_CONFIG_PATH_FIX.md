# Clawdbot Config Path & Workspace Fix

**Date:** Feb 21, 2026
**Issue:** Gateway was configured to read config via a fragile symlink instead of an explicit path
**Fix:** Set `CLAWDBOT_STATE_DIR` explicitly in `start-gateway.sh`

---

## Background

### Directory Roles

| Path | Role |
|------|------|
| `~/.openclaw/` | **Canonical state directory** — config, logs, credentials, devices, etc. |
| `~/.openclaw/clawdbot.json` | **Primary config file** |
| `~/.openclaw/openclaw.json` | Secondary config (OpenClaw plugin config) |
| `~/.clawdbot` | **Symlink** → `~/.openclaw` (legacy compatibility shim) |
| `~/.clawdbot-dev` | Dev-profile state directory (used with `--dev` flag) |

### How Config Path Resolution Works

The config path is resolved in [`src/config/paths.ts`](../src/config/paths.ts) with this priority chain:

1. `CLAWDBOT_CONFIG_PATH` env var (explicit file path override)
2. `$CLAWDBOT_STATE_DIR/clawdbot.json` (if `CLAWDBOT_STATE_DIR` is set)
3. `~/.clawdbot-{PROFILE}/clawdbot.json` (if `--profile` or `--dev` CLI flag is used)
4. `~/.clawdbot/clawdbot.json` (default)

```typescript
// src/config/paths.ts
export function resolveStateDir(env = process.env, homedir = os.homedir): string {
  const override = env.CLAWDBOT_STATE_DIR?.trim();
  if (override) return resolveUserPath(override);
  return path.join(homedir(), ".clawdbot");   // default
}
```

---

## The Problem: Symlink-Based Setup

Before the fix, `~/.clawdbot` was a symlink pointing to `~/.openclaw`:

```bash
$ ls -la ~ | grep .clawdbot
lrwxr-xr-x  .clawdbot -> /Users/ghu/.openclaw   # symlink
drwx------  .clawdbot-dev                         # real dev dir
```

This meant the default path `~/.clawdbot/clawdbot.json` resolved to `~/.openclaw/clawdbot.json` — which worked, but was fragile:
- Any tool that creates `~/.clawdbot` as a real directory breaks the symlink
- Intent is invisible — looks like a bug, not a feature
- Running with `--dev` used `~/.clawdbot-dev/clawdbot.json` instead, which had its own stale config

---

## The Fix: Explicit `CLAWDBOT_STATE_DIR`

**File changed:** [`start-gateway.sh`](../start-gateway.sh)

```diff
 set -e
+export CLAWDBOT_STATE_DIR="$HOME/.openclaw"
 export MCP_SERVER_URL=http://localhost:3333/sse

-LOG_DIR="${HOME}/.clawdbot/logs"
+LOG_DIR="${CLAWDBOT_STATE_DIR:-$HOME/.openclaw}/logs"
```

Now when `start-gateway.sh` runs:
- `CLAWDBOT_STATE_DIR` is explicitly set to `~/.openclaw`
- Config is read from `~/.openclaw/clawdbot.json` directly — no symlink needed
- Logs go to `~/.openclaw/logs/` (same as before, but explicit)

---

## Verification

Confirm the running gateway is reading the right file:

```bash
# Check which config file the gateway process has open
lsof -p $(cat ~/.openclaw/logs/gateway.pid) | grep clawdbot.json
# Expected: /Users/ghu/.openclaw/clawdbot.json
```

Check logs for config errors:
```bash
tail -f ~/.openclaw/logs/gateway.log | grep -i "config\|error"
```

---

## Symlink Status

The symlink `~/.clawdbot → ~/.openclaw` **still exists** as a fallback for:
- Direct `clawdbot` CLI commands run without `start-gateway.sh`
- Any other script that uses the default `~/.clawdbot` path

It can be safely removed if you set `CLAWDBOT_STATE_DIR=~/.openclaw` in your shell profile (`~/.zshrc`) or if all entry points are updated to use the explicit path.

```bash
# To make it global (optional):
echo 'export CLAWDBOT_STATE_DIR="$HOME/.openclaw"' >> ~/.zshrc

# Then the symlink can be removed safely:
# rm ~/.clawdbot
```

---

## Common Config Errors

### `commands: Unrecognized key: "ownerDisplay"`

This error appeared in `~/.clawdbot-dev/clawdbot.json` — the dev-profile config. It means the dev config has a key (`commands.ownerDisplay`) that no longer exists in the Zod schema.

**Fix options:**
1. Remove the `ownerDisplay` key from `~/.clawdbot-dev/clawdbot.json`
2. Stop using `--dev` profile (the production config at `~/.openclaw/clawdbot.json` is clean)

### Gateway reads wrong config

If the gateway is using `~/.clawdbot-dev` instead of `~/.openclaw`, it was started with `--dev` or `CLAWDBOT_PROFILE=dev`. Restart using `start-gateway.sh`:

```bash
bash /Users/ghu/aiworker/clawdbot/start-gateway.sh
```

---

## Related Files

| File | Purpose |
|------|---------|
| [`src/config/paths.ts`](../src/config/paths.ts) | Config/state path resolution logic |
| [`src/config/io.ts`](../src/config/io.ts) | Config read/write with the resolved path |
| [`src/cli/profile.ts`](../src/cli/profile.ts) | `--profile` / `--dev` flag handling |
| [`start-gateway.sh`](../start-gateway.sh) | Gateway startup script (sets `CLAWDBOT_STATE_DIR`) |
| `~/.openclaw/clawdbot.json` | Primary config file |
