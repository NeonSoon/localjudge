import * as vscode from "vscode";
import { getToken } from "../auth/tokenStore";

function maskToken(token: string, head = 6, tail = 4) {
  if (!token) return "";
  if (token.length <= head + tail) return token;
  return `${token.slice(0, head)}...${token.slice(-tail)}`;
}

export function registerShowTokenCommand(context: vscode.ExtensionContext, output: vscode.OutputChannel) {
  return vscode.commands.registerCommand("localjudge.showToken", async () => {
    const token = await getToken(context);
    if (!token) {
      vscode.window.showWarningMessage("LocalJudge: no token found. Please login first.");
      return;
    }

    const masked = maskToken(token);

    output.appendLine("=== LocalJudge Token ===");
    output.appendLine(`length=${token.length}`);
    output.appendLine(`token=${masked}`);
    output.show(true);

    const action = await vscode.window.showInformationMessage(
      `Token length: ${token.length}`,
      { modal: true, detail: `Token: ${masked}` },
      "Copy token",
      "Open Output"
    );

    if (action === "Copy token") {
      await vscode.env.clipboard.writeText(token);
      vscode.window.showInformationMessage("Token copied to clipboard.");
    } else if (action === "Open Output") {
      output.show(true);
    }
  });
}
