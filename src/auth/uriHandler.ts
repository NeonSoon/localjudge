import * as vscode from "vscode";
import { setToken } from "./tokenStore";
import type { LocalJudgePanel } from "../ui/panel";
import type { ToWebview } from "../ui/messages";

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

      const message: ToWebview =
        token
          ? { type: "loginResult", ok: true }
          : { type: "loginResult", ok: false };

      if (token) {
        await setToken(context, token);
        vscode.window.showInformationMessage("Login success! Token received.");
      } else {
        vscode.window.showErrorMessage("Callback received, but no token.");
      }

      panel?.postMessage(message);
    },
  });
}
