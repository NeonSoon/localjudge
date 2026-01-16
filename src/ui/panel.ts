import * as vscode from "vscode";
import { getHtml } from "./html";
import type { FromWebview, ToWebview } from "./messages";

export class LocalJudgePanel {
  private static currentPanel: LocalJudgePanel | undefined;
  private panel: vscode.WebviewPanel;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.webview.html = getHtml();
  }

  static createOrShow() {
    if (LocalJudgePanel.currentPanel) {
      LocalJudgePanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return LocalJudgePanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      "localjudgeUI",
      "LocalJudge",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    LocalJudgePanel.currentPanel = new LocalJudgePanel(panel);

    panel.onDidDispose(() => {
      LocalJudgePanel.currentPanel = undefined;
    });

    return LocalJudgePanel.currentPanel;
  }

  onMessage(handler: (msg: FromWebview) => void) {
    return this.panel.webview.onDidReceiveMessage(handler);
  }

  postMessage(msg: ToWebview) {
    return this.panel.webview.postMessage(msg);
  }

  static get current() {
    return this.currentPanel;
  }
}
