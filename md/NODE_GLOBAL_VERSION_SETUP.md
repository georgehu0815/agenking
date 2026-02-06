# Node.js Global Version Setup - Complete Guide

> Making Node.js v22.22.0 the default version across all shells (bash, sh, zsh)

## Overview

This guide documents how Node.js v22.22.0 was configured as the global default version using NVM (Node Version Manager), ensuring it takes priority over Homebrew's Node.js installations.

---

## Problem

Multiple Node.js installations existed on the system:
- **Homebrew node** (v25.5.0) at `/opt/homebrew/bin/node`
- **Homebrew node@22** (v22.21.1) at `/opt/homebrew/opt/node@22/bin/node` ← **REMOVED**
- **NVM-managed Node.js** (v22.22.0) at `~/.nvm/versions/node/v22.22.0/bin/node`

Different shells were loading different Node.js versions:
- bash login shells: v22.11.0 (old default)
- sh login shells: v22.22.0 (worked correctly via .profile)
- zsh login shells: v25.5.0 (Homebrew's default node)
- zsh interactive shells: v22.21.1 (Homebrew's node@22)

---

## Root Causes

### 1. Bash Login Shell Issue
- `.bash_profile` existed but didn't source `.bashrc`
- NVM configuration in `.bashrc` was not loaded for login shells
- Login shells read `.bash_profile`, not `.bashrc`

### 2. Zsh Homebrew Priority Issue
- `.zprofile` loads Homebrew via `eval "$(/opt/homebrew/bin/brew shellenv)"`
- Homebrew adds `/opt/homebrew/bin` to PATH early
- `.zshrc` had Homebrew's node@22 explicitly added to PATH
- NVM configuration loaded after Homebrew, so Homebrew's node took priority

---

## Solution

### 1. Fixed Bash Login Shells

Updated [.bash_profile](~/.bash_profile) to source .bashrc:

```bash
# Source .bashrc if it exists (for NVM and other bash configurations)
if [ -f "$HOME/.bashrc" ]; then
    . "$HOME/.bashrc"
fi
```

### 2. Fixed Zsh Configuration

#### Step 2a: Commented out Homebrew node@22 in .zshrc

Updated [.zshrc](~/.zshrc):

```bash
# Note: Homebrew node@22 commented out to use NVM-managed Node.js instead
# export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

#### Step 2b: Prepend NVM's node to PATH in .zshrc

Added NVM priority configuration to [.zshrc](~/.zshrc) (for interactive shells):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Ensure NVM's default node takes priority over Homebrew's node
# Use explicit path since $NVM_DIR should be set above
NVM_ALIAS_FILE="$HOME/.nvm/alias/default"
if [ -f "$NVM_ALIAS_FILE" ]; then
  DEFAULT_NODE_VERSION=$(cat "$NVM_ALIAS_FILE")
  NVM_DEFAULT_BIN="$HOME/.nvm/versions/node/$DEFAULT_NODE_VERSION/bin"
  if [ -d "$NVM_DEFAULT_BIN" ]; then
    export PATH="$NVM_DEFAULT_BIN:$PATH"
  fi
fi
```

#### Step 2c: Add NVM configuration to .zprofile

Added NVM configuration to [.zprofile](~/.zprofile) (for login shells):

```bash
# NVM Configuration - ensure NVM's node takes priority over Homebrew
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
# Prepend NVM's default node to PATH to override Homebrew's node
NVM_ALIAS_FILE="$HOME/.nvm/alias/default"
if [ -f "$NVM_ALIAS_FILE" ]; then
  DEFAULT_NODE_VERSION=$(cat "$NVM_ALIAS_FILE")
  NVM_DEFAULT_BIN="$HOME/.nvm/versions/node/$DEFAULT_NODE_VERSION/bin"
  if [ -d "$NVM_DEFAULT_BIN" ]; then
    export PATH="$NVM_DEFAULT_BIN:$PATH"
  fi
fi
```

### 3. Set NVM Default Alias

```bash
nvm alias default v22.22.0
```

---

## Verification

### Test All Shells

```bash
# Bash login shell
bash -l -c 'node --version'
# Expected: v22.22.0

# sh login shell
sh -l -c 'node --version'
# Expected: v22.22.0

# Zsh login shell
zsh -l -c 'node --version'
# Expected: v22.22.0

# Zsh interactive shell
zsh -i -c 'node --version'
# Expected: v22.22.0
```

### Actual Results (After Fix)

```
✅ bash -l: v22.22.0
✅ sh -l:   v22.22.0
✅ zsh -l:  v22.22.0
✅ zsh -i:  v22.22.0
```

### Check Which Node Binary

```bash
# Bash
bash -l -c 'which node'
# /Users/ghu/.nvm/versions/node/v22.22.0/bin/node

# Zsh
zsh -i -c 'which node'
# /Users/ghu/.nvm/versions/node/v22.22.0/bin/node
```

### Check NVM Default Alias

```bash
nvm alias
# default -> v22.22.0
```

---

## Understanding Shell Initialization Order

### Bash

**Login Shell** (`bash -l` or SSH):
1. `/etc/profile`
2. `~/.bash_profile` (first found)
3. `~/.bash_login` (if .bash_profile doesn't exist)
4. `~/.profile` (if neither above exist)

**Interactive Non-Login Shell** (`bash`):
1. `~/.bashrc`

**Our Solution**: Made .bash_profile source .bashrc

### Zsh

**Login Shell** (`zsh -l` or SSH):
1. `/etc/zshenv`
2. `~/.zshenv`
3. `/etc/zprofile`
4. `~/.zprofile` ← **Homebrew loaded here**
5. `/etc/zshrc`
6. `~/.zshrc` ← **NVM was loaded here (too late)**
7. `/etc/zlogin`
8. `~/.zlogin`

**Interactive Shell** (`zsh`):
1. `/etc/zshenv`
2. `~/.zshenv`
3. `/etc/zshrc`
4. `~/.zshrc`

**Our Solution**:
- Added NVM to `.zprofile` (for login shells)
- Added NVM to `.zshrc` (for interactive shells)
- Both configurations prepend NVM's node to PATH after loading NVM

---

## Why This Approach Works

### 1. Explicit PATH Prepending

Instead of relying on NVM's automatic PATH management, we explicitly prepend the NVM node bin directory:

```bash
export PATH="$NVM_DEFAULT_BIN:$PATH"
```

This ensures NVM's node comes **before** Homebrew's node in PATH, regardless of when Homebrew was initialized.

### 2. Reading Default Alias File

We read the NVM default alias directly from the file system:

```bash
DEFAULT_NODE_VERSION=$(cat "$HOME/.nvm/alias/default")
```

This approach works in all shell contexts (login, non-login, interactive, non-interactive).

### 3. Conditional Configuration

The configuration only runs if:
- The NVM alias file exists
- The NVM node bin directory exists

This prevents errors if NVM isn't fully installed or the version is missing.

---

## Files Modified

### [~/.bash_profile](~/.bash_profile)
- Added: Source .bashrc if it exists

### [~/.bashrc](~/.bashrc)
- Already had NVM configuration (no changes needed)

### [~/.profile](~/.profile)
- Already had NVM configuration (no changes needed)

### [~/.zshrc](~/.zshrc)
- Commented out: Homebrew node@22 PATH
- Added: NVM default node PATH prepending

### [~/.zprofile](~/.zprofile)
- Added: Complete NVM configuration with PATH prepending

---

## ✅ Cleanup: Removed Homebrew node@22

Since NVM is managing Node.js v22.22.0, we removed the conflicting Homebrew node@22 (v22.21.1):

```bash
# Uninstalled Homebrew's node@22
brew uninstall node@22

# Result
Uninstalling /opt/homebrew/Cellar/node@22/22.21.1_1... (2,438 files, 61.6MB)
==> Autoremoving 1 unneeded formula:
simdutf

# Verify remaining Node.js installations
which -a node
# /opt/homebrew/bin/node (Homebrew's default node v25.5.0)
# /usr/local/bin/node (other installation)

# Verify shells use NVM's node
bash -l -c 'node --version'  # v22.22.0 ✅
zsh -l -c 'node --version'   # v22.22.0 ✅
```

**Benefits:**
- Removed potential version conflict
- Freed up 61.6MB of disk space
- Simplified PATH configuration
- No packages depended on node@22 (was keg-only)

## Optional: Uninstall Homebrew's Default Node

If you want to completely remove all Homebrew Node.js installations:

```bash
# Uninstall Homebrew's default node (v25.5.0)
brew uninstall node

# Verify
which -a node
# Should only show: /Users/ghu/.nvm/versions/node/v22.22.0/bin/node
```

**Note:** Some Homebrew packages may depend on `node`. Check dependencies first:
```bash
brew uses --installed node
```

**Current Approach:** We removed node@22 but kept Homebrew's default node (v25.5.0). NVM's node takes priority via PATH ordering, while Homebrew packages that need node can still access it if needed.

---

## Switching Node.js Versions

To change the default Node.js version:

```bash
# Install a different version
nvm install v20.11.0

# Set as default
nvm alias default v20.11.0

# Restart your shell or run:
exec $SHELL -l

# Verify
node --version
# Should show: v20.11.0
```

The PATH configuration will automatically use the new default version after shell restart.

---

## Troubleshooting

### Still Seeing Wrong Version?

**1. Check NVM default alias:**
```bash
cat ~/.nvm/alias/default
# Should show: v22.22.0
```

**2. Check if version is installed:**
```bash
ls ~/.nvm/versions/node/
# Should include: v22.22.0
```

**3. Check PATH in your current shell:**
```bash
echo $PATH | tr ':' '\n' | grep -E 'nvm|node'
# Should show NVM path before Homebrew paths
```

**4. Restart your shell:**
```bash
exec $SHELL -l
node --version
```

### NVM Command Not Found?

Make sure NVM is loaded. Source the init script:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Or restart your shell:
```bash
exec $SHELL -l
```

### Different Version in tmux/screen?

tmux and screen start login shells by default. Make sure your tmux/screen configuration doesn't override the PATH.

For tmux, check `~/.tmux.conf` for PATH settings.

---

## Summary

### ✅ What Was Done

```
Configuration Complete! 🎉

┌─────────────────────────────────────────┐
│ Node.js Global Version Configuration    │
├─────────────────────────────────────────┤
│ Default Version: v22.22.0               │
│ Managed By: NVM                         │
│ Location: ~/.nvm/versions/node/v22.22.0 │
│                                         │
│ Shell Support:                          │
│ ✅ bash (login + interactive)           │
│ ✅ sh (login)                           │
│ ✅ zsh (login + interactive)            │
└─────────────────────────────────────────┘

NVM path takes priority over:
  - Homebrew node (v25.5.0)
  - System node (if any)

Removed:
  - Homebrew node@22 (v22.21.1) ← Uninstalled
```

### Files Modified

1. **~/.bash_profile**: Sources .bashrc for login shells
2. **~/.zshrc**: NVM priority configuration for interactive shells
3. **~/.zprofile**: NVM priority configuration for login shells

### Key Changes

- Set NVM default alias: `nvm alias default v22.22.0`
- Prepend NVM node bin to PATH after loading NVM
- Commented out Homebrew node@22 PATH in .zshrc
- Made .bash_profile source .bashrc

---

## Related Documentation

- **NVM GitHub**: https://github.com/nvm-sh/nvm
- **Shell Initialization**: See "Understanding Shell Initialization Order" section above
- **Troubleshooting**: See "Troubleshooting" section above

---

**Last Updated**: 2026-02-01
**Node.js Version**: v22.22.0
**NVM Version**: (run `nvm --version` to check)
