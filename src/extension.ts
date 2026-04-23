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
        console.log("code from callback:", code);
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
            console.log("TOKEN STATUS:", res.headers);

            const data: any = await res.json();           // .json 非同步，要 await :any 表任何型別皆可
            console.log("TOKEN RESPONSE:", data);

            const cookie = res.headers.get("set-cookie");
            console.log("SET-COOKIE:", cookie);

            let token = null;

            if(cookie){
              const match = cookie.match(/access_token=([^;]+);/);
              if(match) token = match[1];
            }
            console.log("Token extracted from cookie:", token);

            const userRes = await fetch(`${baseUrl}/user/current-user`, {
              method: "GET",
              headers: { Cookie: `access_token=${token}` }
            });
            const text = await userRes.text();
            console.log("Current user raw response:", text);
            const userData = JSON.parse(text);
            const username = userData.username;

            panel?.webview.postMessage({
              type: "loginResult",
              ok: true,
              username
            });

            // fallback（保命）
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
