# Node.js SQLite Setup Guide for Clawdbot

## Issue: "No such built-in module: node:sqlite"

When running Clawdbot memory commands, you may encounter this error:

```
(node:99517) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
Please use a userland alternative instead.
No such built-in module: node:sqlite
```

## Root Cause

Node.js 22+ includes a built-in SQLite module (`node:sqlite`), but it's marked as **experimental** and requires the `--experimental-sqlite` flag to be enabled.

Clawdbot's memory system uses this built-in module for vector indexing, but the Node.js runner script wasn't passing the required flag.

## Solution

Update the Node.js runner script to include the `--experimental-sqlite` flag.

### File to Modify

**Location**: `scripts/run-node.mjs`

### Change Required

Find the `runNode()` function (around line 88-102) and add the flag:

#### Before (Broken)
```javascript
const runNode = () => {
  const nodeProcess = spawn(process.execPath, ["dist/entry.js", ...args], {
    cwd,
    env,
    stdio: "inherit",
  });

  nodeProcess.on("exit", (exitCode, exitSignal) => {
    if (exitSignal) {
      process.exit(1);
      return;
    }
    process.exit(exitCode ?? 1);
  });
};
```

#### After (Fixed)
```javascript
const runNode = () => {
  const nodeProcess = spawn(process.execPath, ["--experimental-sqlite", "dist/entry.js", ...args], {
    cwd,
    env,
    stdio: "inherit",
  });

  nodeProcess.on("exit", (exitCode, exitSignal) => {
    if (exitSignal) {
      process.exit(1);
      return;
    }
    process.exit(exitCode ?? 1);
  });
};
```

**Key change**: Added `"--experimental-sqlite"` as the first argument in the spawn call.

## Manual Fix Steps

1. **Open the file**:
   ```bash
   code scripts/run-node.mjs
   # or
   vim scripts/run-node.mjs
   ```

2. **Find line 89** (the spawn call inside `runNode()`)

3. **Add the flag**:
   ```javascript
   // Change this:
   ["dist/entry.js", ...args]

   // To this:
   ["--experimental-sqlite", "dist/entry.js", ...args]
   ```

4. **Save the file**

5. **Test the fix**:
   ```bash
   pnpm clawdbot memory status
   ```

## Verification

After applying the fix, verify everything works:

### Test 1: Memory Status
```bash
pnpm clawdbot memory status
```

**Expected output**:
```
Memory Search (main)
Provider: local (requested: local)
Model: hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf
Sources: memory
Indexed: X/X files · X chunks
Vector: ready
Vector dims: 768
FTS: ready
```

### Test 2: Memory Search
```bash
pnpm clawdbot memory search "test query"
```

**Expected**: Returns search results (or "no results" if memory is empty)

### Test 3: Basic CLI
```bash
pnpm clawdbot --version
```

**Expected**: Shows version without errors

## Why This Flag is Needed

### Node.js Built-in SQLite

Node.js 22.5.0+ introduced a built-in SQLite module to provide:
- ✅ Zero external dependencies
- ✅ Native performance
- ✅ Cross-platform compatibility
- ✅ Standardized API

### Experimental Status

The module is marked as "experimental" because:
- API may change in future Node.js versions
- Not yet considered stable/production-ready
- Requires explicit opt-in via flag

### Flag Behavior

The `--experimental-sqlite` flag:
- **Enables** the `node:sqlite` module
- **Shows** an experimental warning (expected)
- **Required** for any code using `require('node:sqlite')` or `import 'node:sqlite'`

## Alternative Solutions

If you don't want to use the experimental flag, you have two options:

### Option 1: Use Bun Instead of Node

Bun has built-in SQLite support without experimental flags:

```bash
# Run with Bun instead
bun run src/cli.ts memory status
```

**Pros**:
- No experimental flags needed
- Faster startup time
- Better TypeScript support

**Cons**:
- Requires Bun installation
- May have compatibility issues with some npm packages

### Option 2: Use External SQLite Package

Configure Clawdbot to use `better-sqlite3` instead:

1. Install the package:
   ```bash
   pnpm add better-sqlite3
   ```

2. Update the SQLite loader to prefer the external package

**Note**: This option requires code changes and is not recommended unless you have specific requirements.

## Common Issues

### Issue 1: Warning about experimental module

**Symptom**:
```
(node:123) ExperimentalWarning: SQLite is an experimental feature
```

**Solution**: This is **expected** and safe to ignore. It's just informing you that the module is experimental.

### Issue 2: Flag not being passed

**Symptom**: Still getting "No such built-in module" after fixing

**Possible causes**:
1. File not saved correctly
2. Running wrong command (not using pnpm clawdbot)
3. Syntax error in the script

**Solution**:
```bash
# Verify the file was updated
grep "experimental-sqlite" scripts/run-node.mjs

# Should output the line with the flag
```

