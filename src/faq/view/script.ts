export function getFaqScript(faqBaseUrl: string): string {
  return `
    (function () {
      const BASE_URL = ${JSON.stringify(faqBaseUrl)};

      const chatArea = document.getElementById("chatArea");
      const emptyState = document.getElementById("emptyState");
      const queryInput = document.getElementById("queryInput");
      const sendBtn = document.getElementById("sendBtn");

      let isLoading = false;

      function escapeHtml(str) {
        return String(str)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }

      function hideEmptyState() {
        if (emptyState) {
          emptyState.style.display = "none";
        }
      }

      function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
      }

      function appendUserMessage(text) {
        hideEmptyState();
        const el = document.createElement("div");
        el.className = "message user";
        el.innerHTML =
          '<span class="message-role">You</span>' +
          '<div class="bubble">' + escapeHtml(text) + "</div>";
        chatArea.appendChild(el);
        scrollToBottom();
      }

      function appendLoadingMessage() {
        hideEmptyState();
        const el = document.createElement("div");
        el.className = "message ai";
        el.id = "loadingMsg";
        el.innerHTML =
          '<span class="message-role">Assistant</span>' +
          '<div class="bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>';
        chatArea.appendChild(el);
        scrollToBottom();
        return el;
      }

      function removeLoadingMessage() {
        const el = document.getElementById("loadingMsg");
        if (el) {
          el.remove();
        }
      }

      function appendAiMessage(answer, sources) {
        const el = document.createElement("div");
        el.className = "message ai";

        const sourcesMarkup =
          Array.isArray(sources) && sources.length
            ? '<div class="sources">' +
              '<span class="sources-label">Sources</span>' +
              '<div class="source-chips">' +
              sources
                .map(
                  (s) =>
                    '<span class="source-chip">' + escapeHtml(s) + "</span>"
                )
                .join("") +
              "</div></div>"
            : "";

        el.innerHTML =
          '<span class="message-role">Assistant</span>' +
          '<div class="bubble">' + escapeHtml(answer) + "</div>" +
          sourcesMarkup;

        chatArea.appendChild(el);
        scrollToBottom();
      }

      function appendErrorMessage(message) {
        const el = document.createElement("div");
        el.className = "message ai error";
        el.innerHTML =
          '<span class="message-role">Assistant</span>' +
          '<div class="bubble">' + escapeHtml(message) + "</div>";
        chatArea.appendChild(el);
        scrollToBottom();
      }

      function setLoadingState(loading) {
        isLoading = loading;
        sendBtn.disabled = loading;
        queryInput.disabled = loading;
      }

      async function sendQuery(query) {
        if (isLoading || !query.trim()) {
          return;
        }

        const trimmed = query.trim();
        appendUserMessage(trimmed);
        setLoadingState(true);
        appendLoadingMessage();

        try {
          const response = await fetch(BASE_URL + "/user/faq/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: trimmed }),
          });

          removeLoadingMessage();

          if (!response.ok) {
            let detail = "Server returned " + response.status;
            try {
              const errBody = await response.json();
              if (errBody && errBody.detail) {
                detail = String(errBody.detail);
              }
            } catch (_) {}
            appendErrorMessage("Error: " + detail);
            return;
          }

          const data = await response.json();
          const answer = data.answer || "(No answer returned)";
          const sources = Array.isArray(data.sources) ? data.sources : [];
          appendAiMessage(answer, sources);
        } catch (err) {
          removeLoadingMessage();
          const msg = err && err.message ? err.message : String(err);
          appendErrorMessage(
            "Could not reach the FAQ service.\\n" +
            "Make sure the backend is running at: " + BASE_URL + "\\n\\n" +
            msg
          );
        } finally {
          setLoadingState(false);
          queryInput.focus();
        }
      }

      function autoResize() {
        queryInput.style.height = "auto";
        queryInput.style.height = Math.min(queryInput.scrollHeight, 140) + "px";
      }

      queryInput.addEventListener("input", autoResize);

      queryInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const value = queryInput.value;
          queryInput.value = "";
          autoResize();
          sendQuery(value);
        }
      });

      sendBtn.addEventListener("click", function () {
        const value = queryInput.value;
        queryInput.value = "";
        autoResize();
        sendQuery(value);
      });

      queryInput.focus();
    })();
  `;
}
