# Quick Start: Local Embeddings for Clawdbot Memory

> No API keys required. All data stays on your machine.

## 1. Configure Local Provider

Edit `~/.clawdbot/clawdbot.json`:

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

## 2. Approve Native Builds

```bash
# Create approval file
echo '{"node-llama-cpp": true}' > .pnpm-approvals.json

# Rebuild native bindings
pnpm rebuild node-llama-cpp
```

## 3. Create Memory Directory

```bash
mkdir -p ~/clawd/memory
```

## 4. Test & Index

```bash
# First run downloads the model (~329MB)
clawdbot memory index

# Verify setup
clawdbot memory status
```

## 5. Create Memory Files

```bash
# Daily log
cat > ~/clawd/memory/$(date +%Y-%m-%d).md << 'EOF'
# Daily Log

## Setup Complete
- Local embeddings configured
- Model: embeddinggemma-300M (768 dims)
- Privacy: 100% offline
EOF

# Long-term memory
cat > ~/clawd/MEMORY.md << 'EOF'
# Long-Term Memory

## User Preferences
- Prefers detailed technical explanations
- Uses TypeScript for projects

## System Info
- Primary workspace: ~/clawd
- Backup location: External SSD
EOF
```

## 6. Search Memory

```bash
clawdbot memory search "embeddings setup"
```

## Common Commands

```bash
# Check status
clawdbot memory status

# Force reindex
clawdbot memory index

# Search with options
clawdbot memory search "query" --max-results 10 --min-score 0.5
```

## File Locations

- Memory files: `~/clawd/memory/*.md`
- Long-term: `~/clawd/MEMORY.md`
- Index: `~/.clawdbot/memory/main.sqlite`
- Model: `~/.node-llama-cpp/models/` (~329MB)

## Troubleshooting

**No results?**
```bash
clawdbot memory index
clawdbot memory status
```

**Build errors?**
```bash
pnpm approve-builds  # Select node-llama-cpp
pnpm rebuild node-llama-cpp
```

**Model download failed?**
- Check disk space: `df -h ~`
- Retry: Downloads resume automatically

## Full Guide

See [MEMORY_SETUP_LOCAL_EMBEDDINGS.md](../../../clawd/MEMORY_SETUP_LOCAL_EMBEDDINGS.md) for comprehensive documentation.

## Resources

- Docs: https://docs.clawd.bot/concepts/memory
- CLI: https://docs.clawd.bot/cli/memory
