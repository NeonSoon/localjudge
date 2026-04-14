import * as vscode from "vscode";

export function createFaqStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  item.text = "$(comment-discussion) FAQ";
  item.tooltip = "Open FAQ Assistant";
  item.command = "localjudge.openFaq";
  item.show();
  return item;
}
