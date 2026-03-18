import { styles } from "./styles/index";
import { script } from "./scripts";
import { welcomePage } from "./pages/welcomePage";
import { loginPage } from "./pages/loginPage";
import { dashboardPage } from "./pages/dashboardPage";

export function getHtml(iconUri: string){

    return `

        <html>

            <head>

                <style>
                    ${styles}
                </style>

            </head>

            <body>

                ${welcomePage}
                ${loginPage(iconUri)}
                ${dashboardPage}

                <script>
                    ${script}
                </script>

            </body>

        </html>

    `;

}