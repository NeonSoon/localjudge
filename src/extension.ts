import * as vscode from "vscode";
import { registerFaq } from "./faq/index";
import { registerOpenUI } from "./commands/openUI";
import { registerAuthCallback } from "./auth/uriHandler";
import { refreshSidebarSession } from "./auth/sessionState";
import { LocalJudgePanel } from "./ui/panel";
import { registerLoginCommand } from "./commands/loginCommand";
import { registerShowTokenCommand } from "./commands/showtoken";
import { registerLogoutCommand } from "./commands/logoutCommand";
import { registerGetProjectsCommand } from "./project/getProjects";
import { registerGetObservationsCommand } from "./project/getObservations";
import { registerGetBlocksCommand } from "./project/getBlocks";
import { registerGetQuizzesCommand } from "./project/getQuizzes";
import { registerCreateSubmissionCommand } from "./submission/submission";
import { registerCodeJudgeCommand } from "./submission/codejudge";
import { registerGetSubmissionsCommand } from "./submission/getSubmissions";

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel("LocalJudge");
  context.subscriptions.push(output);
  const localJudgePanel = new LocalJudgePanel();
  const localJudgeViewProvider = vscode.window.registerWebviewViewProvider(
    LocalJudgePanel.viewType,
    localJudgePanel
  );
  const openUI = registerOpenUI(context, localJudgePanel);
  const login = registerLoginCommand(context, (username) => {
    void localJudgePanel.showAuthState(true, username);
  });
  const uriHandler = registerAuthCallback(context, () => localJudgePanel);
  const showToken = registerShowTokenCommand(context, output);
  const logout = registerLogoutCommand(context, () => {
    void localJudgePanel.showAuthState(false);
    void localJudgePanel.showProjects([]);
    void localJudgePanel.showProjectsError("Not logged in. Please login to load your project list.");
  });
  const getProjects = registerGetProjectsCommand(context, (projects) => {
    void localJudgePanel.showProjects(projects);
  });
  const getObservations = registerGetObservationsCommand(context);
  const getBlocks = registerGetBlocksCommand(context);
  const getQuizzes = registerGetQuizzesCommand(context);
  const submission = registerCreateSubmissionCommand(context);
  const codeJudge = registerCodeJudgeCommand(context);
  const getSubmissions = registerGetSubmissionsCommand(context);
  context.subscriptions.push(...registerFaq(context));
  context.subscriptions.push(
    localJudgeViewProvider,
    openUI,
    login,
    showToken,
    uriHandler,
    logout,
    getProjects,
    getObservations,
    getBlocks,
    getQuizzes,
    submission,
    codeJudge,
    getSubmissions
  );

  void setTimeout(() => {
    void localJudgePanel.reveal();
    void refreshSidebarSession(context, localJudgePanel);
  }, 300);
}

export function deactivate() {}
