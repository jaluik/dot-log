import * as vscode from 'vscode';

class GoCompletionItemProvider implements vscode.CompletionItemProvider {
  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Thenable<vscode.CompletionItem[]> {
    const text = document.getText(
      new vscode.Range(new vscode.Position(position.line, 0), position)
    );

    const data = text
      .match(/([\S])*.log$/g)
      ?.map((item) => item.replace('.log', ''));

    if (data?.length) {
      return Promise.resolve([
        {
          label: 'aa',
        },
      ]);
    }
    return Promise.resolve([]);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const options = vscode.languages.registerCompletionItemProvider(
    'javascript',
    new GoCompletionItemProvider(),
    '.log'
  );

  context.subscriptions.push(options);
}

export function deactivate() {}
