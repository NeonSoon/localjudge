// src/auth/loginHandler.ts
import * as vscode from "vscode";
import { loginWithUsernamePassword } from "./loginFlow";
import { setAuth } from "./tokenStore";
import { CONFIG_SECTION } from "../config/config";

function normalizeBaseUrl(raw: string) {
    return (raw || "").trim().replace(/\/api\/?$/i, "").replace(/\/+$/, "");
}


export async function handleLogin(
    context: vscode.ExtensionContext,
    panel: vscode.WebviewPanel
) {
  // 1) baseUrl
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const rawBaseUrl = String(cfg.get("baseUrl") ?? "").trim();
    const baseUrl = normalizeBaseUrl(rawBaseUrl);

    if (!baseUrl) {
        vscode.window.showErrorMessage(`Missing config: ${CONFIG_SECTION}.baseUrl`);
        panel.webview.postMessage({ type: "loginResult", ok: false, error: "Missing baseUrl" });
        return;
    }

  // 2) 帳密（先用 inputBox，之後你可換成 webview 表單）
    const username = await vscode.window.showInputBox({
        prompt: "Username",
        ignoreFocusOut: true,
    });
    if (!username) return;

    const password = await vscode.window.showInputBox({
        prompt: "Password",
        password: true,
        ignoreFocusOut: true,
    });
    if (!password) return;
    try {
    // 3) loginFlow
        const result = await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "LocalJudge: Logging in...",
            cancellable: false,
        },
        async (progress) => {
            progress.report({ message: "Signing in..." });
            return await loginWithUsernamePassword({
            context,
            baseUrl,
            username: username.trim(),
            password,
            purpose: "localjudge",
        });
      }
    );

    // 4) save token
    await setAuth(context, { token: result.token, tokenId: result.tokenId });

    // 5) 回傳給 UI
    panel.webview.postMessage({
        type: "loginResult",
        ok: true,
        username: result.user?.username,
        role: result.user?.role_name,
    });

    vscode.window.showInformationMessage(`Login successful: ${result.user?.username ?? "OK"}`);
  } catch (e: any) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    const errMsg = data ? JSON.stringify(data) : (e?.message ?? String(e));

    vscode.window.showErrorMessage(`Login failed${status ? ` (${status})` : ""}: ${errMsg}`);
    panel.webview.postMessage({
        type: "loginResult",
        ok: false,
        error: status ? `${status}: ${errMsg}` : errMsg,
    });
  }
}
