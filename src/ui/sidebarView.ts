import * as vscode from "vscode";
import type { Project } from "../project/projectStore";

function escapeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

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
    :root {
      color-scheme: dark;
      --bg: #181818;
      --panel: #202020;
      --panel-2: #252526;
      --border: #313131;
      --text: #f3f3f3;
      --muted: #a9a9a9;
      --accent: #4fc3f7;
      --button: #f5f5f5;
      --button-text: #111111;
      --chip: #2d2d30;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      min-height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      padding: 16px;
    }

    .shell {
      display: grid;
      gap: 16px;
    }

    .view {
      display: grid;
      gap: 16px;
    }

    .view[hidden] {
      display: none;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .login-btn {
      border: 0;
      border-radius: 10px;
      background: var(--button);
      color: var(--button-text);
      font-size: 13px;
      font-weight: 700;
      padding: 9px 14px;
      cursor: pointer;
    }

    .login-btn:disabled {
      opacity: 0.65;
      cursor: default;
    }

    .card {
      background: linear-gradient(180deg, rgba(79, 195, 247, 0.12), rgba(79, 195, 247, 0.02));
      border: 1px solid rgba(79, 195, 247, 0.18);
      border-radius: 18px;
      padding: 16px;
    }

    .card h2 {
      margin: 0;
      font-size: 24px;
      line-height: 1.1;
    }

    .card p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin: 0 0 10px;
    }

    .section-title h3 {
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.08em;
      color: var(--muted);
      text-transform: uppercase;
    }

    .count {
      color: var(--muted);
      font-size: 12px;
    }

    .toolbar {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
    }

    .search-input {
      width: 100%;
      min-height: 40px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--panel);
      color: var(--text);
      padding: 0 12px;
      font-size: 13px;
      outline: none;
    }

    .search-input::placeholder {
      color: var(--muted);
    }

    .toolbar-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 12px;
    }

    .state {
      padding: 14px;
      border: 1px dashed var(--border);
      border-radius: 14px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
      background: var(--panel);
    }

    .project-list {
      display: grid;
      gap: 10px;
    }

    .project-item {
      width: 100%;
      display: grid;
      gap: 8px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      text-align: left;
      cursor: pointer;
    }

    .project-item:hover {
      border-color: rgba(79, 195, 247, 0.4);
    }

    .project-name {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      word-break: break-word;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      background: var(--chip);
      color: var(--muted);
      font-size: 11px;
    }

    .load-more {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--panel);
      color: var(--text);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .load-more:hover {
      border-color: rgba(79, 195, 247, 0.4);
    }

    .back-btn {
      width: fit-content;
      min-height: 36px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--panel);
      color: var(--text);
      font-size: 12px;
      font-weight: 700;
      padding: 0 12px;
      cursor: pointer;
    }

    .back-btn:hover {
      border-color: rgba(79, 195, 247, 0.4);
    }

    .detail-header {
      display: grid;
      gap: 10px;
    }

    .detail-card {
      background: linear-gradient(180deg, rgba(79, 195, 247, 0.12), rgba(79, 195, 247, 0.02));
      border: 1px solid rgba(79, 195, 247, 0.18);
      border-radius: 18px;
      padding: 16px;
    }

    .detail-card h2 {
      margin: 0;
      font-size: 22px;
      line-height: 1.15;
      word-break: break-word;
    }

    .detail-card p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .detail-list {
      display: grid;
      gap: 10px;
    }

    .block-card {
      display: grid;
      gap: 10px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
    }

    .block-name {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      word-break: break-word;
    }

    .quiz-list {
      display: grid;
      gap: 8px;
    }

    .quiz-card {
      display: grid;
      gap: 8px;
      background: var(--panel);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 12px;
    }

    .quiz-question {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--text);
      word-break: break-word;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="topbar">
      <div>
        <h1 class="title">LocalJudge</h1>
        <p class="subtitle">Projects synced from LocalJudge API</p>
      </div>
      <button id="login" class="login-btn">Login</button>
    </div>

    <div id="projectView" class="view">
      <section class="card">
        <h2>Your Projects</h2>
        <p>Login from the command palette or use the button here. After login, the sidebar will fetch and list your projects automatically.</p>
      </section>

      <section>
        <div class="section-title">
          <h3>Project List</h3>
          <span id="count" class="count">0 items</span>
        </div>
        <div class="toolbar">
          <input id="search" class="search-input" type="search" placeholder="Search projects..." />
          <div class="toolbar-meta">
            <span id="results">0 shown</span>
          </div>
        </div>
        <div id="content"></div>
      </section>
    </div>

    <div id="detailView" class="view" hidden>
      <div class="detail-header">
        <button id="back" class="back-btn" type="button">Back to Projects</button>
        <section class="detail-card">
          <h2 id="detailTitle">Project Details</h2>
          <p id="detailSubtitle">Loading blocks and quizzes...</p>
        </section>
      </div>

      <section>
        <div class="section-title">
          <h3>Blocks & Quizzes</h3>
          <span id="detailCount" class="count"></span>
        </div>
        <div id="detailContent"></div>
      </section>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const initialProjects = ${initialProjects};

    const loginButton = document.getElementById("login");
    const projectView = document.getElementById("projectView");
    const detailView = document.getElementById("detailView");
    const backButton = document.getElementById("back");
    const searchInput = document.getElementById("search");
    const content = document.getElementById("content");
    const count = document.getElementById("count");
    const results = document.getElementById("results");
    const detailTitle = document.getElementById("detailTitle");
    const detailSubtitle = document.getElementById("detailSubtitle");
    const detailCount = document.getElementById("detailCount");
    const detailContent = document.getElementById("detailContent");
    const PAGE_SIZE = 5;

    function normalizeProjects(projects) {
      return (Array.isArray(projects) ? projects : []).map((project) => ({
        ...project,
        loaded: project && project.loaded === 1 ? 1 : 0,
      }));
    }

    let allProjects = normalizeProjects(initialProjects);
    let filteredProjects = allProjects.slice();
    let visibleCount = PAGE_SIZE;
    let selectedProjectId = "";
    let selectedProjectName = "";

    loginButton.addEventListener("click", () => {
      vscode.postMessage({ type: "login" });
    });

    function formatDate(value) {
      if (!value) {
        return "Unknown update time";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleString();
    }

    function renderEmpty(message) {
      count.textContent = "0 items";
      results.textContent = "0 shown";
      content.innerHTML = '<div class="state">' + message + "</div>";
    }

    function renderLoading(message) {
      count.textContent = "Loading...";
      results.textContent = "";
      content.innerHTML = '<div class="state">' + message + "</div>";
    }

    function showProjectView() {
      projectView.hidden = false;
      detailView.hidden = true;
    }

    function showDetailView() {
      projectView.hidden = true;
      detailView.hidden = false;
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function setDetailHeader(projectName, subtitle) {
      detailTitle.textContent = projectName || "Project Details";
      detailSubtitle.textContent = subtitle || "";
    }

    function renderDetailState(message) {
      detailCount.textContent = "";
      detailContent.innerHTML = '<div class="state">' + escapeHtml(message) + "</div>";
    }

    function renderProjectDetails(blocks) {
      if (!Array.isArray(blocks) || !blocks.length) {
        detailCount.textContent = "0 blocks";
        renderDetailState("No blocks found for this project.");
        return;
      }

      detailCount.textContent = blocks.length + " blocks";

      const items = blocks.map((block) => {
        const blockTitle = block.name || block.type || "Unnamed Block";
        const blockMeta = [
          block.observationName ? '<span class="chip">Observation: ' + escapeHtml(block.observationName) + "</span>" : "",
          block.type ? '<span class="chip">Type: ' + escapeHtml(block.type) + "</span>" : "",
          '<span class="chip">Block ID: ' + escapeHtml(block.id) + "</span>",
        ]
          .filter(Boolean)
          .join("");

        const quizzes = Array.isArray(block.quizzes) && block.quizzes.length
          ? '<div class="quiz-list">' + block.quizzes.map((quiz) => {
            const quizMeta = [
              quiz.quizType ? '<span class="chip">Type: ' + escapeHtml(quiz.quizType) + "</span>" : "",
              quiz.weight !== undefined ? '<span class="chip">Weight: ' + escapeHtml(String(quiz.weight)) + "</span>" : "",
              '<span class="chip">Quiz ID: ' + escapeHtml(quiz.id) + "</span>",
            ]
              .filter(Boolean)
              .join("");

            return [
              '<article class="quiz-card">',
              '<p class="quiz-question">' + escapeHtml(quiz.question || "Untitled quiz") + "</p>",
              '<div class="meta">' + quizMeta + "</div>",
              "</article>",
            ].join("");
          }).join("") + "</div>"
          : '<div class="state">This block has no quizzes.</div>';

        return [
          '<article class="block-card">',
          '<h4 class="block-name">' + escapeHtml(blockTitle) + "</h4>",
          '<div class="meta">' + blockMeta + "</div>",
          quizzes,
          "</article>",
        ].join("");
      });

      detailContent.innerHTML = '<div class="detail-list">' + items.join("") + "</div>";
    }

    function applySearch() {
      const keyword = searchInput.value.trim().toLowerCase();
      filteredProjects = allProjects.filter((project) => {
        const haystack = [
          project.name,
          project.id,
          project.is_public ? "public" : "private",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      });
      visibleCount = PAGE_SIZE;
      renderProjects();
    }

    function renderProjects() {
      count.textContent = allProjects.length + " items";
      if (!filteredProjects.length) {
        const hasSearch = searchInput.value.trim().length > 0;
        renderEmpty(
          hasSearch
            ? "No projects match your search."
            : "No projects found yet. Run LocalJudge: Login to fetch your project list."
        );
        return;
      }

      const newlyVisibleProjects = filteredProjects.slice(0, visibleCount);
      newlyVisibleProjects.forEach((project) => {
        project.loaded = 1;
      });

      const visibleProjects = filteredProjects.filter((project) => project.loaded === 1);
      results.textContent = "Showing " + visibleProjects.length + " / " + filteredProjects.length;

      const items = visibleProjects.map((project) => {
        const visibility = project.is_public ? "Public" : "Private";
        const updated = formatDate(project.updated_at || project.created_at);
        return [
          '<button class="project-item loaded-' + project.loaded + '" data-loaded="' + project.loaded + '" data-project-id="' + escapeHtml(project.id) + '" data-project-name="' + escapeHtml(project.name) + '" type="button">',
          '<h4 class="project-name">' + escapeHtml(project.name) + "</h4>",
          '<div class="meta">',
          '<span class="chip">ID: ' + escapeHtml(project.id) + "</span>",
          '<span class="chip">' + visibility + "</span>",
          '<span class="chip">Updated: ' + escapeHtml(updated) + "</span>",
          "</div>",
          "</button>",
        ].join("");
      });

      const hasMore = visibleProjects.length < filteredProjects.length;
      const loadMoreButton = hasMore
        ? '<button id="loadMore" class="load-more" type="button">Load More</button>'
        : "";

      content.innerHTML =
        '<div class="project-list">' + items.join("") + loadMoreButton + "</div>";

      const loadMore = document.getElementById("loadMore");
      if (loadMore) {
        loadMore.addEventListener("click", () => {
          visibleCount += PAGE_SIZE;
          renderProjects();
        });
      }

      const projectCards = content.querySelectorAll(".project-item[data-project-id]");
      projectCards.forEach((card) => {
        card.addEventListener("click", () => {
          const projectId = card.getAttribute("data-project-id");
          const projectName = card.getAttribute("data-project-name") || "Project Details";
          if (!projectId) {
            return;
          }

          selectedProjectId = projectId;
          selectedProjectName = projectName;
          setDetailHeader(projectName, "Loading blocks and quizzes...");
          renderDetailState("Loading blocks and quizzes...");
          showDetailView();
          vscode.postMessage({ type: "selectProject", projectId, projectName });
        });
      });
    }

    function setLoggedIn(username) {
      loginButton.textContent = username || "Logged In";
      loginButton.disabled = true;
    }

    function setLoggedOut() {
      loginButton.textContent = "Login";
      loginButton.disabled = false;
    }

    searchInput.addEventListener("input", () => {
      applySearch();
    });

    backButton.addEventListener("click", () => {
      showProjectView();
    });

    if (Array.isArray(initialProjects) && initialProjects.length > 0) {
      renderProjects();
    } else {
      renderLoading("Checking login status...");
    }

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "authState") {
        if (msg.loggedIn) {
          setLoggedIn(msg.username);
        } else {
          setLoggedOut();
        }
      }

      if (msg.type === "loginResult") {
        if (msg.ok) {
          renderLoading("Login successful. Loading projects...");
        } else {
          setLoggedOut();
          renderEmpty(msg.message || "Login failed.");
        }
      }

      if (msg.type === "projectsLoading") {
        renderLoading(msg.message || "Loading projects...");
      }

      if (msg.type === "projectsLoaded") {
        allProjects = normalizeProjects(msg.projects);
        filteredProjects = allProjects.slice();
        visibleCount = PAGE_SIZE;
        showProjectView();
        renderProjects();
      }

      if (msg.type === "projectsError") {
        showProjectView();
        renderEmpty(msg.message || "Failed to load projects.");
      }

      if (msg.type === "projectDetailsLoading" && msg.projectId === selectedProjectId) {
        setDetailHeader(msg.projectName || selectedProjectName, msg.message || "Loading blocks and quizzes...");
        renderDetailState(msg.message || "Loading blocks and quizzes...");
      }

      if (msg.type === "projectDetailsLoaded" && msg.projectId === selectedProjectId) {
        setDetailHeader(msg.projectName || selectedProjectName, "Blocks loaded for this project.");
        renderProjectDetails(msg.blocks);
      }

      if (msg.type === "projectDetailsError" && msg.projectId === selectedProjectId) {
        setDetailHeader(msg.projectName || selectedProjectName, "Failed to load project details.");
        renderDetailState(msg.message || "Failed to load project details.");
      }
    });
  </script>
</body>
</html>`;
}
