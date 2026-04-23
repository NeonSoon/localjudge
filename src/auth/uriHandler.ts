import * as vscode from "vscode";
import { setToken, setUsername } from "./tokenStore";
import { fetchProjects } from "../project/getProjects";
import { getDisplayNameFromToken } from "./sessionState";
import type { LocalJudgePanel } from "../ui/panel";
import type { ToWebview } from "../ui/messages";

const baseUrl = "https://pslab.squidspirit.com"; // ← 你的 backend

export function registerAuthCallback(
  context: vscode.ExtensionContext,
  getPanel: () => LocalJudgePanel | undefined
) {
  return vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      console.log("CALLBACK URI:", uri.toString());

      // 只處理 auth-callback
      if (uri.path !== "/auth-callback") return;

      const params = new URLSearchParams(uri.query);
      const code = params.get("code");

      const panel = getPanel();

      // 沒有 code
      if (!code) {
        vscode.window.showErrorMessage("Callback received, but no code.");
        panel?.postMessage({ type: "authState", loggedIn: false });
        panel?.postMessage({ type: "loginResult", ok: false });
        return;
      }

      console.log("CODE:", code);

      try {
        // 用 code 換 token
        const res = await fetch(`${baseUrl}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        // 從 cookie 拿 access_token
        const cookie = res.headers.get("set-cookie");
        const token = cookie?.match(/access_token=([^;]+)/)?.[1];

        console.log("COOKIE:", cookie);
        console.log("TOKEN:", token);

        if (!token) {
          vscode.window.showErrorMessage("Failed to extract token from cookie.");
          panel?.postMessage({ type: "authState", loggedIn: false });
          panel?.postMessage({ type: "loginResult", ok: false });
          return;
        }

        // 存 token
        await setToken(context, token);
        // 解析 username
        const username = getDisplayNameFromToken(token);
        if (username) {
          await setUsername(context, username);
        }

        vscode.window.showInformationMessage("Login success!");

        // 通知 UI
        panel?.postMessage({
          type: "authState",
          loggedIn: true,
          username,
        });

        panel?.postMessage({
          type: "loginResult",
          ok: true,
        });

        // 載入專題
        panel?.postMessage({
          type: "projectsLoading",
          message: "Loading projects...",
        });

        try {
          const projects = await fetchProjects(context, {
            showNotification: false,
          });

          panel?.postMessage({
            type: "projectsLoaded",
            projects,
          });
        } catch (error: any) {
          panel?.postMessage({
            type: "projectsError",
            message: String(
              error?.message ?? error ?? "Failed to load projects."
            ),
          });
        }
      } catch (err: any) {
        console.error("❌ OAuth error:", err);

        vscode.window.showErrorMessage("OAuth login failed.");
        panel?.postMessage({ type: "authState", loggedIn: false });
        panel?.postMessage({ type: "loginResult", ok: false });
      }
    },
  });
}