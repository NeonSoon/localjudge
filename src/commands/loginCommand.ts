import * as vscode from "vscode";
import { loginWithUsernamePassword } from "../auth/loginFlow";
import { setAuth } from "../auth/tokenStore";
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

function normalizeBaseUrl(raw: string) {
  let u = (raw || "").trim().replace(/\/+$/, "");
  if (u.toLowerCase().endsWith("/api")) u = u.slice(0, -4);
  return u;
}

export function registerLoginCommand(
  context: vscode.ExtensionContext,
  onLoggedIn?: (username?: string) => void
) {
  return vscode.commands.registerCommand("localjudge.login", async () => {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const rawBaseUrl = (cfg.get<string>("baseUrl") || "").trim();
    const baseUrl = normalizeBaseUrl(rawBaseUrl);

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
    out.appendLine(`[config] baseUrl(raw)=${rawBaseUrl}`);
    out.appendLine(`[config] baseUrl(norm)=${baseUrl}`);
    out.appendLine(`[input] username=${username.trim()}`);
    out.show(true);

    try {
      const result = await vscode.window.withProgress<{
        token: string;
        tokenId?: string;
        user: any;
      }>(
        {
          location: vscode.ProgressLocation.Notification,
          title: "LocalJudge: Logging in...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Signing in (/user/signin)..." });

          const { token, tokenId, user } = await loginWithUsernamePassword({
            context,
            baseUrl,
            username: username.trim(),
            password,
            purpose: "localjudge",
          });

          out.appendLine("[debug] loginFlow returned:");
          out.appendLine(`  tokenLen=${token.length}`);
          out.appendLine(`  tokenId=${tokenId ?? "(none)"}`);

          progress.report({ message: "Saving token..." });
          await setAuth(context, { token, tokenId, username: user.username });

          return { token, tokenId, user };
        }
      );

      const { token, tokenId, user } = result;

      const summaryLines = [
        `Username: ${user.username}`,
        `Role: ${user.role_name ?? "(unknown)"}`,
        `Auth: ${user.auth_type ?? "(unknown)"}`,
        `User ID: ${user.id ?? "(unknown)"}`,
        `Token ID: ${tokenId ?? "(none)"}`,
        `Token: ${token.length} chars (${maskToken(token)})`,
      ];

      out.appendLine("=== Login Success ===");
      for (const line of summaryLines) out.appendLine(line);

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

      vscode.window.setStatusBarMessage(
        `LocalJudge: logged in as ${user.username} (${user.role_name})`,
        8000
      );

      onLoggedIn?.(user.username);
      await vscode.commands.executeCommand("localjudge.getProjects");
    } catch (e: any) {
      const status = e?.response?.status;
      const headers = e?.response?.headers;
      const data = e?.response?.data;

      const msg = data ? JSON.stringify(data) : String(e?.message ?? e);

      out.appendLine("=== Login Failed ===");
      out.appendLine(`[error] status=${status ?? "(none)"}`);
      out.appendLine(`[error] message=${msg}`);
      if (headers) out.appendLine(`[error] headers=${JSON.stringify(headers)}`);

      vscode.window.showErrorMessage(`Login failed${status ? ` (${status})` : ""}: ${msg}`);
      console.error("[login] status=", status, "headers=", headers, "data=", data, "err=", e);
    }
  });
}
