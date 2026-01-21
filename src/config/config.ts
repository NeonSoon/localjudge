import * as vscode from "vscode";

export const CONFIG_SECTION = "localjudge";
export const DEFAULT_LANGUAGE_ID = 71;

export interface LocalJudgeConfig {
    baseUrl: string;
    wait: boolean;
    pollIntervalMs: number;
    pollTimeoutMs: number;
    dryRun: boolean;
    previewChars: number;
    stdinDefault: string;
    token?: string;
}

export function cfg(): LocalJudgeConfig {
    const c = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
        baseUrl: c.get<string>("baseUrl", "http://localhost:3000"),
        wait: c.get<boolean>("wait", true),
        pollIntervalMs: c.get<number>("pollIntervalMs", 1000),
        pollTimeoutMs: c.get<number>("pollTimeoutMs", 30000),
        dryRun: c.get<boolean>("dryRun", false),
        previewChars: c.get<number>("previewChars", 800),
        stdinDefault: c.get<string>("stdinDefault", ""),
        token: c.get<string>("token", "")?.trim(),
    };
}
