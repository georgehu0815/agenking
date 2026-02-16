# Dexter VS Code Extension - Quick Start

Get up and running in 5 minutes! 🚀

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ VS Code 1.85.0+ installed
- ✅ Parent Dexter project has API keys configured

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd /Users/ghu/aiworker/dexter/dexter-vscode
npm install
code --extensionDevelopmentPath=/Users/ghu/aiworker/dexter/dexter-vscode

```

### 2. Link Agent Code (30 sec)

```bash
ln -s ../src ./src/agent-parent
```

Or edit `src/extension.ts` line 9 to point to the correct agent path.

### 3. Build Everything (1 min)

```bash
npm run build
```

Expected output:
```
✅ Extension built successfully!
✅ Webview built successfully!
```

### 4. Launch Extension (30 sec)

In VS Code:
1. Press **F5**
2. New "Extension Development Host" window opens

### 5. Test It! (1 min)

In the Extension Development Host:
1. Click Dexter icon in sidebar (left)
2. Type: "What is 2+2?"
3. Press Enter
4. Watch the agent respond!

## What's Next?

- 📖 Read [README.md](README.md) for full documentation
- 🛠️ Read [DEVELOPMENT.md](DEVELOPMENT.md) for development guide
- 🧪 Run tests: `npm test`
- 🔍 Enable watch mode: `npm run dev`

## Quick Troubleshooting

### Problem: Can't find agent module

```bash
# Solution: Check symlink
ls -l src/agent-parent
# If broken, recreate:
ln -sf ../src src/agent-parent
```

### Problem: Build fails

```bash
# Solution: Clean and rebuild
rm -rf node_modules out dist
npm install
npm run build
```

### Problem: Extension doesn't appear

1. Check Output: **View → Output → Dexter AI**
2. Reload: **Cmd+Shift+P** → "Developer: Reload Window"
3. Rebuild: `npm run build`

### Problem: API errors

```bash
# Solution: Check parent .env file
cat ../.env | grep API_KEY
```

## Development Workflow

```bash
# Start watch mode
npm run dev

# Make changes to:
# - src/extension.ts (extension host)
# - src/webview/** (React components)

# Reload:
# - Extension host: Cmd+Shift+F5
# - Webview: Cmd+Shift+P → "Reload Webviews"

# Run tests
npm test
```

## File Structure (Simplified)

```
dexter-vscode/
├── src/
│   ├── extension.ts           # 👈 Extension host (Node.js)
│   ├── shared/types.ts        # 👈 Shared types
│   └── webview/               # 👈 React app
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/        # UI components (from web app)
│       └── hooks/             # React hooks (adapted)
├── test/                      # Unit tests
├── package.json               # Extension manifest
└── README.md                  # Full docs
```

## Key Commands

```bash
# Build
npm run build                  # Build everything
npm run build:extension        # Extension only
npm run build:webview          # Webview only

# Development
npm run dev                    # Watch mode
npm run test                   # Run all tests
npm run test:watch             # Test watch mode

# Package
npm run package                # Create .vsix file
```

## Testing Checklist

- [ ] Extension activates (check Output panel)
- [ ] Dexter icon appears in sidebar
- [ ] Chat interface loads
- [ ] Can send a message
- [ ] See streaming events
- [ ] Get final answer
- [ ] Cancel button works
- [ ] Clear button works

## Need Help?

1. **Check logs**: View → Output → Dexter AI
2. **Check console**: Help → Toggle Developer Tools
3. **Read docs**: [README.md](README.md), [DEVELOPMENT.md](DEVELOPMENT.md)
4. **Common issues**: See [Troubleshooting](#quick-troubleshooting) above

## Next Steps

### For Users
- Install locally: `code --install-extension dexter-vscode-1.0.0.vsix`
- Configure settings: Search "Dexter" in VS Code settings
- Try different queries: Financial research, code questions, web search

### For Developers
- Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed dev guide
- Write tests for new features
- Add new components
- Customize UI/UX

---

**Happy coding! 🎉**

If you got this far in under 5 minutes, you're ready to use and develop the Dexter VS Code extension!
