import * as vscode from "vscode";
import { loginWithUsernamePassword } from "./auth/loginFlow";
import { setAuth } from "./auth/tokenStore";
import { CONFIG_SECTION } from "./config/config";


let currentPanel: vscode.WebviewPanel | undefined;
// VS Code 在 extension「被啟動」時，會自動呼叫 activate(main)
// context 是 VS Code 借你的「管理工具箱」
export function activate(context: vscode.ExtensionContext) {
    // 註冊一個 Command
    const openUI  =  vscode.commands.registerCommand(
        "localjudge-ui.openUI", // 暗號->指令
        ()  => {
            const panel  =  vscode.window.createWebviewPanel(     // 建立 Webview 視窗object
                "localjudgeUI",                  // Webview 的內部 ID（系統用）
                "LocalJudge",                    // title
                vscode.ViewColumn.One,           // 開一個視窗
                {
                    enableScripts: true          // 允許 HTML 裡的 <script> 執行
                }
            );
            currentPanel = panel;

            panel.webview.html  =  getHtml();      // getHTML得到的東東丟進來

            panel.webview.onDidReceiveMessage(async (msg)  => {     // 接收 Webview 傳回的訊息
                if(msg.type  ===  "start") {
                    vscode.window.showInformationMessage("Start clicked!");
                }
                if(msg.type === "login"){
                    const extID = context.extension.id;       // extension 的身分證(才能定位 extension ))
                    console.log("extID:", extID);
                    const callbackuri = `vscode://${extID}/auth-callback`;      // 創建專用 URI
                    const loginurl = 
                        `https://pslab.squidspirit.com/sign-in?redirect=${encodeURIComponent(callbackuri)}`;

                    await vscode.env.openExternal(vscode.Uri.parse(loginurl));      // 用 external 打開
                    // vscode.window.showInformationMessage("Login clicked!");
                }

            });
        }
    );
    const uriHandler = vscode.window.registerUriHandler({
        async handleUri(uri: vscode.Uri) {
            // 只接受 auth-callback（避免別的 URI 亂進來）
            if (uri.path !== "/auth-callback") return;
            const params = new URLSearchParams(uri.query);
            const token = params.get("token");

            if (token) {
                await context.secrets.store("localjudge.token", token);
                currentPanel?.webview.postMessage({ type: "loginResult", ok: true });
                vscode.window.showInformationMessage("Login success! Token received.");
            }
            else {
                currentPanel?.webview.postMessage({ type: "loginResult", ok: false });
                vscode.window.showErrorMessage("Callback received, but no token.");
            }
        }

    });
    context.subscriptions.push(openUI, uriHandler);          // 註冊清理 reload就一起清掉
}

// 做出html該長怎樣 包成字串丟回去
function getHtml() {
    return `<!doctype html>         
<html>
<head>
    <meta charset = "utf-8" />

    <!-- 根據裝置顯示寬度 -->
    <meta name = "viewport" content = "width = device-width, initial-scale = 1" />

    <style>
		html, body {
			height: 100%;
			margin: 0;
		}

        body {
			position: relative;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;  <!-- 系統原生字體 -->
            padding: 40px;     /* 內容跟邊緣保持距離 */
            display: flex;     /* 排版模式 */
            justify-content: center;   /* 水平置中 */
            align-items: center;       /* 垂直置中 */
        }

        .container {
            text-align: center;        <!-- 文字置中 -->
            max-width: 420px;     
        }
        p {
            color: #666;
            margin: 10px 0 24px;
        }

        button {
            padding: 10px 20px;
            border-radius: 12px;       <!-- 圓角 -->
            border: 1px solid #ccc;
            background: #fff;
            font-size: 14px;
            cursor: pointer;          <!-- 滑鼠碰到要變成啥 -->
        }
        button:hover {
            background: #f5f5f5;    <!-- 碰到按鈕變色 -->
        }

		.login-btn {
			position: absolute;       /* 脫離原本排版 */
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
	<button id = "login" class = "login-btn">Login</button>

    <div class = "container">
        <h1>LocalJudge</h1>    <!-- 標題 -->
        <p>Welcome. Start coding directly in VS Code.</p>     <!-- 文字 -->
        <button id = "start">Start</button>     <!-- 按鈕名/按鈕顯示名 -->
    </div>

    <script>
        const vscode  =  acquireVsCodeApi();    // 取得 vscode 提供的 Webview API

        // 監聽 Start 按鈕被點擊
        document.getElementById("start").addEventListener("click", ()  => {
            vscode.postMessage({ type: "start" });
        });
        document.getElementById("login").addEventListener("click", ()  => {
            vscode.postMessage({ type: "login" });
        });
        window.addEventListener("message", (event) => {
            const msg = event.data;
            if (msg.type === "loginResult") {
                if (msg.ok) {
                document.getElementById("login").textContent = "Logged in";
                } else {
                alert("Login failed (no token).");
                }
            }
        });

    </script>
</body>
</html>`;
}

export function deactivate() {}
// extID: undefined_publisher.localjudge-ui