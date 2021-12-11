import * as vscode from 'vscode';

class GoCompletionItemProvider implements vscode.CompletionItemProvider {
  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const snippetCompletion = new vscode.CompletionItem('log');
    snippetCompletion.documentation = new vscode.MarkdownString(
      'quick console.log result'
    );
    const linePrefix = document
      .lineAt(position)
      .text.substr(0, position.character);

    const matchList = linePrefix.match(/([^\s\.])\.log$/);
    if (matchList?.length === 2) {
      const keywordWithDot = matchList[0];
      const keyword = matchList[1];
      const startPosition = new vscode.Position(
        position.line,
        position.character - keywordWithDot.length
      );
      snippetCompletion.insertText = new vscode.SnippetString(
        `console.log( ${keyword} )`
      );
      snippetCompletion.range = {
        inserting: new vscode.Range(startPosition, position),
        replacing: new vscode.Range(startPosition, position),
      };
    }

    return [snippetCompletion];
  }
}

export function activate(context: vscode.ExtensionContext) {
  const options = vscode.languages.registerCompletionItemProvider(
    'javascript',
    new GoCompletionItemProvider(),
    '.'
  );

  context.subscriptions.push(options);
}

export function deactivate() {}
