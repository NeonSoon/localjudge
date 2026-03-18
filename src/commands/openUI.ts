import * as vscode from "vscode";
import { LocalJudgePanel } from "../ui/panel";
import type { FromWebview } from "../ui/messages";

export async function openLoginPage(context: vscode.ExtensionContext) {
  const extID = context.extension.id;
  const callbackUri = `vscode://${extID}/auth-callback`;
  const loginUrl = `https://pslab.squidspirit.com/sign-in?redirect=${encodeURIComponent(callbackUri)}`;
  await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
}

export function registerOpenUI(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge-ui.openUI", async () => {
    const panel = LocalJudgePanel.createOrShow();

    panel.onMessage(async (msg: FromWebview) => {
      if (msg.type === "start") {
        //await vscode.commands.executeCommand("localjudge.run");
      }

      if (msg.type === "login") {
        await openLoginPage(context);
      }
    });
  });
}
