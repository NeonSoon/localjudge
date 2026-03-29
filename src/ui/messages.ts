import type { Project } from "../project/projectStore";

export type FromWebview =
  | { type: "login" }
  | { type: "selectProject"; projectId: string; projectName?: string };

export type QuizSummary = {
  id: string;
  question: string;
  quizType?: string;
  weight?: number;
  sortOrder?: number;
};

export type BlockSummary = {
  id: string;
  observationId: string;
  observationName?: string;
  name?: string;
  type?: string;
  order?: number;
  quizzes: QuizSummary[];
};

export type ToWebview =
  | { type: "authState"; loggedIn: boolean; username?: string }
  | { type: "loginResult"; ok: boolean; message?: string }
  | { type: "projectsLoading"; message?: string }
  | { type: "projectsLoaded"; projects: Project[] }
  | { type: "projectsError"; message: string }
  | { type: "projectDetailsLoading"; projectId: string; projectName?: string; message?: string }
  | { type: "projectDetailsLoaded"; projectId: string; projectName?: string; blocks: BlockSummary[] }
  | { type: "projectDetailsError"; projectId: string; projectName?: string; message: string };
