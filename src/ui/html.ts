export function getHtml(): string {    /* 回傳字串 */
    return `
<!DOCTYPE html>
<html>
    /* 頁面的設定資訊 */
    <head>                   
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <style>
            html, body {
                height: 100%;
                margin: 0;
            }

            /* 畫面內容 */
            body {
                display: flex;             /* 可控制排列方向與對齊方式的系統 */
                justify-content: center;
                align-items: center;
                background: #1e1e1e;
                font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
                padding: 24px;
                box-sizing: border-box;
                color: white;
            }

            /* 首頁、登入頁 */
            #mainView, #loginView {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            /* 只要class = mainBox 都是這個格式 */
            .mainBox {
                width: 100%;
                max-width: 420px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 20px;
            }

            /* 登入框框 */
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

            /* 帳密輸入框 */
            input {
                width: 100%;
                padding: 12px 14px;
                border-radius: 12px;
                border: 1px solid #dcdcdc;
                background: #ffffff;
                color: #111;
                font-size: 14px;
                box-sizing: border-box;
                outline: none;
            }

            /* 裡面的提示字 */
            input::placeholder {
                color: #666;
            }

            /* 按鈕都是整條的 */
            .fullBtn {
                width: 100%;
                padding: 14px 0;
                border-radius: 12px;
                border: none;
                cursor: pointer;
                font-size: 15px;
                transition: 0.15s ease;
            }

            /* 首頁登入 */
            .homeLoginBtn {
                background: #ffffff;
                color: #111111;
            }
            .homeLoginBtn:hover { background: #c5c3c3; }

            /* 一般登入 */
            .manualBtn {
                background: #dcdcdc;
                color: #111111;
            }
            .manualBtn:hover { background: #a9a7a7; }

            /* portal 登入 */
            .portalBtn {
                background: #8fb8ff;
                color: #ffffff;
            }
            .portalBtn:hover { background: #718fcb; }

            /* 一條線，中間有 or */
            .divider {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 8px 0;
                color: rgba(255,255,255,0.9);
            }

            /* 左邊的線 右邊的線 */
            .divider::before,
            .divider::after {
                content: "";
                flex: 1;
                height: 1px;
                color: white;
                background: rgba(255,255,255,0.22);
            }
            .divider span {
                font-size: 13px;
            }

            /* 畫面切換 */
            .hidden {
                display: none !important;
            }

            /* 首頁 標題、副標題 */
            #mainView h1 {
                font-size: 36px;
                margin: 0;
                font-weight: 650;
            }
            #mainView p {
                margin: 0;
                color: #9ca3af;
                line-height: 1.4;
            }

            /* dashboard */
            #appView {
                position: fixed;
                inset: 0;
                background: #1e1e1e;
                display: flex;
                flex-direction: column;
            }

            /* username 跟登出按鈕 */
            .topBar {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                padding: 16px 24px;
                gap: 16px;
                font-size: 14px;
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

        </style>
    </head>

    <body>

        <!-- 主畫面 -->
        <div id="mainView">
            <div class="mainBox">
                <h1>LocalJudge</h1>
                <p>Welcome. Start coding directly in VS Code.</p>
                <button id="goLogin" class="fullBtn homeLoginBtn">
                    Login
                </button>
            </div>
        </div>

        <!-- 登入畫面 -->
        <div id="loginView" class="card hidden">
            <input id="username" placeholder="username" />
            <input id="password" type="password" placeholder="password" />

            <button id="manualLoginBtn" class="fullBtn manualBtn">
                Sign in
            </button>

            <div class="divider">
                <span>or</span>
            </div>

            <button id="portalLoginBtn" class="fullBtn portalBtn">
                Sign in with Portal
            </button>
        </div>

        <!-- dashboard -->
        <div id="appView" class="hidden">
            <div class="topBar">
                <span id="userDisplay"></span>
                <button id="logoutBtn" class="logoutBtn">Logout</button>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            const mainView = document.getElementById("mainView");
            const loginView = document.getElementById("loginView");
            const appView = document.getElementById("appView");

            document.getElementById("goLogin").addEventListener("click", () => {
                mainView.classList.add("hidden");
                loginView.classList.remove("hidden");
            });

            document.getElementById("manualLoginBtn").addEventListener("click", () => {
                vscode.postMessage({
                    type: "manualLogin",
                    username: document.getElementById("username").value,
                    password: document.getElementById("password").value
                });
            });

            document.getElementById("portalLoginBtn").addEventListener("click", () => {
                vscode.postMessage({ type: "portalLogin" });
            });

            document.getElementById("logoutBtn").addEventListener("click", () => {
                vscode.postMessage({ type: "logout" });
            });

            window.addEventListener("message", (event) => {
                const msg = event.data;

                if (msg.type === "loginResult" && msg.ok) {
                    mainView.classList.add("hidden");
                    loginView.classList.add("hidden");
                    appView.classList.remove("hidden");

                    document.getElementById("userDisplay").innerText =
                        "[" + msg.username + "]";
                }

                if (msg.type === "loggedOut") {
                    appView.classList.add("hidden");
                    mainView.classList.remove("hidden");
                    document.getElementById("username").value = "";
                    document.getElementById("password").value = "";
                }
            });
        </script>

    </body>
</html>
`;
}