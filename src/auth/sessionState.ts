import * as vscode from "vscode";
import { clearAuth, getToken, getUsername } from "./tokenStore";
import { fetchProjects } from "../project/getProjects";
import { clearProjectListCache } from "../project/projectStore";
import type { LocalJudgePanel } from "../ui/panel";

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

type JwtPayload = {
  exp?: number;
  username?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  sub?: string;
};

function getJwtPayload(token: string): JwtPayload | undefined {
  const parts = token.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
  } catch {
    return undefined;
  }
}

export function getDisplayNameFromToken(token: string) {
  const payload = getJwtPayload(token);
  const candidate =
    payload?.username ||
    payload?.preferred_username ||
    payload?.name ||
    payload?.email ||
    payload?.sub;

  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : undefined;
}

function isJwtExpired(token: string) {
  const payload = getJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds;
}

async function clearStoredSession(context: vscode.ExtensionContext) {
  await clearAuth(context);
  await clearProjectListCache(context);
}

export async function refreshSidebarSession(
  context: vscode.ExtensionContext,
  panel: LocalJudgePanel
) {
  panel.showProjectsLoading("Checking login status...");

  const token = await getToken(context);
  if (!token) {
    await clearProjectListCache(context);
    panel.showAuthState(false);
    panel.showProjectsError("Not logged in. Please login to load your project list.");
    return;
  }

  if (isJwtExpired(token)) {
    await clearStoredSession(context);
    panel.showAuthState(false);
    panel.showProjectsError("Login expired. Please login again.");
    return;
  }

  const username = getDisplayNameFromToken(token) || (await getUsername(context));
  panel.showAuthState(true, username);

  try {
    const projects = await fetchProjects(context, { showNotification: false });
    panel.showProjects(projects);
  } catch (error: any) {
    const status = error?.status;
    if (status === 401 || status === 403) {
      await clearStoredSession(context);
      panel.showAuthState(false);
      panel.showProjectsError("Login expired. Please login again.");
      return;
    }

    panel.showProjectsError(
      String(error?.message ?? error ?? "Failed to verify login state.")
    );
  }
}
