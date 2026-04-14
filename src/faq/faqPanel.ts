import * as vscode from "vscode";
import { getFaqBodyMarkup } from "./view/markup";
import { faqStyles } from "./view/styles";
import { getFaqScript } from "./view/script";

export class FaqPanel {
  private static instance: FaqPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  private constructor(context: vscode.ExtensionContext) {
    this.panel = vscode.window.createWebviewPanel(
      "localjudge.faqPanel",
      "FAQ Assistant",
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    this.panel.webview.html = this.buildHtml();

    this.panel.onDidDispose(() => {
      FaqPanel.instance = undefined;
    }, undefined, context.subscriptions);
  }

  static open(context: vscode.ExtensionContext): void {
    if (FaqPanel.instance) {
      FaqPanel.instance.panel.reveal(vscode.ViewColumn.One);
      return;
    }
    FaqPanel.instance = new FaqPanel(context);
  }

  private buildHtml(): string {
    const config = vscode.workspace.getConfiguration("localjudge");
    const baseUrl: string = config.get<string>("faqBaseUrl") ?? "http://localhost:8002";

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src ${baseUrl};" />
  <title>FAQ Assistant</title>
  <style>
${faqStyles}
  </style>
</head>
<body>
${getFaqBodyMarkup()}
  <script>
${getFaqScript(baseUrl)}
  </script>
</body>
</html>`;
  }
}
