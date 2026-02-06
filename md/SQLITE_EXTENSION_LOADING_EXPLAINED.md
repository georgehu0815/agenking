# SQLite Extension Loading in Clawdbot - Complete Explanation

## TL;DR

✅ **Your system is already properly configured!**

```bash
pnpm clawdbot memory status | grep Vector
# Output: Vector: ready
```

This means `allowExtension: true` is working and the sqlite-vec extension is loaded.

---

## How Extension Loading Works

### 1. Node.js Built-in SQLite

Node.js 22+ includes an experimental built-in SQLite module (`node:sqlite`). To enable extension loading:

**Option A: Constructor (Clawdbot's approach)**
```typescript
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('/path/to/db.sqlite', {
  allowExtension: true  // Enables loadExtension() method
});

// Now you can load extensions
db.loadExtension('/path/to/extension.dylib');
```

**Option B: Method call (alternative)**
```typescript
const db = new DatabaseSync('/path/to/db.sqlite');

// This method doesn't exist in Node.js built-in sqlite!
// It only exists in better-sqlite3
db.enableLoadExtension(true);  // ❌ Not available in node:sqlite
```

### 2. Clawdbot Implementation

Clawdbot uses **Option A** (constructor approach):

**File: [src/memory/manager.ts:675](src/memory/manager.ts#L675)**
```typescript
return new DatabaseSync(dbPath, {
  allowExtension: this.settings.store.vector.enabled
});
```

**File: [src/memory/sqlite-vec.ts:14-24](src/memory/sqlite-vec.ts#L14-L24)**
```typescript
// Check for better-sqlite3 compatibility
if (typeof (params.db as any).enableLoadExtension === "function") {
  (params.db as any).enableLoadExtension(true);
}

// Check if loadExtension exists (Node.js with --experimental-sqlite)
if (typeof (params.db as any).loadExtension !== "function") {
  return {
    ok: false,
    error: "loadExtension method not available. Ensure Node.js is running with --experimental-sqlite flag.",
  };
}

// Load the extension
(params.db as any).loadExtension(extensionPath);
```

---

## Configuration Flow

### Default Configuration

**File: [src/agents/memory-search.ts:159](src/agents/memory-search.ts#L159)**
```typescript
enabled: overrides?.store?.vector?.enabled ?? defaults?.store?.vector?.enabled ?? true,
```

**Default value: `true`** ✅

This means vector search is **enabled by default** unless explicitly disabled.

### Configuration Hierarchy

```
1. User config overrides (~/.clawdbot/clawdbot.json)
2. Agent-specific defaults
3. System defaults (true)
```

### Your Current Configuration

**File: `~/.clawdbot/clawdbot.json`**
```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "fallback": "none"
      }
    }
  }
}
```

**What's missing:**
- No explicit `store.vector.enabled` setting

**What this means:**
- Falls back to system default: `true` ✅
- Vector extension loading is **enabled**

---

## How to Explicitly Enable/Disable

### Explicitly Enable (recommended for clarity)

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "fallback": "none",
        "store": {
          "vector": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

### Disable Vector Search (FTS only)

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "fallback": "none",
        "store": {
          "vector": {
            "enabled": false
          }
        }
      }
    }
  }
}
```

### Custom Extension Path

If you have a custom-built sqlite-vec extension:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "store": {
          "vector": {
            "enabled": true,
            "extensionPath": "/custom/path/to/vec0.dylib"
          }
        }
      }
    }
  }
}
```

---

## Verification Commands

### 1. Check Vector Status

```bash
pnpm clawdbot memory status
```

**Expected Output:**
```
Vector: ready
Vector dims: 768
Vector path: .../vec0.dylib
```

### 2. Check Extension Path

```bash
pnpm clawdbot memory status | grep "Vector path"
```

**Expected Output:**
```
Vector path: ~/aiworker/clawdbot/node_modules/.pnpm/sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec-darwin-arm64/vec0.dylib
```

### 3. Test Extension Loading Directly

```bash
node --experimental-sqlite <<'EOF'
const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync(':memory:', {allowExtension: true});
console.log('loadExtension method exists:', typeof db.loadExtension === 'function');

// Try loading sqlite-vec
const sqliteVec = require('sqlite-vec');
const extPath = sqliteVec.getLoadablePath();
console.log('Extension path:', extPath);

try {
  db.loadExtension(extPath);
  console.log('✅ Extension loaded successfully!');
} catch (err) {
  console.error('❌ Extension load failed:', err.message);
}
EOF
```

**Expected Output:**
```
loadExtension method exists: true
Extension path: /path/to/vec0.dylib
✅ Extension loaded successfully!
```

---

## Troubleshooting

### Issue: "loadExtension is not a function"

**Cause:** Node.js not running with `--experimental-sqlite` flag

**Solution:** The issue is already fixed! [scripts/run-node.mjs:89](scripts/run-node.mjs#L89) includes the flag:

```javascript
const nodeProcess = spawn(process.execPath, [
  "--experimental-sqlite",  // ✅ Already present
  "dist/entry.js",
  ...args
], {...});
```

### Issue: "Vector: unavailable"

**Possible causes:**

1. **Extension not found**
   ```bash
   ls -la node_modules/.pnpm/sqlite-vec*/node_modules/sqlite-vec-*/
   # Should show vec0.dylib (macOS), vec0.so (Linux), or vec0.dll (Windows)
   ```

2. **Platform not supported**
   ```bash
   node -e "console.log(process.platform, process.arch)"
   # Should be one of: darwin-arm64, darwin-x64, linux-arm64, linux-x64, win32-x64
   ```

3. **Permissions issue**
   ```bash
   # Check if extension is readable
   ls -l $(node -e "const sv = require('sqlite-vec'); console.log(sv.getLoadablePath())")
   ```

### Issue: "allowExtension not working"

**Debug steps:**

```bash
# 1. Check Node.js version (need 22.13.0+ for allowExtension option)
node --version

# 2. Check if experimental-sqlite is enabled
pnpm clawdbot memory status 2>&1 | grep -i experimental

# 3. Check configuration
cat ~/.clawdbot/clawdbot.json | grep -A 10 memorySearch
```

---

## Technical Details

### SQLite Extension Loading in Node.js

**From Node.js Type Definitions:**

```typescript
interface DatabaseSyncOptions {
  /**
   * If `true`, the `loadExtension` SQL function
   * and the `loadExtension()` method are enabled.
   * You can call `enableLoadExtension(false)` later to disable this feature.
   * @since v22.13.0
   * @default false
   */
  allowExtension?: boolean | undefined;
}
```

**Key points:**
- Available since Node.js v22.13.0
- Default is `false` (must opt-in)
- Enables both the method and SQL function
- Can be disabled later with `db.enableLoadExtension(false)`

### sqlite-vec Extension

**What it does:**
- Adds vector similarity search to SQLite
- Implements functions: `vec_distance()`, `vec_top_k()`, etc.
- Uses SIMD-optimized C implementation
- Supports cosine similarity, dot product, L2 distance

**Platform-specific binaries:**
- macOS ARM64: `vec0.dylib`
- macOS x64: `vec0.dylib`
- Linux ARM64: `vec0.so`
- Linux x64: `vec0.so`
- Windows x64: `vec0.dll`

**npm package structure:**
```
sqlite-vec@0.1.7-alpha.2/
├── index.mjs (main entry)
├── index.cjs (CommonJS entry)
└── ../
    ├── sqlite-vec-darwin-arm64/vec0.dylib
    ├── sqlite-vec-darwin-x64/vec0.dylib
    ├── sqlite-vec-linux-arm64/vec0.so
    ├── sqlite-vec-linux-x64/vec0.so
    └── sqlite-vec-windows-x64/vec0.dll
```

---

## Complete Example

### Full Configuration with All Options

```json
{
  "agents": {
    "defaults": {
      "workspace": "/Users/youruser/clawd",
      "memorySearch": {
        "provider": "local",
        "fallback": "none",
        "sources": ["memory"],
        "store": {
          "path": "~/.clawdbot/memory/main.sqlite",
          "vector": {
            "enabled": true,
            "extensionPath": null
          }
        },
        "chunking": {
          "tokens": 400,
          "overlap": 80
        },
        "query": {
          "minScore": 0.3,
          "maxResults": 10,
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "candidateMultiplier": 4
          }
        },
        "cache": {
          "enabled": true
        },
        "sync": {
          "watch": true,
          "onSessionStart": true,
          "onSearch": true
        }
      }
    }
  }
}
```

### Minimal Configuration (Your Current Setup)

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "fallback": "none"
      }
    }
  }
}
```

**Why this works:**
- All other options use system defaults
- `store.vector.enabled` defaults to `true`
- Extension loading is automatically enabled

---

## Summary

### ✅ What's Working

1. **Extension loading**: `allowExtension: true` is set correctly
2. **Extension path**: sqlite-vec binary is found and loaded
3. **Vector search**: Fully operational with 768-dimensional embeddings
4. **Hybrid search**: Combined vector + text search enabled

### 📋 Your Configuration Status

```
Configuration: Minimal (using defaults)
├── Provider: local ✅
├── Fallback: none ✅
├── Vector enabled: true (default) ✅
├── Extension path: auto-detected ✅
└── Extension loaded: yes ✅

