import * as vscode from "vscode";
import { getLanguages } from "../api";
import { cfg } from "../config/config";
import { getToken } from "../auth/tokenStore";

export function registerRefreshLanguagesCommand(context: vscode.ExtensionContext, output: vscode.OutputChannel) {
  return vscode.commands.registerCommand("localjudge.refreshLanguages", async () => {
    const { baseUrl } = cfg();
    const token = await getToken(context);

    output.clear();
    output.show(true);
    output.appendLine(`GET ${baseUrl}/code-judge/judge/languages`);

    try {
      const langs = await getLanguages(baseUrl, token);
      output.appendLine(`Loaded languages: ${langs.length}`);
      output.appendLine(JSON.stringify(langs, null, 2));
      vscode.window.showInformationMessage(`Languages refreshed: ${langs.length}`);
    } catch (e: any) {
      output.appendLine(String(e?.message ?? e));
      vscode.window.showErrorMessage("Refresh languages failed. See Output: LocalJudge");
    }
  });
}
