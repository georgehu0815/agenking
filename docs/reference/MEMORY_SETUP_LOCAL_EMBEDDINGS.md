# Clawdbot Memory Setup with Local Embeddings

## Overview

This guide shows how to configure Clawdbot's memory system using **local embeddings** instead of cloud-based providers (OpenAI/Gemini). Local embeddings run entirely on your machine without requiring API keys.

## Why Local Embeddings?

- ✅ **No API keys required** - Works offline
- ✅ **Privacy** - All data stays on your machine
- ✅ **Cost-free** - No API charges
- ✅ **Fast** - No network latency
- ⚠️ **Storage** - Requires ~329MB for the embedding model

## Prerequisites

- Clawdbot installed and configured
- Node.js 22+ or Bun
- ~600MB free disk space (model + cache)

## Step 1: Configure Local Embeddings

Edit `~/.clawdbot/clawdbot.json` and add the `memorySearch` configuration under `agents.defaults`:

```json
{
  "agents": {
    "defaults": {
      "workspace": "/Users/ghu/clawd",
      "memorySearch": {
        "provider": "local",
        "fallback": "none"
      }
    }
  }
}
```

### Configuration Options

| Option | Value | Description |
|--------|-------|-------------|
| `provider` | `"local"` | Use local embedding model |
| `fallback` | `"none"` | Don't fallback to cloud providers |
| `model` | (optional) | Override default model path |

**Default model**: `hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf`

## Step 2: Approve Native Builds

Local embeddings require `node-llama-cpp` with native bindings. Approve the build:

Create `.pnpm-approvals.json` in your project root:

```json
{
  "node-llama-cpp": true
}
```

Or run interactively:

```bash
pnpm approve-builds
# Select: node-llama-cpp
```

Then rebuild:

```bash
pnpm rebuild node-llama-cpp
```

## Step 3: Create Memory Directory

```bash
mkdir -p ~/clawd/memory
```

## Step 4: Test the Setup

Check memory status (this will download the model on first run):

```bash
clawdbot memory status
```

Expected output:
```
Memory Search (main)
Provider: local (requested: local)
Model: hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf
Sources: memory
Indexed: 0/0 files · 0 chunks
Vector: ready
Vector dims: 768
FTS: ready
```

## Step 5: Create Your First Memory File

Create today's daily log:

```bash
cat > ~/clawd/memory/$(date +%Y-%m-%d).md << 'EOF'
# Daily Log

## Setup Notes
- Configured Clawdbot with local embeddings
- Model: embeddinggemma-300M
- No API keys required
- Privacy-focused setup

## Next Steps
- Test memory search functionality
- Configure agent workspace files
EOF
```

## Step 6: Index Memory Files

Index your memory files:

```bash
clawdbot memory index
```

This will:
1. Download the embedding model (~329MB) - **only on first run**
2. Create vector embeddings for your memory files
3. Build a searchable index in `~/.clawdbot/memory/main.sqlite`

## Step 7: Test Memory Search

Search your memory:

```bash
clawdbot memory search "embedding setup"
```

Expected output shows relevant snippets with scores:
```
0.724 memory/2026-01-31.md:1-7
# Daily Log

## Setup Notes
- Configured Clawdbot with local embeddings
...
```

## Usage Guide

### Memory File Structure

Clawdbot uses two types of memory files:

1. **Daily logs**: `~/clawd/memory/YYYY-MM-DD.md`
   - One file per day
   - Append-only notes
   - Auto-loaded (today + yesterday)

2. **Long-term memory**: `~/clawd/MEMORY.md`
   - Curated facts, preferences, decisions
   - Persistent across sessions
   - Only loaded in private sessions

### Writing to Memory

#### Option 1: Manual file creation

```bash
# Add to today's log
echo "## Meeting Notes\n- Discussed project timeline" >> ~/clawd/memory/$(date +%Y-%m-%d).md

# Add to long-term memory
echo "## User Preferences\n- Prefers concise code comments" >> ~/clawd/MEMORY.md
```

#### Option 2: Ask the agent

```bash
clawdbot agent --message "Remember that I prefer TypeScript over JavaScript" --deliver
```

The agent will write to the appropriate memory file.

### Searching Memory

```bash
# Basic search
clawdbot memory search "project timeline"

# With options
clawdbot memory search "preferences" --max-results 10 --min-score 0.5
```

### Memory Status

```bash
# Quick status
clawdbot memory status

# Detailed status
clawdbot memory status --deep
```

## File Locations

| What | Where |
|------|-------|
| Memory files | `~/clawd/memory/*.md` |
| Long-term memory | `~/clawd/MEMORY.md` |
| Vector index | `~/.clawdbot/memory/main.sqlite` |
| Embedding model | `~/.node-llama-cpp/models/` |
| Config | `~/.clawdbot/clawdbot.json` |

## Advanced Configuration

### Custom Model Path

