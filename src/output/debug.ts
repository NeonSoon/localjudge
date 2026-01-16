import * as vscode from "vscode";
import type { JudgeRequest } from "../api";

export function safePreview(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n...[truncated, total ${text.length} chars]`;
}

export function logCaptureSummary(output: vscode.OutputChannel, editor: vscode.TextEditor, payload: JudgeRequest, previewChars: number) {
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
