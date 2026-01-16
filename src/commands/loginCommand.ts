import * as vscode from "vscode";
import { setToken } from "../auth/tokenStore";

export function registerLoginCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.login", async () => {
    const token = await vscode.window.showInputBox({
      prompt: "Paste access token",
      password: true,
      ignoreFocusOut: true,
    });
    if (!token) return;
    await setToken(context, token.trim());
    vscode.window.showInformationMessage("LocalJudge token saved.");
  });
}
