import * as vscode from "vscode";
import {
  createSubmission,
  getLanguages,
  getSubmission,
  type JudgeLanguage,
  type JudgeResponse,
} from "../api";
import { getToken } from "../auth/tokenStore";
import { CONFIG_SECTION, DEFAULT_LANGUAGE_ID, cfg } from "../config/config";
import { getQuizzesMapCache, type Quiz } from "../project/projectStore";

function normalizeBaseUrl(raw: string) {
  let u = (raw || "").trim().replace(/\/+$/, "");
  if (u.toLowerCase().endsWith("/api")) u = u.slice(0, -4);
  return u;
}

function out() {
  return vscode.window.createOutputChannel("LocalJudge");
}

function safeJson(x: unknown) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function pickSourceCode(): string | undefined {
  const ed = vscode.window.activeTextEditor;
  if (!ed) return;
  return ed.document.getText();
}

function getActiveEditorLanguageHints(): string[] {
  const ed = vscode.window.activeTextEditor;
  if (!ed) return [];

  const hints = new Set<string>();
  const languageId = ed.document.languageId?.trim().toLowerCase();
  if (languageId) hints.add(languageId);

  const fileName = ed.document.fileName.toLowerCase();
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".") + 1) : "";
  if (ext) hints.add(ext);

  const aliasMap: Record<string, string[]> = {
    javascript: ["javascript", "js", "node.js", "nodejs"],
    typescript: ["typescript", "ts"],
    python: ["python", "py", "python3"],
    cpp: ["cpp", "c++", "cc", "cxx", "gcc g++"],
    c: ["c", "gcc"],
    java: ["java"],
    csharp: ["csharp", "c#", "cs", "dotnet"],
    go: ["go", "golang"],
    rust: ["rust", "rs"],
    php: ["php"],
    ruby: ["ruby", "rb"],
    swift: ["swift"],
    kotlin: ["kotlin", "kt"],
    scala: ["scala"],
  };

  for (const key of [...hints]) {
    const aliases = aliasMap[key];
    if (!aliases) continue;
    for (const alias of aliases) hints.add(alias);
  }

  return [...hints];
}

function findMatchingLanguageId(languages: JudgeLanguage[], hints: string[]): number | undefined {
  if (hints.length === 0) return;

  const normalized = languages.map((lang) => ({
    id: lang.id,
    name: String(lang.name || "").toLowerCase(),
  }));

  // Prefer Python 3 over Python 2 when the editor only tells us "python".
  if (hints.includes("python") || hints.includes("py")) {
    const python3 = normalized.find(
      (lang) => lang.name.includes("python") && (lang.name.includes("3") || lang.name.includes("py3"))
    );
    if (python3) return python3.id;
  }

  for (const hint of hints) {
    const exact = normalized.find((lang) => lang.name === hint);
    if (exact) return exact.id;
  }

  for (const hint of hints) {
    const partial = normalized.find((lang) => lang.name.includes(hint) || hint.includes(lang.name));
    if (partial) return partial.id;
  }
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
      title: "Select quiz for Code Judge",
      matchOnDescription: true,
      ignoreFocusOut: true,
    }
  );

  return picked?.quiz;
}

async function pickLanguageId(baseUrl: string, token: string): Promise<number | undefined> {
  const languages = await getLanguages(baseUrl, token);
  if (!Array.isArray(languages) || languages.length === 0) {
    vscode.window.showErrorMessage("No judge languages available.");
    return;
  }

  const hints = getActiveEditorLanguageHints();
  const detectedLanguageId = findMatchingLanguageId(languages, hints);
  if (detectedLanguageId !== undefined) {
    return detectedLanguageId;
  }

  const picked = await vscode.window.showQuickPick(
    languages.map((lang: JudgeLanguage) => ({
      label: lang.name || `language ${lang.id}`,
      description: `id=${lang.id}`,
      languageId: lang.id,
    })),
    {
      title: "Select language for Code Judge",
      matchOnDescription: true,
      ignoreFocusOut: true,
    }
  );

  return picked?.languageId;
}

function readStringField(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return;
}

