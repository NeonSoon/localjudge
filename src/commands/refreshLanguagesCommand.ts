import * as vscode from "vscode";
import { getLanguages } from "../api";

const SECRET_TOKEN_KEY = "localjudge.accessToken";
const LANG_CACHE_KEY = "localjudge.languagesCache";

function getCfg() {
  const cfg = vscode.workspace.getConfiguration("localjudge");
  return {
    baseUrl: (cfg.get<string>("baseUrl") || "").trim(),
    dryRun: cfg.get<boolean>("dryRun") === true,
  };
}

export function registerRefreshLanguagesCommand(context: vscode.ExtensionContext, output: vscode.OutputChannel) {
  return vscode.commands.registerCommand("localjudge.refreshLanguages", async () => {
    output.show(true);
    output.appendLine("=== LocalJudge: Refresh Languages ===");

    try {
      const { baseUrl, dryRun } = getCfg();
      if (!baseUrl) throw new Error("Missing baseUrl. Please set localjudge.baseUrl in Settings.");

      if (dryRun) {
        const mock = ["c", "cpp", "java", "python", "javascript", "typescript"];
        await context.globalState.update(LANG_CACHE_KEY, mock);
        output.appendLine(`[dryRun] cached ${mock.length} languages`);
        vscode.window.showInformationMessage(`LocalJudge: cached ${mock.length} languages (dryRun).`);
        return;
      }

      const token = await context.secrets.get(SECRET_TOKEN_KEY);
      if (!token) {
        vscode.window.showWarningMessage("LocalJudge: Please login first.");
        return;
      }

      const langs = await getLanguages(baseUrl, token);
      await context.globalState.update(LANG_CACHE_KEY, langs);

      output.appendLine(`cached ${Array.isArray(langs) ? langs.length : 0} languages`);
      vscode.window.showInformationMessage("LocalJudge: Languages refreshed.");
    } catch (err: any) {
      output.appendLine(`[error] ${err?.message || String(err)}`);
      vscode.window.showErrorMessage(`LocalJudge refresh failed: ${err?.message || String(err)}`);
    }
  });
}
