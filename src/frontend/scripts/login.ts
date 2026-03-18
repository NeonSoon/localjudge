export const loginScript = `

    window.addEventListener("DOMContentLoaded", () => {

    document.getElementById("loginBtn")?.addEventListener("click", () => {

        document.getElementById("mainView")
        ?.classList.add("hidden");

        document.getElementById("loginView")
        ?.classList.remove("hidden");

    });

    document.getElementById("manualLoginBtn")?.addEventListener("click", () => {

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        vscode.postMessage({
        type:"manualLogin",
        username,
        password
        });

    });

    });
`;