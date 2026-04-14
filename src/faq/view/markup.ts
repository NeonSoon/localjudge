export function getFaqBodyMarkup(): string {
  return `
  <div class="layout">
    <header class="header">
      <div class="header-icon">💬</div>
      <div class="header-text">
        <h1>FAQ Assistant</h1>
        <p>Ask anything — powered by RAG</p>
      </div>
    </header>

    <div class="chat-area" id="chatArea">
      <div class="empty-state" id="emptyState">
        <div class="empty-state-icon">🔍</div>
        <h2>How can I help you?</h2>
        <p>Type your question below and get an answer from the knowledge base.</p>
      </div>
    </div>

    <div class="input-bar">
      <div class="input-wrap">
        <textarea
          class="query-input"
          id="queryInput"
          placeholder="Type your question..."
          rows="1"
        ></textarea>
      </div>
      <button class="send-btn" id="sendBtn" type="button" title="Send (Enter)">
        ↑
      </button>
    </div>
  </div>
  `;
}
