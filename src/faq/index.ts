import * as vscode from "vscode";
import { createFaqStatusBarItem } from "./faqButton";
import { FaqPanel } from "./faqPanel";

export function registerFaq(context: vscode.ExtensionContext): vscode.Disposable[] {
  const statusBarItem = createFaqStatusBarItem();

  const command = vscode.commands.registerCommand("localjudge.openFaq", () => {
    FaqPanel.open(context);
  });

  return [statusBarItem, command];
}
