# VS Code Extension with WebSocket Gateway

Last updated: 2026-02-15

Guide for converting the webapp to a VS Code extension using WebSocket gateway connection.

## Overview

The VS Code extension will embed the React webapp UI in a webview panel and connect to the gateway server via WebSocket, enabling AI chat directly within VS Code with access to editor context.

## Architecture Comparison

### Current Webapp
```
React App (Browser) → WebSocket → Gateway Server (18789)
```

### VS Code Extension - Option A (Direct Connection)
```
VS Code Extension
  └─ Webview Panel (React App)
       └─ WebSocket → Gateway Server (18789)
```

### VS Code Extension - Option B (Proxied Connection)
```
VS Code Extension Host (Node.js)
  ├─ WebSocket Client → Gateway Server (18789)
  └─ Webview Panel (React UI)
       └─ postMessage API ↔ Extension Host
```

## Implementation: Option A (Direct WebSocket from Webview)

### Project Structure

```
vscode-extension/
├── package.json              # Extension manifest
├── src/
│   ├── extension.ts         # Extension entry point
│   ├── webview/            # React app (from webapp)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   └── gateway-client.ts  # Same as webapp
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── panels/
│       └── ChatPanel.ts     # Webview panel manager
└── tsconfig.json
```

### Step 1: Extension Entry Point

**File:** `src/extension.ts`

```typescript
import * as vscode from "vscode";
import { ChatPanel } from "./panels/ChatPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("Clawdbot extension activated");

  // Register command to open chat panel
  const openChatCommand = vscode.commands.registerCommand(
    "clawdbot.openChat",
    () => {
      ChatPanel.render(context.extensionUri);
    }
  );

  context.subscriptions.push(openChatCommand);

  // Optional: Auto-open on startup
  // ChatPanel.render(context.extensionUri);
}

export function deactivate() {
  console.log("Clawdbot extension deactivated");
}
```

### Step 2: Webview Panel Manager

**File:** `src/panels/ChatPanel.ts`

```typescript
import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    // Set webview content
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );

    // Listen for disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case "info":
            vscode.window.showInformationMessage(message.text);
            break;
          case "error":
            vscode.window.showErrorMessage(message.text);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static render(extensionUri: vscode.Uri) {
    if (ChatPanel.currentPanel) {
      // Panel already exists, reveal it
      ChatPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
      // Create new panel
      const panel = vscode.window.createWebviewPanel(
        "clawdbot-chat",
        "Clawdbot Chat",
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "out"),
            vscode.Uri.joinPath(extensionUri, "webview-ui/build"),
          ],
        }
      );

      ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    // Get URIs for webview assets
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "webview-ui", "build", "assets", "index.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "webview-ui", "build", "assets", "index.css")
    );

    const nonce = getNonce();

    // Get gateway URL from settings
    const config = vscode.workspace.getConfiguration("clawdbot");
    const gatewayUrl = config.get<string>("gatewayUrl", "ws://localhost:18789");
    const authToken = config.get<string>("authToken", "");

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                       style-src ${webview.cspSource} 'unsafe-inline';
                       script-src 'nonce-${nonce}';
                       connect-src ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:*;
                       img-src ${webview.cspSource} https:;
                       font-src ${webview.cspSource};" />
        <link rel="stylesheet" type="text/css" href="${styleUri}">
        <title>Clawdbot Chat</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}">
          window.vscodeConfig = {
            gatewayUrl: "${gatewayUrl}",
            authToken: "${authToken}"
          };
        </script>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
  }
}
```

### Step 3: Utilities

**File:** `src/utilities/getNonce.ts`

```typescript
export function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

### Step 4: Update React App for VS Code

**File:** `webview-ui/src/main.tsx`

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Declare VS Code API
declare global {
  interface Window {
    acquireVsCodeApi: () => any;
    vscodeConfig: {
      gatewayUrl: string;
      authToken: string;
    };
  }
}

// Get VS Code API (only available in webview)
const vscode = window.acquireVsCodeApi?.();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App vscode={vscode} />
  </React.StrictMode>
);
```

**File:** `webview-ui/src/App.tsx`

