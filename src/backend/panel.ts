// import * as vscode from "vscode";
// import { getHtml } from "../frontend/html";
// import { loginWithUsernamePassword } from "./auth/loginFlow";

// let currentPanel: vscode.WebviewPanel | undefined;   // 現在開著的web

// export function openMainPanel(context: vscode.ExtensionContext) {
//   const panel = vscode.window.createWebviewPanel(    // 在 vscode 裡面開一個視窗
//     "localjudgeUI",           // Webview 的內部 ID（系統用）
//     "LocalJudge",             // title
//     vscode.ViewColumn.One,    // 開在主編輯區
//     { enableScripts: true }   // 允許 HTML 裡的 <script> 執行
//   );

//   currentPanel = panel;

//   const iconUri = panel.webview.asWebviewUri(
//     vscode.Uri.joinPath(context.extensionUri, "src", "public", "icon.png")
//   );
//   panel.webview.html = getHtml(iconUri.toString());

//   // 接收 Webview 傳回的訊息
//   panel.webview.onDidReceiveMessage(async (msg) => {
//     try {

//       if (msg.type === "portalLogin") {
        
//         const url = new URL("https://pslab.squidspirit.com/api/oauth/authorize");
//         url.searchParams.set("should_exchange_code", "true");
//         url.searchParams.set("redirect_uri", "vscode://anna.localjudge-ui/auth-callback");

//         const res = await fetch(url.toString());

//         console.log("STATUS111:", res.status);

//         const text = await res.text();
//         console.log("TOKEN RAW RESPONSE:", text);

//         let data: any = null;
//         try {
//           data = JSON.parse(text);
//           console.log("PARSED JSON:", data);
//         } catch {
//           console.log("Not JSON response");
//         }

//         const authUrl = data.auth_url;

//         if (!authUrl) {
//           vscode.window.showErrorMessage("Failed to get auth URL");
//           return;
//         }

//         await vscode.env.openExternal(vscode.Uri.parse(authUrl));

//       }
//       if (msg.type === "manualLogin") {

//         try {
//           const username = msg.username;
//           const password = msg.password;

//           if (!username || !password) {
//             vscode.window.showErrorMessage("Username or password missing.");
//             return;
//           }

//           // 呼叫 loginFlow
//           const result = await loginWithUsernamePassword({
//             context,
//             baseUrl: "https://pslab.squidspirit.com", 
//             username,
//             password,
//             purpose: "localjudge"
//           });

//           // 存 token
//           await context.secrets.store("localjudge.token", result.token);

//           vscode.window.showInformationMessage(
//             `Login successful: ${result.user.username} (${result.user.role_name})     `
//           );

//           panel.webview.postMessage({
//             type: "loginResult",
//             ok: true, 
//             username: result.user.username
//           });

//         } catch (err: any) {
//             console.error("LOGIN ERROR:", err);
//             vscode.window.showErrorMessage("Login failed");
//         }

//         return;
//       }
//       if (msg.type === "logout") {
//         await context.secrets.delete("localjudge.token");
//         await context.secrets.delete("localjudge.user");
//         panel.webview.postMessage({ type: "loggedOut" });
//       }

//     } catch (e: unknown) {
//       // 如果 e 屬 error 用 message，否則直接轉字串
//       const errMsg = e instanceof Error ? e.message : String(e);    
//       console.error("PANEL ERROR:", e);
//       vscode.window.showErrorMessage(`Unexpected error: ${errMsg}`);
//       currentPanel?.webview.postMessage({ type: "error", message: errMsg });
//     }
//   });

//   // 如果 panel 被關掉，把 currentPanel 清掉
//   panel.onDidDispose(() => {
//     if (currentPanel === panel) currentPanel = undefined;
//   });

//   return panel;
// }

// export function getCurrentPanel() {
//   return currentPanel;
// }