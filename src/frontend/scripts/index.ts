import { loginScript } from "./login";
// import { portalScript } from "./portal";
// import { logoutScript } from "./logout";
// ${portalScript}
// ${logoutScript}

export const script = `

    const vscode = acquireVsCodeApi();

    ${loginScript}

`;