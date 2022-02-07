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
    ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'vue'],
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
    // match case name.log etc.
    const matchVarReg = new RegExp(`\(\[^\\s\]*\[^\'\"\`\]\).${config.type}$`);
    // match case 'name'.log etc.  /(['"`])([^'"])\1.log/
    const matchStrReg = new RegExp(
      `\(\[\'\"\`\]\)\(\[^\'\"\`\]*\)\\1\.${config.type}$`
    );
    let matchFlag: 'var' | 'str' = 'var';
    let text,
      key,
      quote = '"',
      innserVal = '';
    [text, key] = lineText.match(matchVarReg) || [];
    if (!key) {
      [text, quote, key] = lineText.match(matchStrReg) || [];
      matchFlag = 'str';
    }
    // if matched
    if (key) {
      const index = lineText.indexOf(text);
      edit.delete(
        new vscode.Range(
          position.with(undefined, index),
          position.with(undefined, index + text.length)
        )
      );
      if (matchFlag === 'var' && key.includes('"')) {
        quote = "'";
      }
      // format like console.log("xxx", xxx)
      if (matchFlag === 'var') {
        innserVal = `${config.format}(${quote}${key}${quote},${key})`;
      }
      // if key is string format like console.log("xxx")
      if (matchFlag === 'str') {
        innserVal = `${config.format}(${quote}${key}${quote})`;
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
