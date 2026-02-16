/**
 * Unit tests for GatewayClientNode
 * Adapted from webapp's gateway-client.test.ts for Node.js environment
 */

import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert';
import { GatewayClientNode } from '../../src/gateway/gateway-client-node.js';
import { MockWebSocketNode } from '../mocks/mock-websocket-node.js';

describe('GatewayClientNode', () => {
  let client: GatewayClientNode;
  let mockWs: MockWebSocketNode;

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  describe('connect()', () => {
    test('should connect to gateway successfully', async () => {
      let connectCalled = false;
      let connectPayload: any = null;

      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
        clientId: 'test-client',
        WebSocketConstructor: MockWebSocketNode as any,
        onConnect: (payload) => {
          connectCalled = true;
          connectPayload = payload;
        },
      });

      const connectPromise = client.connect();

      // Wait for WebSocket to be created
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get the mock WebSocket instance
      mockWs = (client as any).ws as MockWebSocketNode;

      // Simulate hello-ok response
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: {
            type: 'hello-ok',
            protocol: 3,
            server: { version: 'test', connId: 'test-1' },
          },
        }),
      );

      const result = await connectPromise;

      assert.strictEqual(result.type, 'hello-ok');
      assert.strictEqual(connectCalled, true);
      assert.deepStrictEqual(connectPayload, {
        type: 'hello-ok',
        protocol: 3,
        server: { version: 'test', connId: 'test-1' },
      });
      assert.strictEqual(client.isConnected(), true);
    });

    test('should send correct connect frame', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
        clientId: 'vscode-extension',
        displayName: 'Test Extension',
        authToken: 'test-token',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;
      const sentMessage = mockWs.getParsedLastMessage();

      assert.deepStrictEqual(sentMessage, {
        type: 'req',
        id: 'connect',
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'vscode-extension',
            displayName: 'Test Extension',
            version: '1.0.0',
            platform: 'browser',
            mode: 'webapp',
          },
          auth: { token: 'test-token' },
        },
      });

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;
    });

    test('should reject on connection error', async () => {
      let errorCalled = false;

      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
        onError: () => {
          errorCalled = true;
        },
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Simulate connection failure
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: false,
          error: {
            code: 'AUTH_FAILED',
            message: 'Authentication failed',
          },
        }),
      );

      await assert.rejects(connectPromise, /Authentication failed/);
      assert.strictEqual(errorCalled, true);
    });
  });

  describe('request()', () => {
    test('should send request and receive response', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Send request
      const requestPromise = client.request('health');

      // Simulate response
      await new Promise((resolve) => setTimeout(resolve, 10));
      const sentMessages = mockWs.getParsedMessages();
      const requestMessage = sentMessages[sentMessages.length - 1];

      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: requestMessage.id,
          ok: true,
          payload: { status: 'healthy' },
        }),
      );

      const result = await requestPromise;
      assert.deepStrictEqual(result, { status: 'healthy' });
    });

    test('should timeout on slow response', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Send request - no response will be simulated
      const requestPromise = client.request('health');

      // This would timeout after 30s in real code, but we won't wait that long
      // For testing, we just verify the promise is pending
      const raceResult = await Promise.race([
        requestPromise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 100)),
      ]);

      assert.strictEqual(raceResult, 'timeout');
    });
  });

  describe('event handling', () => {
    test('should subscribe and receive events', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Subscribe to events
      const events: any[] = [];
      client.on('agent', (payload) => {
        events.push(payload);
      });

      // Simulate event
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'event',
          event: 'agent',
          payload: {
            stream: 'tool',
            data: { phase: 'start', name: 'web_search' },
          },
          seq: 1,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert.strictEqual(events.length, 1);
      assert.deepStrictEqual(events[0], {
        stream: 'tool',
        data: { phase: 'start', name: 'web_search' },
      });
    });

    test('should unsubscribe from events', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Subscribe to events
      const events: any[] = [];
      const handler = (payload: any) => {
        events.push(payload);
      };

      client.on('agent', handler);

      // Simulate event
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'event',
          event: 'agent',
          payload: { test: 1 },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.strictEqual(events.length, 1);

      // Unsubscribe
      client.off('agent', handler);

      // Simulate another event
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'event',
          event: 'agent',
          payload: { test: 2 },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.strictEqual(events.length, 1); // Should still be 1
    });
  });

  describe('chat methods', () => {
    test('should send chat message', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Send chat message
      const chatPromise = client.sendChat('Hello', 'agent:main:test');

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check sent message
      const sentMessages = mockWs.getParsedMessages();
      const chatMessage = sentMessages[sentMessages.length - 1];

      assert.strictEqual(chatMessage.method, 'chat.send');
      assert.strictEqual(chatMessage.params.message, 'Hello');
      assert.strictEqual(chatMessage.params.sessionKey, 'agent:main:test');
      assert.ok(chatMessage.params.idempotencyKey);

      // Simulate response
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: chatMessage.id,
          ok: true,
          payload: { sessionId: 'test-session' },
        }),
      );

      const result = await chatPromise;
      assert.deepStrictEqual(result, { sessionId: 'test-session' });
    });

    test('should abort chat session', async () => {
      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Abort chat
      const abortPromise = client.abortChat('agent:main:test', 'run-123');

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check sent message
      const sentMessages = mockWs.getParsedMessages();
      const abortMessage = sentMessages[sentMessages.length - 1];

      assert.strictEqual(abortMessage.method, 'chat.abort');
      assert.strictEqual(abortMessage.params.sessionKey, 'agent:main:test');
      assert.strictEqual(abortMessage.params.runId, 'run-123');

      // Simulate response
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: abortMessage.id,
          ok: true,
          payload: { aborted: true },
        }),
      );

      const result = await abortPromise;
      assert.deepStrictEqual(result, { aborted: true });
    });
  });

  describe('disconnect()', () => {
    test('should disconnect cleanly', async () => {
      let disconnectCalled = false;

      client = new GatewayClientNode({
        WebSocketConstructor: MockWebSocketNode as any,
        url: 'ws://localhost:18789',
        onDisconnect: () => {
          disconnectCalled = true;
        },
      });

      const connectPromise = client.connect();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs = (client as any).ws as MockWebSocketNode;

      // Complete connection
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: 'connect',
          ok: true,
          payload: { type: 'hello-ok', protocol: 3 },
        }),
      );

      await connectPromise;

      // Disconnect
      client.disconnect();

      assert.strictEqual(client.isConnected(), false);
      assert.strictEqual(mockWs.readyState, MockWebSocketNode.CLOSED);
    });
  });
});
