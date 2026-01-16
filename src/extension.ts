import * as vscode from "vscode";
import { registerOpenUI } from "./commands/openUI";
import { registerAuthCallback } from "./auth/uriHandler";
import { LocalJudgePanel } from "./ui/panel";

export function activate(context: vscode.ExtensionContext) {
  const openUI = registerOpenUI(context);

  const uriHandler = registerAuthCallback(context, () => {
    // 需要時才取目前 panel（沒有就 undefined）
    // LocalJudgePanel 內部自己管理 current
    // 這裡如果你想要更嚴謹，可以在 panel.ts 加一個 static getter
    return (LocalJudgePanel as any).current;
  });

  context.subscriptions.push(openUI, uriHandler);
}

export function deactivate() {}
