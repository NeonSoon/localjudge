export function getHtml() {
    return /* html */ `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
       <style>
        html, body { height: 100%; margin: 0; }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #1e1e1e;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
        }
        .hidden { display: none !important; }
        .card {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        h1 { margin: 0 0 12px; }
        p { color: #666; margin: 0 0 16px; }
        input {
            width: 100%;
            padding: 10px 12px;
            margin: 8px 0;
            border: 1px solid #ccc;
            border-radius: 10px;
            font-size: 14px;
            box-sizing: border-box;
        }
        button {
            padding: 10px 14px;
            border-radius: 10px;
            border: 1px solid #ccc;
            background: #fff;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover { background: #f5f5f5; }
        .row { display: flex; gap: 10px; margin-top: 12px; }
        .row button { flex: 1; }
        .mutedBtn { background: #f7f7f7; }
        hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }

        .fullBtn {
            width: 100%;
            margin-top: 12px;
        }

        .primaryBtn {
            background: #f0f0f0;
            color: black;
            border: none;
        }

        .primaryBtn:hover {
            background: #e5e5e5;
        }

        .portalBtn {
            background: #95bffe;
            color: white;
            border: none;
        }

        .portalBtn:hover {
            background: #668abd;
        }

        .divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 20px 0;
            color: white;
        }

        .divider span {
            color: white;
            font-size: 14px;
        }

        .divider::before,
        .divider::after {
            content: "";
            flex: 1;
            height: 1px;
            background: rgba(255,255,255,0.2);
        }
        #mainView, #loginView {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #mainView h1 {
            font-size: 36px;         
            font-weight: 600;
            margin: 0;
        }
        #mainView p {
            font-size: 16px;
            color: #9ca3af;          /* 柔和灰 */
            margin: 0;
        }
        #mainView>div{ max-width: 400px; }

        .centerLoginBtn {
            width: 100%;
            max-width: 320px;
            padding: 14px 0;
            font-size: 16px;
            border-radius: 12px;
            border: none;
            background: #3b7ddd;
            color: white;
            cursor: pointer;
        }

        .centerLoginBtn:hover {
            background: #2f6ec5;
            transform: translateY(-1px);    
        }

        </style>
</head>

<body>
    <!-- 主畫面 -->
    <div id="mainView">
            <h1>LocalJudge</h1>
            <p>Welcome. Start coding directly in VS Code.</p>
            <button id="goLogin">Login</button>
    </div>

    <!-- 登入畫面 -->
    <div id="loginView" class="card hidden">

        <!-- 帳密登入 -->
        <input id="username" placeholder="username" />
        <input id="password" type="password" placeholder="password" />

        <button id="manualLoginBtn" class="fullBtn primaryBtn">
            Sign in
        </button>

        <!-- 分隔 -->
        <div class="divider">
            <span>or</span>
        </div>

        <!-- Portal 登入 -->
        <button id="portalLoginBtn" class="fullBtn portalBtn">
            Sign in with Portal
        </button>
    </div>

    <script>

        const vscode = acquireVsCodeApi();

        window.addEventListener("DOMContentLoaded", () => {

            const mainView = document.getElementById("mainView");
            const loginView = document.getElementById("loginView");
            const goLoginBtn = document.getElementById("goLogin");

            if (goLoginBtn) {
            goLoginBtn.addEventListener("click", () => {
                mainView.classList.add("hidden");
                loginView.classList.remove("hidden");
            });
            }

        });

    </script>
</body>
</html>`;
}