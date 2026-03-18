import { loginScript } from "./login";
import { logoutScript } from "./logout";

export const script = `

    const vscode = acquireVsCodeApi();

    ${loginScript}
    ${logoutScript}

    window.addEventListener("message", (event) => {
        const msg = event.data;

        if (msg.type === "loginResult" && msg.ok) {
            document.getElementById("loginView")?.classList.add("hidden");
            document.getElementById("dashboardView")?.classList.remove("hidden");

            document.getElementById("welcomeUser").innerText = msg.username;
        }

        if (msg.type === "loggedOut") {
            document.getElementById("dashboardView")?.classList.add("hidden");
            document.getElementById("mainView")?.classList.remove("hidden");
        }

    });

`;