import * as vscode from "vscode";
import { createSubmission, getSubmission, type JudgeResponse } from "../api";
import { getToken } from "../auth/tokenStore";
import { CONFIG_SECTION, DEFAULT_LANGUAGE_ID, cfg } from "../config/config";

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

    const body = {
      language_id: DEFAULT_LANGUAGE_ID,
      source_code: sourceCode,
      stdin: c.stdinDefault,
      expected_output: {},
    };

    try {
      log.appendLine("[code-judge] POST /code-judge/judge");
      log.appendLine(`[code-judge] wait=${c.wait}`);
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
