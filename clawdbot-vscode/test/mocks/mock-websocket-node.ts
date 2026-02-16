/**
 * Mock WebSocket for Node.js testing
 *
 * Implements the 'ws' package interface for testing purposes
 * Adapted from webapp's MockWebSocket.ts for Node.js environment
 */

import { EventEmitter } from 'events';

export class MockWebSocketNode extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocketNode.CONNECTING;

  private messageQueue: string[] = [];

  constructor(url: string) {
    super();
    this.url = url;

    // Simulate async connection
    setTimeout(() => {
      if (this.readyState === MockWebSocketNode.CONNECTING) {
        this.readyState = MockWebSocketNode.OPEN;
        this.emit('open');
      }
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocketNode.OPEN) {
      throw new Error("WebSocket is not open");
    }
    this.messageQueue.push(data);
  }

  close(): void {
    if (this.readyState === MockWebSocketNode.CLOSED) {
      return;
    }
    this.readyState = MockWebSocketNode.CLOSED;
    this.emit('close');
  }

  // Test helpers
  simulateOpen(): void {
    if (this.readyState === MockWebSocketNode.CONNECTING) {
      this.readyState = MockWebSocketNode.OPEN;
      this.emit('open');
    }
  }

  simulateMessage(data: string): void {
    if (this.readyState === MockWebSocketNode.OPEN) {
      this.emit('message', data);
    }
  }

  simulateError(error?: Error): void {
    this.emit('error', error || new Error('WebSocket error'));
  }

  simulateClose(): void {
    this.readyState = MockWebSocketNode.CLOSED;
    this.emit('close');
  }

  getLastSentMessage(): string | undefined {
    return this.messageQueue[this.messageQueue.length - 1];
  }

  getAllSentMessages(): string[] {
    return [...this.messageQueue];
  }

  clearMessageQueue(): void {
    this.messageQueue = [];
  }

  getParsedLastMessage(): any {
    const last = this.getLastSentMessage();
    return last ? JSON.parse(last) : undefined;
  }

  getParsedMessages(): any[] {
    return this.messageQueue.map(msg => JSON.parse(msg));
  }
}

// Export as default for mocking
export default MockWebSocketNode;
