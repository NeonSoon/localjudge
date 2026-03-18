export const loginScript = `

    document.getElementById("manualLoginBtn")
    
    ?.addEventListener("click", () => {

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        vscode.postMessage({
            type:"manualLogin",
            username,
            password
        });

    });

`;