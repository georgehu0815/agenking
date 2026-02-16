# Dexter VS Code Extension - Architecture

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VS Code                                 │
│  ┌────────────────────────┐      ┌─────────────────────────┐   │
│  │   Extension Host       │      │   Webview (Browser)     │   │
│  │   (Node.js Process)    │◄────►│   (React App)           │   │
│  └────────────────────────┘      └─────────────────────────┘   │
│             │                                                    │
│             │                                                    │
│             ▼                                                    │
│  ┌────────────────────────┐                                     │
│  │  Parent Project        │                                     │
│  │  - Agent               │                                     │
│  │  - Tools               │                                     │
│  │  - LLM Integration     │                                     │
│  └────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow

### 1. User Sends Query

```
┌────────┐
│  User  │
└───┬────┘
    │ Types query and presses Enter
    ▼
┌────────────────────────────────────┐
│  Webview (React)                   │
│  ┌──────────────────────────────┐  │
│  │  InputBox.tsx                │  │
│  │  - Captures user input       │  │
│  │  - Calls onSend()            │  │
│  └──────────┬───────────────────┘  │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  ChatContainer.tsx           │  │
│  │  - handleSend()              │  │
│  │  - Calls sendMessage()       │  │
│  └──────────┬───────────────────┘  │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  useAgentStream.ts           │  │
│  │  - Creates Message object    │  │
│  │  - Sets isProcessing=true    │  │
│  │  - Calls sendQuery()         │  │
│  └──────────┬───────────────────┘  │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  useVSCodeMessaging.ts       │  │
│  │  - vscode.postMessage({      │  │
│  │      type: 'sendQuery',      │  │
│  │      query: '...'            │  │
│  │    })                        │  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │ postMessage
              ▼
┌─────────────────────────────────────┐
│  Extension Host (Node.js)           │
│  ┌───────────────────────────────┐  │
│  │  extension.ts                 │  │
│  │  - onDidReceiveMessage()      │  │
│  │  - _handleSendQuery()         │  │
│  │    ├─ Create session          │  │
│  │    ├─ Create Agent            │  │
│  │    └─ Start Agent.run()       │  │
│  └───────────┬───────────────────┘  │
└──────────────┼─────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  Agent.run() │
        │  (async gen) │
        └──────┬───────┘
               │ Yields events
```

### 2. Agent Processes Query

```
┌─────────────────────────────────────┐
│  Agent.run() - Iteration Loop       │
│  ┌───────────────────────────────┐  │
│  │  1. Call LLM                  │  │
│  │     - Build prompt            │  │
│  │     - Send to AI model        │  │
│  │     - Get response            │  │
│  └───────────┬───────────────────┘  │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │  2. Extract Tool Calls        │  │
│  │     - Parse AI response       │  │
│  │     - Identify tools to use   │  │
│  └───────────┬───────────────────┘  │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │  3. Execute Tools             │  │
│  │     - web_search              │  │
│  │     - yahoo_finance           │  │
│  │     - browser                 │  │
│  │     etc.                      │  │
│  └───────────┬───────────────────┘  │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │  4. Add Results to Context    │  │
│  │     - Update scratchpad       │  │
│  │     - Build next prompt       │  │
│  └───────────┬───────────────────┘  │
│              │                       │
│  └──────────▶│ Loop or Done?        │
│              │                       │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │  5. Generate Final Answer     │  │
│  │     - Synthesize results      │  │
│  │     - Format response         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3. Stream Events Back to UI

```
┌─────────────────────────────────────┐
│  Agent.run()                        │
│  - yield { type: 'thinking' }       │
│  - yield { type: 'tool_start' }     │
│  - yield { type: 'tool_end' }       │
│  - yield { type: 'done' }           │
└──────────┬──────────────────────────┘
           │ Each event
           ▼
┌─────────────────────────────────────┐
│  Extension Host                     │
│  ┌───────────────────────────────┐  │
│  │  for await (event of agent)   │  │
│  │    webview.postMessage({      │  │
│  │      type: 'agentEvent',      │  │
│  │      event: event,            │  │
│  │      sessionId: '...'         │  │
│  │    })                         │  │
│  └──────────┬────────────────────┘  │
└─────────────┼───────────────────────┘
              │ postMessage
              ▼
