import type { Project } from "../project/projectStore";

export type FromWebview =
  | { type: "login" };

export type ToWebview =
  | { type: "authState"; loggedIn: boolean; username?: string }
  | { type: "loginResult"; ok: boolean; message?: string }
  | { type: "projectsLoading"; message?: string }
  | { type: "projectsLoaded"; projects: Project[] }
  | { type: "projectsError"; message: string };
