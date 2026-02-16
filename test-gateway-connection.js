// Test WebSocket connection to gateway
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:18789');

ws.on('open', () => {
  console.log('[TEST] WebSocket connected');

  // Send connect frame
  const connectFrame = {
    type: 'req',
    id: 'connect',
    method: 'connect',
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'test',
        displayName: 'Test Client',
        version: '1.0.0',
        platform: 'node',
        mode: 'test',
      },
      auth: {
        token: '3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9'
      },
    },
  };

  console.log('[TEST] Sending connect frame...');
  ws.send(JSON.stringify(connectFrame));
});

ws.on('message', (data) => {
  const frame = JSON.parse(data.toString());
  console.log('[TEST] Received frame:', JSON.stringify(frame, null, 2));

  // If connected successfully, send a test chat message
  if (frame.type === 'res' && frame.id === 'connect' && frame.ok) {
    console.log('[TEST] Connected successfully! Sending test message...');

    const chatFrame = {
      type: 'req',
      id: 'test-chat-1',
      method: 'chat.send',
      params: {
        sessionKey: 'agent:main:test-webapp',
        message: 'Hello, this is a test message!',
        idempotencyKey: `test-${Date.now()}`,
      },
    };

    setTimeout(() => {
      console.log('[TEST] Sending chat message...');
      ws.send(JSON.stringify(chatFrame));
    }, 1000);
  }
});

ws.on('error', (error) => {
  console.error('[TEST] WebSocket error:', error);
});

ws.on('close', () => {
  console.log('[TEST] WebSocket closed');
});

// Keep alive for 30 seconds to receive events
setTimeout(() => {
  console.log('[TEST] Test complete, closing connection');
  ws.close();
  process.exit(0);
}, 30000);
