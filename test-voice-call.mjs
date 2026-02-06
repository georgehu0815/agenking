#!/usr/bin/env node
// Test voice-call plugin via Gateway RPC

import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:18789');

ws.on('open', () => {
  console.log('Connected to gateway');

  // Call the voicecall.initiate RPC method
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'voicecall.initiate',
    params: {
      to: '+15550001234',  // test number
      message: 'Hello from Clawdbot voice call test!',
      mode: 'notify'
    }
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Response:', JSON.stringify(response, null, 2));
  ws.close();
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