```typescript
import { useState, useEffect } from "react";
import { ChatContainer } from "./components/ChatContainer";
import { GatewayClient } from "./lib/gateway-client";

interface AppProps {
  vscode?: any;
}

export default function App({ vscode }: AppProps) {
  const [client, setClient] = useState<GatewayClient | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const gatewayUrl = window.vscodeConfig?.gatewayUrl || "ws://localhost:18789";
    const authToken = window.vscodeConfig?.authToken || "";

    const gateway = new GatewayClient(gatewayUrl);

    gateway
      .connect(
        {
          id: "vscode-extension",
          displayName: "VS Code Extension",
          mode: "ui",
          platform: "vscode",
          version: "1.0.0",
        },
        authToken ? { token: authToken } : undefined
      )
      .then(() => {
        setConnected(true);
        vscode?.postMessage({ type: "info", text: "Connected to gateway" });
      })
      .catch((err) => {
        setConnected(false);
        vscode?.postMessage({ type: "error", text: `Connection failed: ${err.message}` });
      });

    setClient(gateway);

    return () => {
      gateway.disconnect();
    };
  }, [vscode]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Connecting to gateway...</p>
        </div>
      </div>
    );
  }

  return <ChatContainer client={client!} vscode={vscode} />;
}
```

### Step 5: Extension Manifest

**File:** `package.json`

```json
{
  "name": "clawdbot-vscode",
  "displayName": "Clawdbot AI Assistant",
  "description": "AI assistant with WebSocket gateway integration",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "clawdbot.openChat",
        "title": "Clawdbot: Open Chat"
      }
    ],
    "configuration": {
      "title": "Clawdbot",
      "properties": {
        "clawdbot.gatewayUrl": {
          "type": "string",
          "default": "ws://localhost:18789",
          "description": "Gateway WebSocket URL"
        },
        "clawdbot.authToken": {
          "type": "string",
          "default": "",
          "description": "Gateway authentication token"
        }
      }
    },
    "keybindings": [
      {
        "command": "clawdbot.openChat",
        "key": "ctrl+shift+c",
        "mac": "cmd+shift+c"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./ && cd webview-ui && npm run build",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/vscode": "^1.85.0",
    "typescript": "^5.3.0"
  }
}
```

## Implementation: Option B (Proxied Connection)

For tighter integration, the extension host can manage the WebSocket connection:

### Extension Host WebSocket Manager

**File:** `src/gateway/GatewayConnection.ts`

```typescript
import WebSocket from "ws";
import * as vscode from "vscode";

export class GatewayConnection {
  private ws: WebSocket | null = null;
  private connected = false;
  private requestCallbacks = new Map<string, (response: any) => void>();
  private eventHandlers = new Map<string, (payload: any) => void>();
  private nextRequestId = 1;

  constructor(
    private url: string,
    private authToken: string,
    private outputChannel: vscode.OutputChannel
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on("open", () => {
        this.outputChannel.appendLine("[Gateway] WebSocket opened");
        this.sendConnect();
      });

      this.ws.on("message", (data: Buffer) => {
        const frame = JSON.parse(data.toString());

        if (frame.type === "res") {
          if (frame.id === "connect" && frame.ok) {
            this.connected = true;
            this.outputChannel.appendLine("[Gateway] Connected successfully");
            resolve();
          }

          const callback = this.requestCallbacks.get(frame.id);
          if (callback) {
            callback(frame);
            this.requestCallbacks.delete(frame.id);
          }
        } else if (frame.type === "event") {
          const handlers = this.eventHandlers.get(frame.event);
          if (handlers) {
            handlers(frame.payload);
          }
        }
      });

      this.ws.on("error", (err) => {
        this.outputChannel.appendLine(`[Gateway] Error: ${err.message}`);
        reject(err);
      });

      this.ws.on("close", () => {
        this.outputChannel.appendLine("[Gateway] Connection closed");
        this.connected = false;
      });
    });
  }

  private sendConnect() {
    this.send({
      type: "req",
      id: "connect",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "vscode-extension",
          displayName: "VS Code Extension",
          version: "1.0.0",
          platform: "vscode",
          mode: "ui",
        },
        auth: this.authToken ? { token: this.authToken } : undefined,
      },
    });
  }

  private send(frame: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  async request(method: string, params?: any): Promise<any> {
    if (!this.connected) {
      throw new Error("Not connected to gateway");
    }

    const id = `r${this.nextRequestId++}`;

    return new Promise((resolve, reject) => {
      this.requestCallbacks.set(id, (frame) => {
        if (frame.ok) {
          resolve(frame.payload);
        } else {
          reject(new Error(frame.error?.message || "Request failed"));
        }
      });

      this.send({ type: "req", id, method, params });

      setTimeout(() => {
        if (this.requestCallbacks.has(id)) {
          this.requestCallbacks.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }

  onEvent(event: string, handler: (payload: any) => void) {
    this.eventHandlers.set(event, handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}
```

### Updated Extension Entry Point

**File:** `src/extension.ts`

