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
  console.log("CALLBACK URI:", uri.toString());

  if (uri.path !== "/auth-callback") return;

  const params = new URLSearchParams(uri.query);
  const code = params.get("code");
  const panel = getPanel();

  if (!code) {
    vscode.window.showErrorMessage("Callback received, but no code.");
    panel?.postMessage({ type: "authState", loggedIn: false });
    panel?.postMessage({ type: "loginResult", ok: false });
    return;
  }

  console.log("CODE:", code);

  try {
    const baseUrl = vscode.workspace
      .getConfiguration("localjudge")
      .get("baseUrl");
    // 用 code 換登入狀態
    const res = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    console.log("TOKEN RESPONSE STATUS:", res.headers);

    const data: any = await res.json();
    console.log("TOKEN RESPONSE:", data);

    const cookie = res.headers.get("set-cookie");
    console.log("SET-COOKIE HEADER:", cookie);

    // 自己拿 token
    let token = null;

    if(cookie){
      const match = cookie.match(/access_token=([^;]+);/);
      if(match) token = match[1];
    }
    console.log("Token extracted from cookie:", token);

    const userRes = await fetch(`${baseUrl}/user/current-user`, {
      method: "GET",
      headers: { Cookie: `access_token=${token}` }
    });
    const text = await userRes.text();
    console.log("Current user raw response:", text);
    const userData = JSON.parse(text);
    const username = userData.username;

    await context.secrets.store("localjudge.token", token);
    vscode.window.showInformationMessage("Login success!");

    // 存 token
    await setToken(context, token);

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

    // 載入 projects
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
    console.error("OAuth error:", err);

    vscode.window.showErrorMessage("OAuth login failed.");
    panel?.postMessage({ type: "authState", loggedIn: false });
    panel?.postMessage({ type: "loginResult", ok: false });
  }
    },
  });
}