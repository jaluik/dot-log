import * as vscode from 'vscode';

class GoCompletionItemProvider implements vscode.CompletionItemProvider {
  position?: vscode.Position;
  document?: vscode.TextDocument;
  public provideCompletionItems(
    _: vscode.TextDocument,
    position: vscode.Position
  ) {
    const snippetCompletion = new vscode.CompletionItem(
      'log',
      vscode.CompletionItemKind.Operator
    );
    snippetCompletion.documentation = new vscode.MarkdownString(
      'quick console.log result'
    );

    this.position = position;
    return [snippetCompletion];
  }

  public resolveCompletionItem(item: vscode.CompletionItem) {
    if (this.position) {
      item.command = {
        command: 'dot-log-replace',
        title: 'refactor',
        arguments: [this.position.translate(0, 4)],
      };
    }

    return item;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const options = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript'],
    new GoCompletionItemProvider(),
    '.'
  );

  const command = 'dot-log-replace';

  const commandHandler = (
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    position: vscode.Position
  ) => {
    const line = editor.document.lineAt(position.line).text;
    const matchList = line.match(/([^\s\.]*)\.log$/);
    const text = matchList?.[0];
    const key = matchList?.[1];
    if (text && key) {
      const index = line.indexOf(text);
      edit.delete(
        new vscode.Range(
          position.with(undefined, index),
          position.with(undefined, index + text.length)
        )
      );
      const innserVal = `console.log('${key}',${key})`;
      edit.insert(position.with(undefined, index), innserVal);
    }
    return Promise.resolve([]);
  };

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(command, commandHandler)
  );
  context.subscriptions.push(options);
}

export function deactivate() {}
