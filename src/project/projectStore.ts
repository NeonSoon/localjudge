import * as vscode from "vscode";

export interface Project {
  id: string;
  name: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface Observation {
  id: string;
  purpose: string;
  name: string;
  is_public: boolean;
  project_id: string;
  owner_name?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface ObservationBlock {
  id: string;
  observation_id: string;
  type?: string;
  name?: string;
  content?: unknown;
  order?: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface Quiz {
  id: string;
  block_id: string;
  question: string;
  weight?: number;
  quiz_type?: string;   // e.g. "CODE"
  config?: unknown;     // 你的輸出是 object：{language, options, expected, testcases}
  sort_order?: number;
  created_at?: string;
  updated_at?: string | null;
}

/** project list 快取 */
const KEY_PROJECT_LIST = "localjudge.projectList";
/** 目前選取的 projectId */
const KEY_CURRENT_PROJECT_ID = "localjudge.currentProjectId";
/** observation 快取：以 projectId 當 key 的 mapping */
const KEY_OBSERVATIONS_BY_PROJECT = "localjudge.observationsByProject";

function state(context: vscode.ExtensionContext, useGlobal?: boolean) {
  return useGlobal ? context.globalState : context.workspaceState;
}

/* ---------------- Projects ---------------- */

export async function getProjectListCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<Project[] | undefined> {
  return state(context, opts?.useGlobal).get<Project[]>(KEY_PROJECT_LIST);
}

export async function setProjectListCache(
  context: vscode.ExtensionContext,
  projects: Project[],
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_PROJECT_LIST, projects);
}

export async function clearProjectListCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_PROJECT_LIST, undefined);
}

export async function getCurrentProjectId(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<string | undefined> {
  const v = state(context, opts?.useGlobal).get<string>(KEY_CURRENT_PROJECT_ID);
  return v?.trim() || undefined;
}

export async function setCurrentProjectId(
  context: vscode.ExtensionContext,
  projectId: string,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_CURRENT_PROJECT_ID, projectId.trim());
}

export async function clearCurrentProjectId(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_CURRENT_PROJECT_ID, undefined);
}

/* ---------------- Observations ---------------- */

type ObsMap = Record<string, Observation[]>;

/** 取得整包 observation map（projectId -> Observation[]） */
export async function getObservationsMapCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<ObsMap | undefined> {
  return state(context, opts?.useGlobal).get<ObsMap>(KEY_OBSERVATIONS_BY_PROJECT);
}

/** 取得某個 projectId 的 observations */
export async function getObservationListCache(
  context: vscode.ExtensionContext,
  projectId: string,
  opts?: { useGlobal?: boolean }
): Promise<Observation[] | undefined> {
  const map = await getObservationsMapCache(context, opts);
  return map?.[projectId];
}

/** 儲存某個 projectId 的 observations（會合併到 map 裡） */
export async function setObservationListCache(
  context: vscode.ExtensionContext,
  projectId: string,
  observations: Observation[],
  opts?: { useGlobal?: boolean }
): Promise<void> {
  const s = state(context, opts?.useGlobal);
  const map = (s.get<ObsMap>(KEY_OBSERVATIONS_BY_PROJECT) ?? {}) as ObsMap;
  map[projectId] = observations;
  await s.update(KEY_OBSERVATIONS_BY_PROJECT, map);
}

/** 清除某個 projectId 的 observations */
export async function clearObservationListCache(
  context: vscode.ExtensionContext,
  projectId: string,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  const s = state(context, opts?.useGlobal);
  const map = (s.get<ObsMap>(KEY_OBSERVATIONS_BY_PROJECT) ?? {}) as ObsMap;
  delete map[projectId];
  await s.update(KEY_OBSERVATIONS_BY_PROJECT, map);
}

/** 清掉整包 observations map */
export async function clearAllObservationsCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_OBSERVATIONS_BY_PROJECT, undefined);
}