Use a different embedding model:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "local": {
          "modelPath": "/path/to/custom-model.gguf"
        },
        "fallback": "none"
      }
    }
  }
}
```

### Model Cache Directory

Override the default cache location:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "local": {
          "modelCacheDir": "/custom/cache/path"
        }
      }
    }
  }
}
```

### Hybrid Search Tuning

Adjust vector vs keyword search weights:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "candidateMultiplier": 4
          }
        }
      }
    }
  }
}
```

### Session Memory Indexing (Experimental)

Index session transcripts in addition to memory files:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local",
        "experimental": {
          "sessionMemory": true
        },
        "sources": ["memory", "sessions"]
      }
    }
  }
}
```

## Troubleshooting

### Issue: "No API key found for provider"

**Problem**: Memory search is trying to use OpenAI/Gemini instead of local.

**Solution**: Ensure `provider: "local"` is set in your config.

### Issue: Model download fails

**Problem**: Network issues or insufficient disk space.

**Solution**:
1. Check disk space: `df -h ~`
2. Retry: `clawdbot memory index`
3. Manual download: The model will resume from where it left off

### Issue: "node-llama-cpp" build errors

**Problem**: Native bindings not compiled.

**Solution**:
```bash
# Approve builds
echo '{"node-llama-cpp": true}' > .pnpm-approvals.json

# Rebuild
pnpm rebuild node-llama-cpp
```

### Issue: Search returns no results

**Problem**: Memory files not indexed.

**Solution**:
```bash
# Force reindex
clawdbot memory index

# Check status
clawdbot memory status
```

### Issue: High memory usage

**Problem**: Large embedding model loaded in memory.

**Solution**: The model (~600MB) is loaded on-demand. Close unused terminals/processes, or switch to remote embeddings for lower memory footprint:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "openai",
        "remote": {
          "apiKey": "sk-..."
        }
      }
    }
  }
}
```

## Performance Notes

### Indexing Speed

- **First run**: Downloads model (~329MB) + indexes files
- **Subsequent runs**: Only indexes changed/new files
- **Incremental**: Changes trigger automatic reindexing (debounced)

### Search Speed

- **Cold start**: ~1-2s (model loading)
- **Warm**: ~100-300ms
- **Concurrent**: Multiple searches share model instance

### Disk Usage

| Component | Size |
|-----------|------|
| Embedding model | ~329MB |
| Vector index | ~1-5MB per 1000 chunks |
| Embedding cache | Variable (grows with usage) |

## Comparison: Local vs Remote Embeddings

| Feature | Local | OpenAI | Gemini |
|---------|-------|--------|--------|
| API Key | ❌ None | ✅ Required | ✅ Required |
| Cost | Free | ~$0.0001/1K tokens | ~$0.00001/1K tokens |
| Privacy | ✅ Offline | ⚠️ Cloud | ⚠️ Cloud |
| Speed (warm) | ~100-300ms | ~500-1000ms | ~500-1000ms |
| Setup | Model download | API key | API key |
| Model size | ~329MB | N/A | N/A |
| Quality | Good | Excellent | Excellent |

## Migration Guide

### From OpenAI/Gemini to Local

1. Update config:
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

2. Reindex (triggers model download):
   ```bash
   clawdbot memory index
   ```

3. Verify:
   ```bash
   clawdbot memory status
   # Should show: Provider: local
   ```

### From Local to OpenAI

1. Add API key to environment:
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

2. Update config:
   ```json
   {
     "agents": {
       "defaults": {
         "memorySearch": {
           "provider": "openai"
         }
       }
     }
   }
   ```

3. Reindex:
   ```bash
   clawdbot memory index
   ```

## Best Practices

### Memory File Organization

✅ **Do**:
- Use daily logs for transient context
- Use MEMORY.md for durable facts
- Keep files concise and scannable
- Use markdown headings for structure

❌ **Don't**:
- Store sensitive credentials in memory files
- Create massive monolithic files
- Duplicate information across files

### Search Queries

✅ **Do**:
- Use natural language: "when did we discuss the API redesign?"
- Include context: "user preferences for code style"
- Use specific terms for exact matches: "error code E1234"

❌ **Don't**:
- Use overly generic queries: "information"
- Search for recent context (already in session)

### Index Management

✅ **Do**:
- Let auto-indexing handle updates (debounced)
- Manually reindex after bulk changes
- Check status periodically

❌ **Don't**:
- Run `index` repeatedly in quick succession
- Delete SQLite index manually (breaks state)

## Resources

- **Clawdbot Docs**: https://docs.clawd.bot/concepts/memory
- **Memory CLI Reference**: https://docs.clawd.bot/cli/memory
- **node-llama-cpp**: https://github.com/withcatai/node-llama-cpp
- **embeddinggemma Model**: https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF

## Changelog

- **2026-01-31**: Initial guide for local embeddings setup
- Model: embeddinggemma-300M-Q8_0 (~329MB)
- Vector dims: 768
- Hybrid search: vector (70%) + BM25 (30%)
