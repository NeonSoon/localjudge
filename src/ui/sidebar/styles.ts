export const sidebarStyles = `
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
    white-space: pre-line;
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

  .quiz-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
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

  .quiz-card.expanded {
    border-color: rgba(79, 195, 247, 0.35);
  }

  .quiz-toggle {
    display: grid;
    gap: 10px;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .quiz-toggle:hover .quiz-question {
    color: #ffffff;
  }

  .quiz-question {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text);
    word-break: break-word;
    white-space: pre-wrap;
  }

  .quiz-preview {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .quiz-detail {
    display: grid;
    gap: 12px;
    padding-top: 4px;
  }

  .quiz-detail[hidden] {
    display: none;
  }

  .quiz-detail-section {
    display: grid;
    gap: 8px;
  }

  .quiz-detail-title {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-transform: uppercase;
  }

  .example-list {
    display: grid;
    gap: 10px;
  }

  .example-card {
    display: grid;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    padding: 10px;
  }

  .example-label {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .example-pre {
    margin: 0;
    padding: 10px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.22);
    color: var(--text);
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .quiz-page {
    display: grid;
    gap: 12px;
  }

  .quiz-page-card {
    display: grid;
    gap: 10px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
  }

  .quiz-page-card.primary {
    gap: 14px;
    padding: 18px;
    border-color: rgba(79, 195, 247, 0.3);
    background: linear-gradient(180deg, rgba(79, 195, 247, 0.1), rgba(79, 195, 247, 0.03));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .problem-body {
    margin: 0;
    color: #fcfcfc;
    font-family: "Segoe UI", sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.75;
    letter-spacing: 0.01em;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .problem-body strong {
    font-weight: 800;
  }

  .judge-result {
    border-color: rgba(79, 195, 247, 0.22);
    background: linear-gradient(180deg, rgba(79, 195, 247, 0.08), rgba(79, 195, 247, 0.02));
  }

  #loginView {
    position: fixed;
    inset: 0;
    
    z-index: 100;
  }

  #loginView:not([hidden]) {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 登入卡片 */
  .card {
    width: 100%;
    max-width: 520px;
    padding: 28px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(17,17,17,0.95);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* input */
  input {
    padding: 12px;
    border-radius: 999px;
    border: none;
    font-size: 16px;
  }

  /* 按鈕都是整條的 */
  .fullBtn {
    width: 100%;
    padding: 14px 0;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: 0.15s ease;
  }

  .homefullBtn {
    width: 240px;
    padding: 14px 0;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: 0.15s ease;
  }

  /* 首頁按鈕 */
  .homeLoginBtn {
    padding: 12px;
    border-radius: 999px;
    width: 480px;
    font-size: 16px;
  }
  .homeLoginBtn:hover { background: #c5c3c3; }
      
  /* 按鈕 */
  .manualBtn {
    padding: 12px;
    border-radius: 999px;
    font-size: 16px;
  }
  .manualBtn:hover { background: #a9a7a7; }

  .portalBtn { 
    background: #7da2d6; 
    color: white;
    font-size: 16px;
  }
  .portalBtn:hover { background: #718fcb; }

  .divider { text-align: center; }

  .logo{
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }

  /* dashboard */
  #dashboardView {
    position: fixed;
    inset: 0;
    background: #1e1e1e;
    display: flex;
    flex-direction: column;
  }

  /* username 跟登出按鈕 */
  .topBar {
    position: absolute;
    top: 10px;
    right: 10px;
    gap: 10px;
  }

  /* 登出按鈕 */
  .logoutBtn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
  }
  .logoutBtn:hover {
    background: rgba(255,255,255,0.1);
  }

`;
