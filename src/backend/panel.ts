import * as vscode from "vscode";
import { getHtml } from "../frontend/html";
import { loginWithUsernamePassword } from "./auth/loginFlow";

let currentPanel: vscode.WebviewPanel | undefined;   // 現在開著的web

export function openMainPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(    // 在 vscode 裡面開一個視窗
    "localjudgeUI",           // Webview 的內部 ID（系統用）
    "LocalJudge",             // title
    vscode.ViewColumn.One,    // 開在主編輯區
    { enableScripts: true }   // 允許 HTML 裡的 <script> 執行
  );

  currentPanel = panel;

  const iconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "src", "public", "icon.png")
  );
  panel.webview.html = getHtml(iconUri.toString());

  // 接收 Webview 傳回的訊息
  panel.webview.onDidReceiveMessage(async (msg) => {
    try {

      if (msg.type === "portalLogin") {

        // 用系統預設瀏覽器打開網址
        const portalUrl = "https://portal.ncu.edu.tw/oauth2/authorization";
        await vscode.env.openExternal(vscode.Uri.parse(portalUrl));

        return;
      }
      if (msg.type === "manualLogin") {

        try {
          const username = msg.username;
          const password = msg.password;

          if (!username || !password) {
            vscode.window.showErrorMessage("Username or password missing.");
            return;
          }

          // 呼叫 loginFlow
          const result = await loginWithUsernamePassword({
            context,
            baseUrl: "https://pslab.squidspirit.com", 
            username,
            password,
            purpose: "localjudge"
          });

          // 存 token
          await context.secrets.store("localjudge.token", result.token);

          vscode.window.showInformationMessage(
            `Login successful: ${result.user.username} (${result.user.role_name})     `
          );

          panel.webview.postMessage({
            type: "loginResult",
            ok: true, 
            username: result.user.username
          });

        } catch (err: any) {
            console.error("LOGIN ERROR:", err);
            vscode.window.showErrorMessage("Login failed");
        }

        return;
      }
      if (msg.type === "logout") {
        await context.secrets.delete("localjudge.token");
        await context.secrets.delete("localjudge.user");
        panel.webview.postMessage({ type: "loggedOut" });
      }

    } catch (e: unknown) {
      // 如果 e 屬 error 用 message，否則直接轉字串
      const errMsg = e instanceof Error ? e.message : String(e);    
      console.error("PANEL ERROR:", e);
      vscode.window.showErrorMessage(`Unexpected error: ${errMsg}`);
      currentPanel?.webview.postMessage({ type: "error", message: errMsg });
    }
  });

  // 如果 panel 被關掉，把 currentPanel 清掉
  panel.onDidDispose(() => {
    if (currentPanel === panel) currentPanel = undefined;
  });

  return panel;
}

export function getCurrentPanel() {
  return currentPanel;
}