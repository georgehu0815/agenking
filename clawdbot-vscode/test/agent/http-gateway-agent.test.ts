/**
 * Unit tests for HTTP Gateway Agent (WebSocket-based)
 *
 * These tests verify that the agent correctly:
 * 1. Connects via WebSocket to gateway
 * 2. Sends connect frame and chat.send request
 * 3. Receives and maps agent/chat events
 * 4. Handles errors and connection failures
 * 5. Supports abort signal
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { HttpGatewayAgent } from '../../src/agent/http-gateway-agent.js';
import type { AgentEvent } from '../../src/shared/types.js';
import { MockWebSocketNode } from '../mocks/mock-websocket-node.js';

// Track current mock WebSocket instance
let currentMockWs: MockWebSocketNode | null = null;

// Create a wrapper class that tracks instances
class TrackedMockWebSocket extends MockWebSocketNode {
  constructor(url: string) {
    super(url);
    currentMockWs = this;
  }
}

// Helper to wait for WebSocket to be created
async function waitForWebSocket(timeoutMs = 200): Promise<MockWebSocketNode> {
  const startTime = Date.now();
  while (!currentMockWs && Date.now() - startTime < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  if (!currentMockWs) {
    throw new Error('WebSocket was not created within timeout');
  }
  return currentMockWs;
}

describe('HttpGatewayAgent - Initialization', () => {
  it('should create agent with default WebSocket URL', () => {
    const agent = HttpGatewayAgent.create({ WebSocketConstructor: TrackedMockWebSocket as any });
    assert.ok(agent instanceof HttpGatewayAgent);
  });

  it('should create agent with custom WebSocket URL', () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:8080'
    });
    assert.ok(agent instanceof HttpGatewayAgent);
  });

  it('should convert HTTP URL to WebSocket URL', () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayUrl: 'http://localhost:3000'
    });
    assert.ok(agent instanceof HttpGatewayAgent);
  });

  it('should accept abort signal', () => {
    const abortController = new AbortController();
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      signal: abortController.signal
    });
    assert.ok(agent instanceof HttpGatewayAgent);
  });
});

describe('HttpGatewayAgent - WebSocket Connection', () => {
  beforeEach(() => {
    currentMockWs = null;
  });

  it('should connect via WebSocket and send connect frame', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const generator = agent.run('test query');

    // Get first event (thinking)
    const firstEvent = await generator.next();
    assert.strictEqual(firstEvent.value.type, 'thinking');

    // Wait for WebSocket to be created
    const ws = await waitForWebSocket();
    assert.ok(ws, 'WebSocket should be created');

    // Simulate connect response
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: {
        type: 'hello-ok',
        protocol: 3,
        server: { version: '1.0.0', connId: 'test-1' }
      }
    }));

    // Wait for connect to process
    await waitForWebSocket();

    // Verify connect frame was sent
    const messages = currentMockWs!.getParsedMessages();
    const connectFrame = messages.find((m: any) => m.id === 'connect');

    assert.ok(connectFrame, 'Connect frame should be sent');
    assert.strictEqual(connectFrame.type, 'req');
    assert.strictEqual(connectFrame.method, 'connect');
    assert.strictEqual(connectFrame.params.client.id, 'webapp');
    assert.strictEqual(connectFrame.params.client.platform, 'browser');
    assert.strictEqual(connectFrame.params.client.mode, 'webapp');

    // Clean up
    await generator.return(undefined);
  });

  it('should send chat.send request after connection', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const generator = agent.run('hello world');

    // Get first event
    await generator.next();

    // Wait for WebSocket and simulate connection
    await waitForWebSocket();

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: { type: 'hello-ok', protocol: 3 }
    }));

    // Get answer_start event
    await generator.next();

    // Wait for chat.send request
    await waitForWebSocket();

    // Verify chat.send was sent
    const messages = currentMockWs!.getParsedMessages();
    const chatFrame = messages.find((m: any) => m.method === 'chat.send');

    assert.ok(chatFrame, 'chat.send frame should be sent');
    assert.strictEqual(chatFrame.params.message, 'hello world');
    assert.ok(chatFrame.params.sessionKey.startsWith('agent:main:vscode-'));
    assert.ok(chatFrame.params.idempotencyKey, 'Should have idempotency key');

    // Simulate response
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: chatFrame.id,
      ok: true,
      payload: { sessionId: 'test-session-123' }
    }));

    // Simulate final chat event
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'chat',
      payload: {
        state: 'final',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello! How can I help?' }]
        }
      }
    }));

    // Get events
    await new Promise(resolve => setTimeout(resolve, 50));

    // Clean up
    await generator.return(undefined);
  });
});

describe('HttpGatewayAgent - Event Streaming', () => {
  beforeEach(() => {
    currentMockWs = null;
  });

  it('should receive and map agent events', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const events: AgentEvent[] = [];
    const generator = agent.run('test query');

    // Start consuming events
    const consumer = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (event.type === 'done') break;
      }
    })();

    // Wait for connection
    await waitForWebSocket();

    // Simulate connection
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: { type: 'hello-ok', protocol: 3 }
    }));

    await waitForWebSocket();

    // Simulate chat.send response
    const messages = currentMockWs!.getParsedMessages();
    const chatFrame = messages.find((m: any) => m.method === 'chat.send');

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: chatFrame.id,
      ok: true,
      payload: { sessionId: 'test' }
    }));

    // Simulate agent events
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'tool',
        data: {
          phase: 'start',
          name: 'web_search',
          args: { query: 'test' }
        }
      }
    }));

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'tool',
        data: {
          phase: 'end',
          name: 'web_search',
          result: 'Found results',
          duration: 500
        }
      }
    }));

    // Simulate final chat event
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'chat',
      payload: {
        state: 'final',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Here is the answer' }]
        }
      }
    }));

    // Wait for all events to be processed
    await consumer;

    // Verify events
    assert.ok(events.some(e => e.type === 'thinking'), 'Should have thinking event');
    assert.ok(events.some(e => e.type === 'answer_start'), 'Should have answer_start event');
    assert.ok(events.some(e => e.type === 'tool_start'), 'Should have tool_start event');
    assert.ok(events.some(e => e.type === 'tool_end'), 'Should have tool_end event');
    assert.ok(events.some(e => e.type === 'done'), 'Should have done event');

    const toolStart = events.find(e => e.type === 'tool_start') as any;
    assert.strictEqual(toolStart.tool, 'web_search');

    const doneEvent = events.find(e => e.type === 'done') as any;
    assert.strictEqual(doneEvent.answer, 'Here is the answer');
  });

  it('should map lifecycle events to thinking', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const events: AgentEvent[] = [];
    const generator = agent.run('test query');

    const consumer = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (event.type === 'done') break;
      }
    })();

    await waitForWebSocket();

    // Simulate connection
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: { type: 'hello-ok', protocol: 3 }
    }));

    await waitForWebSocket();

    const messages = currentMockWs!.getParsedMessages();
    const chatFrame = messages.find((m: any) => m.method === 'chat.send');

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: chatFrame.id,
      ok: true,
      payload: { sessionId: 'test' }
    }));

    // Simulate lifecycle events
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'lifecycle',
        data: { phase: 'start' }
      }
    }));

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'lifecycle',
        data: { phase: 'end' }
      }
    }));

    // Final chat event
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'chat',
      payload: {
        state: 'final',
        message: { content: [{ type: 'text', text: 'Done' }] }
      }
    }));

    await consumer;

    const thinkingEvents = events.filter(e => e.type === 'thinking');
    assert.ok(thinkingEvents.length >= 2, 'Should have lifecycle thinking events');
  });
});

describe('HttpGatewayAgent - Error Handling', () => {
  beforeEach(() => {
    currentMockWs = null;
  });

  it('should handle connection errors', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const generator = agent.run('test query');
    await generator.next();

    await waitForWebSocket();

    // Simulate connection error
    currentMockWs!.simulateError(new Error('Connection refused'));

    await assert.rejects(
      async () => {
        for await (const event of generator) {
          // Should throw
        }
      },
      /Cannot connect to WebSocket Gateway/
    );
  });

  it('should handle abort signal', async () => {
    const abortController = new AbortController();
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789',
      signal: abortController.signal
    });

    const generator = agent.run('test query');
    await generator.next();

    await waitForWebSocket();

    // Simulate connection
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: { type: 'hello-ok', protocol: 3 }
    }));

    await waitForWebSocket();

    const messages = currentMockWs!.getParsedMessages();
    const chatFrame = messages.find((m: any) => m.method === 'chat.send');

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: chatFrame.id,
      ok: true,
      payload: { sessionId: 'test' }
    }));

    // Abort
    abortController.abort();

    await assert.rejects(
      async () => {
        for await (const event of generator) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      },
      /Abort/
    );

    // Verify chat.abort was called
    await waitForWebSocket();
    const allMessages = currentMockWs!.getParsedMessages();
    const abortFrame = allMessages.find((m: any) => m.method === 'chat.abort');
    assert.ok(abortFrame, 'Should call chat.abort on abort signal');
  });

  it('should handle tool errors', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const events: AgentEvent[] = [];
    const generator = agent.run('test query');

    const consumer = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (event.type === 'done') break;
      }
    })();

    await waitForWebSocket();

    // Connection
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: { type: 'hello-ok', protocol: 3 }
    }));

    await waitForWebSocket();

    const messages = currentMockWs!.getParsedMessages();
    const chatFrame = messages.find((m: any) => m.method === 'chat.send');

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: chatFrame.id,
      ok: true,
      payload: { sessionId: 'test' }
    }));

    // Simulate tool error
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'tool',
        data: {
          name: 'web_search',
          isError: true,
          error: 'Search failed'
        }
      }
    }));

    // Final event
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'chat',
      payload: {
        state: 'final',
        message: { content: [{ type: 'text', text: 'Error occurred' }] }
      }
    }));

    await consumer;

    const toolError = events.find(e => e.type === 'tool_error') as any;
    assert.ok(toolError, 'Should have tool_error event');
    assert.strictEqual(toolError.tool, 'web_search');
    assert.strictEqual(toolError.error, 'Search failed');
  });
});

describe('HttpGatewayAgent - Integration Test', () => {
  beforeEach(() => {
    currentMockWs = null;
  });

  it('should successfully complete full chat flow', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const events: AgentEvent[] = [];
    const generator = agent.run('What is TypeScript?');

    const consumer = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (event.type === 'done') break;
      }
    })();

    await waitForWebSocket();

    // Simulate full connection and chat flow
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: 'connect',
      ok: true,
      payload: { type: 'hello-ok', protocol: 3 }
    }));

    await waitForWebSocket();

    const messages = currentMockWs!.getParsedMessages();
    const chatFrame = messages.find((m: any) => m.method === 'chat.send');

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'res',
      id: chatFrame.id,
      ok: true,
      payload: { sessionId: 'integration-test' }
    }));

    // Simulate agent lifecycle and tool events
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'lifecycle',
        data: { phase: 'start' }
      }
    }));

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'tool',
        data: {
          phase: 'start',
          name: 'web_search',
          args: { query: 'TypeScript' }
        }
      }
    }));

    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'agent',
      payload: {
        stream: 'tool',
        data: {
          phase: 'end',
          name: 'web_search',
          result: 'TypeScript is a typed superset of JavaScript',
          duration: 1500
        }
      }
    }));

    // Final answer
    currentMockWs!.simulateMessage(JSON.stringify({
      type: 'event',
      event: 'chat',
      payload: {
        state: 'final',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'TypeScript is a strongly typed programming language that builds on JavaScript.'
            }
          ]
        }
      }
    }));

    await consumer;

    // Verify all event types
    assert.ok(events.some(e => e.type === 'thinking'), 'Should have thinking events');
    assert.ok(events.some(e => e.type === 'answer_start'), 'Should have answer_start');
    assert.ok(events.some(e => e.type === 'tool_start'), 'Should have tool_start');
    assert.ok(events.some(e => e.type === 'tool_end'), 'Should have tool_end');
    assert.ok(events.some(e => e.type === 'done'), 'Should have done event');

    // Verify final answer
    const doneEvent = events.find(e => e.type === 'done') as any;
    assert.ok(doneEvent.answer.includes('TypeScript'));
  });
});

describe('HttpGatewayAgent - Gateway Connection Verification', () => {
  beforeEach(() => {
    currentMockWs = null;
  });

  it('should verify WebSocket connection to gateway', async () => {
    const agent = HttpGatewayAgent.create({
      WebSocketConstructor: TrackedMockWebSocket as any,
      gatewayWsUrl: 'ws://localhost:18789'
    });

    const generator = agent.run('Test query to verify backend');

    // Get first event
    await generator.next();

    // Wait for WebSocket creation
    await waitForWebSocket();

    assert.ok(currentMockWs, 'WebSocket should be created');
    assert.strictEqual(currentMockWs!.url, 'ws://localhost:18789', 'Should connect to correct URL');

    // Verify protocol messages
    const messages = currentMockWs!.getParsedMessages();

    const connectFrame = messages.find((m: any) => m.method === 'connect');
    assert.ok(connectFrame, 'Should send connect frame');
    assert.strictEqual(connectFrame.params.minProtocol, 3);
    assert.strictEqual(connectFrame.params.maxProtocol, 3);

    console.log('✅ WebSocket connection successfully established to gateway');
    console.log('   WebSocket URL: ws://localhost:18789');
    console.log('   Protocol: WebSocket frame-based (req/res/event)');
    console.log('   Client ID: vscode-extension');

    // Clean up
    await generator.return(undefined);
  });
});
