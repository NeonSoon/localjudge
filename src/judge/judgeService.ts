import * as vscode from "vscode";
import { createSubmission, getSubmission, type JudgeRequest, type JudgeResponse } from "../api";
import { mockJudgeResponse } from "../output/render";

export interface RunJudgeOptions {
  baseUrl: string;
  wait: boolean;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  dryRun: boolean;
  token?: string;
  output: vscode.OutputChannel;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runJudge(payload: JudgeRequest, options: RunJudgeOptions): Promise<JudgeResponse> {
  const { baseUrl, wait, pollIntervalMs, pollTimeoutMs, dryRun, token, output } = options;

  if (dryRun) {
    output.appendLine("DRY RUN is enabled. No network request will be sent.");
    output.appendLine(`Would call: POST ${baseUrl}/code-judge/judge?wait=${wait ? "true" : "false"}`);
    output.appendLine("");
    return mockJudgeResponse();
  }

  if (wait) {
    output.appendLine(`[poll] ${new Date().toLocaleTimeString()} checking status...`);
    return createSubmission(baseUrl, true, payload, token);
  }

  const first = await createSubmission(baseUrl, false, payload, token);
  if (!first.token) {
    return first;
  }

  const start = Date.now();

  return vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "LocalJudge running...", cancellable: true },
    async (_progress, cancelToken) => {
      while (true) {
        if (cancelToken.isCancellationRequested) {
          throw new Error("Cancelled by user.");
        }
        if (Date.now() - start > pollTimeoutMs) {
          throw new Error("Polling timed out.");
        }
        const resp = await getSubmission(baseUrl, first.token!, token);
        const desc = (resp.status?.description || "").toLowerCase();
        const stillRunning = desc.includes("queue") || desc.includes("processing") || desc.includes("running");
        if (!stillRunning) {
          return resp;
        }
        await delay(pollIntervalMs);
      }
    }
  );
}
