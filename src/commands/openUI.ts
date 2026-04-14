import * as vscode from "vscode";
import { refreshSidebarSession } from "../auth/sessionState";
import { fetchProjectDetails } from "../project/loadProjectDetails";
import { runCodeJudgeForQuiz } from "../submission/codejudge";
import { LocalJudgePanel } from "../ui/panel";
import type { FromWebview } from "../ui/messages";

export async function openLoginPage(context: vscode.ExtensionContext) {
  const extID = context.extension.id;
  const callbackUri = `vscode://${extID}/auth-callback`;
  const loginUrl = `https://pslab.squidspirit.com/sign-in?redirect=${encodeURIComponent(callbackUri)}`;
  await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
}

export function registerOpenUI(
  context: vscode.ExtensionContext,
  panel: LocalJudgePanel
) {
  panel.setMessageHandler(async (msg: FromWebview) => {
    if (msg.type === "login") {
      panel.showProjectsLoading("Opening login page...");
      await openLoginPage(context);
      return;
    }

    if (msg.type === "logout") {
      panel.showProjectsLoading("Logging out...");
      await vscode.commands.executeCommand("localjudge.logout");
      return;
    }

    if (msg.type === "selectProject") {
      panel.showProjectDetailsLoading(
        msg.projectId,
        msg.projectName,
        "Loading blocks and quizzes..."
      );

      try {
        const blocks = await fetchProjectDetails(context, msg.projectId);
        panel.showProjectDetails(msg.projectId, msg.projectName, blocks);
      } catch (error: any) {
        panel.showProjectDetailsError(
          msg.projectId,
          msg.projectName,
          String(error?.message ?? error ?? "Failed to load project details.")
        );
      }
    }

    if (msg.type === "selectQuiz") {
      return;
    }

    if (msg.type === "runCodeJudge") {
      panel.showCodeJudgeStarted(msg.quizId, "Running Code Judge...");

      try {
        const result = await runCodeJudgeForQuiz(context, { quizId: msg.quizId });
        panel.showCodeJudgeFinished(
          msg.quizId,
          "Code Judge completed.",
          result?.editorLanguage,
          result?.judgeLanguage,
          result?.resultLabel,
          result?.resultDetails
        );
      } catch (error: any) {
        panel.showCodeJudgeError(
          msg.quizId,
          String(error?.message ?? error ?? "Code Judge failed.")
        );
      }
    }
  });

  return vscode.commands.registerCommand("localjudge-ui.openUI", async () => {
    await panel.reveal();
    await refreshSidebarSession(context, panel);
  });
}
