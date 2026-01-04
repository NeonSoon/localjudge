import * as vscode from "vscode";
import { createSubmission, getLanguages, getSubmission, type JudgeRequest, type JudgeResponse } from "./api";

const SECRET_TOKEN_KEY = "localjudge.accessToken";

function safePreview(text: string, limit: number) {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + `\n...[truncated, total ${text.length} chars]`;
}

function logCaptureSummary(output: vscode.OutputChannel, editor: vscode.TextEditor, payload: JudgeRequest, previewChars: number) {
  const doc = editor.document;

  output.appendLine("=== LocalJudge Debug: Capture Summary ===");
  output.appendLine(`workspaceFolder: ${vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath ?? "(none)"}`);
  output.appendLine(`fileName: ${doc.fileName}`);
  output.appendLine(`uri: ${doc.uri.toString(true)}`);
  output.appendLine(`languageId(VSCode): ${doc.languageId}`);
  output.appendLine(`lineCount: ${doc.lineCount}`);
  output.appendLine(`eol: ${doc.eol === vscode.EndOfLine.CRLF ? "CRLF" : "LF"}`);
  output.appendLine(`isDirty(unsaved changes): ${doc.isDirty}`);
  output.appendLine("");

  output.appendLine("--- Payload (without source_code preview) ---");
  output.appendLine(`language_id: ${payload.language_id}`);
  output.appendLine(`stdin length: ${(payload.stdin ?? "").length}`);
  output.appendLine(`expected_output type: ${typeof payload.expected_output}`);
  output.appendLine("");

  output.appendLine("--- source_code preview ---");
  output.appendLine(safePreview(payload.source_code, previewChars));
  output.appendLine("=== End Debug ===\n");
}

function cfg() {
  const c = vscode.workspace.getConfiguration("localjudge");
  return {
    baseUrl: c.get<string>("baseUrl", "http://localhost:3000"),
    wait: c.get<boolean>("wait", true),
    pollIntervalMs: c.get<number>("pollIntervalMs", 1000),
    pollTimeoutMs: c.get<number>("pollTimeoutMs", 30000),
    dryRun: c.get<boolean>("dryRun", false),
    previewChars: c.get<number>("previewChars", 800),
  };
}

async function getToken(context: vscode.ExtensionContext) {
  return context.secrets.get(SECRET_TOKEN_KEY);
}

async function setToken(context: vscode.ExtensionContext, token: string) {
  await context.secrets.store(SECRET_TOKEN_KEY, token);
}

function render(output: vscode.OutputChannel, resp: JudgeResponse) {
  output.appendLine("=== LocalJudge Result ===");
  if (resp.status) output.appendLine(`Status: [${resp.status.id}] ${resp.status.description}`);
  if (resp.message) output.appendLine(`Message: ${resp.message}`);
  if (resp.time) output.appendLine(`Time: ${resp.time}`);
  if (typeof resp.memory === "number") output.appendLine(`Memory: ${resp.memory}`);

  if (resp.compile_output) {
    output.appendLine("\n--- compile_output ---");
    output.appendLine(resp.compile_output);
  }
  if (resp.stdout) {
    output.appendLine("\n--- stdout ---");
    output.appendLine(resp.stdout);
  }
  if (resp.stderr) {
    output.appendLine("\n--- stderr ---");
    output.appendLine(resp.stderr);
  }
  if (resp.token) output.appendLine(`\nToken: ${resp.token}`);
  output.appendLine("========================\n");
}

/**
 * 先用最簡策略：language_id 先寫死，下一步再接 languages endpoint 自動選語言
 * 你先把這個常數改成你們最常用的語言 id（例如 Python）
 */