Runtime Status:
├── Vector: ready ✅
├── Vector dims: 768 ✅
├── FTS: ready ✅
└── Extension path: .../vec0.dylib ✅
```

### 🎯 Recommendation

**Option 1: Keep current setup (minimal configuration)**
- Works perfectly with defaults
- Easier to maintain
- ✅ Recommended for most users

**Option 2: Explicit configuration**
- Makes settings visible in config file
- Useful for customization
- Helpful for troubleshooting

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "fallback": "none",
        "store": {
          "vector": {
            "enabled": true  // Make it explicit
          }
        }
      }
    }
  }
}
```

---

## Related Files

- **Configuration**: [src/agents/memory-search.ts](src/agents/memory-search.ts#L159)
- **Database creation**: [src/memory/manager.ts:675](src/memory/manager.ts#L675)
- **Extension loading**: [src/memory/sqlite-vec.ts](src/memory/sqlite-vec.ts)
- **Runtime script**: [scripts/run-node.mjs:89](scripts/run-node.mjs#L89)
- **Type definitions**: `node_modules/@types/node/sqlite.d.ts`

---

## Further Reading

- [Node.js SQLite Documentation](https://nodejs.org/api/sqlite.html)
- [sqlite-vec on npm](https://www.npmjs.com/package/sqlite-vec)
- [sqlite-vec GitHub](https://github.com/asg017/sqlite-vec)
- [SQLite Extension Loading](https://www.sqlite.org/loadext.html)

---

**Last Updated**: 2026-02-01
**Clawdbot Version**: 2026.1.25
**Node.js Version Required**: 22.13.0+ (you have: 22.21.1 ✅)
