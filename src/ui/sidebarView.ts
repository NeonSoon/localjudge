import * as vscode from "vscode";
import type { Project } from "../project/projectStore";
import { getSidebarBodyMarkup } from "./sidebar/markup";
import { escapeJsonForHtml } from "./sidebar/serialization";
import { getSidebarScript } from "./sidebar/script";
import { sidebarStyles } from "./sidebar/styles";

export function getSidebarHtml(
  _webview: vscode.Webview,
  projects: Project[] = []
) {
  const initialProjects = escapeJsonForHtml(projects);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
${sidebarStyles}
  </style>
</head>
<body>
${getSidebarBodyMarkup()}
  <script>
${getSidebarScript(initialProjects)}
  </script>
</body>
</html>`;

}
