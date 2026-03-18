// src/auth/oauthLoginHandler.ts
import * as vscode from "vscode";

export async function handleOAuthLogin(context: vscode.ExtensionContext) {
  const extId = context.extension.id; // ex: localjudge.localjudge-ui
  const callbackUri = `vscode://${extId}/auth-callback`;

  // 你的登入頁，把 callbackUri 帶進去
  const loginUrl =
    `https://pslab.squidspirit.com/sign-in?redirect=${encodeURIComponent(callbackUri)}`;

  await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
}