### Issue 3: Node version too old

**Symptom**: Flag doesn't help, still errors

**Check Node version**:
```bash
node --version
```

**Requirement**: Node.js >= 22.5.0

**Solution**: Upgrade Node.js
```bash
# Via Homebrew (macOS)
brew upgrade node@22

# Via nvm
nvm install 22
nvm use 22

# Verify
node --version  # Should show v22.5.0 or higher
```

## Technical Details

### What is node:sqlite?

`node:sqlite` is Node.js's built-in SQLite binding that provides:
- `DatabaseSync`: Synchronous SQLite database access
- `StatementSync`: Prepared statements
- Transaction support
- Backup utilities

### How Clawdbot Uses It

Clawdbot's memory system uses `node:sqlite` for:

1. **Vector Index Storage**
   - Embeddings stored in SQLite with sqlite-vec extension
   - Fast vector similarity search
   - Location: `~/.clawdbot/memory/main.sqlite`

2. **Full-Text Search (FTS)**
   - BM25 keyword search via SQLite FTS5
   - Hybrid search combining vector + keyword

3. **Metadata Storage**
   - File hashes
   - Index metadata
   - Embedding cache

### Import Location

The module is loaded in `src/memory/sqlite.ts`:

```typescript
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function requireNodeSqlite(): typeof import("node:sqlite") {
  return require("node:sqlite") as typeof import("node:sqlite");
}
```

This uses CommonJS `require()` to load the built-in module.

## Environment Variables

You can also set the flag via environment variable (less common):

```bash
# Set in shell
export NODE_OPTIONS="--experimental-sqlite"

# Run commands
pnpm clawdbot memory status
```

**Note**: This approach is less reliable because npm/pnpm may not pass `NODE_OPTIONS` to child processes.

## Testing the Fix

### Manual Test Script

Create a test file to verify Node.js SQLite works:

```javascript
// test-sqlite.mjs
import { DatabaseSync } from 'node:sqlite';

try {
  const db = new DatabaseSync(':memory:');
  console.log('✅ node:sqlite is working!');
  db.close();
} catch (error) {
  console.error('❌ node:sqlite failed:', error.message);
  process.exit(1);
}
```

Run it:
```bash
# Without flag (fails)
node test-sqlite.mjs

# With flag (works)
node --experimental-sqlite test-sqlite.mjs
```

## CI/CD Considerations

If you're running Clawdbot in CI/CD, ensure:

1. **Node.js version**: >= 22.5.0
2. **Flag passed**: Update CI scripts to include `--experimental-sqlite`
3. **Environment**: Set `NODE_OPTIONS` if needed

### Example CI Configuration

**GitHub Actions**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'

- name: Run memory tests
  run: pnpm clawdbot memory status
  env:
    NODE_OPTIONS: '--experimental-sqlite'
```

**Docker**:
```dockerfile
FROM node:22-alpine

# Install dependencies
RUN npm install -g pnpm

# Set Node options
ENV NODE_OPTIONS="--experimental-sqlite"

# Run application
CMD ["pnpm", "clawdbot", "memory", "status"]
```

## Future Considerations

### When node:sqlite Becomes Stable

When Node.js removes the experimental flag (likely Node.js 23+):
- The flag will still work (backward compatible)
- The warning will disappear
- No code changes needed

### If You Prefer to Wait

If you don't want to use experimental features:
1. Use Bun (stable SQLite support)
2. Disable memory search:
   ```json
   {
     "agents": {
       "defaults": {
         "memorySearch": {
           "enabled": false
         }
       }
     }
   }
   ```

## Summary

### Problem
- Node.js requires `--experimental-sqlite` flag for built-in SQLite
- Clawdbot's runner script wasn't passing this flag
- Memory commands failed with "No such built-in module"

### Solution
- Added `--experimental-sqlite` to runner script
- One-line change in `scripts/run-node.mjs`
- All memory commands now work

### Verification
```bash
✅ pnpm clawdbot memory status  # Shows memory index
✅ pnpm clawdbot memory search "query"  # Searches memory
✅ pnpm clawdbot --version  # Basic CLI works
```

## Resources

- **Node.js SQLite Docs**: https://nodejs.org/api/sqlite.html
- **Experimental Features**: https://nodejs.org/api/cli.html#--experimental-modules
- **Clawdbot Memory**: [MEMORY_SETUP_LOCAL_EMBEDDINGS.md](./MEMORY_SETUP_LOCAL_EMBEDDINGS.md)
- **Memory System**: [MEMORY_README.md](./MEMORY_README.md)

## Changelog

- **2026-01-31**: Initial guide
  - Documented node:sqlite experimental flag requirement
  - Provided fix for run-node.mjs script
  - Added verification steps and troubleshooting
