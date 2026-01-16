import * as vscode from "vscode";
import { LocalJudgePanel } from "../ui/panel";
import type { FromWebview } from "../ui/messages";
import { openLoginPage } from "../auth/loginFlow";

export function registerOpenUI(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge-ui.openUI", async () => {
    const panel = LocalJudgePanel.createOrShow();

    panel.onMessage(async (msg: FromWebview) => {
      if (msg.type === "start") {
        await vscode.commands.executeCommand("localjudge.run");
      }

      if (msg.type === "login") {
        await openLoginPage(context);
      }
    });
  });
}