/* ================= Blocks ================= */

/** block 快取：observationId -> blocks[] */
const KEY_BLOCKS_BY_OBSERVATION = "localjudge.blocksByObservation";

type BlockMap = Record<string, ObservationBlock[]>;

/** 取得整包 block map */
export async function getBlocksMapCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<BlockMap | undefined> {
  return state(context, opts?.useGlobal).get<BlockMap>(KEY_BLOCKS_BY_OBSERVATION);
}

/** 取得某個 observationId 的 blocks */
export async function getBlockListCache(
  context: vscode.ExtensionContext,
  observationId: string,
  opts?: { useGlobal?: boolean }
): Promise<ObservationBlock[] | undefined> {
  const map = await getBlocksMapCache(context, opts);
  return map?.[observationId];
}

/** 儲存某個 observationId 的 blocks */
export async function setBlockListCache(
  context: vscode.ExtensionContext,
  observationId: string,
  blocks: ObservationBlock[],
  opts?: { useGlobal?: boolean }
): Promise<void> {
  const s = state(context, opts?.useGlobal);
  const map = (s.get<BlockMap>(KEY_BLOCKS_BY_OBSERVATION) ?? {}) as BlockMap;
  map[observationId] = blocks;
  await s.update(KEY_BLOCKS_BY_OBSERVATION, map);
}

/** 清除某個 observationId 的 blocks */
export async function clearBlockListCache(
  context: vscode.ExtensionContext,
  observationId: string,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  const s = state(context, opts?.useGlobal);
  const map = (s.get<BlockMap>(KEY_BLOCKS_BY_OBSERVATION) ?? {}) as BlockMap;
  delete map[observationId];
  await s.update(KEY_BLOCKS_BY_OBSERVATION, map);
}

/** 清空全部 blocks */
export async function clearAllBlocksCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_BLOCKS_BY_OBSERVATION, undefined);
}

/* ================= Quizzes ================= */

/** quiz 快取：blockId -> quizzes[] */
const KEY_QUIZZES_BY_BLOCK = "localjudge.quizzesByBlock";

type QuizMap = Record<string, Quiz[]>;

/** 取得整包 quiz map */
export async function getQuizzesMapCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<QuizMap | undefined> {
  return state(context, opts?.useGlobal).get<QuizMap>(KEY_QUIZZES_BY_BLOCK);
}

/** 取得某個 blockId 的 quizzes */
export async function getQuizListCache(
  context: vscode.ExtensionContext,
  blockId: string,
  opts?: { useGlobal?: boolean }
): Promise<Quiz[] | undefined> {
  const map = await getQuizzesMapCache(context, opts);
  return map?.[blockId];
}

/** 儲存某個 blockId 的 quizzes */
export async function setQuizListCache(
  context: vscode.ExtensionContext,
  blockId: string,
  quizzes: Quiz[],
  opts?: { useGlobal?: boolean }
): Promise<void> {
  const s = state(context, opts?.useGlobal);
  const map = (s.get<QuizMap>(KEY_QUIZZES_BY_BLOCK) ?? {}) as QuizMap;
  map[blockId] = quizzes;
  await s.update(KEY_QUIZZES_BY_BLOCK, map);
}

/** 清除某個 blockId 的 quizzes */
export async function clearQuizListCache(
  context: vscode.ExtensionContext,
  blockId: string,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  const s = state(context, opts?.useGlobal);
  const map = (s.get<QuizMap>(KEY_QUIZZES_BY_BLOCK) ?? {}) as QuizMap;
  delete map[blockId];
  await s.update(KEY_QUIZZES_BY_BLOCK, map);
}

/** 清空全部 quizzes */
export async function clearAllQuizzesCache(
  context: vscode.ExtensionContext,
  opts?: { useGlobal?: boolean }
): Promise<void> {
  await state(context, opts?.useGlobal).update(KEY_QUIZZES_BY_BLOCK, undefined);
}
