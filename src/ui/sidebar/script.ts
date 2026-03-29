export function getSidebarScript(initialProjectsJson: string) {
  return `
    const vscode = acquireVsCodeApi();
    const initialProjects = ${initialProjectsJson};
    const PAGE_SIZE = 5;

    const elements = {
      loginButton: document.getElementById("login"),
      projectView: document.getElementById("projectView"),
      detailView: document.getElementById("detailView"),
      quizView: document.getElementById("quizView"),
      backButton: document.getElementById("back"),
      quizBackButton: document.getElementById("quizBack"),
      runCodeJudgeButton: document.getElementById("runCodeJudge"),
      searchInput: document.getElementById("search"),
      content: document.getElementById("content"),
      count: document.getElementById("count"),
      results: document.getElementById("results"),
      detailTitle: document.getElementById("detailTitle"),
      detailSubtitle: document.getElementById("detailSubtitle"),
      detailCount: document.getElementById("detailCount"),
      detailContent: document.getElementById("detailContent"),
      quizTitle: document.getElementById("quizTitle"),
      quizSubtitle: document.getElementById("quizSubtitle"),
      quizStatus: document.getElementById("quizStatus"),
      quizContent: document.getElementById("quizContent"),
    };

    function normalizeProjects(projects) {
      return (Array.isArray(projects) ? projects : []).map((project) => ({
        ...project,
        loaded: project && project.loaded === 1 ? 1 : 0,
      }));
    }

    const state = {
      allProjects: normalizeProjects(initialProjects),
      filteredProjects: [],
      visibleCount: PAGE_SIZE,
      selectedProjectId: "",
      selectedProjectName: "",
      latestBlocks: [],
      selectedBlockId: "",
      selectedBlockName: "",
      selectedQuiz: null,
      isRunningCodeJudge: false,
      currentEditorLanguage: "",
      currentJudgeLanguage: "",
      lastJudgeResult: null,
    };
    state.filteredProjects = state.allProjects.slice();

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

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

    function setProjectSummary(totalCount, summaryText) {
      elements.count.textContent = totalCount + " items";
      elements.results.textContent = summaryText;
    }

    function renderProjectState(message, options = {}) {
      const totalCount = options.totalCount ?? 0;
      const summaryText = options.summaryText ?? "0 shown";
      setProjectSummary(totalCount, summaryText);
      elements.content.innerHTML = '<div class="state">' + escapeHtml(message) + "</div>";
    }

    function showProjectView() {
      elements.projectView.hidden = false;
      elements.detailView.hidden = true;
      elements.quizView.hidden = true;
      setRunCodeJudgeEnabled(false);
    }

    function showDetailView() {
      elements.projectView.hidden = true;
      elements.detailView.hidden = false;
      elements.quizView.hidden = true;
      setRunCodeJudgeEnabled(false);
    }

    function showQuizView() {
      elements.projectView.hidden = true;
      elements.detailView.hidden = true;
      elements.quizView.hidden = false;
    }

    function setDetailHeader(projectName, subtitle) {
      elements.detailTitle.textContent = projectName || "Project Details";
      elements.detailSubtitle.textContent = subtitle || "";
    }

    function renderDetailState(message) {
      elements.detailCount.textContent = "";
      elements.detailContent.innerHTML =
        '<div class="state">' + escapeHtml(message) + "</div>";
    }

    function createChip(label, value) {
      if (!value && value !== 0) {
        return "";
      }
      return '<span class="chip">' + escapeHtml(label + ": " + String(value)) + "</span>";
    }

    function stringifyValue(value) {
      if (value === undefined || value === null) {
        return "";
      }

      if (typeof value === "string") {
        return value;
      }

      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }

      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    function readStringField(record, keys) {
      if (!record || typeof record !== "object") {
        return "";
      }

      for (const key of keys) {
        const value = record[key];
        const text = stringifyValue(value);
        if (text) {
          return text;
        }
      }

      return "";
    }

    function getQuizConfig(quiz) {
      if (!quiz || !quiz.config || typeof quiz.config !== "object") {
        return null;
      }

      return quiz.config;
    }

    function getQuizDescription(quiz) {
      const config = getQuizConfig(quiz);
      const configuredDescription = readStringField(config, [
        "description",
        "prompt",
        "statement",
        "content",
        "body",
      ]);

      return configuredDescription || quiz.question || "Untitled quiz";
    }

    function getQuizPreview(quiz) {
      const description = getQuizDescription(quiz).replace(/\s+/g, " ").trim();
      if (description.length <= 88) {
        return description;
      }

      return description.slice(0, 88) + "...";
    }

    function getExampleValue(record, keys) {
      if (!record || typeof record !== "object") {
        return "";
      }

      return readStringField(record, keys);
    }

    function getQuizExamples(quiz) {
      const config = getQuizConfig(quiz);
      if (!config) {
        return [];
      }

      const testcases = Array.isArray(config.testcases) ? config.testcases : [];
      const testcaseExamples = testcases
        .map((testcase, index) => {
          const input = getExampleValue(testcase, [
            "stdin",
            "input",
            "test_input",
            "sample_input",
          ]);
          const output = getExampleValue(testcase, [
            "expected",
            "output",
            "stdout",
            "test_output",
            "sample_output",
          ]);

          if (!input && !output) {
            return null;
          }

          return {
            label: "Sample " + (index + 1),
            input,
            output,
          };
        })
        .filter(Boolean);

      if (testcaseExamples.length > 0) {
        return testcaseExamples;
      }

      const directInput = getExampleValue(config, ["stdin", "input"]);
      const directOutput = getExampleValue(config, ["expected", "output"]);
      if (!directInput && !directOutput) {
        return [];
      }

      return [
        {
          label: "Sample",
          input: directInput,
          output: directOutput,
        },
      ];
    }

    function renderExampleCard(example) {
      const inputMarkup = example.input
        ? [
          '<div class="quiz-detail-section">',
          '<span class="example-label">Input</span>',
          '<pre class="example-pre">' + escapeHtml(example.input) + "</pre>",
          "</div>",
        ].join("")
        : "";

      const outputMarkup = example.output
        ? [
          '<div class="quiz-detail-section">',
          '<span class="example-label">Output</span>',
          '<pre class="example-pre">' + escapeHtml(example.output) + "</pre>",
          "</div>",
        ].join("")
        : "";

      return [
        '<article class="example-card">',
        '<span class="example-label">' + escapeHtml(example.label) + "</span>",
        inputMarkup,
        outputMarkup,
        "</article>",
      ].join("");
    }

    function setQuizHeader(title, subtitle) {
      elements.quizTitle.textContent = title || "Quiz Details";
      elements.quizSubtitle.textContent = subtitle || "";
    }

    function setRunCodeJudgeEnabled(enabled) {
      elements.runCodeJudgeButton.disabled = !enabled;
    }

    function renderQuizPageState(message) {
      elements.quizStatus.textContent = "";
      elements.quizContent.innerHTML =
        '<div class="state">' + escapeHtml(message) + "</div>";
    }

    function renderQuizPage(quiz) {
      const description = getQuizDescription(quiz);
      const examples = getQuizExamples(quiz);
      const examplesMarkup = examples.length
        ? '<div class="example-list">' + examples.map(renderExampleCard).join("") + "</div>"
        : '<div class="state">No sample test data available.</div>';
      const languageMeta = [
        state.currentEditorLanguage ? createChip("Editor", state.currentEditorLanguage) : "",
        state.currentJudgeLanguage ? createChip("Judge", state.currentJudgeLanguage) : "",
      ]
        .filter(Boolean)
        .join("");
      const judgeResultMarkup = state.lastJudgeResult
        ? [
          '<section class="quiz-page-card judge-result">',
          '<h5 class="quiz-detail-title">Judge Result</h5>',
          '<div class="meta">',
          state.lastJudgeResult.label ? createChip("Status", state.lastJudgeResult.label) : "",
          "</div>",
          state.lastJudgeResult.details
            ? '<pre class="example-pre">' + escapeHtml(state.lastJudgeResult.details) + "</pre>"
            : '<div class="state">No detailed output available.</div>',
          "</section>",
        ].join("")
        : "";

      elements.quizStatus.textContent = quiz.quizType || "Quiz";
      elements.quizContent.innerHTML = [
        '<div class="quiz-page">',
        '<section class="quiz-page-card primary">',
        '<h5 class="quiz-detail-title">Problem</h5>',
        '<div class="meta">',
        quiz.quizType ? createChip("Type", quiz.quizType) : "",
        quiz.weight !== undefined ? createChip("Weight", String(quiz.weight)) : "",
        createChip("Quiz ID", quiz.id),
        languageMeta,
        "</div>",
        '<div class="problem-body">' + escapeHtml(description) + "</div>",
        "</section>",
        '<section class="quiz-page-card">',
        '<h5 class="quiz-detail-title">Sample Test Data</h5>',
        examplesMarkup,
        "</section>",
        judgeResultMarkup,
        "</div>",
      ].join("");
    }

    function renderQuizCard(block, quiz) {
      const quizMeta = [
        quiz.quizType ? createChip("Type", quiz.quizType) : "",
        quiz.weight !== undefined ? createChip("Weight", String(quiz.weight)) : "",
        createChip("Quiz ID", quiz.id),
      ]
        .filter(Boolean)
        .join("");
      const preview = getQuizPreview(quiz);

      return [
        '<article class="quiz-card" data-quiz-card>',
        '<button class="quiz-toggle" type="button" data-quiz-toggle data-block-id="' + escapeHtml(block.id) + '" data-block-name="' + escapeHtml(block.name || block.type || "Unnamed Block") + '" data-quiz-id="' + escapeHtml(quiz.id) + '" aria-expanded="false">',
        '<p class="quiz-question">' + escapeHtml(quiz.question || "Untitled quiz") + "</p>",
        '<div class="quiz-preview">' + escapeHtml(preview) + "</div>",
        '<div class="meta">' + quizMeta + "</div>",
        "</button>",
        "</article>",
      ].join("");
    }

    function renderBlockCard(block) {
      const blockTitle = block.name || block.type || "Unnamed Block";
      const blockMeta = [
        block.observationName ? createChip("Observation", block.observationName) : "",
        block.type ? createChip("Type", block.type) : "",
        createChip("Block ID", block.id),
      ]
        .filter(Boolean)
        .join("");

      const quizzesMarkup = Array.isArray(block.quizzes) && block.quizzes.length
        ? '<div class="quiz-list">' + block.quizzes.map((quiz) => renderQuizCard(block, quiz)).join("") + "</div>"
        : '<div class="state">This block has no quizzes.</div>';

      return [
        '<article class="block-card">',
        '<h4 class="block-name">' + escapeHtml(blockTitle) + "</h4>",
        '<div class="meta">' + blockMeta + "</div>",
        quizzesMarkup,
        "</article>",
      ].join("");
    }

    function renderProjectDetails(blocks) {
      if (!Array.isArray(blocks) || !blocks.length) {
        elements.detailCount.textContent = "0 blocks";
        renderDetailState("No blocks found for this project.");
        return;
      }

      elements.detailCount.textContent = blocks.length + " blocks";
      elements.detailContent.innerHTML =
        '<div class="detail-list">' + blocks.map(renderBlockCard).join("") + "</div>";
      bindQuizEvents();
    }

    function getProjectSearchText(project) {
      return [
        project.name,
        project.id,
        project.is_public ? "public" : "private",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }

    function filterProjects(keyword) {
      state.filteredProjects = state.allProjects.filter((project) =>
        getProjectSearchText(project).includes(keyword)
      );
      state.visibleCount = PAGE_SIZE;
    }

    function renderProjectList(projects) {
      const items = projects.map((project) => {
        const visibility = project.is_public ? "Public" : "Private";
        const updated = formatDate(project.updated_at || project.created_at);

        return [
          '<button class="project-item loaded-' + project.loaded + '" data-loaded="' + project.loaded + '" data-project-id="' + escapeHtml(project.id) + '" data-project-name="' + escapeHtml(project.name) + '" type="button">',
          '<h4 class="project-name">' + escapeHtml(project.name) + "</h4>",
          '<div class="meta">',
          createChip("ID", project.id),
          '<span class="chip">' + escapeHtml(visibility) + "</span>",
          createChip("Updated", updated),
          "</div>",
          "</button>",
        ].join("");
      });

      const hasMore = projects.length < state.filteredProjects.length;
      const loadMoreButton = hasMore
        ? '<button id="loadMore" class="load-more" type="button">Load More</button>'
        : "";

      elements.content.innerHTML =
        '<div class="project-list">' + items.join("") + loadMoreButton + "</div>";
    }

    function bindProjectListEvents() {
      const loadMoreButton = document.getElementById("loadMore");
      if (loadMoreButton) {
        loadMoreButton.addEventListener("click", () => {
          state.visibleCount += PAGE_SIZE;
          renderProjects();
        });
      }

      const projectCards = elements.content.querySelectorAll(".project-item[data-project-id]");
      projectCards.forEach((card) => {
        card.addEventListener("click", () => {
          const projectId = card.getAttribute("data-project-id");
          const projectName =
            card.getAttribute("data-project-name") || "Project Details";

          if (!projectId) {
            return;
          }

          state.selectedProjectId = projectId;
          state.selectedProjectName = projectName;
          setDetailHeader(projectName, "Loading blocks and quizzes...");
          renderDetailState("Loading blocks and quizzes...");
          showDetailView();
          vscode.postMessage({ type: "selectProject", projectId, projectName });
        });
      });
    }

    function bindQuizEvents() {
      const quizToggleButtons =
        elements.detailContent.querySelectorAll("[data-quiz-toggle]");

      quizToggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const blockId = button.getAttribute("data-block-id");
          const blockName = button.getAttribute("data-block-name") || "Unnamed Block";
          const quizId = button.getAttribute("data-quiz-id");
          if (!blockId || !quizId) {
            return;
          }
          openQuizDetail(blockId, blockName, quizId);
        });
      });
    }

    function findSelectedQuiz(blockId, quizId) {
      if (!state.latestBlocks || !Array.isArray(state.latestBlocks)) {
        return null;
      }

      for (const block of state.latestBlocks) {
        if (block.id !== blockId) {
          continue;
        }

        const quiz = Array.isArray(block.quizzes)
          ? block.quizzes.find((candidate) => candidate.id === quizId)
          : null;

        if (quiz) {
          return { block, quiz };
        }
      }

      return null;
    }

    function openQuizDetail(blockId, blockName, quizId) {
      const selected = findSelectedQuiz(blockId, quizId);
      if (!selected) {
        renderQuizPageState("Quiz details are no longer available.");
        return;
      }

      state.selectedBlockId = blockId;
      state.selectedBlockName = blockName;
      state.selectedQuiz = selected.quiz;
      state.currentEditorLanguage = "";
      state.currentJudgeLanguage = "";
      state.lastJudgeResult = null;
      setQuizHeader("Quiz Details", blockName);
      renderQuizPage(selected.quiz);
      setRunCodeJudgeEnabled(!state.isRunningCodeJudge);
      showQuizView();
      vscode.postMessage({
        type: "selectQuiz",
        projectId: state.selectedProjectId,
        projectName: state.selectedProjectName,
        blockId,
        blockName,
        quizId,
      });
    }

    function renderProjects() {
      if (!state.filteredProjects.length) {
        const hasSearch = elements.searchInput.value.trim().length > 0;
        renderProjectState(
          hasSearch
            ? "No projects match your search."
            : "No projects found yet. Run LocalJudge: Login to fetch your project list.",
          { totalCount: state.allProjects.length }
        );
        return;
      }

      const newlyVisibleProjects = state.filteredProjects.slice(0, state.visibleCount);
      newlyVisibleProjects.forEach((project) => {
        project.loaded = 1;
      });

      const visibleProjects = state.filteredProjects.filter(
        (project) => project.loaded === 1
      );
      setProjectSummary(
        state.allProjects.length,
        "Showing " + visibleProjects.length + " / " + state.filteredProjects.length
      );
      renderProjectList(visibleProjects);
      bindProjectListEvents();
    }

    function applySearch() {
      const keyword = elements.searchInput.value.trim().toLowerCase();
      filterProjects(keyword);
      renderProjects();
    }

    function setLoggedIn(username) {
      elements.loginButton.textContent = username || "Logged In";
      elements.loginButton.disabled = true;
    }

    function setLoggedOut() {
      elements.loginButton.textContent = "Login";
      elements.loginButton.disabled = false;
    }

    function setProjects(projects) {
      state.allProjects = normalizeProjects(projects);
      state.filteredProjects = state.allProjects.slice();
      state.visibleCount = PAGE_SIZE;
      state.latestBlocks = [];
      state.selectedQuiz = null;
      state.isRunningCodeJudge = false;
      state.currentEditorLanguage = "";
      state.currentJudgeLanguage = "";
      state.lastJudgeResult = null;
    }

    function setCodeJudgeRunning(quizId, running, message, editorLanguage, judgeLanguage) {
      if (!state.selectedQuiz || state.selectedQuiz.id !== quizId) {
        return;
      }

      state.isRunningCodeJudge = running;
      if (editorLanguage) {
        state.currentEditorLanguage = editorLanguage;
      }
      if (judgeLanguage) {
        state.currentJudgeLanguage = judgeLanguage;
      }
      setRunCodeJudgeEnabled(!running && !elements.quizView.hidden);
      elements.quizStatus.textContent = message || (running ? "Running..." : state.selectedQuiz.quizType || "Quiz");
      renderQuizPage(state.selectedQuiz);
    }

    function setJudgeResult(quizId, label, details) {
      if (!state.selectedQuiz || state.selectedQuiz.id !== quizId) {
        return;
      }

      state.lastJudgeResult = { label, details };
      renderQuizPage(state.selectedQuiz);
    }

    function handleMessage(message) {
      if (message.type === "authState") {
        if (message.loggedIn) {
          setLoggedIn(message.username);
        } else {
          setLoggedOut();
        }
        return;
      }

      if (message.type === "loginResult") {
        if (message.ok) {
          renderProjectState("Login successful. Loading projects...", {
            totalCount: state.allProjects.length,
            summaryText: "",
          });
        } else {
          setLoggedOut();
          renderProjectState(message.message || "Login failed.");
        }
        return;
      }

      if (message.type === "projectsLoading") {
        renderProjectState(message.message || "Loading projects...", {
          totalCount: state.allProjects.length,
          summaryText: "",
        });
        return;
      }

      if (message.type === "projectsLoaded") {
        setProjects(message.projects);
        showProjectView();
        renderProjects();
        return;
      }

      if (message.type === "projectsError") {
        showProjectView();
        renderProjectState(message.message || "Failed to load projects.");
        return;
      }

      if (
        message.type === "projectDetailsLoading" &&
        message.projectId === state.selectedProjectId
      ) {
        setDetailHeader(
          message.projectName || state.selectedProjectName,
          message.message || "Loading blocks and quizzes..."
        );
        renderDetailState(message.message || "Loading blocks and quizzes...");
        return;
      }

      if (
        message.type === "projectDetailsLoaded" &&
        message.projectId === state.selectedProjectId
      ) {
        state.latestBlocks = message.blocks;
        setDetailHeader(
          message.projectName || state.selectedProjectName,
          "Blocks loaded for this project."
        );
        renderProjectDetails(message.blocks);
        return;
      }

      if (
        message.type === "projectDetailsError" &&
        message.projectId === state.selectedProjectId
      ) {
        setDetailHeader(
          message.projectName || state.selectedProjectName,
          "Failed to load project details."
        );
        renderDetailState(message.message || "Failed to load project details.");
        return;
      }

      if (message.type === "codeJudgeStarted") {
        setCodeJudgeRunning(
          message.quizId,
          true,
          message.message || "Running Code Judge...",
          message.editorLanguage,
          message.judgeLanguage
        );
        return;
      }

      if (message.type === "codeJudgeFinished") {
        setCodeJudgeRunning(
          message.quizId,
          false,
          message.message || "Code Judge completed.",
          message.editorLanguage,
          message.judgeLanguage
        );
        setJudgeResult(message.quizId, message.resultLabel, message.resultDetails);
        return;
      }

      if (message.type === "codeJudgeError") {
        setCodeJudgeRunning(
          message.quizId,
          false,
          message.message || "Code Judge failed.",
          message.editorLanguage,
          message.judgeLanguage
        );
        setJudgeResult(message.quizId, "Failed", message.message || "Code Judge failed.");
      }
    }

    elements.loginButton.addEventListener("click", () => {
      vscode.postMessage({ type: "login" });
    });

    elements.searchInput.addEventListener("input", applySearch);
    elements.backButton.addEventListener("click", showProjectView);
    elements.quizBackButton.addEventListener("click", () => {
      showDetailView();
      setRunCodeJudgeEnabled(false);
    });
    elements.runCodeJudgeButton.addEventListener("click", () => {
      if (!state.selectedQuiz || state.isRunningCodeJudge || elements.quizView.hidden) {
        return;
      }

      vscode.postMessage({
        type: "runCodeJudge",
        projectId: state.selectedProjectId,
        projectName: state.selectedProjectName,
        blockId: state.selectedBlockId,
        blockName: state.selectedBlockName,
        quizId: state.selectedQuiz.id,
      });
    });

    if (Array.isArray(initialProjects) && initialProjects.length > 0) {
      renderProjects();
    } else {
      renderProjectState("Checking login status...", {
        totalCount: state.allProjects.length,
        summaryText: "",
      });
    }

    window.addEventListener("message", (event) => {
      handleMessage(event.data);
    });
`;
}
