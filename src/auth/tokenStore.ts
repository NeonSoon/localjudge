import * as vscode from "vscode";

const TOKEN_KEY = "localjudge.token";

export async function saveToken(context: vscode.ExtensionContext, token: string) {
  await context.secrets.store(TOKEN_KEY, token);
}

export async function readToken(context: vscode.ExtensionContext) {
  return context.secrets.get(TOKEN_KEY);
}
