import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";
import { getToken } from "../auth/tokenStore";
import {
  getObservationsMapCache,
  setBlockListCache,
  type Observation,
  type ObservationBlock,
} from "./projectStore";

/* ---------- output ---------- */

let outputChannel: vscode.OutputChannel | undefined;
function out() {
  if (!outputChannel) outputChannel = vscode.window.createOutputChannel("LocalJudge");
  return outputChannel;
}

/* ---------- session ---------- */

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
/* ---------- command ---------- */

export function registerGetBlocksCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.getBlocks", async () => {
    const log = out();
    log.appendLine("=== Get Observation Blocks ===");
    log.show(true);

    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const baseUrl = (cfg.get<string>("baseUrl") || "").replace(/\/+$/, "");

    const token = await getToken(context);
    if (!token) {
      vscode.window.showErrorMessage("LocalJudge: missing token");
      return;
    }

    // 1儭 敺?store ??observations
    const obsMap = await getObservationsMapCache(context);
    if (!obsMap || Object.keys(obsMap).length === 0) {
      vscode.window.showErrorMessage("No observations found. Please run Get Observations first.");
      return;
    }

    const allObservations: Observation[] = Object.values(obsMap).flat();

    // 2儭 ??observation name 霈蝙?刻
    const picked = await vscode.window.showQuickPick(
      allObservations.map((o) => ({
        label: o.name,
        description: o.id,
        detail: o.purpose,
      })),
      {
        title: "Select observation to load blocks",
        matchOnDescription: true,
      }
    );

    if (!picked) return;

    const observationId = picked.description!;
    const observationName = picked.label;

    // 3儭 ?澆 observation-block API
    try {
      const { client, jar } = await getSession(baseUrl);
      const origin = new URL(baseUrl).origin + "/";
      await jar.setCookie(`access_token=${token}`, origin);

      const res = await client.get("/api/observation-block", {
        params: { observation_id: observationId },
      });

      log.appendLine(`[block] HTTP ${res.status}`);
      log.appendLine(JSON.stringify(res.data, null, 2));

      if (res.status !== 200 || !Array.isArray(res.data)) {
        vscode.window.showErrorMessage("Failed to fetch observation blocks");
        return;
      }

      const blocks = res.data as ObservationBlock[];
      await setBlockListCache(context, observationId, blocks);

      log.appendLine(
        `??Saved ${blocks.length} blocks for observation "${observationName}"`
      );

      blocks.forEach((b, i) =>
        log.appendLine(`- [${i}] ${b.id} type=${b.type ?? "?"}`)
      );

      vscode.window.showInformationMessage(
        `Loaded ${blocks.length} blocks for ${observationName}`
      );
    } catch (err: any) {
      log.appendLine(`??Error: ${err?.message ?? err}`);
      vscode.window.showErrorMessage("Get Blocks failed");
    }
  });
}


