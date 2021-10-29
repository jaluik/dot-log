import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('dot-log.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from Dot Log!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