function extractStdinFromQuizConfig(config: unknown): string | undefined {
  if (!config || typeof config !== "object") return;

  const root = config as Record<string, unknown>;
  const direct = readStringField(root, ["stdin", "input"]);
  if (direct !== undefined) return direct;

  const testcases = root.testcases;
  if (!Array.isArray(testcases) || testcases.length === 0) return;

  for (const testcase of testcases) {
    if (!testcase || typeof testcase !== "object") continue;
    const value = readStringField(testcase as Record<string, unknown>, [
      "stdin",
      "input",
      "test_input",
      "sample_input",
    ]);
    if (value !== undefined) return value;
  }
}

function isPending(resp: JudgeResponse) {
  const s = String(resp?.status?.description ?? "").toLowerCase();
  const id = resp?.status?.id;
  if (id === 1 || id === 2) return true;
  return s.includes("queue") || s.includes("process");
}

async function pollResult(args: {
  baseUrl: string;
  token: string;
  submissionToken: string;
  pollIntervalMs: number;
  timeoutMs: number;
  log: vscode.OutputChannel;
}): Promise<JudgeResponse> {
  const { baseUrl, token, submissionToken, pollIntervalMs, timeoutMs, log } = args;
  const start = Date.now();

  while (true) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Polling timeout after ${timeoutMs}ms`);
    }

    const r = await getSubmission(baseUrl, submissionToken, token);
    log.appendLine("[code-judge] GET /code-judge/judge/{token}:");
    log.appendLine(safeJson(r));

    if (!isPending(r)) return r;
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

export function registerCodeJudgeCommand(context: vscode.ExtensionContext) {
  const run = async () => {
    const log = out();
    log.appendLine("=== Code Judge ===");
    log.show(true);

    const c = cfg();
    const baseUrl = normalizeBaseUrl(c.baseUrl);
    if (!baseUrl) {
      vscode.window.showErrorMessage(`Missing config: ${CONFIG_SECTION}.baseUrl`);
      return;
    }

    const token = await getToken(context);
    if (!token) {
      vscode.window.showErrorMessage("LocalJudge: missing token (please login first)");
      return;
    }

    const sourceCode = pickSourceCode();
    if (!sourceCode) {
      vscode.window.showErrorMessage("No active editor text to submit.");
      return;
    }

    const quiz = await pickQuizFromCache(context);
    if (!quiz) return;

    const quizStdin = extractStdinFromQuizConfig(quiz.config);
    const stdin = quizStdin ?? c.stdinDefault;
    const languageId = await pickLanguageId(baseUrl, token);
    if (languageId === undefined) return;

    const body = {
      language_id: languageId || DEFAULT_LANGUAGE_ID,
      source_code: sourceCode,
      stdin,
      expected_output: {},
    };

    try {
      log.appendLine("[code-judge] POST /code-judge/judge");
      log.appendLine(`[code-judge] wait=${c.wait}`);
      log.appendLine(`[code-judge] quiz=${quiz.id}`);
      log.appendLine(`[code-judge] language_id=${body.language_id}`);
      log.appendLine(`[code-judge] stdinSource=${quizStdin !== undefined ? "quiz.config" : "config.stdinDefault"}`);
      log.appendLine("[code-judge] request:");
      log.appendLine(safeJson(body));

      const created = await createSubmission(baseUrl, c.wait, body, token);
      log.appendLine("[code-judge] response:");
      log.appendLine(safeJson(created));

      if (c.wait) {
        vscode.window.showInformationMessage("CodeJudge finished (wait=true).");
        return;
      }

      const submissionToken = String(created?.token ?? "").trim();
      if (!submissionToken) {
        vscode.window.showWarningMessage("Created submission but response token is missing (wait=false).");
        return;
      }

      await context.globalState.update("localjudge.lastJudgeToken", submissionToken);
      const final = await pollResult({
        baseUrl,
        token,
        submissionToken,
        pollIntervalMs: c.pollIntervalMs,
        timeoutMs: c.pollTimeoutMs,
        log,
      });

      vscode.window.showInformationMessage(
        `CodeJudge: ${final?.status?.description ?? "completed"} (token=${submissionToken})`
      );
    } catch (err: any) {
      log.appendLine(`❌ Error: ${err?.message ?? err}`);
      vscode.window.showErrorMessage(`CodeJudge failed: ${err?.message ?? err}`);
    }
  };

  return vscode.Disposable.from(
    vscode.commands.registerCommand("localjudge.codeJudge", run),
    vscode.commands.registerCommand("localjudge.checkSubmission", run)
  );
}
