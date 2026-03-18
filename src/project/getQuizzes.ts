import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";
import { getToken } from "../auth/tokenStore";
import {
  getBlocksMapCache,
  setQuizListCache,
  type ObservationBlock,
  type Quiz,
} from "./projectStore";

/* ---------- output ---------- */

let outputChannel: vscode.OutputChannel | undefined;
function out() {
  if (!outputChannel) outputChannel = vscode.window.createOutputChannel("LocalJudge");
  return outputChannel;
}

/* ---------- helpers ---------- */

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

  // mirror loginFlow: attach cookies from jar to each request
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

export function registerGetQuizzesCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("localjudge.getQuizzes", async () => {
    const log = out();
    log.appendLine("=== Get Quizzes ===");
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

    // 1) 從 store 拿 blocks（你會先跑 getBlocks）
    const blockMap = await getBlocksMapCache(context);
    if (!blockMap || Object.keys(blockMap).length === 0) {
      vscode.window.showErrorMessage("No blocks found. Please run Get Blocks first.");
      return;
    }

    const allBlocks: ObservationBlock[] = Object.values(blockMap).flat();

    // 2) 選 block（用 id/type/name 當提示）
    const picked = await vscode.window.showQuickPick(
      allBlocks.map((b) => ({
        label: b.name ? b.name : (b.type ? `[${b.type}]` : "[block]"),
        description: b.id,
        detail: `observation=${b.observation_id}${b.type ? ` | type=${b.type}` : ""}`,
      })),
      {
        title: "Select block to load quizzes",
        matchOnDescription: true,
        ignoreFocusOut: true,
      }
    );

    if (!picked) return;

    const blockId = picked.description!;
    const blockTitle = picked.label;

    // 3) 呼叫 quiz API /api/quiz?block_id=...
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `LocalJudge: Loading quizzes (${blockTitle})...`,
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Preparing session..." });

          const { client, jar } = await getSession(baseUrl);
          const origin = new URL(baseUrl).origin + "/";
          await jar.setCookie(`access_token=${token}`, origin);

          progress.report({ message: "Fetching (/api/quiz)..." });

          const res = await client.get("/api/quiz", { params: { block_id: blockId } });

          log.appendLine(`[quiz] HTTP ${res.status}`);
          log.appendLine(safeJson(res.data));

          if (res.status !== 200) {
            vscode.window.showErrorMessage(`LocalJudge: GET /api/quiz failed (HTTP ${res.status})`);
            return;
          }

          // 你現在 PowerShell 看起來回單個物件，但也可能回陣列
          const quizzes: Quiz[] = Array.isArray(res.data) ? (res.data as Quiz[]) : [res.data as Quiz];

          await setQuizListCache(context, blockId, quizzes);

          log.appendLine(`✅ Saved ${quizzes.length} quizzes for block=${blockId}`);
          quizzes.forEach((q, i) => {
            const qPreview = (q.question || "").replace(/\s+/g, " ").slice(0, 80);
            log.appendLine(`- [${i}] ${q.id} type=${q.quiz_type ?? "?"} weight=${q.weight ?? "?"} q="${qPreview}"`);
          });

          vscode.window.showInformationMessage(`LocalJudge: loaded ${quizzes.length} quizzes`);
        }
      );
    } catch (err: any) {
      log.appendLine(`❌ Error: ${err?.message ?? err}`);
      vscode.window.showErrorMessage("LocalJudge: get quizzes failed");
    }
  });
}
