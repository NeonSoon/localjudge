import * as vscode from "vscode";
import { openMainPanel } from "./ui/panel";

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

  // 註冊清理 reload 就一起清掉
    context.subscriptions.push(openUI);
}

export function deactivate() {}
