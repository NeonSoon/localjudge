export type FromWebview =
  | { type: "start" }
  | { type: "login" };

export type ToWebview =
  | { type: "loginResult"; ok: boolean };
