export function getSidebarBodyMarkup() {
  return `
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

    <div id="quizView" class="view" hidden>
      <div class="detail-header">
        <div class="quiz-topbar">
          <button id="quizBack" class="back-btn" type="button">Back to Blocks</button>
          <button id="runCodeJudge" class="login-btn" type="button" disabled>Run Code Judge</button>
        </div>
        <section class="detail-card">
          <h2 id="quizTitle">Quiz Details</h2>
          <p id="quizSubtitle">Select a quiz to inspect the full statement.</p>
        </section>
      </div>

      <section>
        <div class="section-title">
          <h3>Quiz Content</h3>
          <span id="quizStatus" class="count"></span>
        </div>
        <div id="quizContent"></div>
      </section>
    </div>
  </div>
`;
}
