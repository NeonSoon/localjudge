import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";

export const SECRET_TOKEN_KEY = "localjudge.accessToken";

export async function getToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  const secret = await context.secrets.get(SECRET_TOKEN_KEY);
  if (secret) return secret;

  const fallback = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>("token", "");
  return fallback?.trim() || undefined;
}

export async function setToken(context: vscode.ExtensionContext, token: string) {
  await context.secrets.store(SECRET_TOKEN_KEY, token);
}
