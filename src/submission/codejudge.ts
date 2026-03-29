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

function getActiveEditorLabel(): string | undefined {
  const ed = vscode.window.activeTextEditor;
  if (!ed) return;

  const languageId = ed.document.languageId?.trim();
  const fileName = ed.document.fileName.split("/").pop() || ed.document.fileName;
  if (!languageId) {
    return fileName;
  }

  return `${fileName} (${languageId})`;
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

async function findQuizByIdInCache(
  context: vscode.ExtensionContext,
  quizId: string
): Promise<Quiz | undefined> {
  const quizMap = await getQuizzesMapCache(context);
  const allQuizzes: Quiz[] = quizMap ? Object.values(quizMap).flat() : [];
  return allQuizzes.find((quiz) => quiz.id === quizId);
}

async function pickLanguage(
  baseUrl: string,
  token: string
): Promise<{ id: number; name: string } | undefined> {
  const languages = await getLanguages(baseUrl, token);
  if (!Array.isArray(languages) || languages.length === 0) {
    vscode.window.showErrorMessage("No judge languages available.");
    return;
  }

  const hints = getActiveEditorLanguageHints();
  const detectedLanguageId = findMatchingLanguageId(languages, hints);
  if (detectedLanguageId !== undefined) {
    const detectedLanguage = languages.find((lang) => lang.id === detectedLanguageId);
    return {
      id: detectedLanguageId,
      name: detectedLanguage?.name || `language ${detectedLanguageId}`,
    };
  }

  const picked = await vscode.window.showQuickPick(
    languages.map((lang: JudgeLanguage) => ({
      label: lang.name || `language ${lang.id}`,
      description: `id=${lang.id}`,
      language: {
        id: lang.id,
        name: lang.name || `language ${lang.id}`,
      },
    })),
    {
      title: "Select language for Code Judge",
      matchOnDescription: true,
      ignoreFocusOut: true,
    }
  );

  return picked?.language;
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

export async function runCodeJudgeForQuiz(
  context: vscode.ExtensionContext,
  options?: { quizId?: string }
) {
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

  const quiz = options?.quizId
    ? await findQuizByIdInCache(context, options.quizId)
    : await pickQuizFromCache(context);
  if (!quiz) {
    throw new Error(
      options?.quizId
        ? `Quiz ${options.quizId} not found in cache. Please reopen the project details first.`
        : "No quiz selected."
    );
  }

  const quizStdin = extractStdinFromQuizConfig(quiz.config);
  const stdin = quizStdin ?? c.stdinDefault;
  const selectedLanguage = await pickLanguage(baseUrl, token);
  if (!selectedLanguage) {
    return;
  }

  const body = {
    language_id: selectedLanguage.id || DEFAULT_LANGUAGE_ID,
    source_code: sourceCode,
    stdin,
    expected_output: {},
  };
  const editorLanguage = getActiveEditorLabel();

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
      const statusText = String(created?.status?.description ?? "completed");
      vscode.window.showInformationMessage(`CodeJudge: ${statusText}`);
      return {
        editorLanguage,
        judgeLanguage: selectedLanguage.name,
        resultLabel: statusText,
        resultDetails: safeJson(created),
      };
    }

    const submissionToken = String(created?.token ?? "").trim();
    if (!submissionToken) {
      vscode.window.showWarningMessage("Created submission but response token is missing (wait=false).");
      return {
        editorLanguage,
        judgeLanguage: selectedLanguage.name,
        resultLabel: "Submission created",
        resultDetails: safeJson(created),
      };
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
    const statusText = String(final?.status?.description ?? "completed");

    vscode.window.showInformationMessage(
      `CodeJudge: ${statusText} (token=${submissionToken})`
    );

    return {
      editorLanguage,
      judgeLanguage: selectedLanguage.name,
      resultLabel: statusText,
      resultDetails: safeJson(final),
    };
  } catch (err: any) {
    log.appendLine(`❌ Error: ${err?.message ?? err}`);
    vscode.window.showErrorMessage(`CodeJudge failed: ${err?.message ?? err}`);
    throw err;
  }
}

export function registerCodeJudgeCommand(context: vscode.ExtensionContext) {
  const run = async () => {
    await runCodeJudgeForQuiz(context);
  };

  return vscode.Disposable.from(
    vscode.commands.registerCommand("localjudge.codeJudge", run),
    vscode.commands.registerCommand("localjudge.checkSubmission", run)
  );
}
