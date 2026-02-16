/**
 * MINIMAL TEST EXTENSION
 * This is a bare-bones extension to test if the basic VSCode extension API works
 */

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('====================================');
  console.log('🎯 MINIMAL EXTENSION ACTIVATED!!!');
  console.log('====================================');

  vscode.window.showInformationMessage('Minimal extension works!');
}

export function deactivate() {
  console.log('Minimal extension deactivated');
}
