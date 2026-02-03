import * as vscode from "vscode";
import { logoutAndRevokeToken } from "../auth/logoutFlow";
import { CONFIG_SECTION } from "../config/config";

function normalizeBaseUrl(raw: string) {
  let u = (raw || "").trim().replace(/\/+$/, "");
  if (u.toLowerCase().endsWith("/api")) u = u.slice(0, -4);
  return u;
}

export function registerLogoutCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.logout", async () => {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const rawBaseUrl = cfg.get<string>("baseUrl") || "";
    const baseUrl = normalizeBaseUrl(rawBaseUrl);

    if (!baseUrl) {
      vscode.window.showErrorMessage("Missing config: baseUrl");
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "LocalJudge: Logging out...",
        cancellable: false,
      },
      async () => {
        await logoutAndRevokeToken({ baseUrl, context });
      }
    );

    vscode.window.setStatusBarMessage("LocalJudge: logged out", 5000);
    vscode.window.showInformationMessage("Logout successful");
  });
}
