import * as vscode from 'vscode';

interface ConfigItem {
  trigger: string;
  description: string;
  hideName: boolean;
  format: string;
  prefix: string;
  suffix: string;
}
class GoCompletionItemProvider implements vscode.CompletionItemProvider {
  position?: vscode.Position;
  config: ConfigItem[];

  constructor(config: ConfigItem[]) {
    this.config = config;
  }

  public provideCompletionItems(
    _: vscode.TextDocument,
    position: vscode.Position
  ) {
    this.position = position;
    const completions = this.config.map((item) => {
      const snippetCompletion = new vscode.CompletionItem(
        item.trigger,
        vscode.CompletionItemKind.Operator
      );
      snippetCompletion.documentation = new vscode.MarkdownString(
        item.description
      );
      return snippetCompletion;
    });

    return completions;
  }

  public resolveCompletionItem(item: vscode.CompletionItem) {
    const label = item.label;
    if (this.position && this.config && typeof label === 'string') {
      const config = this.config.find((config) => config.trigger === label);
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
  const dotLogConfig: vscode.WorkspaceConfiguration =
    vscode.workspace.getConfiguration('dotLog');

  const configList: ConfigItem[] | undefined = dotLogConfig.get('config');
  if (!configList) {
    return;
  }
  const options = vscode.languages.registerCompletionItemProvider(
    [
      'html',
      'javascript',
      'javascriptreact',
      'typescript',
      'typescriptreact',
      'vue',
    ],
    new GoCompletionItemProvider(configList),
    '.'
  );
  const command = 'dot-log-replace';
  const commandHandler = (
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    position: vscode.Position,
    config: ConfigItem
  ) => {
    const lineText = editor.document.lineAt(position.line).text;
    // match case name.log etc.
    const matchVarReg = new RegExp(
      `\(\[^\\s\]*\[^\'\"\`\]\).${config.trigger}$`
    );
    // match case 'name'.log etc.  /(['"`])([^'"])\1.log/
    const matchStrReg = new RegExp(
      `\(\[\'\"\`\]\)\(\[^\'\"\`\]*\)\\1\.${config.trigger}$`
    );
    let matchFlag: 'var' | 'str' = 'var';
    let text,
      key,
      quote = "'",
      insertVal = '';
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
      const prefix = config.prefix || '';
      const suffix = config.suffix || '';

      if (config.hideName === true) {
        insertVal = `${config.format}(${key})`;
      } else {
        if (matchFlag === 'var' && key.includes("'")) {
          quote = '"';
        }
        // format like console.log("xxx", xxx)
        if (matchFlag === 'var') {
          insertVal = `${config.format}(${quote}${prefix}${key}${suffix}${quote},${key})`;
        }
        // if key is string format like console.log("xxx")
        if (matchFlag === 'str') {
          insertVal = `${config.format}(${quote}${key}${quote})`;
        }
      }
      edit.insert(position.with(undefined, index), insertVal);
    }

    return Promise.resolve([]);
  };

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(command, commandHandler)
  );
  context.subscriptions.push(options);
}

export function deactivate() {}