const DEFAULT_LANGUAGE_ID = 71;

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel("LocalJudge");
  context.subscriptions.push(output);

  // 1) Login
  context.subscriptions.push(
    vscode.commands.registerCommand("localjudge.login", async () => {
      const token = await vscode.window.showInputBox({
        prompt: "Paste access token",
        password: true,
        ignoreFocusOut: true,
      });
      if (!token) return;

      await setToken(context, token.trim());
      vscode.window.showInformationMessage("LocalJudge token saved.");
    })
  );

  // 2) Refresh Languages（先把資料抓回來並印在 Output，下一步再用它做語言選擇）
  context.subscriptions.push(
    vscode.commands.registerCommand("localjudge.refreshLanguages", async () => {
      const { baseUrl } = cfg();
      const token = await getToken(context);

      output.clear();
      output.show(true);
      output.appendLine(`GET ${baseUrl}/code-judge/judge/languages`);

      try {
        const langs = await getLanguages(baseUrl, token);
        output.appendLine(`Loaded languages: ${langs.length}`);
        // 先直接印 JSON 方便你確認格式，之後再把型別/匹配規則寫死
        output.appendLine(JSON.stringify(langs, null, 2));
        vscode.window.showInformationMessage(`Languages refreshed: ${langs.length}`);
      } catch (e: any) {
        output.appendLine(String(e?.message ?? e));
        vscode.window.showErrorMessage("Refresh languages failed. See Output: LocalJudge");
      }
    })
  );

  // 3) Run
  context.subscriptions.push(
    vscode.commands.registerCommand("localjudge.run", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor.");
        return;
      }

      const { baseUrl, wait, pollIntervalMs, pollTimeoutMs, dryRun, previewChars } = cfg();
      const token = await getToken(context);

      const stdin = await vscode.window.showInputBox({
        prompt: "stdin (optional)",
        placeHolder: "Leave empty if not needed",
        ignoreFocusOut: true,
      });

      const payload: JudgeRequest = {
        language_id: DEFAULT_LANGUAGE_ID,              // 下一步改成自動選語言
        source_code: editor.document.getText(),
        stdin: stdin ?? "",
        expected_output: {},                          // 你們若有規格再改
      };

      output.clear();
      output.show(true);
      output.appendLine(`POST ${baseUrl}/code-judge/judge?wait=${wait ? "true" : "false"}`);
      output.appendLine(`file=${editor.document.fileName}`);
      output.appendLine(`language_id=${payload.language_id}\n`);
      logCaptureSummary(output, editor, payload, previewChars);

      if (dryRun) {
        output.appendLine("DRY RUN is enabled. No network request will be sent.");
        output.appendLine(`Would call: POST ${baseUrl}/code-judge/judge?wait=${wait ? "true" : "false"}`);
        vscode.window.showInformationMessage("LocalJudge dry-run: payload printed to Output.");
        return;
      }

      try {
        if (wait) {
          const resp = await createSubmission(baseUrl, true, payload, token);
          render(output, resp);
          return;
        }

        // wait=false：先拿 token，然後輪詢 GET /{token}
        const first = await createSubmission(baseUrl, false, payload, token);
        if (!first.token) {
          render(output, first);
          throw new Error("wait=false response has no token; cannot poll.");
        }

        const start = Date.now();
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: "LocalJudge running...", cancellable: true },
          async (_progress, cancelToken) => {
            while (true) {
              if (cancelToken.isCancellationRequested) throw new Error("Cancelled by user.");
              if (Date.now() - start > pollTimeoutMs) throw new Error("Polling timed out.");

              const resp = await getSubmission(baseUrl, first.token!, token);

              // 停止條件：你們的 status id 還沒定義，先用「不再是 queue/processing」的描述關鍵字做保守判斷
              const desc = (resp.status?.description || "").toLowerCase();
              const stillRunning =
                desc.includes("queue") || desc.includes("processing") || desc.includes("running");

              if (!stillRunning) {
                render(output, resp);
                return;
              }

              await new Promise((r) => setTimeout(r, pollIntervalMs));
            }
          }
        );
      } catch (e: any) {
        output.appendLine("=== LocalJudge Error ===");
        output.appendLine(String(e?.stack ?? e));

        if (e?.cause) {
          output.appendLine("--- cause ---");
          output.appendLine(String(e.cause?.stack ?? e.cause));
        }

        vscode.window.showErrorMessage("LocalJudge run failed. See Output: LocalJudge");
      }
    })
  );
}

export function deactivate() {}
