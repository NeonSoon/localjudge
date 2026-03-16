import { styles } from "./styles";
import { script } from "./script";
import { welcomePage } from "./pages/welcomePage";
import { loginPage } from "./pages/loginPage";
import { dashboardPage } from "./pages/dashboardPage";
import * as vscode from "vscode";

export function getHtml(iconUri: vscode.Uri): string {

return `
<!DOCTYPE html>
<html>

    <head>
        <meta charset="UTF-8">

        <style>
            ${styles}
        </style>

    </head>

    <body>

        ${welcomePage}
        ${loginPage}
        ${dashboardPage}

        <script>
            ${script}
        </script>

    </body>

</html>
`;
}