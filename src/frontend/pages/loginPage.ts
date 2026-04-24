import { Card } from "../components/card";
import { Button } from "../components/button";
import { Divider } from "../components/divider";
import { Input } from "../components/input";
import { Logo } from "../components/logo";

export function loginPage(iconUri: string) {

    return `
        <div id="loginView" hidden>
            ${Card(`

                ${Logo(iconUri)}
                ${Input("username","username")}
                ${Input("password","password","password")}
                <div id="loginError" style="display:none; color:#ff6b6b; font-size:13px;"></div>
                ${Button("manualLoginBtn","Sign in","fullBtn manualBtn")}
                ${Divider}
                ${Button("portalLoginBtn","Sign in with Portal","fullBtn portalBtn")}

            `)}
        </div>
    `;

}