```typescript
import * as vscode from "vscode";
import { GatewayConnection } from "./gateway/GatewayConnection";
import { ChatPanel } from "./panels/ChatPanel";

let gatewayConnection: GatewayConnection | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("Clawdbot");
  outputChannel.show();

  // Get configuration
  const config = vscode.workspace.getConfiguration("clawdbot");
  const gatewayUrl = config.get<string>("gatewayUrl", "ws://localhost:18789");
  const authToken = config.get<string>("authToken", "");

  // Connect to gateway
  gatewayConnection = new GatewayConnection(gatewayUrl, authToken, outputChannel);

  try {
    await gatewayConnection.connect();
    vscode.window.showInformationMessage("Connected to Clawdbot gateway");
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to connect to gateway: ${err}`);
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("clawdbot.openChat", () => {
      ChatPanel.render(context.extensionUri, gatewayConnection!);
    })
  );

  // Listen for agent events and show in output channel
  gatewayConnection.onEvent("agent", (payload) => {
    outputChannel.appendLine(`[Agent Event] ${JSON.stringify(payload)}`);
  });

  context.subscriptions.push(outputChannel);
}

export function deactivate() {
  gatewayConnection?.disconnect();
}
```

## Enhanced VS Code Features

Once connected to the gateway, you can add VS Code-specific features:

### 1. Insert AI Response into Editor

```typescript
vscode.commands.registerCommand("clawdbot.insertResponse", async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const response = await gatewayConnection.request("chat.send", {
    text: "Generate a function",
    idempotencyKey: `insert-${Date.now()}`,
  });

  editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, response.text);
  });
});
```

### 2. Use Current File as Context

```typescript
const editor = vscode.window.activeTextEditor;
if (editor) {
  const fileContent = editor.document.getText();
  const fileName = editor.document.fileName;

  await gatewayConnection.request("chat.send", {
    text: `Analyze this code:\n\n${fileContent}`,
    context: {
      file: fileName,
      language: editor.document.languageId,
    },
  });
}
```

### 3. Show Progress Indicator

```typescript
vscode.window.withProgress(
  {
    location: vscode.ProgressLocation.Notification,
    title: "Clawdbot is thinking...",
    cancellable: true,
  },
  async (progress, token) => {
    token.onCancellationRequested(() => {
      gatewayConnection.request("chat.abort", { sessionId: currentSession });
    });

    return gatewayConnection.request("chat.send", { text: query });
  }
);
```

### 4. Status Bar Item

```typescript
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
statusBarItem.text = "$(hubot) Clawdbot";
statusBarItem.command = "clawdbot.openChat";
statusBarItem.show();
```

## Build and Package

### Development

```bash
# Install dependencies
npm install

# Build extension
npm run compile

# Build webview
cd webview-ui
npm install
npm run build
cd ..

# Run in VS Code
# Press F5 to open Extension Development Host
```

### Package for Distribution

```bash
# Install vsce
npm install -g @vscode/vsce

# Package extension
vsce package

# This creates clawdbot-vscode-0.1.0.vsix
```

### Install Locally

```bash
code --install-extension clawdbot-vscode-0.1.0.vsix
```

## Configuration

Users can configure the extension via VS Code settings:

**File:** `.vscode/settings.json`

```json
{
  "clawdbot.gatewayUrl": "ws://localhost:18789",
  "clawdbot.authToken": "your-auth-token-here"
}
```

## Comparison: Webapp vs VS Code Extension

| Feature | Webapp | VS Code Extension |
|---------|--------|-------------------|
| UI Framework | React (standalone browser) | React (webview) |
| WebSocket Client | Browser WebSocket API | Same or Node.js ws |
| Distribution | Web server | VSIX package |
| Integration | None | Full VS Code API access |
| Context | Browser only | Editor files, workspace |
| Installation | URL | Marketplace / VSIX |
| Updates | Deploy server | Extension update |

## Code Reuse

**Can be reused 100%:**
- React components (ChatContainer, MessageList, etc.)
- GatewayClient class
- TypeScript types and interfaces
- Tailwind CSS styles
- Utility functions

**Needs adaptation:**
- Entry point (main.tsx)
- Environment configuration
- Asset bundling (Vite config)
- CSP configuration

**Extension-specific:**
- Extension manifest (package.json)
- Extension host code (extension.ts)
- Webview panel manager (ChatPanel.ts)
- VS Code API integrations

## Security Considerations

1. **Content Security Policy**: Webviews require CSP configuration to allow WebSocket connections
2. **Authentication**: Store tokens securely using VS Code's SecretStorage API
3. **Gateway URL**: Validate and sanitize user-provided URLs
4. **Message Validation**: Validate all messages between webview and extension host

## References

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Webapp Migration Guide](./webapp-websocket-migration.md)
- [Gateway Protocol](../concepts/typebox.md)

---

**Status:** Ready for implementation
**Estimated Effort:** 2-3 days (if webapp is already WebSocket-ready)
**Code Reuse:** ~90% of webapp code
