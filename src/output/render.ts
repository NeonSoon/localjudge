import * as vscode from "vscode";
import type { JudgeResponse } from "../api";

export function mockJudgeResponse(): JudgeResponse {
  return {
    status: { id: 3, description: "Accepted (dry-run)" },
    stdout: "Hello from dry-run\n",
    stderr: "",
    time: "0.00",
    memory: 0,
    message: "This is a simulated response (dry-run)",
  };
}

export function render(output: vscode.OutputChannel, resp: JudgeResponse) {
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
