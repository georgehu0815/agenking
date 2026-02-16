# Dexter VS Code Extension - Complete Installation & Testing Guide

A comprehensive, step-by-step guide to build, install, and test the Dexter VS Code extension.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Building the Extension](#building-the-extension)
4. [Installation Methods](#installation-methods)
5. [Testing the Extension](#testing-the-extension)
6. [Running Automated Tests](#running-automated-tests)
7. [Development Mode](#development-mode)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

✅ **Node.js 18 or higher**
```bash
node --version
# Should output: v18.x.x or higher
```

✅ **npm or bun**
```bash
npm --version
# Should output: 8.x.x or higher
```

✅ **Visual Studio Code 1.85.0 or higher**
```bash
code --version
# Should output: 1.85.0 or higher
```

✅ **Git** (for version control)
```bash
git --version
```

### Required Configuration

✅ **Parent Dexter project must have API keys configured**

Check that `../env` file exists with required keys:
```bash
cat ../.env | grep API_KEY
```

Required environment variables:
- `OPENAI_API_KEY` - For OpenAI models
- `ANTHROPIC_API_KEY` - For Claude models
- `TAVILY_API_KEY` - For web search
- `EXA_API_KEY` - For Exa search

If missing, create or update `../.env`:
```bash
# In parent directory: /Users/ghu/aiworker/dexter/
cat > .env << 'EOF'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...
EOF
```

---

## Initial Setup

### Step 1: Navigate to Extension Directory

```bash
cd /Users/ghu/aiworker/dexter/dexter-vscode
```

Verify you're in the right place:
```bash
pwd
# Should output: /Users/ghu/aiworker/dexter/dexter-vscode

ls -l package.json
# Should show the extension's package.json
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 603 packages in 25s
```

**Verify installation:**
```bash
ls -ld node_modules
# Should show the node_modules directory exists

npm list --depth=0
# Should show all top-level dependencies
```

### Step 3: Verify Parent Agent Code Access

The extension imports the agent from the parent project. Verify the path is correct:

```bash
# Check if parent agent exists
ls -l ../../src/agent/agent.ts

# Should show the agent file
```

If the file doesn't exist, check the import path in `src/extension.ts` (line 12).

---

## Building the Extension

### Method 1: Build Everything (Recommended)

Build both the extension host and webview:

```bash
npm run build
```

**Expected output:**
```
> dexter-vscode@1.0.0 build
> npm run build:extension && npm run build:webview

> dexter-vscode@1.0.0 build:extension
> node build/esbuild.extension.js

✅ Extension built successfully!
  out/extension.js      778.2kb

> dexter-vscode@1.0.0 build:webview
> vite build

vite v7.3.1 building client environment for production...
✓ 499 modules transformed.
../../dist/webview.js                 543.93 kB
✓ built in 1.4s
```

**Verify build outputs:**
```bash
ls -lh out/extension.js dist/webview.js dist/assets/*.css
```

Should show:
```
-rw-r--r--  1 user  staff   778K  out/extension.js
-rw-r--r--  1 user  staff   531K  dist/webview.js
-rw-r--r--  1 user  staff    15K  dist/assets/index-*.css
```

### Method 2: Build Components Separately

**Build extension host only:**
```bash
npm run build:extension
```

**Build webview only:**
```bash
npm run build:webview
```

### Understanding Build Outputs

```
dexter-vscode/
├── out/
│   ├── extension.js           # Extension host bundle (Node.js)
│   └── extension.js.map       # Source map for debugging
└── dist/
    ├── index.html             # Webview HTML entry
    ├── webview.js             # Webview bundle (React)
    ├── webview.js.map         # Source map
    └── assets/
        └── index-*.css        # Compiled styles
```

---

## Installation Methods

### Method A: Development Mode (Recommended for Testing)

This is the **fastest way** to test the extension during development.

#### Step 1: Open Project in VS Code

```bash
# From extension directory
code .
```

#### Step 2: Launch Extension Development Host

**Option 1: Press F5**
- Simply press **F5** on your keyboard
- VS Code will compile and launch automatically

**Option 2: Use Debug Panel**
1. Click the **Run and Debug** icon in the Activity Bar (left sidebar)
2. Select **"Run Extension"** from the dropdown
3. Click the green play button

**Option 3: Use Command Palette**
1. Press **Cmd+Shift+P** (Mac) or **Ctrl+Shift+P** (Windows/Linux)
2. Type: "Debug: Start Debugging"
3. Press Enter

#### Step 3: Verify Extension Loaded

A new window titled **"[Extension Development Host]"** will open.

**Check activation:**
1. Open Output panel: **View → Output**
2. Select **"Dexter AI"** from the dropdown
3. Look for: `"Dexter AI Extension activated successfully"`

**Check sidebar:**
- Look for Dexter icon in the Activity Bar (left sidebar)
- If you don't see it, the extension may not have activated

---

### Method B: Install from VSIX Package

This method creates an installable `.vsix` file for distribution.

#### Step 1: Install Packaging Tool

```bash
npm install -g @vscode/vsce
```

Verify installation:
```bash
vsce --version
```

#### Step 2: Build the Extension

```bash
npm run build
```

#### Step 3: Create VSIX Package

```bash
npm run package
```

**Alternative (direct command):**
```bash
vsce package
```

**Expected output:**
```
 DONE  Packaged: /Users/ghu/aiworker/dexter/dexter-vscode/dexter-vscode-1.0.0.vsix (603 files, 5.2MB)
```

**Verify package created:**
```bash
ls -lh *.vsix
```

Should show:
```
-rw-r--r--  1 user  staff   5.2M  dexter-vscode-1.0.0.vsix
```

#### Step 4: Install VSIX File

**Option 1: Command Line**
```bash
code --install-extension dexter-vscode-1.0.0.vsix
```

**Option 2: VS Code UI**
1. Open VS Code
2. Press **Cmd+Shift+P** (or **Ctrl+Shift+P**)
3. Type: "Extensions: Install from VSIX..."
4. Select the `.vsix` file

**Option 3: Extensions Panel**
1. Click Extensions icon in Activity Bar
2. Click the **"..."** menu (top right)
3. Select **"Install from VSIX..."**
4. Choose the `.vsix` file

#### Step 5: Verify Installation

```bash
# List all extensions
code --list-extensions

# Should include:
# your-publisher-name.dexter-vscode
```

#### Step 6: Restart VS Code

```bash
# Quit and restart VS Code
# Or reload window: Cmd+Shift+P → "Developer: Reload Window"
```

---

### Method C: Symlink for Development

For rapid iteration, you can symlink the extension to VS Code's extensions folder.

#### Step 1: Find Extensions Directory

**macOS/Linux:**
```bash
~/.vscode/extensions/
```

**Windows:**
```bash
%USERPROFILE%\.vscode\extensions\
```

#### Step 2: Create Symlink

**macOS/Linux:**
```bash
ln -s /Users/ghu/aiworker/dexter/dexter-vscode ~/.vscode/extensions/dexter-vscode
```

**Windows (as Administrator):**
```bash
mklink /D "%USERPROFILE%\.vscode\extensions\dexter-vscode" "C:\path\to\dexter-vscode"
```

#### Step 3: Reload VS Code

Press **Cmd+Shift+P** → "Developer: Reload Window"

---

## Testing the Extension

### Phase 1: Verify Extension Loaded

#### 1.1: Check Extension is Active

**Method 1: Output Panel**
```
1. View → Output
2. Select "Dexter AI" from dropdown
3. Look for: "Dexter AI Extension activated successfully"
```

**Method 2: Developer Tools**
```
1. Help → Toggle Developer Tools
2. Console tab
3. Look for: "Dexter AI Extension is now active!"
```

#### 1.2: Check Sidebar Icon

- Dexter icon should appear in Activity Bar (left sidebar)
- Icon should be clickable

If icon is missing:
1. Check Commands: **Cmd+Shift+P** → "Dexter: Open AI Chat"
2. If command exists but no icon, the extension is partially loaded

---

### Phase 2: Basic Functionality Tests

#### 2.1: Open Chat Interface

**Method 1: Click Icon**
- Click Dexter icon in Activity Bar

**Method 2: Command Palette**
```
1. Cmd+Shift+P (or Ctrl+Shift+P)
2. Type: "Dexter: Open AI Chat"
3. Press Enter
```

**Expected result:**
- Chat panel opens in sidebar
- Shows header: "Dexter AI Assistant"
- Shows input box at bottom
- Shows "Ready" status

#### 2.2: Test Basic Query

**Type in chat input:**
```
What is 2+2?
```

Press **Enter** or click **Send**.

**Expected behavior:**
```
1. Status changes to "Processing..."
2. Send button becomes "Cancel"
3. Message counter increases
4. Your query appears in the chat
5. Loading indicator shows
6. Final answer appears: "4" or "2+2 equals 4"
7. Status returns to "Ready"
```

**Verify in Output panel:**
```
View → Output → Select "Dexter AI"

Should see:
[timestamp] ℹ️ Starting query: "What is 2+2?"
[timestamp] ℹ️ Session session-... started
[timestamp] ℹ️ Event: thinking
[timestamp] ℹ️ Event: done
[timestamp] ℹ️ Session session-... completed
```

#### 2.3: Test Tool Execution

**Type in chat:**
```
What's the weather in San Francisco today?
```

**Expected behavior:**
```
1. Status: "Processing..."
2. Thinking event: "I'll search for weather information..."
3. Tool execution shows:
   - Tool: web_search or tavily_search
   - Args: { query: "San Francisco weather today" }
   - Duration: ~1-3 seconds
4. Tool result appears (truncated)
5. Final answer synthesizes the weather info
```

#### 2.4: Test Cancellation

**Send a query:**
```
Tell me a very long story about AI
```

**While processing, click "Cancel" button**

**Expected behavior:**
```
1. Processing stops immediately
2. Status returns to "Ready"
3. Message shows: "Cancelled by user" (or error)
4. Cancel button disappears
5. Can send new queries
```

**Verify in Output:**
```
Should see:
[timestamp] ℹ️ Cancelled session session-...
```

#### 2.5: Test Clear History

**Send a few queries, then click "Clear" button**

**Expected behavior:**
```
1. All messages disappear from chat
2. Message counter shows "0 messages"
3. Input remains functional
4. Status shows "Ready"
```

---

### Phase 3: Advanced Testing

#### 3.1: Test Financial Query (if tools available)

```
What is the current stock price of AAPL?
```

**Expected:**
- Uses `yahoo_finance` or `web_search` tool
- Returns recent stock price
- Shows tool execution details

#### 3.2: Test Multi-Step Reasoning

```
Compare the market cap of Apple and Microsoft
```

**Expected:**
- Multiple tool calls
- Web searches or API calls
- Synthesized comparison in final answer

#### 3.3: Test Error Handling

**Invalid query:**
```
[Empty message - just press Enter]
```

**Expected:**
- Error message: "Query cannot be empty"
- No processing occurs

**Trigger API error** (if possible):
```
Make a query with invalid API key configured
```

**Expected:**
- Error message displays
- Status returns to Ready
- Can retry

#### 3.4: Test Theme Integration

**Switch VS Code theme:**
```
Cmd+Shift+P → "Preferences: Color Theme"
Select different themes
```

**Expected:**
- Chat colors adapt to theme
- Text remains readable
- Borders and backgrounds match theme

---

### Phase 4: Performance Testing

#### 4.1: Response Time

**Simple query:**
```
What is 2+2?
```
**Target:** < 2 seconds for response

**Tool query:**
```
What's the weather?
```
**Target:** < 5 seconds for response

#### 4.2: Memory Usage

**Check VS Code memory:**
```
Help → Toggle Developer Tools → Performance
Record → Send several queries → Stop
```

**Expected:**
- Stable memory usage
- No memory leaks
- Smooth UI updates

#### 4.3: Multiple Queries

**Send 5 queries in sequence:**
```
1. What is 2+2?
2. What is 3+3?
3. What is 4+4?
4. What is 5+5?
5. What is 6+6?
```

**Expected:**
- Each completes successfully
- No slowdown over time
- Message history grows correctly

---

## Running Automated Tests

### Unit Tests

#### Extension Host Tests

```bash
npm run test:extension
```

**Expected output:**
```
✔ Dexter Extension › should activate extension
✔ Dexter Extension › should register commands
✔ Message Handling › should handle sendQuery message
✔ Agent Event Streaming › should format thinking event
✔ Configuration › should have default configuration values

5 tests passed
```

#### Webview Tests

```bash
npm run test:webview
```

**Expected output:**
```
✓ test/webview/useAgentStream.test.ts (10)
  ✓ useAgentStream
    ✓ should initialize with empty state
    ✓ should send webviewReady message on mount
    ✓ should send query to extension
    ✓ should handle agent events
    ✓ should prevent sending while processing

Test Files  1 passed (1)
Tests  10 passed (10)
```

#### All Tests

```bash
npm test
```

Runs both extension and webview tests.

### Test Coverage

```bash
npm run test:webview -- --coverage
```

**View coverage report:**
```bash
open coverage/index.html
```

---

## Development Mode

### Watch Mode for Live Reloading

Start watch mode to automatically rebuild on file changes:

```bash
npm run dev
```

**This runs two watchers:**
1. Extension host watcher (esbuild)
2. Webview watcher (Vite)

**Expected output:**
```
👀 Watching extension for changes...
👀 Watching webview for changes...
```

### Making Changes

#### Changing Extension Host Code

**File:** `src/extension.ts`

1. Make your changes
2. Save the file → automatic rebuild
3. In Extension Development Host window:
   - Press **Cmd+Shift+F5** (Reload Window)
   - Or **Cmd+Shift+P** → "Developer: Reload Window"
4. Test your changes

#### Changing Webview Code

**Files:** `src/webview/**/*.tsx`

1. Make your changes
2. Save the file → automatic rebuild
3. In Extension Development Host window:
   - Press **Cmd+Shift+P**
   - Type: "Developer: Reload Webviews"
   - Press Enter
4. Test your changes

#### Changing Styles

**File:** `src/webview/styles.css`

1. Make your changes
2. Save → automatic rebuild
3. Reload webviews (same as above)
4. See style changes

### Debugging

#### Extension Host Debugging

1. Set breakpoints in `src/extension.ts`
2. Press **F5** to launch
3. Trigger the code path
4. Debugger pauses at breakpoint

**Debug Console commands:**
```javascript
// Inspect sessions
this._activeSessions

// Check config
vscode.workspace.getConfiguration('dexter').get('model')
```

#### Webview Debugging

1. In Extension Development Host window
2. **Help → Toggle Developer Tools**
3. **Console** tab shows logs
4. **Sources** tab for breakpoints
5. **Network** tab for resource loading

**Console commands:**
```javascript
// Check VS Code API
window.acquireVsCodeApi()

// Inspect React component
$r
$r.props
```

---

## Troubleshooting

### Issue: Extension Doesn't Activate

**Symptoms:**
- No Dexter icon in sidebar
- Commands don't appear
- No output in "Dexter AI" channel

**Solutions:**

1. **Check Output panel:**
   ```
   View → Output → Select "Dexter AI"
   Look for activation errors
   ```

2. **Check Developer Tools:**
   ```
   Help → Toggle Developer Tools
   Console tab → Look for errors
   ```

3. **Verify build outputs exist:**
   ```bash
   ls -lh out/extension.js dist/webview.js
   # Both files should exist
   ```

4. **Rebuild and reload:**
   ```bash
   npm run build
   # Then: Cmd+Shift+P → "Developer: Reload Window"
   ```

5. **Check extension is installed:**
   ```bash
   code --list-extensions | grep dexter
   ```

---

### Issue: Webview Shows Blank Screen

**Symptoms:**
- Chat panel is empty
- No UI elements visible
- White or blank screen

**Solutions:**

1. **Check Developer Tools:**
   ```
   Help → Toggle Developer Tools
   Console tab → Look for JavaScript errors
   ```

2. **Common errors and fixes:**

   **"Cannot read properties of undefined"**
   - React component error
   - Check browser console for component name
   - Verify all imports in that component

   **"Failed to load resource"**
   - CSS or JS not found
   - Verify dist/ files exist:
     ```bash
     ls -lh dist/webview.js dist/assets/*.css
     ```
   - Rebuild webview:
     ```bash
     npm run build:webview
     ```

3. **Check Content Security Policy:**
   ```
   Look for: "Refused to load..."
   Solution: Check nonce in extension.ts
   ```

4. **Clear VS Code cache:**
   ```bash
   rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage
   # Restart VS Code
   ```

5. **Rebuild everything:**
   ```bash
   rm -rf out dist
   npm run build
   # Reload: Cmd+Shift+P → "Developer: Reload Window"
   ```

---

### Issue: Agent Errors

**Error:** "Cannot find module '../src/agent/agent.js'"

**Solution:**
```bash
# Verify parent agent exists
ls -l ../../src/agent/agent.ts

# Check import path in src/extension.ts line 12
# Should be: import { Agent } from '../../src/agent/agent.js';
```

**Error:** "API key not configured"

**Solution:**
```bash
# Check parent .env file
cat ../.env | grep API_KEY

# Should show:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# TAVILY_API_KEY=tvly-...
# EXA_API_KEY=...

# If missing, add them to ../.env
```

---

### Issue: Build Fails

**Error:** "Cannot resolve dependencies"

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Error:** "Playwright build errors"

**Solution:**
Already fixed in `build/esbuild.extension.js` - playwright is marked as external.
If still occurring:
```bash
# Check external dependencies list
cat build/esbuild.extension.js | grep -A 10 "external:"
```

**Error:** "Vite: Could not resolve entry module"

**Solution:**
```bash
# Verify index.html exists
ls -l src/webview/index.html

# Verify vite.config.ts points to correct path
cat vite.config.ts | grep input
```

---

### Issue: Tests Fail

**Error:** "Module not found in tests"

**Solution:**
```bash
# Install test dependencies
npm install --save-dev @testing-library/react@^16.1.0 @testing-library/jest-dom jsdom

# Verify tsconfig.json includes test files
cat tsconfig.json | grep include
```

**Error:** "VS Code API not found in tests"

**Solution:**
Tests mock the VS Code API. Check `test/webview/setup.ts`:
```typescript
global.window = {
  acquireVsCodeApi: () => ({
    postMessage: mockFn,
    getState: mockFn,
    setState: mockFn,
  }),
} as any;
```

---

## Quick Reference

### Essential Commands

```bash
# Install dependencies
npm install

# Build everything
npm run build

# Build extension only
npm run build:extension

# Build webview only
npm run build:webview

# Watch mode (auto-rebuild)
npm run dev

# Run all tests
npm test

# Run extension tests
npm run test:extension

# Run webview tests
npm run test:webview

# Package extension
npm run package

# Install VSIX
code --install-extension dexter-vscode-1.0.0.vsix
```

### Keyboard Shortcuts

```
F5                      - Launch extension development host
Cmd+Shift+F5           - Reload extension development host
Cmd+Shift+P            - Command palette
Cmd+Shift+I            - Toggle Developer Tools
Cmd+,                  - Open settings
```

### Important Paths

```
Extension source:       src/extension.ts
Webview source:        src/webview/
Built extension:       out/extension.js
Built webview:         dist/webview.js
Tests:                 test/
Configuration:         package.json
Build configs:         build/esbuild.extension.js, vite.config.ts
```

### Log Locations

```
Extension logs:        View → Output → "Dexter AI"
Webview logs:         Help → Toggle Developer Tools → Console
VS Code logs:         Help → Toggle Developer Tools
```

---

## Success Checklist

Before considering your installation complete, verify:

- [ ] Extension builds without errors
- [ ] Extension activates in development host
- [ ] Dexter icon appears in sidebar
- [ ] Chat interface loads
- [ ] Can send a simple query
- [ ] Streaming events display
- [ ] Final answer appears
- [ ] Cancel button works
- [ ] Clear button works
- [ ] All unit tests pass
- [ ] Theme adapts to VS Code theme
- [ ] No errors in Output panel
- [ ] No errors in Developer Tools console

---

## Getting Help

If you're still stuck after following this guide:

1. **Check logs:**
   - Extension: View → Output → "Dexter AI"
   - Webview: Help → Toggle Developer Tools → Console

2. **Review documentation:**
   - [README.md](README.md) - Complete guide
   - [QUICKSTART.md](QUICKSTART.md) - Quick setup
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflow
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

3. **Common issues:**
   - Review the Troubleshooting section above
   - Check [SETUP_COMPLETE.md](SETUP_COMPLETE.md)

4. **Clean slate:**
   ```bash
   # Nuclear option - start fresh
   rm -rf node_modules out dist
   npm install
   npm run build
   ```

---

**You're now ready to build, install, and test the Dexter VS Code Extension!** 🎉
