import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { getToken } from "../auth/tokenStore";
import { CONFIG_SECTION } from "../config/config";
import { getObservationsMapCache, type Observation } from "../project/projectStore";

let outputChannel: vscode.OutputChannel | undefined;
function out() {
  if (!outputChannel) outputChannel = vscode.window.createOutputChannel("LocalJudge");
  return outputChannel;
}

function normalizeBaseUrl(raw: string) {
  let u = (raw || "").trim().replace(/\/+$/, "");
  if (u.toLowerCase().endsWith("/api")) u = u.slice(0, -4);
  return u;
}

function safeJson(x: unknown) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function short(v: unknown, max = 80) {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 3)}...`;
}

function listify(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  return [data];
}

function renderSummaryRows(data: any): string[] {
  const rows = listify(data);
  return rows.map((r, i) => {
    const id = String(r?.id ?? "-");
    const user = String(r?.user?.username ?? "-");
    const quiz = String(r?.quiz?.id ?? "-");
    const at = String(r?.created_at ?? "-");
    const code = short(r?.meta?.code ?? "-", 60);
    return `[${i}] id=${id} user=${user} quiz=${quiz} at=${at} code="${code}"`;
  });
}

const sessionCache = new Map<string, { client: AxiosInstance; jar: CookieJar }>();

async function getSession(baseUrl: string) {
  const cached = sessionCache.get(baseUrl);
  if (cached) return cached;

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
  return { client, jar };
}

async function pickObservationId(context: vscode.ExtensionContext): Promise<string | undefined> {
  const obsMap = await getObservationsMapCache(context);
  const all: Observation[] = obsMap ? Object.values(obsMap).flat() : [];

  const manualOption = {
    label: "Enter observation_id manually",
    description: "Manual input",
    detail: "",
    observationId: "__manual__",
  };

  const picked = await vscode.window.showQuickPick(
    [
      ...all.map((o) => ({
        label: o.name || "(unnamed observation)",
        description: o.id,
        detail: o.purpose || "",
        observationId: o.id,
      })),
      manualOption,
    ],
    {
      title: "Select observation_id for GET /submission",
      matchOnDescription: true,
      ignoreFocusOut: true,
    }
  );

  if (!picked) return;
  if (picked.observationId !== "__manual__") return picked.observationId;

  const manual = await vscode.window.showInputBox({
    title: "observation_id",
    prompt: "Enter observation_id (uuid)",
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : "observation_id is required"),
  });
  return manual?.trim() || undefined;
}

async function pickLatestFlag(): Promise<boolean | undefined> {
  const picked = await vscode.window.showQuickPick(
    [
      { label: "latest=true", value: true, description: "Only latest submission(s)" },
      { label: "latest=false", value: false, description: "All submissions" },
    ],
    {
      title: "Choose latest query parameter",
      ignoreFocusOut: true,
    }
  );
  return picked?.value;
}

export function registerGetSubmissionsCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.getSubmissions", async () => {
    const log = out();
    log.appendLine("=== Get Submissions ===");
    log.show(true);

    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const baseUrl = normalizeBaseUrl(cfg.get<string>("baseUrl") || "");
    if (!baseUrl) {
      vscode.window.showErrorMessage(`Missing config: ${CONFIG_SECTION}.baseUrl`);
      return;
    }

    const token = await getToken(context);
    if (!token) {
      vscode.window.showErrorMessage("LocalJudge: missing token (please login first)");
      return;
    }

    const observationId = await pickObservationId(context);
    if (!observationId) return;

    const latest = await pickLatestFlag();
    if (latest === undefined) return;

    try {
      const { client, jar } = await getSession(baseUrl);
      const origin = new URL(baseUrl).origin + "/";
      await jar.setCookie(`access_token=${token}`, origin);

      const res = await client.get("/api/submission", {
        params: {
          observation_id: observationId,
          latest,
        },
      });

      log.appendLine(`[submission.list] GET /api/submission?observation_id=${observationId}&latest=${String(latest)}`);
      log.appendLine(`[submission.list] HTTP ${res.status}`);

      if (res.status !== 200) {
        log.appendLine("[submission.list] response:");
        log.appendLine(safeJson(res.data));
        vscode.window.showErrorMessage(`LocalJudge: GET /api/submission failed (HTTP ${res.status})`);
        return;
      }

      const rows = renderSummaryRows(res.data);
      const count = rows.length;
      log.appendLine(`[submission.list] count=${count}`);
      rows.forEach((line) => log.appendLine(line));
      vscode.window.showInformationMessage(
        `LocalJudge: fetched ${count} submission record(s) for observation ${observationId}`
      );
    } catch (err: any) {
      log.appendLine(`❌ Error: ${err?.message ?? err}`);
      vscode.window.showErrorMessage("LocalJudge: get submissions failed");
    }
  });
}
