import * as vscode from "vscode";
import { saveToken } from "./tokenStore";
import type { LocalJudgePanel } from "../ui/panel";

export function registerAuthCallback(
  context: vscode.ExtensionContext,
  getPanel: () => LocalJudgePanel | undefined
) {
  return vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      if (uri.path !== "/auth-callback") return;

      const params = new URLSearchParams(uri.query);
      const token = params.get("token");

      const panel = getPanel();

      if (token) {
        await saveToken(context, token);
        panel?.postMessage({ type: "loginResult", ok: true });
        vscode.window.showInformationMessage("Login success! Token received.");
      } else {
        panel?.postMessage({ type: "loginResult", ok: false });
        vscode.window.showErrorMessage("Callback received, but no token.");
      }
    },
  });
}
