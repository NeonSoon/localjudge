import * as vscode from "vscode";

export async function openLoginPage(context: vscode.ExtensionContext) {
  const extID = context.extension.id;
  const callbackUri = `vscode://${extID}/auth-callback`;
  const loginUrl = `https://pslab.squidspirit.com/sign-in?redirect=${encodeURIComponent(callbackUri)}`;
  await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
}
