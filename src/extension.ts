import * as vscode from "vscode";
import { registerOpenUI } from "./commands/openUI";
import { registerAuthCallback } from "./auth/uriHandler";
import { LocalJudgePanel } from "./ui/panel";
import { registerLoginCommand } from "./commands/loginCommand";
import { registerRefreshLanguagesCommand } from "./commands/refreshLanguagesCommand";
import { registerRunCommand } from "./commands/runCommand";

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel("LocalJudge");
  context.subscriptions.push(output);

  const openUI = registerOpenUI(context);
  const login = registerLoginCommand(context);
  const refresh = registerRefreshLanguagesCommand(context, output);
  const run = registerRunCommand(context, output);
  const uriHandler = registerAuthCallback(context, () => LocalJudgePanel.current);

  context.subscriptions.push(openUI, login, refresh, run, uriHandler);
}

export function deactivate() {}
