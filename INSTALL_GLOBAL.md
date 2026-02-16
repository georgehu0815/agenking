# Clawdbot Global Installation Guide

This guide provides step-by-step instructions to install clawdbot globally on your system, making it accessible from anywhere via the command line.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Using pnpm link (Recommended for Development)](#method-1-using-pnpm-link-recommended-for-development)
  - [Method 2: Using pnpm install -g](#method-2-using-pnpm-install--g)
  - [Method 3: Using npm install -g](#method-3-using-npm-install--g)
  - [Method 4: Manual Symlink](#method-4-manual-symlink)
- [Verification](#verification)
- [Post-Installation Setup](#post-installation-setup)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

---

## Prerequisites

Before installing clawdbot globally, ensure you have the following:

### Required

- **Node.js**: Version 22.12.0 or higher
  ```bash
  node --version
  ```

- **Package Manager**: One of the following:
  - **pnpm** (Recommended): Version 10.23.0 or higher
    ```bash
    pnpm --version
    ```
  - **npm**: Version 8.0.0 or higher
    ```bash
    npm --version
    ```

### Installing pnpm (if not already installed)

```bash
# Using npm
npm install -g pnpm

# Using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Using Homebrew (macOS)
brew install pnpm
```

### Repository Access

- Clone or download the clawdbot repository
- Default location in this guide: `~/aiworker/clawdbot`

---

## Installation Methods

### Method 1: Using pnpm link (Recommended for Development)

This method creates a symlink from your global pnpm directory to the local clawdbot installation. It's ideal for development as changes to the source code are immediately reflected.

#### Steps:

1. **Navigate to the clawdbot directory:**
   ```bash
   cd ~/aiworker/clawdbot
   ```

2. **Build the project (if not already built):**
   ```bash
   pnpm install
   pnpm build
   ```

3. **Create the global link:**
   ```bash
   pnpm link --global
   ```

4. **Expected output:**
   ```
   Progress: resolved X, reused Y, downloaded Z, added 0, done

   /Users/yourname/Library/pnpm/global/5:
   + clawdbot 2026.1.25 <- ../../../../aiworker/clawdbot
   ```

#### Advantages:
- ✅ Changes to source code are immediately available
- ✅ Easy to update by pulling latest changes and rebuilding
- ✅ Easy to unlink without removing source code

#### Disadvantages:
- ❌ Requires keeping the source directory intact
- ❌ Moving or deleting the source directory breaks the link

---

### Method 2: Using pnpm install -g

This method installs a copy of clawdbot to your global pnpm store.

#### Steps:

1. **Navigate to the clawdbot directory:**
   ```bash
   cd ~/aiworker/clawdbot
   ```

2. **Build the project:**
   ```bash
   pnpm install
   pnpm build
   ```

3. **Install globally:**
   ```bash
   pnpm install -g .
   ```

#### Advantages:
- ✅ Independent of source directory location
- ✅ Stable installation

#### Disadvantages:
- ❌ Updates require reinstalling
- ❌ Takes up more disk space

---

### Method 3: Using npm install -g

Similar to Method 2, but using npm instead of pnpm.

#### Steps:

1. **Navigate to the clawdbot directory:**
   ```bash
   cd ~/aiworker/clawdbot
   ```

2. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

3. **Install globally:**
   ```bash
   npm install -g .
   ```

---

### Method 4: Manual Symlink

Create a manual symlink to the clawdbot executable.

#### Steps:

1. **Navigate to the clawdbot directory and build:**
   ```bash
   cd ~/aiworker/clawdbot
   pnpm install
   pnpm build
   ```

2. **Create symlink to a directory in your PATH:**
   ```bash
   # For pnpm users (macOS/Linux)
   ln -s ~/aiworker/clawdbot/dist/entry.js ~/Library/pnpm/clawdbot
   chmod +x ~/Library/pnpm/clawdbot

   # Alternative: Use /usr/local/bin
   sudo ln -s ~/aiworker/clawdbot/dist/entry.js /usr/local/bin/clawdbot
   sudo chmod +x /usr/local/bin/clawdbot
   ```

3. **Ensure the target directory is in your PATH:**
   ```bash
   echo $PATH
   ```

---

## Verification

After installation, verify that clawdbot is accessible globally:

### 1. Check command availability:
```bash
which clawdbot
```

**Expected output:**
```
/Users/yourname/Library/pnpm/clawdbot
# or
/usr/local/bin/clawdbot
```

### 2. Check version:
```bash
clawdbot --version
```

**Expected output:**
```
2026.1.25
```

### 3. Display help menu:
```bash
clawdbot --help
```

**Expected output:**
```
🦞 Clawdbot 2026.1.25 (commit-hash) — Your messages, your servers, Meta's tears.

Usage: clawdbot [options] [command]
...
```

### 4. Test from a different directory:
```bash
cd ~
clawdbot --version
```

If all commands work, clawdbot is successfully installed globally! 🎉

---

## Post-Installation Setup

After global installation, complete the initial setup:

### 1. Run the onboarding wizard:
```bash
clawdbot onboard
```

This interactive wizard will guide you through:
- Setting up the gateway
- Configuring your workspace
- Installing skills
- Setting up authentication

### 2. Alternatively, use step-by-step setup:

#### Initialize configuration:
```bash
clawdbot setup
```

#### Configure credentials and defaults:
```bash
clawdbot configure
```

#### Check system health:
```bash
clawdbot doctor
```

### 3. Common first commands:

```bash
# Check status
clawdbot status

# Start the gateway
clawdbot gateway

# Start the Terminal UI
clawdbot tui

# View logs
clawdbot logs

# Open the Control UI dashboard
clawdbot dashboard
```

---

## Troubleshooting

### Issue 1: Command not found

**Problem:**
```bash
clawdbot --version
# zsh: command not found: clawdbot
```

**Solutions:**

1. **Check PATH includes pnpm bin directory:**
   ```bash
   echo $PATH | grep pnpm
   ```

   If not present, add to your shell config (`~/.zshrc` or `~/.bashrc`):
   ```bash
   export PATH="$HOME/Library/pnpm:$PATH"
   ```

   Then reload:
   ```bash
   source ~/.zshrc  # or source ~/.bashrc
   ```

2. **Find pnpm global bin directory:**
   ```bash
   pnpm bin -g
   ```

   Add the output to your PATH.

3. **Reinstall using a different method** (try Method 4 with `/usr/local/bin`)

---

### Issue 2: Permission denied

**Problem:**
```bash
clawdbot --version
# zsh: permission denied: clawdbot
```

**Solution:**

Make the file executable:
```bash
chmod +x $(which clawdbot)
```

Or for manual symlink:
```bash
chmod +x ~/aiworker/clawdbot/dist/entry.js
```

---

### Issue 3: Wrong version or outdated

**Problem:**
Clawdbot shows an old version after updating the source.

**Solutions:**

1. **For pnpm link installations:**
   ```bash
   cd ~/aiworker/clawdbot
   git pull
   pnpm install
   pnpm build
   # No need to relink
   ```

2. **For pnpm install -g installations:**
   ```bash
   cd ~/aiworker/clawdbot
   git pull
   pnpm install
   pnpm build
   pnpm install -g .
   ```

---

### Issue 4: Module not found errors

**Problem:**
```
Error: Cannot find module '...'
```

**Solution:**

Ensure all dependencies are installed and the project is built:
```bash
cd ~/aiworker/clawdbot
pnpm install
pnpm build
```

Then reinstall/relink globally.

---

### Issue 5: Multiple clawdbot installations conflict

**Problem:**
Multiple versions installed via different methods.

**Solution:**

1. **Find all installations:**
   ```bash
   which -a clawdbot
   ```

2. **Remove duplicates:**
   ```bash
   # Unlink pnpm global
   cd ~/aiworker/clawdbot
   pnpm unlink --global

   # Or uninstall global package
   pnpm uninstall -g clawdbot
   npm uninstall -g clawdbot

   # Remove manual symlinks
   rm /usr/local/bin/clawdbot
   ```

3. **Reinstall using your preferred method**

---

## Uninstallation

### For pnpm link:
```bash
cd ~/aiworker/clawdbot
pnpm unlink --global
```

### For pnpm install -g:
```bash
pnpm uninstall -g clawdbot
```

### For npm install -g:
```bash
npm uninstall -g clawdbot
```

### For manual symlink:
```bash
rm $(which clawdbot)
# or
rm /usr/local/bin/clawdbot
```

### Complete cleanup (including config and data):
```bash
# Remove clawdbot configuration
clawdbot reset

# Or manually remove
rm -rf ~/.clawdbot
rm -rf ~/.clawdbot-dev

# Remove LaunchAgent services (macOS)
launchctl unload ~/Library/LaunchAgents/com.clawdbot.gateway.plist
rm ~/Library/LaunchAgents/com.clawdbot.gateway.plist
rm ~/Library/LaunchAgents/com.clawdbot.dev.plist
```

---

## Additional Resources

- **Official Documentation**: https://docs.clawd.bot/cli
- **GitHub Repository**: [Check package.json for repository URL]
- **Support**: Create an issue in the GitHub repository

---

## Quick Reference Card

### Installation (Recommended Method)
```bash
cd ~/aiworker/clawdbot
pnpm install && pnpm build
pnpm link --global
```

### Verification
```bash
which clawdbot
clawdbot --version
clawdbot --help
```

### Post-Install Setup
```bash
clawdbot onboard
```

### Update (for pnpm link)
```bash
cd ~/aiworker/clawdbot
git pull
pnpm install && pnpm build
```

### Uninstall
```bash
cd ~/aiworker/clawdbot
pnpm unlink --global
```

---

**Last Updated**: 2026-02-12
**Clawdbot Version**: 2026.1.25
**Node Requirement**: ≥22.12.0
