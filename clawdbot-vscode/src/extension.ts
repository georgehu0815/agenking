/**
 * Dexter VS Code Extension - Extension Host
 *
 * This file runs in the Node.js environment and handles:
 * - Agent execution
 * - Message passing to/from webview
 * - Configuration management
 */

// Load environment variables BEFORE importing SimpleAgent
// SimpleAgent imports azure-openai-models which needs these env vars
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Load .env file from extension root directory
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import * as vscode from 'vscode';
import { SimpleAgent } from './agent/simple-agent.js';
import { HttpGatewayAgent } from './agent/http-gateway-agent.js';
import type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
  AgentEvent
} from './shared/types.js';

/**
 * Active agent sessions
 */
interface AgentSession {
  sessionId: string;
  abortController: AbortController;
  agent: SimpleAgent | HttpGatewayAgent;
}

let outputChannel: vscode.OutputChannel;
let chatViewProvider: DexterChatViewProvider | undefined;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('====================================');
  console.log('🚀 DEXTER AI EXTENSION ACTIVATING!');
  console.log('====================================');
  console.log('Extension URI:', context.extensionUri.toString());
  console.log('Dexter AI Extension is now active!');

  // Create output channel for debugging
  outputChannel = vscode.window.createOutputChannel('Dexter AI');
  context.subscriptions.push(outputChannel);

  try {
    // Register chat view provider
    chatViewProvider = new DexterChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DexterChatViewProvider.viewType,
      chatViewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('dexter.openChat', () => {
      vscode.commands.executeCommand('dexter.chatView.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dexter.clearHistory', () => {
      chatViewProvider?.clearHistory();
    })
  );

    log('Dexter AI Extension activated successfully');
  } catch (error) {
    console.error('❌ Error during activation:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      vscode.window.showErrorMessage(`Dexter extension failed to activate: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Extension deactivation
 */
export function deactivate() {
  chatViewProvider?.dispose();
  log('Dexter AI Extension deactivated');
}

/**
 * Chat view provider
 */
class DexterChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'dexter.chatView';

  private _view?: vscode.WebviewView;
  private _activeSessions = new Map<string, AgentSession>();

  constructor(private readonly _extensionUri: vscode.Uri) {}

  /**
   * Resolve webview view
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out'),
        vscode.Uri.joinPath(this._extensionUri, 'dist')
      ]
    };

    // Set HTML content
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        await this._handleWebviewMessage(message);
      }
    );

    log('Webview view resolved');
  }

  /**
   * Handle messages from webview
   */
  private async _handleWebviewMessage(message: WebviewToExtensionMessage) {
    try {
      switch (message.type) {
        case 'webviewReady':
          log('Webview ready');
          break;

        case 'sendQuery':
          await this._handleSendQuery(message.query, message.userId);
          break;

        case 'cancelQuery':
          this._handleCancelQuery();
          break;

        case 'clearHistory':
          this.clearHistory();
          break;

        default:
          log(`Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      this._sendError(error instanceof Error ? error.message : String(error));
      log(`Error handling message: ${error}`, 'error');
    }
  }

  /**
   * Handle send query request
   */
  private async _handleSendQuery(query: string, userId?: string) {
    if (!this._view) {
      throw new Error('Webview not initialized');
    }

    // Cancel any active session
    this._cancelAllSessions();

    // Create new session
    const sessionId = `session-${Date.now()}`;
    const abortController = new AbortController();

    // Get configuration
    const config = vscode.workspace.getConfiguration('dexter');
    const agentMode = config.get<string>('agentMode', 'direct');
    const gatewayUrl = config.get<string>('gatewayUrl', 'http://localhost:3000');
    const model = config.get<string>('model', 'gpt-5.2');
    const maxIterations = config.get<number>('maxIterations', 10);

    // Create agent based on mode
    let agent: SimpleAgent | HttpGatewayAgent;

    if (agentMode === 'gateway') {
      log(`Creating HttpGatewayAgent (URL: ${gatewayUrl})`);
      agent = HttpGatewayAgent.create({
        gatewayUrl,
        authToken: '3b34e1a1252392a579eacbc66fb11fd6de8b152a2d9579b9', // Gateway auth token from ~/.clawdbot/clawdbot.json
        signal: abortController.signal
      });
    } else {
      log(`Creating SimpleAgent (Direct mode)`);
      agent = SimpleAgent.create({
        model,
        maxIterations,
        signal: abortController.signal
      });
    }

    const session: AgentSession = {
      sessionId,
      abortController,
      agent
    };

    this._activeSessions.set(sessionId, session);

    // Notify webview that session started
    this._postMessage({
      type: 'sessionStarted',
      sessionId
    });

    log(`Starting agent session ${sessionId} with query: "${query}"`);

    try {
      // Run agent and stream events
      for await (const event of agent.run(query)) {
        // Check if session was cancelled
        if (!this._activeSessions.has(sessionId)) {
          log(`Session ${sessionId} was cancelled`);
          break;
        }

        // Send event to webview
        this._postMessage({
          type: 'agentEvent',
          event,
          sessionId
        });

        log(`Event: ${event.type}`, 'debug');
      }

      log(`Session ${sessionId} completed`);
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        log(`Session ${sessionId} aborted`);
      } else {
        log(`Session ${sessionId} error: ${error}`, 'error');
        this._sendError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      this._activeSessions.delete(sessionId);
    }
  }

  /**
   * Handle cancel query request
   */
  private _handleCancelQuery() {
    this._cancelAllSessions();
  }

  /**
   * Cancel all active sessions
   */
  private _cancelAllSessions() {
    for (const [sessionId, session] of this._activeSessions.entries()) {
      session.abortController.abort();
      this._postMessage({
        type: 'sessionCancelled',
        sessionId
      });
      log(`Cancelled session ${sessionId}`);
    }
    this._activeSessions.clear();
  }

  /**
   * Clear chat history
   */
  public clearHistory() {
    this._postMessage({
      type: 'historyCleared'
    });
    log('Chat history cleared');
  }

  /**
   * Send message to webview
   */
  private _postMessage(message: ExtensionToWebviewMessage) {
    this._view?.webview.postMessage(message);
  }

  /**
   * Send error to webview
   */
  private _sendError(error: string) {
    this._postMessage({
      type: 'error',
      error
    });
  }

  /**
   * Get HTML for webview
   */
  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get URIs for webview resources
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource} https:; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">
  <link href="${styleUri}" rel="stylesheet">
  <title>Agentflow AI Chat</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Dispose provider
   */
  public dispose() {
    this._cancelAllSessions();
  }
}

/**
 * Generate a nonce for CSP
 */
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Log message to output channel
 */
function log(message: string, level: 'info' | 'debug' | 'error' = 'info') {
  const config = vscode.workspace.getConfiguration('dexter');
  const enableDebugLogs = config.get<boolean>('enableDebugLogs', false);

  if (level === 'debug' && !enableDebugLogs) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'debug' ? '🔍' : 'ℹ️';
  outputChannel.appendLine(`${prefix} [${timestamp}] ${message}`);

  if (level === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
}
