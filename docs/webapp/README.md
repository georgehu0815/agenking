# WebApp Documentation

**Complete documentation for the Clawdbot WebApp client**

---

## Quick Links

- **[Setup & Authentication Guide](setup-authentication.md)** - Complete guide to configuring webapp with gateway authentication
- **[WebSocket Migration Guide](../../webapp/WEBSOCKET_MIGRATION.md)** - Migration from SSE to WebSocket
- **[Testing Guide](../../webapp/client/TESTING.md)** - Unit test suite documentation
- **[API Reference](api-reference.md)** - WebApp client API documentation

---

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- Gateway server running on `localhost:18789`
- Gateway auth token configured

### 2. Quick Start

```bash
# Install dependencies
cd src/webapp/client
npm install

# Configure environment
cat > .env << EOF
VITE_GATEWAY_URL=ws://localhost:18789
VITE_GATEWAY_TOKEN=<your-gateway-token>
EOF

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Configuration

See [Setup & Authentication Guide](setup-authentication.md) for detailed configuration instructions.

---

## Architecture

### Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│                                                          │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │ ChatUI     │───>│ useAgent     │───>│ useGateway  │ │
│  │ Components │    │ Stream Hook  │    │ Hook        │ │
│  └────────────┘    └──────────────┘    └─────────────┘ │
│                           │                    │         │
│                           │                    │         │
│                    ┌──────▼────────────────────▼──────┐ │
│                    │    GatewayClient (WebSocket)     │ │
│                    └──────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────┘
                             │ WebSocket (ws://)
                             │ + Auth Token
                             ▼
                    ┌─────────────────┐
                    │  Gateway Server │
                    │  (port 18789)   │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  AI Agent       │
                    │  + Tools        │
                    └─────────────────┘
```

### Key Components

| Component | Description | Location |
|-----------|-------------|----------|
| **GatewayClient** | WebSocket client for gateway protocol | `src/lib/gateway-client.ts` |
| **useGateway** | React hook for connection management | `src/hooks/useGateway.ts` |
| **useAgentStream** | React hook for agent chat streaming | `src/hooks/useAgentStream.ts` |
| **ChatContainer** | Main chat UI component | `src/components/ChatContainer.tsx` |

---

## Features

### ✅ Implemented

- **WebSocket Connection** - Real-time bidirectional communication
- **Authentication** - Token-based auth with gateway
- **Agent Chat** - Send messages and receive streaming responses
- **Event Streaming** - Real-time agent events (thinking, tools, results)
- **Connection Status** - Visual connection state indicator
- **Auto-Reconnection** - Automatic reconnection with exponential backoff
- **Session Management** - Session-based conversation history
- **Error Handling** - Graceful error handling and user feedback

### 🚧 Planned

- **Message History** - Load previous conversation history
- **Multi-Session** - Switch between different chat sessions
- **File Upload** - Send files to agent
- **Voice Input** - Voice-to-text input
- **Export Chat** - Export conversation as text/PDF
- **Customization** - Themes, fonts, layout options

---

## Development

### Project Structure

```
src/webapp/client/
├── src/
│   ├── components/           # React components
│   │   ├── ChatContainer.tsx # Main chat UI
│   │   ├── MessageList.tsx   # Message display
│   │   ├── ChatInput.tsx     # Input field
│   │   └── ...
│   ├── hooks/               # React hooks
│   │   ├── useGateway.ts    # Connection management
│   │   └── useAgentStream.ts # Agent streaming
│   ├── lib/                 # Core libraries
│   │   └── gateway-client.ts # WebSocket client
│   ├── services/            # API services (legacy)
│   └── types/               # TypeScript types
├── .env                     # Environment config
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report

# Linting
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_GATEWAY_URL` | ✅ | - | WebSocket gateway URL |
| `VITE_GATEWAY_TOKEN` | ✅ | - | Gateway auth token |
| `VITE_CLIENT_NAME` | ❌ | "Dexter Web App" | Client display name |

---

## API Usage

### Send a Message

```typescript
import { useAgentStream } from './hooks/useAgentStream';

function ChatComponent() {
  const {
    messages,
    sendMessage,
    isProcessing,
    connected,
  } = useAgentStream({
    gatewayUrl: 'ws://localhost:18789',
    authToken: 'your-auth-token',
  });

  const handleSend = async () => {
    await sendMessage('Hello, agent!');
  };

  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={handleSend} disabled={!connected || isProcessing}>
        Send Message
      </button>
    </div>
  );
}
```

### Listen to Events

```typescript
const { client } = useGateway({
  url: 'ws://localhost:18789',
  authToken: 'your-token',
});

// Listen for agent events
client?.on('agent', (payload) => {
  console.log('Agent event:', payload);
});

// Listen for chat events
client?.on('chat', (payload) => {
  console.log('Chat event:', payload);
});
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test gateway-client.test.ts

# Run with coverage
npm test -- --coverage

# Run with UI
npm run test:ui
```

### Test Coverage

- **GatewayClient**: 88% (21/24 tests passing)
- **useAgentStream**: 100% (7/7 tests passing)
- **useGateway**: 11% (1/9 tests passing - async timing issues)

See [Testing Guide](../../webapp/client/TESTING.md) for details.

### Manual Testing

1. Start gateway: `node scripts/run-node.mjs gateway --port 18789`
2. Start webapp: `cd src/webapp/client && npm run dev`
3. Open http://localhost:5173
4. Send a test message: "What is the weather?"
5. Verify events display in real-time
6. Check connection status indicator

---

## Deployment

### Build for Production

```bash
cd src/webapp/client
npm run build
```

Output: `dist/` directory with optimized static files

### Deploy to Static Hosting

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Static Server:**
```bash
npm install -g serve
serve -s dist -p 3000
```

### Environment Configuration

Create production `.env.production`:

```bash
VITE_GATEWAY_URL=wss://your-gateway-domain.com
VITE_GATEWAY_TOKEN=<production-token>
```

Build with production env:
```bash
npm run build -- --mode production
```

---

## Troubleshooting

### Common Issues

See [Setup & Authentication Guide - Troubleshooting](setup-authentication.md#troubleshooting) for detailed solutions.

**Quick fixes:**

1. **Connection refused**
   - Check gateway is running: `lsof -i :18789`
   - Verify URL in `.env` file

2. **Auth failed**
   - Verify token matches gateway config
   - Restart webapp after changing `.env`

3. **No messages displayed**
   - Check browser console for errors
   - Verify WebSocket connection established

---

## Contributing

### Code Style

- ESLint configuration in `.eslintrc.json`
- Prettier for formatting
- TypeScript strict mode enabled

### Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test
3. Run linting: `npm run lint`
4. Commit with descriptive message
5. Push and create pull request

---

## License

See main project LICENSE file.

---

## Support

- **Documentation**: This directory
- **Issues**: GitHub issues
- **Gateway Docs**: `docs/gateway/`

---

**Last Updated:** 2026-02-15
**Version:** 1.0.0
