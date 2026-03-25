import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";
import { getToken } from "../auth/tokenStore";
import { setProjectListCache, type Project } from "./projectStore";

/* ---------- output (same style as loginCommand) ---------- */

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

function structure(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/* ---------- session cache ---------- */

const sessionCache = new Map<string, { client: AxiosInstance; jar: CookieJar }>();

async function getOrCreateSession(baseUrlRaw: string) {
  const baseUrl = normalizeBaseUrl(baseUrlRaw);

  const cached = sessionCache.get(baseUrl);
  if (cached) return { baseUrl, ...cached };

  const { wrapper } = await import("axios-cookiejar-support");

  const jar = new CookieJar();

    const client = wrapper(
    axios.create({
      baseURL: baseUrl,
      withCredentials: true,
      jar,
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    } as any)
  );
  
  client.interceptors.request.use(async (config) => {
    const url = new URL(config.url ?? "", config.baseURL);
    const cookieHeader = await jar.getCookieString(url.toString());
    config.headers = { ...(config.headers as any), Cookie: cookieHeader } as any;
    return config;
  });

  sessionCache.set(baseUrl, { client, jar });
  return { baseUrl, client, jar };
}

/* ---------- command (same style as loginCommand) ---------- */

export function registerGetProjectsCommand(
  context: vscode.ExtensionContext,
  onProjectsLoaded?: (projects: Project[]) => void
) {
  return vscode.commands.registerCommand("localjudge.getProjects", async () => {
    try {
      const projects = await fetchProjects(context, { showNotification: true });
      onProjectsLoaded?.(projects);
    } catch (e: any) {
      const out = getOutputChannel();
      const status = e?.response?.status;
      const headers = e?.response?.headers;
      const data = e?.response?.data;

      out.appendLine("=== Get Projects Failed ===");
      out.appendLine(`[error] status=${status ?? "(none)"}`);
      out.appendLine(`[error] message=${data ? JSON.stringify(data) : String(e?.message ?? e)}`);
      if (headers) {
        out.appendLine(`[error] headers=${JSON.stringify(headers)}`);
      }

      vscode.window.showErrorMessage(`Get projects failed${status ? ` (${status})` : ""}`);
      console.error("[getProjects] status=", status, "headers=", headers, "data=", data, "err=", e);
    }
  });
}

export async function fetchProjects(
  context: vscode.ExtensionContext,
  opts?: { showNotification?: boolean }
): Promise<Project[]> {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const rawBaseUrl = (cfg.get<string>("baseUrl") || "").trim();
  const baseUrl = normalizeBaseUrl(rawBaseUrl);

  if (!baseUrl) {
    throw new Error(`Missing config: ${CONFIG_SECTION}.baseUrl`);
  }

  const out = getOutputChannel();
  out.appendLine("=== Get Projects ===");
  out.appendLine(`[config] baseUrl(raw)=${rawBaseUrl}`);
  out.appendLine(`[config] baseUrl(norm)=${baseUrl}`);
  out.show(true);

  const token = await getToken(context);
  out.appendLine(`[auth] hasToken=${Boolean(token)}`);

  if (!token) {
    out.appendLine("[projects] ??Missing token. Please login first.");
    throw new Error("LocalJudge: missing token (please login first)");
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "LocalJudge: Loading projects...",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: "Preparing session..." });

      const { client, jar } = await getOrCreateSession(baseUrl);

      const origin = new URL(baseUrl).origin + "/";
      await jar.setCookie(`access_token=${token}`, origin);

      progress.report({ message: "Fetching (/api/projects)..." });

      const res = await client.get("/api/projects");

      const record = {
        status: res.status,
        statusText: res.statusText,
        body: res.data,
      };

      out.appendLine("[projects] API response:");
      out.appendLine(structure(record));

      if (res.status !== 200) {
        throw Object.assign(
          new Error(`LocalJudge: GET /projects failed (HTTP ${res.status})`),
          { status: res.status }
        );
      }

      if (!Array.isArray(res.data)) {
        out.appendLine("[projects] ??Response is not an array");
        throw new Error("LocalJudge: projects response is not an array");
      }

      const projects = res.data as Project[];

      await setProjectListCache(context, projects);

      out.appendLine(`[projects] ??Saved ${projects.length} projects via projectStore.setProjectListCache()`);
      if (opts?.showNotification !== false) {
        vscode.window.showInformationMessage(`LocalJudge: loaded ${projects.length} projects`);
      }

      return projects;
    }
  );
}
