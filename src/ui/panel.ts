import * as vscode from "vscode";
import { getHtml } from "./html";
import type { FromWebview, ToWebview } from "./messages";

export class LocalJudgePanel {
  private static current: LocalJudgePanel | undefined;
  private panel: vscode.WebviewPanel;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.webview.html = getHtml();
  }

  static createOrShow() {
    if (LocalJudgePanel.current) {
      LocalJudgePanel.current.panel.reveal(vscode.ViewColumn.One);
      return LocalJudgePanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      "localjudgeUI",
      "LocalJudge",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    LocalJudgePanel.current = new LocalJudgePanel(panel);

    panel.onDidDispose(() => {
      LocalJudgePanel.current = undefined;
    });

    return LocalJudgePanel.current;
  }

  onMessage(handler: (msg: FromWebview) => void) {
    return this.panel.webview.onDidReceiveMessage(handler);
  }

  postMessage(msg: ToWebview) {
    return this.panel.webview.postMessage(msg);
  }
}
