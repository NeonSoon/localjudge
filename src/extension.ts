import * as vscode from "vscode";
import { openMainPanel } from "./backend/panel";
import { getCurrentPanel } from "./backend/panel";

// VS Code 在 extension「被啟動」時，會自動呼叫 activate(main)
// context 是 VS Code 借你的「管理工具箱」
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

        console.log("Received URI:", uri.toString());

        if (uri.path !== "/auth-callback") return;

        const params = new URLSearchParams(uri.query);
        const code = params.get("code");

        console.log("CODE:", code);

        const panel = getCurrentPanel();

        if (code) {
          try {
            const baseUrl = vscode.workspace
              .getConfiguration("localjudge")
              .get("baseUrl");

            const res = await fetch(`${baseUrl}/oauth/token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ code })
            });

            const data: any = await res.json();
            console.log("TOKEN RESPONSE:", data);

            const token = data.access_token;

            if (token) {
              await context.secrets.store("localjudge.token", token);

              vscode.window.showInformationMessage("Login success!");

              panel?.webview.postMessage({
                type: "loginResult",
                ok: true
              });

            } else {
              vscode.window.showErrorMessage("No token received");
            }

          } catch (err) {
            console.error("TOKEN ERROR:", err);
            vscode.window.showErrorMessage("Token exchange failed");
          }

        } else {
          vscode.window.showErrorMessage("No code in callback");
        }
      }
    });

    const testLogin = vscode.commands.registerCommand("localjudge.testLogin", async () => {
      const panel = getCurrentPanel();

      await context.secrets.store("localjudge.token", "123");

      panel?.webview.postMessage({
        type: "loginResult",
        ok: true,
        username: "test_user"
      });

      vscode.window.showInformationMessage("Fake login success");
    });

    console.log("Extension activated");
  // 註冊清理 reload 就一起清掉
    context.subscriptions.push(openUI, uriHandler, testLogin);
}

export function deactivate() {}
