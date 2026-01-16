export interface JudgeLanguage {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface JudgeStatus {
  id: number;
  description: string;
}

export interface JudgeResponse {
  token?: string;
  status?: JudgeStatus;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  time?: string;
  memory?: number;
  message?: string;
  [key: string]: unknown;
}

export interface JudgeRequest {
  language_id: number;
  source_code: string;
  stdin?: string;
  expected_output?: unknown;
  [key: string]: unknown;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export async function getLanguages(baseUrl: string, accessToken?: string): Promise<JudgeLanguage[]> {
  const url = `${normalizeBaseUrl(baseUrl)}/code-judge/judge/languages`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) throw new Error(`GET languages failed: ${res.status} ${res.statusText}\n${await res.text()}`);
  return (await res.json()) as JudgeLanguage[];
}

export async function createSubmission(baseUrl: string, wait: boolean, body: JudgeRequest, accessToken?: string): Promise<JudgeResponse> {
  const url = `${normalizeBaseUrl(baseUrl)}/code-judge/judge?wait=${wait ? "true" : "false"}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST judge failed: ${res.status} ${res.statusText}\n${await res.text()}`);
  return (await res.json()) as JudgeResponse;
}

export async function getSubmission(baseUrl: string, token: string, accessToken?: string): Promise<JudgeResponse> {
  const url = `${normalizeBaseUrl(baseUrl)}/code-judge/judge/${encodeURIComponent(token)}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) throw new Error(`GET submission failed: ${res.status} ${res.statusText}\n${await res.text()}`);
  return (await res.json()) as JudgeResponse;
}
