/**
 * Webview-specific types
 */

export * from '../shared/types.js';

/**
 * VS Code API available in webview
 */
export interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

/**
 * Declare vscode global
 */
declare global {
  interface Window {
    acquireVsCodeApi(): VSCodeAPI;
  }
}
