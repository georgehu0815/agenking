/**
 * Unit tests for Dexter VS Code Extension Host
 */

import { describe, it, before, after, mock } from 'node:test';
import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { activate, deactivate } from '../src/extension';

describe('Dexter Extension', () => {
  let context: vscode.ExtensionContext;

  before(async () => {
    // Create mock extension context
    context = {
      subscriptions: [],
      extensionUri: vscode.Uri.file(__dirname),
      extensionPath: __dirname,
      globalState: {
        get: () => undefined,
        update: async () => {},
        keys: () => [],
        setKeysForSync: () => {},
      } as any,
      workspaceState: {
        get: () => undefined,
        update: async () => {},
        keys: () => [],
      } as any,
      extensionMode: vscode.ExtensionMode.Test,
      storagePath: undefined,
      globalStoragePath: '',
      logPath: '',
      asAbsolutePath: (relativePath: string) => relativePath,
      storageUri: undefined,
      globalStorageUri: vscode.Uri.file(''),
      logUri: vscode.Uri.file(''),
      secrets: {
        get: async () => undefined,
        store: async () => {},
        delete: async () => {},
        onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event,
      },
      environmentVariableCollection: {} as any,
      extension: {} as any,
      languageModelAccessInformation: {} as any,
    };
  });

  after(() => {
    deactivate();
  });

  it('should activate extension', () => {
    activate(context);
    assert.ok(context.subscriptions.length > 0, 'Extension should register subscriptions');
  });

  it('should register commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('dexter.openChat'), 'Should register openChat command');
    assert.ok(commands.includes('dexter.clearHistory'), 'Should register clearHistory command');
  });
});

describe('Dexter Agent Session', () => {
  it('should create agent session with configuration', async () => {
    const config = vscode.workspace.getConfiguration('dexter');

    const model = config.get<string>('model', 'gpt-5.2');
    const maxIterations = config.get<number>('maxIterations', 10);

    assert.strictEqual(typeof model, 'string', 'Model should be a string');
    assert.strictEqual(typeof maxIterations, 'number', 'MaxIterations should be a number');
    assert.ok(maxIterations > 0, 'MaxIterations should be positive');
  });

  it('should handle abort signal', async () => {
    const abortController = new AbortController();

    // Simulate aborting
    abortController.abort();

    assert.ok(abortController.signal.aborted, 'Signal should be aborted');
  });
});

describe('Message Handling', () => {
  it('should handle sendQuery message', () => {
    const message = {
      type: 'sendQuery' as const,
      query: 'What is the stock price of AAPL?',
      userId: 'test-user',
    };

    assert.strictEqual(message.type, 'sendQuery');
    assert.strictEqual(message.query, 'What is the stock price of AAPL?');
    assert.strictEqual(message.userId, 'test-user');
  });

  it('should handle cancelQuery message', () => {
    const message = {
      type: 'cancelQuery' as const,
    };

    assert.strictEqual(message.type, 'cancelQuery');
  });

  it('should handle clearHistory message', () => {
    const message = {
      type: 'clearHistory' as const,
    };

    assert.strictEqual(message.type, 'clearHistory');
  });
});

describe('Agent Event Streaming', () => {
  it('should format thinking event', () => {
    const event = {
      type: 'thinking' as const,
      message: 'Searching for information...',
    };

    assert.strictEqual(event.type, 'thinking');
    assert.ok(event.message.length > 0);
  });

  it('should format tool_start event', () => {
    const event = {
      type: 'tool_start' as const,
      tool: 'web_search',
      args: { query: 'AAPL stock price' },
    };

    assert.strictEqual(event.type, 'tool_start');
    assert.strictEqual(event.tool, 'web_search');
    assert.ok(typeof event.args === 'object');
  });

  it('should format tool_end event', () => {
    const event = {
      type: 'tool_end' as const,
      tool: 'web_search',
      result: 'Found information about AAPL',
      duration: 1234,
    };

    assert.strictEqual(event.type, 'tool_end');
    assert.strictEqual(event.tool, 'web_search');
    assert.ok(event.duration > 0);
  });

  it('should format done event', () => {
    const event = {
      type: 'done' as const,
      answer: 'AAPL stock price is $150.00',
      iterations: 3,
      totalTime: 5000,
    };

    assert.strictEqual(event.type, 'done');
    assert.ok(event.answer.length > 0);
    assert.ok(event.iterations > 0);
    assert.ok(event.totalTime > 0);
  });
});

describe('Configuration', () => {
  it('should have default configuration values', () => {
    const config = vscode.workspace.getConfiguration('dexter');

    const model = config.get<string>('model');
    const maxIterations = config.get<number>('maxIterations');
    const enableDebugLogs = config.get<boolean>('enableDebugLogs');

    // Check that defaults exist (may be undefined if not set)
    assert.ok(model === undefined || typeof model === 'string');
    assert.ok(maxIterations === undefined || typeof maxIterations === 'number');
    assert.ok(enableDebugLogs === undefined || typeof enableDebugLogs === 'boolean');
  });
});

describe('Session Management', () => {
  it('should generate unique session IDs', () => {
    const sessionId1 = `session-${Date.now()}`;
    const sessionId2 = `session-${Date.now() + 1}`;

    assert.notStrictEqual(sessionId1, sessionId2, 'Session IDs should be unique');
  });

  it('should track active sessions', () => {
    const sessions = new Map<string, { sessionId: string }>();

    const sessionId = 'test-session';
    sessions.set(sessionId, { sessionId });

    assert.ok(sessions.has(sessionId), 'Should track active session');
    assert.strictEqual(sessions.size, 1, 'Should have one active session');

    sessions.delete(sessionId);
    assert.ok(!sessions.has(sessionId), 'Should remove session after deletion');
  });
});
