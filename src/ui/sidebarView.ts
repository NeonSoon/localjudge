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
      display: grid;
      gap: 8px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
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

  <script>
    const vscode = acquireVsCodeApi();
    const initialProjects = ${initialProjects};

    const loginButton = document.getElementById("login");
    const searchInput = document.getElementById("search");
    const content = document.getElementById("content");
    const count = document.getElementById("count");
    const results = document.getElementById("results");
    const PAGE_SIZE = 5;
    let allProjects = Array.isArray(initialProjects) ? initialProjects : [];
    let filteredProjects = allProjects.slice();
    let visibleCount = PAGE_SIZE;

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

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
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

      const visibleProjects = filteredProjects.slice(0, visibleCount);
      results.textContent = "Showing " + visibleProjects.length + " / " + filteredProjects.length;

      const items = visibleProjects.map((project) => {
        const visibility = project.is_public ? "Public" : "Private";
        const updated = formatDate(project.updated_at || project.created_at);
        return [
          '<article class="project-item">',
          '<h4 class="project-name">' + escapeHtml(project.name) + "</h4>",
          '<div class="meta">',
          '<span class="chip">ID: ' + escapeHtml(project.id) + "</span>",
          '<span class="chip">' + visibility + "</span>",
          '<span class="chip">Updated: ' + escapeHtml(updated) + "</span>",
          "</div>",
          "</article>",
        ].join("");
      });

      const hasMore = visibleProjects.length < filteredProjects.length;
      const loadMoreButton = hasMore
        ? '<button id="loadMore" class="load-more" type="button">Load More</button>'
        : "";

      content.innerHTML =
        '<div class="project-list">' + items.join("") + "</div>" + loadMoreButton;

      const loadMore = document.getElementById("loadMore");
      if (loadMore) {
        loadMore.addEventListener("click", () => {
          visibleCount += PAGE_SIZE;
          renderProjects();
        });
      }
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
        allProjects = Array.isArray(msg.projects) ? msg.projects : [];
        filteredProjects = allProjects.slice();
        visibleCount = PAGE_SIZE;
        renderProjects();
      }

      if (msg.type === "projectsError") {
        renderEmpty(msg.message || "Failed to load projects.");
      }
    });
  </script>
</body>
</html>`;
}