┌─────────────────────────────────────┐
│  Webview                            │
│  ┌───────────────────────────────┐  │
│  │  window.addEventListener(     │  │
│  │    'message',                 │  │
│  │    handleMessage              │  │
│  │  )                            │  │
│  └──────────┬────────────────────┘  │
│             ▼                       │
│  ┌───────────────────────────────┐  │
│  │  useVSCodeMessaging.ts        │  │
│  │  - Receives message           │  │
│  │  - Calls onMessage callback   │  │
│  └──────────┬────────────────────┘  │
│             ▼                       │
│  ┌───────────────────────────────┐  │
│  │  useAgentStream.ts            │  │
│  │  - handleExtensionMessage()   │  │
│  │  - Updates message state      │  │
│  │  - Appends event to message   │  │
│  └──────────┬────────────────────┘  │
│             ▼                       │
│  ┌───────────────────────────────┐  │
│  │  React Re-render              │  │
│  │  - MessageList updates        │  │
│  │  - EventStream shows event    │  │
│  │  - UI reflects new state      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              │
              ▼
          ┌────────┐
          │  User  │
          │  Sees  │
          │ Update │
          └────────┘
```

## Message Types

### Webview → Extension

```typescript
type WebviewToExtensionMessage =
  | { type: 'sendQuery'; query: string; userId?: string }
  | { type: 'cancelQuery' }
  | { type: 'clearHistory' }
  | { type: 'webviewReady' };
```

### Extension → Webview

```typescript
type ExtensionToWebviewMessage =
  | { type: 'agentEvent'; event: AgentEvent; sessionId: string }
  | { type: 'error'; error: string }
  | { type: 'sessionStarted'; sessionId: string }
  | { type: 'sessionCancelled'; sessionId: string }
  | { type: 'historyCleared' };
```

### Agent Events

```typescript
type AgentEvent =
  | { type: 'thinking'; message: string }
  | { type: 'tool_start'; tool: string; args: any }
  | { type: 'tool_end'; tool: string; result: string; duration: number }
  | { type: 'tool_error'; tool: string; error: string }
  | { type: 'done'; answer: string; iterations: number; totalTime: number }
  // ... etc
```

## Component Communication

```
┌────────────────────────────────────────────────────────────┐
│                      Webview (React)                       │
│                                                            │
│  ┌──────────────┐                                         │
│  │     App      │                                         │
│  └──────┬───────┘                                         │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────────┐                                     │
│  │  ChatContainer   │◄─────┐                              │
│  └──────┬───────────┘      │                              │
│         │                  │                              │
│         │ Uses             │ Provides                     │
│         ▼                  │                              │
│  ┌──────────────────┐      │                              │
│  │ useAgentStream() │──────┘                              │
│  │  - messages      │                                     │
│  │  - isProcessing  │                                     │
│  │  - sendMessage() │                                     │
│  └──────┬───────────┘                                     │
│         │                                                  │
│         │ Uses                                             │
│         ▼                                                  │
│  ┌────────────────────────┐                               │
│  │ useVSCodeMessaging()   │◄─────┐                        │
│  │  - sendQuery()         │      │                        │
│  │  - cancelQuery()       │      │ Provides               │
│  └────────┬───────────────┘      │                        │
│           │                      │                        │
│           │ Uses                 │                        │
│           ▼                      │                        │
│  ┌────────────────────────┐      │                        │
│  │   VS Code API          │──────┘                        │
│  │   - postMessage()      │                               │
│  │   - addEventListener() │                               │
│  └────────────────────────┘                               │
│           │                                                │
└───────────┼────────────────────────────────────────────────┘
            │ Message Passing
            ▼
