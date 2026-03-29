import type { Project } from "../project/projectStore";

export type FromWebview =
  | { type: "login" }
  | { type: "selectProject"; projectId: string; projectName?: string }
  | {
      type: "selectQuiz";
      projectId: string;
      projectName?: string;
      blockId: string;
      blockName?: string;
      quizId: string;
    }
  | {
      type: "runCodeJudge";
      projectId: string;
      projectName?: string;
      blockId: string;
      blockName?: string;
      quizId: string;
    };

export type QuizSummary = {
  id: string;
  question: string;
  quizType?: string;
  weight?: number;
  sortOrder?: number;
  config?: unknown;
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
  | { type: "projectDetailsError"; projectId: string; projectName?: string; message: string }
  | { type: "codeJudgeStarted"; quizId: string; message?: string; editorLanguage?: string; judgeLanguage?: string }
  | { type: "codeJudgeFinished"; quizId: string; message: string; editorLanguage?: string; judgeLanguage?: string; resultLabel?: string; resultDetails?: string }
  | { type: "codeJudgeError"; quizId: string; message: string; editorLanguage?: string; judgeLanguage?: string };
