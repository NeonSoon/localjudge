import * as vscode from 'vscode';

const output = vscode.window.createOutputChannel('LocalJudge');


export function activate(context: vscode.ExtensionContext) {

  console.log('Congratulations, your extension "localjudge" is now active!');

  // Hello World（原本就有）
  const helloWorld = vscode.commands.registerCommand(
    'localjudge.helloWorld',
    () => {
      vscode.window.showInformationMessage('Hello World from localjudge!');
    }
  );

  const uploadCurrentFile = vscode.commands.registerCommand(
    'localjudge.uploadCurrentFile',
    async () => {
      // 1) 取得目前 editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('沒有開啟任何檔案，請先開一個程式檔再執行。');
        return;
      }

      // 2) 取得檔案資訊與內容
      const doc = editor.document;
      const fileUri = doc.uri;
      const filePath = fileUri.fsPath;
      const languageId = doc.languageId; // 例如 javascript / python / cpp
      const text = doc.getText();

      // 3) 輸出到 Output
      output.clear();
      output.show(true);
      output.appendLine('=== LocalJudge: uploadCurrentFile ===');
      output.appendLine(`filePath: ${filePath}`);
      output.appendLine(`languageId: ${languageId}`);
      output.appendLine(`charCount: ${text.length}`);
      output.appendLine('--- preview (first 200 chars) ---');
      output.appendLine(text.slice(0, 200));
      output.appendLine('=== end ===');

      // 4) 給使用者一個提示
      vscode.window.showInformationMessage('已讀取目前檔案並輸出到 LocalJudge Output。');
    }
  );


  context.subscriptions.push(helloWorld, uploadCurrentFile);
}

export function deactivate() {}
