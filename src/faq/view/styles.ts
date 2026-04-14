export const faqStyles = `
  :root {
    color-scheme: dark;
    --bg: #181818;
    --panel: #202020;
    --panel-2: #252526;
    --border: #313131;
    --text: #f3f3f3;
    --muted: #a9a9a9;
    --accent: #4fc3f7;
    --accent-dim: rgba(79, 195, 247, 0.15);
    --button: #f5f5f5;
    --button-text: #111111;
    --user-bubble: rgba(79, 195, 247, 0.18);
    --ai-bubble: #252526;
    --error: #f28b82;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 860px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
  }

  .header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--accent-dim);
    border: 1px solid rgba(79, 195, 247, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .header-text h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .header-text p {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--muted);
  }

  /* ── Chat area ── */
  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chat-area::-webkit-scrollbar {
    width: 6px;
  }

  .chat-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-area::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  /* ── Messages ── */
  .message {
    display: flex;
    flex-direction: column;
    max-width: 82%;
    gap: 4px;
  }

  .message.user {
    align-self: flex-end;
    align-items: flex-end;
  }

  .message.ai {
    align-self: flex-start;
    align-items: flex-start;
  }

  .message-role {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 0 4px;
  }

  .message.user .message-role {
    color: var(--accent);
  }

  .bubble {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .message.user .bubble {
    background: var(--user-bubble);
    border: 1px solid rgba(79, 195, 247, 0.3);
    border-bottom-right-radius: 4px;
    color: var(--text);
  }

  .message.ai .bubble {
    background: var(--ai-bubble);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
    color: var(--text);
  }

  .message.ai.error .bubble {
    border-color: rgba(242, 139, 130, 0.3);
    color: var(--error);
  }

  /* ── Sources ── */
  .sources {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 4px;
  }

  .sources-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .source-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .source-chip {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
  }

  /* ── Loading dots ── */
  .loading-dots {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 4px 0;
  }

  .loading-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: bounce 1.2s infinite ease-in-out;
  }

  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* ── Empty state ── */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
    padding: 40px 24px;
    color: var(--muted);
  }

  .empty-state-icon {
    font-size: 40px;
    opacity: 0.5;
  }

  .empty-state h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
  }

  .empty-state p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    max-width: 320px;
  }

  /* ── Input bar ── */
  .input-bar {
    flex-shrink: 0;
    display: flex;
    gap: 10px;
    padding: 16px 24px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }

  .input-wrap {
    flex: 1;
    position: relative;
  }

  .query-input {
    width: 100%;
    min-height: 44px;
    max-height: 140px;
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    line-height: 1.5;
    resize: none;
    outline: none;
    overflow-y: auto;
    transition: border-color 0.15s;
  }

  .query-input:focus {
    border-color: rgba(79, 195, 247, 0.5);
  }

  .query-input::placeholder {
    color: var(--muted);
  }

  .query-input:disabled {
    opacity: 0.6;
  }

  .send-btn {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 14px;
    background: var(--button);
    color: var(--button-text);
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
    align-self: flex-end;
  }

  .send-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .send-btn:not(:disabled):hover {
    opacity: 0.85;
  }
`;
