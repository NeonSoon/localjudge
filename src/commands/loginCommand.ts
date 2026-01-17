import * as vscode from "vscode";
import { loginWithUsernamePassword } from "../auth/loginFlow";
import { setToken } from "../auth/tokenStore";
import { CONFIG_SECTION } from "../config/config";

function maskToken(token: string, head = 10, tail = 6) {
  if (!token) return "";
  if (token.length <= head + tail) return token;
  return `${token.slice(0, head)}...${token.slice(-tail)}`;
}

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("LocalJudge");
  }
  return outputChannel;
}

export function registerLoginCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.login", async () => {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const baseUrl = (cfg.get<string>("baseUrl") || "").trim();

    if (!baseUrl) {
      vscode.window.showErrorMessage(`Missing config: ${CONFIG_SECTION}.baseUrl`);
      return;
    }

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

    const out = getOutputChannel();
    out.appendLine("=== Login Attempt ===");
    out.appendLine(`[config] baseUrl=${baseUrl}`);
    out.appendLine(`[input] username=${username.trim()}`);
    out.show(true);

    try {
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "LocalJudge: Logging in…",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Signing in (/user/signin) …" });

          const { token, user } = await loginWithUsernamePassword({
            baseUrl,
            username: username.trim(),
            password,
            purpose: "localjudge",
          });

          progress.report({ message: "Saving token …" });
          await setToken(context, token);

          return { token, user };
        }
      );

      const { token, user } = result;

      // 直觀摘要（不洩漏 token）
      const summaryLines = [
        `Username: ${user.username}`,
        `Role: ${user.role_name ?? "(unknown)"}`,
        `Auth: ${user.auth_type ?? "(unknown)"}`,
        `User ID: ${user.id ?? "(unknown)"}`,
        `Token: ${token.length} chars (${maskToken(token)})`,
      ];

      out.appendLine("=== Login Success ===");
      for (const line of summaryLines) out.appendLine(line);

      // 提供按鈕操作：Copy token / Open Output / Close
      const action = await vscode.window.showInformationMessage(
        `Login successful: ${user.username}`,
        { modal: true, detail: summaryLines.join("\n") },
        "Copy token",
        "Open Output",
        "Close"
      );

      if (action === "Copy token") {
        await vscode.env.clipboard.writeText(token);
        vscode.window.showInformationMessage("Token copied to clipboard.");
      } else if (action === "Open Output") {
        out.show(true);
      }

      // 狀態列訊息（短暫）
      vscode.window.setStatusBarMessage(
        `LocalJudge: logged in as ${user.username} (${user.role_name})`,
        8000
      );
    } catch (e: any) {
      const status = e?.response?.status;
      const headers = e?.response?.headers;
      const data = e?.response?.data;

      const msg = data ? JSON.stringify(data) : String(e?.message ?? e);

      out.appendLine("=== Login Failed ===");
      out.appendLine(`[error] status=${status ?? "(none)"}`);
      out.appendLine(`[error] message=${msg}`);
      if (headers) out.appendLine(`[error] headers=${JSON.stringify(headers)}`);

      vscode.window.showErrorMessage(
        `Login failed${status ? ` (${status})` : ""}: ${msg}`
      );

      console.error("[login] status=", status, "headers=", headers, "data=", data, "err=", e);
    }
  });
}
