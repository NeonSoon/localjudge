import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";

export const SECRET_TOKEN_KEY = "localjudge.accessToken";
export const SECRET_TOKEN_ID_KEY = "localjudge.accessTokenId";

export async function getToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  const secret = await context.secrets.get(SECRET_TOKEN_KEY);
  if (secret) return secret;

  const fallback = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>("token", "");
  return fallback?.trim() || undefined;
}

export async function getTokenId(context: vscode.ExtensionContext): Promise<string | undefined> {
  const id = await context.secrets.get(SECRET_TOKEN_ID_KEY);
  return id?.trim() || undefined;
}

export async function setToken(context: vscode.ExtensionContext, token: string): Promise<void> {
  await context.secrets.store(SECRET_TOKEN_KEY, token.trim());
}

export async function setTokenId(context: vscode.ExtensionContext, tokenId: string): Promise<void> {
  await context.secrets.store(SECRET_TOKEN_ID_KEY, tokenId.trim());
}

export async function setAuth(
  context: vscode.ExtensionContext,
  args: { token: string; tokenId?: string }
): Promise<void> {
  await context.secrets.store(SECRET_TOKEN_KEY, args.token.trim());

  if (args.tokenId) {
    await context.secrets.store(SECRET_TOKEN_ID_KEY, args.tokenId.trim());
  } else {
    await context.secrets.delete(SECRET_TOKEN_ID_KEY);
  }
}

export async function getAuth(
  context: vscode.ExtensionContext
): Promise<{ token?: string; tokenId?: string }> {
  const [token, tokenId] = await Promise.all([getToken(context), getTokenId(context)]);
  return { token, tokenId };
}

export async function clearToken(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_TOKEN_KEY);
  await context.secrets.delete(SECRET_TOKEN_ID_KEY);
}

export async function clearTokenId(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_TOKEN_ID_KEY);
}

export async function clearAuth(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_TOKEN_KEY);
  await context.secrets.delete(SECRET_TOKEN_ID_KEY);
}

export async function hasToken(context: vscode.ExtensionContext): Promise<boolean> {
  return Boolean(await getToken(context));
}

export async function hasTokenId(context: vscode.ExtensionContext): Promise<boolean> {
  return Boolean(await getTokenId(context));
}
