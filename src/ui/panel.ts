// src/ui/panel.ts
import * as vscode from "vscode";
import { getHtml } from "./html";
import { handleOAuthLogin } from "../auth/oauthLoginHandler";

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * 開啟主介面 Webview
 * - 建 panel
 * - 塞 html
 * - 綁 UI -> extension 的 message handler
 */
export function openMainPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "localjudgeUI",           // Webview 的內部 ID（系統用）
    "LocalJudge",             // title
    vscode.ViewColumn.One,    // 開在主編輯區
    { enableScripts: true }   // 允許 HTML 裡的 <script> 執行
  );

  currentPanel = panel;

  // UI 內容
  panel.webview.html = getHtml();

  // 接收 Webview 傳回的訊息
  panel.webview.onDidReceiveMessage(async (msg) => {
    try {
      if (msg?.type === "start") {
        vscode.window.showInformationMessage("Start clicked!");
        return;
      }

      if (msg?.type === "login") {
        await handleOAuthLogin(context);
        return;
      }

    } catch (e: any) {
      // 這裡只做保底（大多數錯誤在 loginHandler 已經處理）
      const errMsg = e?.message ?? String(e);
      vscode.window.showErrorMessage(`UI error: ${errMsg}`);
      currentPanel?.webview.postMessage({ type: "error", message: errMsg });
    }
  });

  // 如果 panel 被關掉，把 currentPanel 清掉（避免之後 postMessage 發到舊 panel）
  panel.onDidDispose(() => {
    if (currentPanel === panel) currentPanel = undefined;
  });

  return panel;
}

/**
 * 你未來可能會需要：
 * 從 extension 其他地方拿到 panel（例如 socket 回傳結果要更新 UI）
 */
export function getCurrentPanel() {
  return currentPanel;
}
