# Quick Fix: Node.js SQLite "No such built-in module" Error

## Problem
```
No such built-in module: node:sqlite
```

## Solution

Edit `scripts/run-node.mjs` line 89:

```diff
- const nodeProcess = spawn(process.execPath, ["dist/entry.js", ...args], {
+ const nodeProcess = spawn(process.execPath, ["--experimental-sqlite", "dist/entry.js", ...args], {
```

## Why?

Node.js 22+ has built-in SQLite but requires `--experimental-sqlite` flag.

## Verify

```bash
pnpm clawdbot memory status
```

## Full Guide

See [NODEJS_SQLITE_SETUP_GUIDE.md](../../../clawd/NODEJS_SQLITE_SETUP_GUIDE.md) for comprehensive documentation.

## Related Files

- Fix location: [scripts/run-node.mjs](scripts/run-node.mjs#L89)
- SQLite loader: [src/memory/sqlite.ts](src/memory/sqlite.ts)
- Memory system: [docs/concepts/memory.md](docs/concepts/memory.md)

## Alternative: Use Bun

Bun has native SQLite support without experimental flags:

```bash
bun run src/cli.ts memory status
```
