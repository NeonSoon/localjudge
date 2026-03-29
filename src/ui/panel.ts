import * as vscode from "vscode";
import type { Project } from "../project/projectStore";
import { getSidebarHtml } from "./sidebarView";
import type { BlockSummary, FromWebview, ToWebview } from "./messages";

export class LocalJudgePanel implements vscode.WebviewViewProvider {
  static readonly containerId = "localjudge";
  static readonly viewType = "localjudge.sidebar";
  private static currentPanel: LocalJudgePanel | undefined;
  private view: vscode.WebviewView | undefined;
  private messageHandler: ((msg: FromWebview) => void) | undefined;

  constructor() {
    LocalJudgePanel.currentPanel = this;
  }

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getSidebarHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: FromWebview) => {
      this.messageHandler?.(msg);
    });

    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.view = undefined;
      }
    });
  }

  setMessageHandler(handler: (msg: FromWebview) => void) {
    this.messageHandler = handler;
  }

  async reveal() {
    await vscode.commands.executeCommand(
      `workbench.view.extension.${LocalJudgePanel.containerId}`
    );
    await vscode.commands.executeCommand(`${LocalJudgePanel.viewType}.focus`);
  }

  postMessage(msg: ToWebview) {
    return this.view?.webview.postMessage(msg);
  }

  showProjects(projects: Project[]) {
    return this.postMessage({ type: "projectsLoaded", projects });
  }

  showProjectsLoading(message?: string) {
    return this.postMessage({ type: "projectsLoading", message });
  }

  showProjectsError(message: string) {
    return this.postMessage({ type: "projectsError", message });
  }

  showAuthState(loggedIn: boolean, username?: string) {
    return this.postMessage({ type: "authState", loggedIn, username });
  }

  showProjectDetailsLoading(projectId: string, projectName?: string, message?: string) {
    return this.postMessage({ type: "projectDetailsLoading", projectId, projectName, message });
  }

  showProjectDetails(projectId: string, projectName: string | undefined, blocks: BlockSummary[]) {
    return this.postMessage({ type: "projectDetailsLoaded", projectId, projectName, blocks });
  }

  showProjectDetailsError(projectId: string, projectName: string | undefined, message: string) {
    return this.postMessage({ type: "projectDetailsError", projectId, projectName, message });
  }

  showCodeJudgeStarted(
    quizId: string,
    message?: string,
    editorLanguage?: string,
    judgeLanguage?: string
  ) {
    return this.postMessage({
      type: "codeJudgeStarted",
      quizId,
      message,
      editorLanguage,
      judgeLanguage,
    });
  }

  showCodeJudgeFinished(
    quizId: string,
    message: string,
    editorLanguage?: string,
    judgeLanguage?: string,
    resultLabel?: string,
    resultDetails?: string
  ) {
    return this.postMessage({
      type: "codeJudgeFinished",
      quizId,
      message,
      editorLanguage,
      judgeLanguage,
      resultLabel,
      resultDetails,
    });
  }

  showCodeJudgeError(
    quizId: string,
    message: string,
    editorLanguage?: string,
    judgeLanguage?: string
  ) {
    return this.postMessage({
      type: "codeJudgeError",
      quizId,
      message,
      editorLanguage,
      judgeLanguage,
    });
  }

  static get current() {
    return this.currentPanel;
  }
}
