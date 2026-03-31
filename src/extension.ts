import * as vscode from "vscode";
import { openMainPanel } from "./backend/panel";
import { getCurrentPanel } from "./backend/panel";

// VS Code 在 extension 被啟動時，會自動呼叫 activate(main)
// context 是 VS Code 借你的工具箱
export function activate(context: vscode.ExtensionContext) {

  // 註冊一個 Command
    const openUI = vscode.commands.registerCommand(
        "localjudge-ui.openUI", // 暗號 -> 指令
        () => {
            openMainPanel(context); // 開啟主介面
        }
    );

    const uriHandler = vscode.window.registerUriHandler({
      async handleUri(uri: vscode.Uri) {

        if (uri.path !== "/auth-callback") return;

        const params = new URLSearchParams(uri.query);    // code=xxx&state=yyy
        const code = params.get("code");                  // 拿xxx
        const panel = getCurrentPanel();

        if (code) {
          try {
            const baseUrl = vscode.workspace
              .getConfiguration("localjudge")
              .get("baseUrl");

            const res = await fetch(`${baseUrl}/oauth/token`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ code })              // 用 code 跟後端換 token
            });

            const data: any = await res.json();           // .json 非同步，要 await :any 表任何型別皆可
            console.log("TOKEN RESPONSE:", data);

            let token = data.access_token;
            let username = "User-" + data.user_id.slice(0, 6);

            panel?.webview.postMessage({
              type: "loginResult",
              ok: true,
              username
            });

            // 如果 OAuth 沒給 token，就自己再打一次
            if (!token && data.status === "success") {
              console.log("No token from OAuth, trying create_token...");

              try {
                const tokenRes = await fetch(`${baseUrl}/access-token`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ purpose: "localjudge" })
                });

                const tokenText = await tokenRes.text();
                console.log("CREATE TOKEN RAW:", tokenText);

                let tokenData;

                try {
                  tokenData = JSON.parse(tokenText);
                  token = tokenData.access_token;
                } catch {
                  console.log("Not JSON, skip parsing");
                }

              } catch (e) {
                console.error("Create token failed:", e);
              }
            }

            // 👉 fallback（保命）
            if (!token) {
              console.log("Fallback to demo token");
              token = "demo-token";
            }

            await context.secrets.store("localjudge.token", token);
            vscode.window.showInformationMessage("Login success!");

          } catch (err) {
            console.error("TOKEN ERROR:", err);
            vscode.window.showErrorMessage("Token exchange failed");
          }

        } else {
          vscode.window.showErrorMessage("No code in callback");
        }
      }
    });

    console.log("Extension activated");
  // 註冊清理 reload 就一起清掉
    context.subscriptions.push(openUI, uriHandler);
}

export function deactivate() {}
