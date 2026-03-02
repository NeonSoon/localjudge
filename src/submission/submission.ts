import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { CONFIG_SECTION } from "../config/config";
import { getToken } from "../auth/tokenStore";
import {
  getBlocksMapCache,
  getQuizzesMapCache,
  type ObservationBlock,
  type Quiz,
} from "../project/projectStore";

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

function basenameFromUri(uri: vscode.Uri) {
  const p = uri.fsPath || uri.path;
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

/* ---------- session (same as getQuizzes) ---------- */

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

/* ---------- pick helpers ---------- */

function getOpenTextTabUris(): vscode.Uri[] {
  // 優先用 tabGroups (能拿到「開啟的分頁」)
  const uris: vscode.Uri[] = [];

  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input: any = tab.input;

      // Text editor tab
      if (input?.uri && input.uri instanceof vscode.Uri) {
        uris.push(input.uri);
        continue;
      }

      // Diff tab: { modified, original }
      if (input?.modified && input.modified instanceof vscode.Uri) uris.push(input.modified);
      else if (input?.original && input.original instanceof vscode.Uri) uris.push(input.original);
    }
  }

  // fallback：沒有 tabGroups 就用 visible editors
  if (uris.length === 0) {
    for (const ed of vscode.window.visibleTextEditors) {
      if (ed.document?.uri) uris.push(ed.document.uri);
    }
  }

  // 去重
  const uniq = new Map<string, vscode.Uri>();
  for (const u of uris) uniq.set(u.toString(), u);
  return [...uniq.values()];
}

async function pickOpenFile(): Promise<vscode.Uri | undefined> {
  const uris = getOpenTextTabUris().filter((u) => u.scheme !== "output");

  if (uris.length === 0) {
    vscode.window.showErrorMessage("No open text tabs found.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    uris.map((uri) => ({
      label: basenameFromUri(uri),
      description: uri.fsPath || uri.toString(),
      uri,
    })),
    {
      title: "Select an open VSCode tab to submit",
      matchOnDescription: true,
      ignoreFocusOut: true,
    }
  );

  return picked?.uri;
}

async function pickQuizFromCache(context: vscode.ExtensionContext): Promise<Quiz | undefined> {
  const quizMap = await getQuizzesMapCache(context);
  const allQuizzes: Quiz[] = quizMap ? Object.values(quizMap).flat() : [];

  if (allQuizzes.length === 0) {
    vscode.window.showErrorMessage("No quizzes in cache. Please run Get Quizzes first.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    allQuizzes.map((q) => {
      const preview = (q.question || "").replace(/\s+/g, " ").slice(0, 80);
      return {
        label: preview || "(no question text)",
        description: q.id,
        detail: `block=${q.block_id}${q.quiz_type ? ` | type=${q.quiz_type}` : ""}`,
        quiz: q,
      };
    }),
    {
      title: "Select quiz to submit",
      matchOnDescription: true,
      ignoreFocusOut: true,
    }
  );

  return picked?.quiz;
}

async function resolveObservationId(
  context: vscode.ExtensionContext,
  blockId: string
): Promise<string | undefined> {
  const blockMap = await getBlocksMapCache(context);
  if (!blockMap || Object.keys(blockMap).length === 0) return;

  const allBlocks: ObservationBlock[] = Object.values(blockMap).flat();
  const block = allBlocks.find((b) => b.id === blockId);
  return block?.observation_id;
}

/* ---------- command ---------- */

export function registerCreateSubmissionCommand(context: vscode.ExtensionContext) {
  const runSubmission = async () => {
    const log = out();
    log.appendLine("=== Create Submission ===");
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

    const fileUri = await pickOpenFile();
    if (!fileUri) return;

    const quiz = await pickQuizFromCache(context);
    if (!quiz) return;

    const observationId = await resolveObservationId(context, quiz.block_id);
    if (!observationId) {
      vscode.window.showErrorMessage(
        "Cannot resolve observation_id. Please run Get Blocks (so blocks cache exists)."
      );
      return;
    }

    const doc = await vscode.workspace.openTextDocument(fileUri);
    const code = doc.getText();

    const payload = {
      quiz_id: quiz.id,
      observation_id: observationId,
      meta: {
        selection: [] as string[],
        code,
        text: "",
      },
      token_list: [] as string[],
    };

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "LocalJudge: Submitting...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Preparing session..." });

          const { client, jar } = await getSession(baseUrl);
          const origin = new URL(baseUrl).origin + "/";
          await jar.setCookie(`access_token=${token}`, origin);

          progress.report({ message: "POST /api/submission ..." });

          const res = await client.post("/api/submission", payload);

          log.appendLine(`[submission] HTTP ${res.status}`);
          log.appendLine("payload:");
          log.appendLine(safeJson(payload));
          log.appendLine("response:");
          log.appendLine(safeJson(res.data));

          if (res.status !== 200 && res.status !== 201) {
            vscode.window.showErrorMessage(`LocalJudge: POST /api/submission failed (HTTP ${res.status})`);
            return;
          }

          vscode.window.showInformationMessage(
            `Submitted: ${basenameFromUri(fileUri)} → quiz=${quiz.id}`
          );
        }
      );
    } catch (err: any) {
      log.appendLine(`❌ Error: ${err?.message ?? err}`);
      vscode.window.showErrorMessage("LocalJudge: create submission failed");
    }
  };

  // Keep both IDs for compatibility:
  // - `localjudge.submission` is declared in package.json
  // - `localjudge.createSubmission` may be referenced by older setups
  const main = vscode.commands.registerCommand("localjudge.submission", runSubmission);
  const legacy = vscode.commands.registerCommand("localjudge.createSubmission", runSubmission);
  return vscode.Disposable.from(main, legacy);
}
