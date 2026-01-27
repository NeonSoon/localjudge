// 做出 html 該長怎樣，包成字串丟回去
export function getMainHtml() {
    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />

    <!-- 根據裝置顯示寬度 -->
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <style>
        html, body {
            height: 100%;
            margin: 0;
        }

        body {
            position: relative;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
            padding: 40px;          /* 內容跟邊緣保持距離 */
            display: flex;          /* 排版模式 */
            justify-content: center;/* 水平置中 */
            align-items: center;    /* 垂直置中 */
        }

        .container {
            text-align: center;     /* 文字置中 */
            max-width: 420px;
        }

        p {
            color: #666;
            margin: 10px 0 24px;
        }

        button {
            padding: 10px 20px;
            border-radius: 12px;    /* 圓角 */
            border: 1px solid #ccc;
            background: #fff;
            font-size: 14px;
            cursor: pointer;        /* 滑鼠碰到要變成啥 */
        }

        button:hover {
            background: #f5f5f5;    /* 碰到按鈕變色 */
        }

        .login-btn {
            position: absolute;     /* 脫離原本排版 */
            top: 16px;
            right: 16px;
            padding: 8px 14px;
            border-radius: 10px;
            border: 1px solid #ccc;
            background: #fff;
            cursor: pointer;
        }
    </style>
</head>

<body>
    <button id="login" class="login-btn">Login</button>

    <div class="container">
        <h1>LocalJudge</h1>   <!-- 標題 -->
        <p id="hint">Welcome. Start coding directly in VS Code.</p>
        <button id="start">Start</button> <!-- 按鈕 -->
    </div>

    <script>
        const vscode = acquireVsCodeApi(); // 取得 vscode 提供的 Webview API

        document.getElementById("start").addEventListener("click", () => {
            vscode.postMessage({ type: "start" });
        });

        document.getElementById("login").addEventListener("click", () => {
            vscode.postMessage({ type: "login" });
        });

        window.addEventListener("message", (event) => {
            const msg = event.data;
            if (msg.type === "loginResult") {
                if (msg.ok) {
                    document.getElementById("login").textContent = "Logged in";
                    if (msg.username) {
                        document.getElementById("hint").textContent =
                            "Hi, " + msg.username + "!";
                    }
                } else {
                    alert("Login failed");
                }
            }
        });
    </script>
</body>
</html>`;
}