# Clawdbot Global Installation - Quick Start

> **TL;DR**: Install clawdbot globally in 3 simple steps

## Prerequisites

- Node.js ≥ 22.12.0
- pnpm ≥ 10.23.0 (or npm ≥ 8.0.0)

```bash
# Install pnpm if needed
npm install -g pnpm
```

---

## Installation

### Option A: Development Setup (Recommended)

Best for active development - changes are immediately reflected.

```bash
# 1. Navigate to clawdbot directory
cd ~/aiworker/clawdbot

# 2. Install dependencies and build
pnpm install && pnpm build

# 3. Link globally
pnpm link --global
```

### Option B: Stable Installation

Best for production use - independent of source directory.

```bash
# 1. Navigate to clawdbot directory
cd ~/aiworker/clawdbot

# 2. Install dependencies and build
pnpm install && pnpm build

# 3. Install globally
pnpm install -g .
```

---

## Verification

```bash
# Check installation
which clawdbot
# Output: /Users/yourname/Library/pnpm/clawdbot

# Check version
clawdbot --version
# Output: 2026.1.25

# View help
clawdbot --help
```

---

## First Steps

```bash
# Run interactive setup wizard
clawdbot onboard

# Or configure manually
clawdbot setup
clawdbot configure

# Check system health
clawdbot doctor

# View status
clawdbot status
```

---

## Common Commands

```bash
clawdbot gateway              # Start the gateway
clawdbot tui                  # Open Terminal UI
clawdbot dashboard            # Open Control UI
clawdbot logs                 # View logs
clawdbot status               # Check health
clawdbot --help               # Show all commands
```

---

## Updating

### For pnpm link installations:
```bash
cd ~/aiworker/clawdbot
git pull
pnpm install && pnpm build
# That's it! Already linked.
```

### For pnpm install -g installations:
```bash
cd ~/aiworker/clawdbot
git pull
pnpm install && pnpm build
pnpm install -g .
```

---

## Troubleshooting

### Command not found?

Add pnpm bin to your PATH in `~/.zshrc` or `~/.bashrc`:

```bash
export PATH="$HOME/Library/pnpm:$PATH"
```

Then reload:
```bash
source ~/.zshrc
```

### Permission denied?

```bash
chmod +x $(which clawdbot)
```

### Need to uninstall?

```bash
# For pnpm link
cd ~/aiworker/clawdbot && pnpm unlink --global

# For pnpm install -g
pnpm uninstall -g clawdbot
```

---

## Platform-Specific Notes

### macOS

- Default pnpm bin: `~/Library/pnpm`
- Global pnpm packages: `~/Library/pnpm/global/5`

### Linux

- Default pnpm bin: `~/.local/share/pnpm`
- May need to add to PATH manually

### Windows

- Default pnpm bin: `%LOCALAPPDATA%\pnpm`
- Use PowerShell or Git Bash

---

**Full Documentation**: See [INSTALL_GLOBAL.md](./INSTALL_GLOBAL.md) for detailed instructions and troubleshooting.

**Clawdbot Version**: 2026.1.25 | **Node Required**: ≥22.12.0
