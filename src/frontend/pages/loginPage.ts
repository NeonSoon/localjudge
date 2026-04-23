import { Card } from "../components/card";
import { Button } from "../components/button";
import { Divider } from "../components/divider";
import { Input } from "../components/input";
import { Logo } from "../components/logo";

export function loginPage(iconUri: string) {

    return `
        <div id="loginView" class="view login-container" hidden>
            ${Card(`

                ${Logo(iconUri)}
                ${Input("username","username")}
                ${Input("password","password","password")}
                ${Button("manualLoginBtn","Sign in","fullBtn manualBtn")}
                ${Divider}
                ${Button("portalLoginBtn","Sign in with Portal","fullBtn portalBtn")}

            `)}
        </div>
    `;

}