import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  console.log('Congratulations, your extension "localjudge" is now active!');

  // Hello World（原本就有）
  const helloWorld = vscode.commands.registerCommand(
    'localjudge.helloWorld',
    () => {
      vscode.window.showInformationMessage('Hello World from localjudge!');
    }
  );

  // uploadCurrentFile（你新加的）
  const uploadCurrentFile = vscode.commands.registerCommand(
    'localjudge.uploadCurrentFile',
    async () => {
      vscode.window.showInformationMessage('uploadCurrentFile triggered');
    }
  );

  context.subscriptions.push(helloWorld, uploadCurrentFile);
}

export function deactivate() {}
