import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as vscode from "vscode";
import { getToken } from "../auth/tokenStore";
import { CONFIG_SECTION } from "../config/config";
import {
  setBlockListCache,
  setCurrentProjectId,
  setObservationListCache,
  setQuizListCache,
  type Observation,
  type ObservationBlock,
  type Quiz,
} from "./projectStore";
import type { BlockSummary } from "../ui/messages";

const sessionCache = new Map<string, { client: AxiosInstance; jar: CookieJar }>();

function normalizeBaseUrl(raw: string) {
  let url = (raw || "").trim().replace(/\/+$/, "");
  if (url.toLowerCase().endsWith("/api")) {
    url = url.slice(0, -4);
  }
  return url;
}

function formatApiError(prefix: string, status: number, data: unknown) {
  const detail =
    typeof data === "string"
      ? data
      : data
        ? JSON.stringify(data)
        : "";
  return detail ? `${prefix} failed (HTTP ${status}): ${detail}` : `${prefix} failed (HTTP ${status})`;
}

async function getSession(baseUrl: string) {
  const cached = sessionCache.get(baseUrl);
  if (cached) {
    return cached;
  }

  const { wrapper } = await import("axios-cookiejar-support");
  const jar = new CookieJar();

  const client = wrapper(
    axios.create({
      baseURL: baseUrl,
      withCredentials: true,
      jar,
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    } as any)
  );

  client.interceptors.request.use(async (config) => {
    const url = new URL(config.url ?? "", config.baseURL);
    const cookieHeader = await jar.getCookieString(url.toString());
    config.headers = { ...(config.headers as any), Cookie: cookieHeader } as any;
    return config;
  });

  const session = { client, jar };
  sessionCache.set(baseUrl, session);
  return session;
}

function compareOrder(a?: number, b?: number) {
  return (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER);
}

async function fetchObservations(
  client: AxiosInstance,
  projectId: string
): Promise<Observation[]> {
  const candidates = ["/api/observation", "/api/observation/list"];
  let lastStatus = 0;
  let lastData: unknown;

  for (const path of candidates) {
    const response = await client.get(path, {
      params: { project_id: projectId },
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data as Observation[];
    }

    lastStatus = response.status;
    lastData = response.data;

    // Some backends route "/api/observation/list" into "/api/observation/{id}".
    // Try the next candidate before failing.
    if (response.status === 404 || response.status === 405 || response.status === 422) {
      continue;
    }

    break;
  }

  throw new Error(
    formatApiError("LocalJudge: GET /api/observation", lastStatus, lastData)
  );
}

export async function fetchProjectDetails(
  context: vscode.ExtensionContext,
  projectId: string
): Promise<BlockSummary[]> {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const baseUrl = normalizeBaseUrl(cfg.get<string>("baseUrl") || "");
  if (!baseUrl) {
    throw new Error(`Missing config: ${CONFIG_SECTION}.baseUrl`);
  }

  const token = await getToken(context);
  if (!token) {
    throw new Error("LocalJudge: missing token (please login first)");
  }

  const { client, jar } = await getSession(baseUrl);
  const origin = new URL(baseUrl).origin + "/";
  await jar.setCookie(`access_token=${token}`, origin);
  await setCurrentProjectId(context, projectId);

  const observations = await fetchObservations(client, projectId);
  await setObservationListCache(context, projectId, observations);

  const blockGroups = await Promise.all(
    observations.map(async (observation) => {
      const blocksRes = await client.get("/api/observation-block", {
        params: { observation_id: observation.id },
      });

      if (blocksRes.status !== 200 || !Array.isArray(blocksRes.data)) {
        throw new Error(
          formatApiError("LocalJudge: GET /api/observation-block", blocksRes.status, blocksRes.data)
        );
      }

      const blocks = blocksRes.data as ObservationBlock[];
      await setBlockListCache(context, observation.id, blocks);

      const blocksWithQuizzes = await Promise.all(
        blocks.map(async (block) => {
          const quizzesRes = await client.get("/api/quiz", {
            params: { block_id: block.id },
          });

          if (quizzesRes.status !== 200) {
            throw new Error(
              formatApiError("LocalJudge: GET /api/quiz", quizzesRes.status, quizzesRes.data)
            );
          }

          const quizzes = Array.isArray(quizzesRes.data)
            ? (quizzesRes.data as Quiz[])
            : quizzesRes.data
              ? [quizzesRes.data as Quiz]
              : [];

          await setQuizListCache(context, block.id, quizzes);

          return {
            id: block.id,
            observationId: observation.id,
            observationName: observation.name,
            name: block.name,
            type: block.type,
            order: block.order,
            quizzes: quizzes
              .slice()
              .sort((a, b) => compareOrder(a.sort_order, b.sort_order))
              .map((quiz) => ({
                id: quiz.id,
                question: quiz.question,
                quizType: quiz.quiz_type,
                weight: quiz.weight,
                sortOrder: quiz.sort_order,
                config: quiz.config,
              })),
          } satisfies BlockSummary;
        })
      );

      return blocksWithQuizzes.sort((a, b) => compareOrder(a.order, b.order));
    })
  );

  return blockGroups.flat();
}
