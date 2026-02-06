# ClawdHub Guide for Clawdbot

ClawdHub is the **public skills registry** for Clawdbot - a free service for discovering, installing, updating, and sharing agent skills.

**Website**: [https://clawdhub.com](https://clawdhub.com)

---

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [Quick Start](#quick-start)
- [Common Commands](#common-commands)
- [Configuration](#configuration)
- [Workflows](#workflows)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Installation

### Install ClawdHub CLI

Choose one method:

```bash
# Using npm (recommended for global packages)
npm install -g clawdhub

# Using pnpm
pnpm add -g clawdhub
```

### Verify Installation

```bash
# Check CLI version
clawdhub -V

# Should output: ClawdHub CLI v0.3.0 (or later)
```

---

## Authentication

### Login to ClawdHub

```bash
# Browser-based login (recommended)
clawdhub login

# Login with API token
clawdhub login --token YOUR_TOKEN_HERE

# Non-interactive login (no browser)
clawdhub login --no-browser --token YOUR_TOKEN_HERE

# Custom token label
clawdhub login --label "My Development Machine"
```

### Check Login Status

```bash
# Verify you're logged in
clawdhub whoami
```

### Logout

```bash
clawdhub logout
```

---

## Quick Start

### 1. Search for Skills

```bash
# Search by natural language
clawdhub search "github integration"
clawdhub search "calendar management"
clawdhub search "image generation"

# Limit search results
clawdhub search "database" --limit 10
```

### 2. Explore Latest Skills

```bash
# Browse recently updated skills
clawdhub explore

# Explore with custom limit
clawdhub explore --limit 20
```

### 3. Install a Skill

```bash
# Install latest version
clawdhub install <skill-slug>

# Install specific version
clawdhub install <skill-slug> --version 1.2.0

# Force overwrite if exists
clawdhub install <skill-slug> --force
```

### 4. List Installed Skills

```bash
clawdhub list
```

### 5. Update Skills

```bash
# Update all installed skills
clawdhub update --all

# Update specific skill
clawdhub update <skill-slug>

# Update to specific version
clawdhub update <skill-slug> --version 2.0.0

# Force update when local changes exist
clawdhub update <skill-slug> --force
```

### 6. Restart Clawdbot

After installing or updating skills, start a new Clawdbot session to load them:

```bash
# Start new agent session
clawdbot agent --message "hello"

# Or restart the macOS app from the menu bar
```

---

## Common Commands

### Search Commands

```bash
# Basic search
clawdhub search "query"

# Search with result limit
clawdhub search "query" --limit 15
```

### Install Commands

```bash
# Install latest version
clawdhub install skill-name

# Install specific version
clawdhub install skill-name --version 1.0.0

# Install with custom workdir
clawdhub install skill-name --workdir ~/.clawdbot

# Install with custom skills directory
clawdhub install skill-name --dir my-skills

# Force overwrite existing
clawdhub install skill-name --force
```

### Update Commands

```bash
# Update all skills
clawdhub update --all

# Update single skill
clawdhub update skill-name

# Update to specific version
clawdhub update skill-name --version 2.0.0

# Force update (ignore local changes)
clawdhub update --all --force
```

### Publish Commands

```bash
# Publish a skill
clawdhub publish ./my-skill \
  --slug my-skill \
  --name "My Custom Skill" \
  --version 1.0.0 \
  --changelog "Initial release" \
  --tags latest

# Publish without changelog
clawdhub publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog ""

# Publish with multiple tags
clawdhub publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --tags "latest,stable,production"
```

### Sync Commands

```bash
# Scan and publish all skills
clawdhub sync --all

# Dry run (preview what would be uploaded)
clawdhub sync --dry-run

# Sync with version bump
clawdhub sync --bump patch   # 1.0.0 → 1.0.1
clawdhub sync --bump minor   # 1.0.0 → 1.1.0
clawdhub sync --bump major   # 1.0.0 → 2.0.0

# Sync with custom changelog
clawdhub sync --all --changelog "Bug fixes and improvements"

# Sync with additional scan roots
clawdhub sync --root /path/to/more/skills

# Sync with custom concurrency
clawdhub sync --concurrency 8
```

### Management Commands

```bash
# Star a skill
clawdhub star skill-name

# Unstar a skill
clawdhub unstar skill-name

# Delete a skill (owner/admin only)
clawdhub delete skill-name --yes

# Restore a deleted skill
clawdhub undelete skill-name --yes
```

---

## Configuration

### Global Options

These options apply to all commands:

```bash
--workdir <dir>      # Working directory (default: current directory)
--dir <dir>          # Skills directory relative to workdir (default: skills)
--site <url>         # Site base URL (for browser login)
--registry <url>     # Registry API base URL
--no-input           # Disable prompts (non-interactive mode)
-V, --cli-version    # Print CLI version
-h, --help           # Display help
```

### Environment Variables

```bash
# Override site URL
export CLAWDHUB_SITE="https://clawdhub.com"

# Override registry API URL
export CLAWDHUB_REGISTRY="https://api.clawdhub.com"

# Custom config path
export CLAWDHUB_CONFIG_PATH="~/.config/clawdhub"

# Custom working directory
export CLAWDHUB_WORKDIR="/path/to/workspace"

# Disable telemetry (install count tracking)
export CLAWDHUB_DISABLE_TELEMETRY=1
```

### Clawdbot Configuration

Configure skills in `~/.clawdbot/clawdbot.json`:

```json5
{
  "skills": {
    "entries": {
      "google-calendar": {
        "enabled": true,
        "apiKey": "YOUR_API_KEY_HERE",
        "env": {
          "GOOGLE_CALENDAR_API_KEY": "YOUR_KEY"
        }
      },
      "github-tools": {
        "enabled": true,
        "env": {
          "GITHUB_TOKEN": "ghp_your_token_here"
        }
      },
      "disabled-skill": {
        "enabled": false
      }
    },
    "load": {
      "watch": true,          // Auto-reload when skills change
      "watchDebounceMs": 250,
      "extraDirs": [          // Additional skill folders
        "/path/to/custom/skills",
        "~/shared-skills"
      ]
    }
  }
}
```

---

## Workflows

### Workflow 1: Discover and Install Skills

```bash
# 1. Search for what you need
clawdhub search "github integration"

# 2. Explore results and pick one
# Output will show: skill-slug, name, description

# 3. Install the skill
clawdhub install github-tools

# 4. Verify installation
clawdhub list

# 5. Start new Clawdbot session
clawdbot agent --message "create a GitHub issue"
```

### Workflow 2: Keep Skills Updated

```bash
# 1. Check for updates
clawdhub update --all --dry-run

# 2. Update all skills
clawdhub update --all

# 3. Restart Clawdbot to load updates
```

### Workflow 3: Create and Publish Your Own Skill

```bash
# 1. Create skill folder structure
mkdir my-custom-skill
cd my-custom-skill

# 2. Create SKILL.md with frontmatter
cat > SKILL.md << 'EOF'
---
name: my-custom-skill
description: Does amazing things with APIs
metadata: {"clawdbot":{"requires":{"env":["MY_API_KEY"]}}}
---

# My Custom Skill

This skill teaches the agent how to...

## Usage
/my-skill [args]

## Commands
- `/my-skill help` - Show help
- `/my-skill run` - Execute main function
EOF

# 3. Publish to ClawdHub
clawdhub publish . \
  --slug my-custom-skill \
  --name "My Custom Skill" \
  --version 1.0.0 \
  --changelog "Initial release" \
  --tags latest

# 4. Share with others
# They can now run: clawdhub install my-custom-skill
```

### Workflow 4: Sync Multiple Skills at Once

```bash
# Useful for backing up your local skills to ClawdHub

# 1. Navigate to your workspace
cd ~/my-clawdbot-workspace

# 2. Scan and sync all skills
clawdhub sync --all

# 3. Skills are now backed up to ClawdHub
# Others can install them with: clawdhub install <your-skill-slug>
```

---

## Troubleshooting

### Issue: "Cannot find package 'undici'"

**Symptom:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'undici' imported from ...
```

**Solution:**
```bash
# Reinstall with force flag
pnpm remove -g clawdhub
pnpm add -g clawdhub --force

# Or use npm (often more reliable for global packages)
npm uninstall -g clawdhub
npm install -g clawdhub
```

### Issue: Skills Not Loading in Clawdbot

**Symptoms:**
- Installed skills don't appear in Clawdbot
- Slash commands not working

**Solutions:**

1. **Verify installation location:**
   ```bash
   clawdhub list
   # Check the install path matches your workspace
   ```

2. **Check skills directory:**
   ```bash
   ls -la skills/
   # Should show your installed skills
   ```

3. **Restart Clawdbot:**
   - Start a new session
   - Skills load at session start, not mid-session

4. **Check Clawdbot config:**
   - Ensure skill isn't disabled in `~/.clawdbot/clawdbot.json`
   - Verify required environment variables are set

### Issue: "Not logged in"

**Solution:**
```bash
# Login again
clawdhub login

# Verify
clawdhub whoami
```

### Issue: Update Conflicts (Local Changes)

**Symptom:**
```
Local files do not match any published version
```

**Solutions:**

1. **Force update (overwrites local changes):**
   ```bash
   clawdhub update skill-name --force
   ```

2. **Back up local changes first:**
   ```bash
   cp -r skills/skill-name skills/skill-name.backup
   clawdhub update skill-name --force
   ```

3. **Publish local changes as new version:**
   ```bash
   clawdhub publish skills/skill-name \
     --slug skill-name \
     --version 1.1.0 \
     --changelog "Local improvements"
   ```

---

## Advanced Usage

### Skill Installation Locations

Skills are loaded from three places (in precedence order):

1. **Workspace skills** (highest): `<workspace>/skills`
2. **Managed/local skills**: `~/.clawdbot/skills`
3. **Bundled skills** (lowest): Shipped with Clawdbot

When ClawdHub installs skills:
- Default: `./skills` in current directory
- Falls back to Clawdbot workspace if configured
- Can override with `--workdir` or `CLAWDHUB_WORKDIR`

### Multi-Agent Setups

For per-agent skills:
```bash
# Install to specific agent's workspace
cd ~/agent-workspace-1
clawdhub install special-skill

# This skill is only available to agent-1
```

For shared skills across all agents:
```bash
# Install to shared location
clawdhub install common-skill --workdir ~/.clawdbot
```

### Custom Skill Directories

Add to `~/.clawdbot/clawdbot.json`:
```json5
{
  "skills": {
    "load": {
      "extraDirs": [
        "/path/to/team/skills",
        "~/company/shared-skills"
      ]
    }
  }
}
```

### Versioning and Tags

```bash
# Install latest (default)
clawdhub install skill-name

# Install specific version
clawdhub install skill-name --version 1.2.3

# Tags point to versions
# Common tags: latest, stable, beta, dev
```

### Lockfile and Sync

ClawdHub tracks installations in `.clawdhub/lock.json`:
```json
{
  "skills": {
    "github-tools": {
      "version": "1.2.0",
      "slug": "github-tools"
    }
  }
}
```

### Telemetry

When you run `clawdhub sync` while logged in, minimal install counts are sent to the registry.

Disable telemetry:
```bash
export CLAWDHUB_DISABLE_TELEMETRY=1
clawdhub sync
```

---

## Skill Creation Reference

### Minimal SKILL.md Format

```markdown
---
name: my-skill
description: What this skill does
---

# My Skill

Instructions for the agent on how to use this skill.

## Usage
/my-skill [command]
```

### Advanced SKILL.md with Metadata

```markdown
---
name: advanced-skill
description: Advanced skill with requirements
homepage: https://github.com/user/skill
user-invocable: true
disable-model-invocation: false
metadata: {"clawdbot":{"requires":{"bins":["tool"],"env":["API_KEY"],"config":["feature.enabled"]},"primaryEnv":"API_KEY","emoji":"🚀"}}
---

# Advanced Skill

Full skill documentation here.
```

### Skill Structure

```
my-skill/
├── SKILL.md           # Required: skill definition
├── README.md          # Optional: documentation
├── scripts/           # Optional: helper scripts
│   └── setup.sh
└── templates/         # Optional: templates
    └── example.txt
```

---

## Resources

- **ClawdHub Website**: [https://clawdhub.com](https://clawdhub.com)
- **Clawdbot Documentation**: [https://docs.clawd.bot](https://docs.clawd.bot)
- **Skills Documentation**: [https://docs.clawd.bot/tools/skills](https://docs.clawd.bot/tools/skills)
- **Creating Skills Guide**: [https://docs.clawd.bot/tools/creating-skills](https://docs.clawd.bot/tools/creating-skills)
- **GitHub Repository**: [https://github.com/clawdbot/clawdbot](https://github.com/clawdbot/clawdbot)

---

## Quick Reference Card

```bash
# Essential Commands
clawdhub login                    # Authenticate
clawdhub search "query"           # Find skills
clawdhub install skill-name       # Install skill
clawdhub list                     # Show installed
clawdhub update --all             # Update all
clawdhub publish ./skill          # Publish skill

# Status
clawdhub whoami                   # Check login
clawdhub -V                       # Check version

# Environment
export CLAWDHUB_DISABLE_TELEMETRY=1  # Disable tracking
export CLAWDHUB_WORKDIR=/path         # Set workdir
```

---

## Version Information

- **ClawdHub CLI Version**: 0.3.0 (as of 2026-01-27)
- **Guide Last Updated**: 2026-01-27

---

## Contributing

Found an issue or have suggestions? Report them at:
- [Clawdbot GitHub Issues](https://github.com/clawdbot/clawdbot/issues)

---

*This guide was created for the Clawdbot project to help users get started with ClawdHub skills management.*
