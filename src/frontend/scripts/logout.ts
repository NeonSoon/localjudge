export const logoutScript = `

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        vscode.postMessage({ type:"logout" });
    });

`;