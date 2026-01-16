import * as vscode from "vscode";
import { LocalJudgePanel } from "../ui/panel";
import type { FromWebview } from "../ui/messages";

export function registerOpenUI(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge-ui.openUI", async () => {
    const panel = LocalJudgePanel.createOrShow();

    panel.onMessage(async (msg: FromWebview) => {
      if (msg.type === "start") {
        vscode.window.showInformationMessage("Start clicked!");
      }

      if (msg.type === "login") {
        const extID = context.extension.id;
        const callbackuri = `vscode://${extID}/auth-callback`;
        const loginurl =
          `https://pslab.squidspirit.com/sign-in?redirect=${encodeURIComponent(callbackuri)}`;

        await vscode.env.openExternal(vscode.Uri.parse(loginurl));
      }
    });
  });
}
