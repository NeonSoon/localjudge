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
        const token = params.get("token");

        const panel = getCurrentPanel();

        if (token) {
          await context.secrets.store("localjudge.token", token);
          vscode.window.showInformationMessage("Login success! Token received.");
          panel?.webview.postMessage({ type: "loginResult", ok: true });
        }
        else {
          vscode.window.showErrorMessage("Callback received, but no token.");
          panel?.webview.postMessage({ type: "loginResult", ok: false });
        }
      }
    });


  // 註冊清理 reload 就一起清掉
    context.subscriptions.push(openUI, uriHandler);
}

export function deactivate() {}
