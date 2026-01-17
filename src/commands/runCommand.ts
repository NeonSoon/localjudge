import * as vscode from "vscode";
import { cfg, DEFAULT_LANGUAGE_ID } from "../config/config";
import type { JudgeRequest } from "../api";
import { getToken } from "../auth/tokenStore";
import { logCaptureSummary } from "../output/debug";
import { render } from "../output/render";
import { runJudge } from "../judge/judgeService";

export function registerRunCommand(
  context: vscode.ExtensionContext,
  output: vscode.OutputChannel
) {
  return vscode.commands.registerCommand("localjudge.run", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor.");
      return;
    }

    const {
      baseUrl,
      wait,
      pollIntervalMs,
      pollTimeoutMs,
      dryRun,
      previewChars,
      stdinDefault,
    } = cfg();

    // ① 一定要先取得 token
    const token = await getToken(context);
    if (!token) {
      vscode.window.showErrorMessage(
        "Not logged in. Please run 'LocalJudge: Login' first."
      );
      return;
    }

    // ② 取得 stdin
    const stdin = await vscode.window.showInputBox({
      prompt: "stdin (optional)",
      value: stdinDefault,
      ignoreFocusOut: true,
    });

    const payload: JudgeRequest = {
      language_id: DEFAULT_LANGUAGE_ID,
      source_code: editor.document.getText(),
      stdin: stdin ?? "",
      expected_output: {},
    };

    // ③ Output debug
    output.clear();
    output.show(true);
    output.appendLine(
      `POST ${baseUrl}/code-judge/judge?wait=${wait ? "true" : "false"}`
    );
    output.appendLine(`file=${editor.document.fileName}`);
    output.appendLine(`language_id=${payload.language_id}`);
    output.appendLine(`tokenLen=${token.length}\n`);
    logCaptureSummary(output, editor, payload, previewChars);

    try {
      // ④ 明確把 token 傳進 runJudge
      const resp = await runJudge(payload, {
        baseUrl,
        wait,
        pollIntervalMs,
        pollTimeoutMs,
        dryRun,
        token,
        output,
      });

      render(output, resp);
    } catch (e: any) {
      output.appendLine("=== LocalJudge Error ===");
      output.appendLine(String(e?.stack ?? e));

      if (e?.cause) {
        output.appendLine("--- cause ---");
        output.appendLine(String(e.cause?.stack ?? e.cause));
      }

      vscode.window.showErrorMessage(
        "LocalJudge run failed. See Output: LocalJudge"
      );
    }
  });
}
