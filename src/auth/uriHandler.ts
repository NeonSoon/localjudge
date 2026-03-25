import * as vscode from "vscode";
import { setToken, setUsername } from "./tokenStore";
import { fetchProjects } from "../project/getProjects";
import { getDisplayNameFromToken } from "./sessionState";
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
        const username = getDisplayNameFromToken(token);
        if (username) {
          await setUsername(context, username);
        }
        vscode.window.showInformationMessage("Login success! Token received.");
        panel?.postMessage({
          type: "authState",
          loggedIn: true,
          username,
        });
        panel?.postMessage(message);
        panel?.postMessage({ type: "projectsLoading", message: "Loading projects..." });
        try {
          const projects = await fetchProjects(context, { showNotification: false });
          panel?.postMessage({ type: "projectsLoaded", projects });
        } catch (error: any) {
          panel?.postMessage({
            type: "projectsError",
            message: String(error?.message ?? error ?? "Failed to load projects."),
          });
        }
      } else {
        vscode.window.showErrorMessage("Callback received, but no token.");
        panel?.postMessage({ type: "authState", loggedIn: false });
        panel?.postMessage(message);
      }
    },
  });
}
