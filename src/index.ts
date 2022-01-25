import * as vscode from 'vscode';
import configList from './config';

class GoCompletionItemProvider implements vscode.CompletionItemProvider {
  position?: vscode.Position;
  public provideCompletionItems(
    _: vscode.TextDocument,
    position: vscode.Position
  ) {
    this.position = position;
    const completions = configList.map((item) => {
      const snippetCompletion = new vscode.CompletionItem(
        item.type,
        vscode.CompletionItemKind.Operator
      );
      snippetCompletion.documentation = new vscode.MarkdownString(
        item.document
      );
      return snippetCompletion;
    });

    return completions;
  }

  public resolveCompletionItem(item: vscode.CompletionItem) {
    const label = item.label;
    if (this.position && typeof label === 'string') {
      const config = configList.find((config) => config.type === label);
      item.command = {
        command: 'dot-log-replace',
        title: 'refactor',
        arguments: [this.position.translate(0, label.length + 1), config],
      };
    }

    return item;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const options = vscode.languages.registerCompletionItemProvider(
    {
      pattern: '**/*.{ts,js,tsx,jsx,vue}',
    },
    new GoCompletionItemProvider(),
    '.'
  );
  const command = 'dot-log-replace';
  const commandHandler = (
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    position: vscode.Position,
    config: typeof configList[0]
  ) => {
    const lineText = editor.document.lineAt(position.line).text;
    const matchReg = new RegExp(`\(\[^\\s\]*\)\\\.${config.type}$`);
    const [text, key] = lineText.match(matchReg) || [];
    if (text && key) {
      const index = lineText.indexOf(text);
      edit.delete(
        new vscode.Range(
          position.with(undefined, index),
          position.with(undefined, index + text.length)
        )
      );
      let innserVal: string;
      if (key.endsWith("'") || key.endsWith('"')) {
        innserVal = `${config.format}(${key})`;
      } else {
        let quote = '"';
        if (key.includes('"')) {
          quote = "'";
        }
        innserVal = `${config.format}(${quote}${key}${quote},${key})`;
      }
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
