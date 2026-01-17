import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";

export const SECRET_TOKEN_KEY = "localjudge.accessToken";

export async function getToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  const secret = await context.secrets.get(SECRET_TOKEN_KEY);
  if (secret) return secret;

  const fallback = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>("token", "");
  return fallback?.trim() || undefined;
}

export async function setToken(context: vscode.ExtensionContext, token: string): Promise<void> {
  await context.secrets.store(SECRET_TOKEN_KEY, token.trim());
}

export async function clearToken(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_TOKEN_KEY);
}

// 可選：常用小工具（不想要也可以不加）
export async function hasToken(context: vscode.ExtensionContext): Promise<boolean> {
  return Boolean(await getToken(context));
}