┌────────────────────────────────────────────────────────────┐
│                  Extension Host (Node.js)                  │
│                                                            │
│  ┌────────────────────────┐                               │
│  │ DexterChatViewProvider │                               │
│  │  - resolveWebviewView()│                               │
│  │  - _handleMessage()    │                               │
│  │  - _postMessage()      │                               │
│  └────────┬───────────────┘                               │
│           │                                                │
│           │ Creates & Manages                              │
│           ▼                                                │
│  ┌────────────────────────┐                               │
│  │   Agent Sessions       │                               │
│  │   Map<id, session>     │                               │
│  └────────┬───────────────┘                               │
│           │                                                │
│           │ Each session has                               │
│           ▼                                                │
│  ┌────────────────────────┐                               │
│  │   Agent Instance       │                               │
│  │   - run(query)         │                               │
│  │   - AbortController    │                               │
│  └────────┬───────────────┘                               │
│           │                                                │
│           │ Imports from                                   │
│           ▼                                                │
│  ┌────────────────────────┐                               │
│  │  Parent Project        │                               │
│  │  ../src/agent/         │                               │
│  └────────────────────────┘                               │
└────────────────────────────────────────────────────────────┘
```

## State Management

### Webview State (React)

```typescript
// In useAgentStream hook
const [messages, setMessages] = useState<Message[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const [error, setError] = useState<string | null>(null);
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

// Message structure
interface Message {
  id: string;              // 'msg-1234567890'
  query: string;           // User's question
  userId: string;          // 'anonymous' or user ID
  timestamp: number;       // Date.now()
  events: AgentEvent[];    // All events for this message
  answer?: string;         // Final answer
  isProcessing: boolean;   // Currently processing?
  error?: string;          // Error message if failed
}
```

### Extension Host State

```typescript
// In DexterChatViewProvider
private _activeSessions = new Map<string, AgentSession>();

interface AgentSession {
  sessionId: string;        // 'session-1234567890'
  abortController: AbortController;
  agent: Agent;
}
```

## Lifecycle

### Extension Activation

```
1. VS Code starts
2. Extension registered (package.json)
3. activate() called
   ├─ Create output channel
   ├─ Register webview view provider
   └─ Register commands
4. Extension active, waiting for user
```

### Query Lifecycle

```
1. User types query in webview
2. Webview sends 'sendQuery' message
3. Extension host receives message
4. Create new Agent session
5. Send 'sessionStarted' to webview
6. Start Agent.run() iterator
7. For each event from agent:
   ├─ Send 'agentEvent' to webview
   └─ Webview updates UI
8. Agent completes
9. Clean up session
10. UI shows final answer
```

### Cancellation Flow

```
1. User clicks Cancel button
2. Webview sends 'cancelQuery' message
3. Extension host receives message
4. Call abortController.abort()
5. Agent.run() throws AbortError
6. Catch error, clean up session
7. Send 'sessionCancelled' to webview
8. Webview updates UI to show cancelled
```

## Security

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               style-src ${webview.cspSource} 'unsafe-inline';
               script-src 'nonce-${nonce}';">
```

### Nonce Generation

```typescript
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

### Resource URIs

```typescript
const scriptUri = webview.asWebviewUri(
  vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js')
);
```

## Performance Considerations

### Extension Host
- ✅ Single Agent instance per session
- ✅ Abort controller for cancellation
- ✅ Lazy loading of tools
- ✅ Efficient event streaming (async generator)

### Webview
- ✅ React.memo for expensive components
- ✅ useCallback for event handlers
- ✅ Efficient state updates (batched)
- ✅ Virtual scrolling for long message lists (future)

### Build Optimization
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification in production
- ✅ Source maps for debugging

## Error Handling

### Extension Host Errors
```typescript
try {
  for await (const event of agent.run(query)) {
    // Process event
  }
} catch (error) {
  if (error.name === 'AbortError') {
    // User cancelled
  } else {
    // Real error - send to webview
    this._sendError(error.message);
  }
}
```

### Webview Errors
```typescript
try {
  await sendMessage(query);
} catch (error) {
  // Show error in UI
  setError(error.message);
  setIsProcessing(false);
}
```

## Testing Strategy

### Unit Tests
- ✅ Test message handling
- ✅ Test state updates
- ✅ Test event streaming
- ✅ Mock VS Code API

### Integration Tests
- ✅ Test extension activation
- ✅ Test command registration
- ✅ Test webview creation

### E2E Tests (Manual)
- ✅ Send real queries
- ✅ Test cancellation
- ✅ Test error cases
- ✅ Test theme switching

---

This architecture provides:
- **Separation of Concerns**: UI, business logic, and agent are separate
- **Type Safety**: TypeScript throughout
- **Testability**: Each layer can be tested independently
- **Performance**: Efficient streaming and state management
- **Maintainability**: Clear data flow and component structure
