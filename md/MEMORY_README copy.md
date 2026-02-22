# Clawdbot Memory System

This directory contains Clawdbot's memory system - plain Markdown files that serve as the agent's long-term memory and daily context.

## Quick Overview

Clawdbot's memory is **file-based**: what you write to disk is what the agent remembers. No databases, no hidden storage - just Markdown files you can read, edit, and version control.

## Memory Files

### Current Files

```bash
~/clawd/
├── MEMORY.md                    # Long-term curated memory (create if needed)
└── memory/
    └── YYYY-MM-DD.md           # Daily logs (one per day)
```

### File Purposes

| File | Purpose | When Loaded |
|------|---------|-------------|
| `MEMORY.md` | Long-term facts, preferences, decisions | Every private session |
| `memory/YYYY-MM-DD.md` | Daily running notes | Today + yesterday |

## How It Works

1. **Write**: Agent or user writes to memory files
2. **Index**: Files are embedded and indexed in SQLite
3. **Search**: Vector + keyword search finds relevant context
4. **Load**: Agent reads matching snippets into context

## Your Setup

✅ **Provider**: Local embeddings (no API key)
✅ **Model**: embeddinggemma-300M (768 dimensions)
✅ **Privacy**: 100% offline, all data stays on your machine
✅ **Index**: `~/.clawdbot/memory/main.sqlite`

## Usage

### Write Memory (Manual)

```bash
# Add to today's log
echo "## Project Notes\n- Completed authentication module" >> ~/clawd/memory/$(date +%Y-%m-%d).md

# Add to long-term memory
echo "## Tech Stack\n- Backend: Node.js + TypeScript\n- Database: PostgreSQL" >> ~/clawd/MEMORY.md
```

### Write Memory (Via Agent)

```bash
clawdbot agent --message "Remember that I use PostgreSQL for the main database" --deliver
```

### Search Memory

```bash
clawdbot memory search "authentication"
clawdbot memory search "database setup"
```

### Check Status

```bash
clawdbot memory status
```

## When to Use Each File

### Use `MEMORY.md` for:
- System architecture decisions
- User preferences and habits
- Important project milestones
- Recurring patterns and learnings
- Configuration details

### Use `memory/YYYY-MM-DD.md` for:
- Daily work notes
- Meeting summaries
- Debugging sessions
- Task tracking
- Temporary context

## Memory Search

Your memory is searchable via:

1. **Vector search**: Semantic similarity (meaning-based)
2. **Keyword search**: Exact token matching (IDs, codes, names)
3. **Hybrid**: Both combined for best results

### Example Queries

```bash
# Semantic: finds related concepts even with different wording
clawdbot memory search "how do we handle user authentication?"

# Keyword: finds exact matches
clawdbot memory search "API_KEY_PREFIX"

# Hybrid: combines both approaches
clawdbot memory search "database connection settings"
```

## Automatic Features

### Auto-Indexing
- Files are watched for changes
- Index updates automatically (debounced 1.5s)
- No manual reindexing needed (unless bulk changes)

### Pre-Compaction Memory Flush
- Before context is compacted, agent gets a silent turn
- Opportunity to write important context to memory
- Usually responds with `NO_REPLY` (nothing delivered to user)
- Configurable via `agents.defaults.compaction.memoryFlush`

## Commands

```bash
# View status (shows indexed files, model info)
clawdbot memory status

# Force reindex (use after bulk changes)
clawdbot memory index

# Search (semantic + keyword)
clawdbot memory search "query"

# Search with options
clawdbot memory search "query" --max-results 10 --min-score 0.5
```

## File Organization Tips

### ✅ Good Practices

```markdown
# MEMORY.md Example

## User Profile
- Name: Peter
- Role: Software architect
- Preferences: Detailed error messages, TypeScript over JavaScript

## Project: Clawdbot Extension
- Status: Active development
- Repo: ~/projects/clawdbot-plugin
- Stack: TypeScript, Docker, PostgreSQL

## Decisions
- 2026-01-28: Chose PostgreSQL over MongoDB for relational data
- 2026-01-29: Implemented retry logic for API calls
```

```markdown
# memory/2026-01-31.md Example

## Morning
- Fixed memory indexing bug
- Configured local embeddings (no API key needed)
- Updated documentation

## Afternoon
- Meeting with team about Q1 goals
- Discussed switching to TypeScript strict mode

## Notes
- Remember to update CI/CD pipeline before Monday
```

### ❌ Avoid

- Don't store secrets (API keys, passwords) in memory files
- Don't create massive files (split by topic/date)
- Don't duplicate content across files
- Don't use for ephemeral session context (agent remembers current session)

## Troubleshooting

### Memory not saving?
Check that files are in the correct location:
```bash
ls -la ~/clawd/memory/
ls -la ~/clawd/MEMORY.md
```

### Search not working?
Reindex and check status:
```bash
clawdbot memory index
clawdbot memory status
```

### Model issues?
The embedding model is downloaded on first index:
```bash
ls -lh ~/.node-llama-cpp/models/
```

Expected: `hf_ggml-org_embeddinggemma-300M-Q8_0.gguf` (~329MB)

## Documentation

- **Setup Guide**: [MEMORY_SETUP_LOCAL_EMBEDDINGS.md](./MEMORY_SETUP_LOCAL_EMBEDDINGS.md)
- **Quick Start**: [LOCAL_EMBEDDINGS_QUICKSTART.md](../aiworker/clawdbot/LOCAL_EMBEDDINGS_QUICKSTART.md)
- **Official Docs**: https://docs.clawd.bot/concepts/memory
- **CLI Reference**: https://docs.clawd.bot/cli/memory

## Technical Details

### Index Storage
- Location: `~/.clawdbot/memory/main.sqlite`
- Format: SQLite with sqlite-vec extension
- Tables: chunks, files, metadata, vector index, FTS index

### Chunking
- Target: ~400 tokens per chunk
- Overlap: 80 tokens
- Format: Markdown-aware splitting

### Embedding Model
- Model: embeddinggemma-300M-Q8_0
- Dimensions: 768
- Size: ~329MB
- Provider: Local (no API)
- Cache: `~/.node-llama-cpp/models/`

### Search Algorithm
- Vector: Cosine similarity (semantic)
- Keyword: BM25 via SQLite FTS5
- Hybrid: 70% vector + 30% keyword (configurable)

## Next Steps

1. **Create MEMORY.md**: Add your long-term facts
   ```bash
   touch ~/clawd/MEMORY.md
   ```

2. **Start daily logs**: Write today's notes
   ```bash
   touch ~/clawd/memory/$(date +%Y-%m-%d).md
   ```

3. **Index**: Build searchable index
   ```bash
   clawdbot memory index
   ```

4. **Test search**: Verify it works
   ```bash
   clawdbot memory search "test"
   ```

## Support

- Report issues: https://github.com/clawdbot/clawdbot/issues
- Docs: https://docs.clawd.bot
- Community: Discord (link in repo)

---

**Remember**: Memory files are **your files**. Edit them, version control them, back them up. Clawdbot just reads them and indexes them for search.
