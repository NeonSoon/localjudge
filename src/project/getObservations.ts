import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";
import { getToken } from "../auth/tokenStore";
import {
  getProjectListCache,
  setCurrentProjectId,
  setObservationListCache,
  type Project,
  type Observation,
} from "./projectStore";

/* ---------- output ---------- */

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel() {
  if (!outputChannel) outputChannel = vscode.window.createOutputChannel("LocalJudge");
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

/* ---------- command ---------- */

export function registerGetObservationsCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.getObservations", async () => {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const rawBaseUrl = (cfg.get<string>("baseUrl") || "").trim();
    const baseUrl = normalizeBaseUrl(rawBaseUrl);

    const out = getOutputChannel();
    out.appendLine("=== Get Observations ===");
    out.appendLine(`[config] baseUrl(raw)=${rawBaseUrl}`);
    out.appendLine(`[config] baseUrl(norm)=${baseUrl}`);
    out.show(true);

    if (!baseUrl) {
      vscode.window.showErrorMessage(`Missing config: ${CONFIG_SECTION}.baseUrl`);
      return;
    }

    const token = await getToken(context);
    out.appendLine(`[auth] hasToken=${Boolean(token)}`);
    if (!token) {
      vscode.window.showErrorMessage("LocalJudge: missing token (please login first)");
      return;
    }

    // 1) 從 store 拿 projects（你說會先跑 getProjects，所以這裡就直接讀快取）
    const projects = await getProjectListCache(context);
    if (!projects || projects.length === 0) {
      vscode.window.showErrorMessage("LocalJudge: project list is empty. Please run Get Projects first.");
      return;
    }

    // 2) 讓使用者用「名稱」選 project（QuickPick 依照名稱搜尋；同名時用 id 區分）
    const picked = await vscode.window.showQuickPick(
      projects.map((p) => ({
        label: p.name,
        description: p.id,
      })),
      {
        title: "Select a project to load observations",
        placeHolder: "Type project name to filter",
        matchOnDescription: true,
        canPickMany: false,
        ignoreFocusOut: true,
      }
    );

    if (!picked) {
      out.appendLine("[observations] cancelled by user");
      return;
    }

    const projectId = picked.description!;
    const projectName = picked.label;
    await setCurrentProjectId(context, projectId);

    // 3) 呼叫 observations API，並存到 store
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `LocalJudge: Loading observations (${projectName})...`,
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Preparing session..." });

          const { client, jar } = await getOrCreateSession(baseUrl);

          // token -> cookie
          const origin = new URL(baseUrl).origin + "/";
          await jar.setCookie(`access_token=${token}`, origin);

          progress.report({ message: "Fetching (/api/observation/list)..." });

          const res = await client.get("/api/observation/list", {
            params: { project_id: projectId },
          });

          const record = {
            status: res.status,
            statusText: res.statusText,
            body: res.data,
          };

          out.appendLine("[observations] API response:");
          out.appendLine(structure(record));

          if (res.status !== 200) {
            vscode.window.showErrorMessage(`LocalJudge: GET /observation/list failed (HTTP ${res.status})`);
            return;
          }

          if (!Array.isArray(res.data)) {
            vscode.window.showErrorMessage("LocalJudge: observations response is not an array");
            return;
          }

          const observations = res.data as Observation[];

          await setObservationListCache(context, projectId, observations);

          out.appendLine(
            `[observations] ✅ Saved ${observations.length} observations for project=${projectName} (${projectId})`
          );

          // 顯示清單（避免太長，先列 name/id）
          for (const o of observations) {
            out.appendLine(`- ${o.name} (${o.id}) purpose=${o.purpose}`);
          }

          vscode.window.showInformationMessage(
            `LocalJudge: loaded ${observations.length} observations for "${projectName}"`
          );
        }
      );
    } catch (e: any) {
      out.appendLine("=== Get Observations Failed ===");
      out.appendLine(`[error] message=${String(e?.message ?? e)}`);
      vscode.window.showErrorMessage("LocalJudge: get observations failed");
      console.error("[getObservations] err=", e);
    }
  });
}
