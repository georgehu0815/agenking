# Dexter VS Code Extension - Development Guide

Complete step-by-step guide to build, test, and develop the Dexter VS Code extension.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Building the Extension](#building-the-extension)
3. [Running & Testing](#running--testing)
4. [Development Workflow](#development-workflow)
5. [Debugging](#debugging)
6. [Testing](#testing)
7. [Packaging](#packaging)
8. [Troubleshooting](#troubleshooting)

## Initial Setup

### Step 1: Prerequisites

Ensure you have:
- ✅ Node.js 18+ or Bun installed
- ✅ VS Code 1.85.0 or higher
- ✅ Git

```bash
# Verify versions
node --version   # Should be v18+
code --version   # Should be 1.85.0+
```

### Step 2: Navigate to Extension Directory

```bash
cd /Users/ghu/aiworker/dexter/dexter-vscode
```

### Step 3: Install Dependencies

```bash
npm install
# or
bun install
```

This will install:
- **Extension dependencies**: vscode API types, esbuild
- **Webview dependencies**: React, Vite, TailwindCSS
- **Test dependencies**: Vitest, Testing Library
- **Agent dependencies**: LangChain, AI model clients

**Expected output:**
```
added 450 packages in 15s
```

### Step 4: Link to Parent Agent Code

The extension needs the main Dexter agent code. Choose **one** of these options:

#### Option A: Symbolic Link (Recommended)

```bash
# From dexter-vscode directory
ln -s ../src ./src/agent-parent
```

#### Option B: Update Import Path

Edit [src/extension.ts](src/extension.ts) line 9:

```typescript
// Change from:
import { Agent } from '../src/agent/agent.js';

// To:
import { Agent } from '../../src/agent/agent.js';
```

#### Option C: Copy Agent Code (Not Recommended)

```bash
cp -r ../src/agent ./src/agent-copy
# Then update imports to use ./agent-copy
```

### Step 5: Verify Environment Variables

The extension reads API keys from the parent project's `.env` file:

```bash
# Verify .env exists in parent directory
cat ../env.example

# Your .env should have:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# TAVILY_API_KEY=tvly-...
# EXA_API_KEY=...
```

### Step 6: Build the Extension

```bash
npm run build
```

**What this does:**
1. Builds extension host (Node.js) → `out/extension.js`
2. Builds webview (React) → `dist/webview.js` and `dist/webview.css`

**Expected output:**
```
✅ Extension built successfully!
✅ Webview built successfully!

Build completed in 2.5s
```

**Verify build outputs:**
```bash
ls -lh out/extension.js
ls -lh dist/webview.js dist/webview.css
```

## Building the Extension

### Build Commands

```bash
# Build everything (production)
npm run build

# Build extension host only
npm run build:extension

# Build webview only
npm run build:webview

# Build for production (minified)
npm run vscode:prepublish
```

### Build Output

```
dexter-vscode/
├── out/
│   └── extension.js          # Extension host bundle (~500KB)
└── dist/
    ├── webview.js            # Webview bundle (~800KB)
    ├── webview.css           # Styles (~50KB)
    └── assets/               # Images, fonts, etc.
```

## Running & Testing

### Method 1: Press F5 (Recommended)

1. Open VS Code in the `dexter-vscode` directory
2. Press **F5** (or **Run → Start Debugging**)
3. A new "Extension Development Host" window opens
4. The extension is automatically loaded

### Method 2: Run from Command Palette

1. In the Extension Development Host window
2. Press **Cmd+Shift+P** (or **Ctrl+Shift+P**)
3. Type: "Dexter: Open AI Chat"
4. Press **Enter**

### Method 3: Click Sidebar Icon

1. Look for the Dexter icon in the Activity Bar (left sidebar)
2. Click it to open the chat panel

### First Test Query

In the Dexter chat:
```
What is the weather like today?
```

**Expected behavior:**
1. Status changes to "Processing..."
2. You see thinking events: "Searching for weather information..."
3. Tool execution appears: "web_search"
4. Final answer is displayed
5. Status returns to "Ready"

## Development Workflow

### Watch Mode for Live Development

```bash
npm run dev
```

This runs both watchers:
- **Extension host watcher** (esbuild): Rebuilds on `.ts` changes in `src/extension.ts`
- **Webview watcher** (Vite): Rebuilds on changes in `src/webview/**`

### Making Changes

#### Change Extension Host Code (src/extension.ts)

1. Make your changes
2. Save the file
3. In Extension Development Host: **Press Cmd+Shift+F5** (Reload Window)
4. Test your changes

**Example: Add logging**

```typescript
// src/extension.ts
private async _handleSendQuery(query: string, userId?: string) {
  console.log('🔍 Received query:', query);  // Add this
  log(`Starting query: ${query}`);
  // ... rest of code
}
```

#### Change Webview Code (src/webview/**)

1. Make your changes
2. Save the file
3. Vite automatically rebuilds
4. In Extension Development Host: Run command **"Developer: Reload Webviews"**
5. Test your changes

**Example: Change header color**

```tsx
// src/webview/components/ChatContainer.tsx
<div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6">
  {/* Changed from blue-purple to green-blue */}
</div>
```

### Adding New Components

1. Create component in `src/webview/components/`
2. Export from the component file
3. Import in parent component
4. Use it!

**Example: Add a "Clear All" button**

```tsx
// src/webview/components/ClearButton.tsx
export function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-red-500 text-white rounded"
    >
      Clear All Messages
    </button>
  );
}

// src/webview/components/ChatContainer.tsx
import { ClearButton } from './ClearButton';

// In render:
<ClearButton onClick={clearMessages} />
```

## Debugging

### Extension Host Debugging

1. Set breakpoints in `src/extension.ts`
2. Press **F5** to start debugging
3. Breakpoints hit when code executes
4. Use Debug Console to inspect variables

**Debug Console commands:**
```javascript
// Inspect active sessions
this._activeSessions

// Check configuration
vscode.workspace.getConfiguration('dexter').get('model')
```

### Webview Debugging

1. In Extension Development Host window
2. **Help → Toggle Developer Tools**
3. Console tab shows webview logs
4. Sources tab for breakpoints

**Console commands:**
```javascript
// Check VS Code API
window.acquireVsCodeApi()

// Inspect React state
$r.props
$r.state
```

### Logging

**Extension Host:**
```typescript
log('Debug message', 'debug');  // Only if enableDebugLogs is true
log('Info message', 'info');
log('Error message', 'error');
```

**Webview:**
```typescript
console.log('[Component] Message');
console.error('[Component] Error');
```

**View Logs:**
- **View → Output → Select "Dexter AI"**

## Testing

### Run All Tests

```bash
npm test
```

### Run Extension Tests Only

```bash
npm run test:extension
```

Tests run with Node.js test runner:
```
✔ Dexter Extension › should activate extension
✔ Dexter Extension › should register commands
✔ Message Handling › should handle sendQuery message
✔ Agent Event Streaming › should format thinking event
✔ Configuration › should have default configuration values

5 tests passed
```

### Run Webview Tests Only

```bash
npm run test:webview
```

Tests run with Vitest:
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

### Watch Mode for Tests

```bash
npm run test:watch
```

Reruns tests automatically when files change.

### Writing New Tests

**Extension Test Example:**

```typescript
// test/extension.test.ts
import { describe, it } from 'node:test';
import * as assert from 'node:assert';

describe('My Feature', () => {
  it('should do something', () => {
    const result = myFunction();
    assert.strictEqual(result, 'expected');
  });
});
```

**Webview Test Example:**

```typescript
// test/webview/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../../src/webview/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test Coverage

```bash
# Generate coverage report
npm run test:webview -- --coverage

# View coverage in browser
open coverage/index.html
```

## Packaging

### Create VSIX Package

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package extension
npm run package
```

**Output:**
```
dexter-vscode-1.0.0.vsix
```

### Install VSIX Locally

```bash
code --install-extension dexter-vscode-1.0.0.vsix
```

### Publish to Marketplace (Future)

```bash
# Create publisher account first: https://marketplace.visualstudio.com/manage

# Login
vsce login your-publisher-name

# Publish
vsce publish
```

## Troubleshooting

### Problem: Extension doesn't activate

**Symptoms:**
- No Dexter icon in sidebar
- Commands don't appear in Command Palette

**Solutions:**

1. Check Output panel: **View → Output → Dexter AI**
   ```
   Look for: "Dexter AI Extension activated successfully"
   ```

2. Check if extension is installed:
   ```bash
   code --list-extensions | grep dexter
   ```

3. Reload window: **Cmd+Shift+P** → "Developer: Reload Window"

4. Check for build errors:
   ```bash
   npm run build
   # Look for errors in output
   ```

### Problem: Webview shows blank screen

**Symptoms:**
- Chat panel is empty
- No UI elements visible

**Solutions:**

1. Check Developer Tools: **Help → Toggle Developer Tools**
   - Look for JavaScript errors
   - Check Network tab for failed resource loads

2. Verify build outputs exist:
   ```bash
   ls -lh dist/webview.js dist/webview.css
   ```

3. Check CSP errors:
   ```
   Look for: "Refused to load..."
   Solution: Check nonce in extension.ts
   ```

4. Rebuild webview:
   ```bash
   npm run build:webview
   ```

5. Reload webview: **Cmd+Shift+P** → "Developer: Reload Webviews"

### Problem: Agent not found error

**Error:**
```
Error: Cannot find module '../src/agent/agent.js'
```

**Solutions:**

1. Check symlink exists:
   ```bash
   ls -l src/agent-parent
   ```

2. Recreate symlink:
   ```bash
   rm src/agent-parent
   ln -s ../src src/agent-parent
   ```

3. Or update import path in `src/extension.ts`

### Problem: API key errors

**Error:**
```
Error: API key not configured
```

**Solutions:**

1. Check parent `.env` file exists:
   ```bash
   cat ../.env | grep API_KEY
   ```

2. Load environment variables:
   ```typescript
   // In extension.ts
   import * as dotenv from 'dotenv';
   dotenv.config({ path: path.join(__dirname, '../../.env') });
   ```

3. Verify keys are set:
   ```bash
   echo $OPENAI_API_KEY
   ```

### Problem: Tests fail

**Symptoms:**
- Import errors
- Module not found
- Type errors

**Solutions:**

1. Install test dependencies:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
   ```

2. Check tsconfig.json includes test files:
   ```json
   {
     "include": ["src/**/*", "test/**/*"]
   }
   ```

3. Clear cache and rebuild:
   ```bash
   rm -rf node_modules out dist
   npm install
   npm run build
   ```

### Problem: Watch mode not working

**Symptoms:**
- Changes don't rebuild
- Have to manually run build

**Solutions:**

1. Check watchers are running:
   ```bash
   npm run dev
   # Should see: "👀 Watching extension for changes..."
   # Should see: "👀 Watching webview for changes..."
   ```

2. Kill and restart:
   ```bash
   # Kill all node processes
   killall node
   # Restart watch
   npm run dev
   ```

3. Use polling (if on network drive):
   ```json
   // vite.config.ts
   export default defineConfig({
     server: {
       watch: {
         usePolling: true
       }
     }
   });
   ```

### Problem: Styles not applying

**Symptoms:**
- UI looks broken
- Colors don't match VS Code theme

**Solutions:**

1. Check CSS is loaded:
   - Open Developer Tools
   - Elements tab → Check `<link>` tags
   - Should see `webview.css`

2. Rebuild with CSS:
   ```bash
   npm run build:webview
   ```

3. Check Tailwind config:
   ```bash
   cat tailwind.config.js
   # Verify content paths are correct
   ```

4. Clear VS Code cache:
   ```bash
   rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage
   ```

## Common Development Tasks

### Task: Add a new tool

1. Add tool in parent project: `../src/tools/`
2. Register in `../src/tools/registry.ts`
3. Test in extension (no changes needed!)

### Task: Change AI model

1. Open VS Code Settings
2. Search "dexter.model"
3. Change to desired model
4. Reload extension

### Task: Add configuration option

1. Edit `package.json`:
   ```json
   "configuration": {
     "properties": {
       "dexter.myNewSetting": {
         "type": "string",
         "default": "value",
         "description": "My new setting"
       }
     }
   }
   ```

2. Use in code:
   ```typescript
   const config = vscode.workspace.getConfiguration('dexter');
   const mySetting = config.get<string>('myNewSetting');
   ```

### Task: Debug agent execution

1. Add breakpoint in Agent.run() in parent project
2. Attach debugger to extension host process
3. Send query from webview
4. Step through agent logic

### Task: Profile performance

1. Open Developer Tools
2. Performance tab
3. Click Record
4. Send query
5. Stop recording
6. Analyze flame graph

## Best Practices

### Code Organization

- ✅ Keep components small and focused
- ✅ Use TypeScript for type safety
- ✅ Add JSDoc comments for complex functions
- ✅ Follow existing naming conventions

### Testing

- ✅ Write tests for new features
- ✅ Test error cases, not just happy path
- ✅ Mock external dependencies
- ✅ Keep tests fast and isolated

### Performance

- ✅ Avoid unnecessary re-renders in React
- ✅ Use `useMemo` and `useCallback` appropriately
- ✅ Batch state updates
- ✅ Minimize bundle size

### Security

- ✅ Never commit API keys
- ✅ Sanitize user input
- ✅ Use CSP in webview
- ✅ Validate messages from webview

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)

## Getting Help

If you're stuck:

1. Check Output panel: **View → Output → Dexter AI**
2. Check Developer Tools Console
3. Search existing issues
4. Ask for help with:
   - VS Code version
   - Node.js version
   - Error messages from Output panel
   - Steps to reproduce
