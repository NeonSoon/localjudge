import { Card } from "../components/card";
import { Button } from "../components/button";
import { Divider } from "../components/divider";
import { Input } from "../components/input";

export function loginPage(iconUri: string) {
  return `
    <div id="loginView" hidden>
      ${Card(`
        <div class="login-card-shell">
          <button id="loginBackBtn" class="login-back-btn" type="button">Back</button>
          <div class="login-eyebrow">Anna Access</div>
          <h2 class="login-title">Sign in to start</h2>
          <p class="login-copy">
            Use your Anna account, or continue with NCU Portal
          </p>

          <div class="login-form">
            <label class="login-field">
              <span>Username</span>
              ${Input("username", "Enter your username")}
            </label>
            <label class="login-field">
              <span>Password</span>
              ${Input("password", "Enter your password", "password")}
            </label>
          </div>

          <div id="loginError" class="login-error" hidden></div>

          <div class="login-actions">
            ${Button("manualLoginBtn", "Sign in", "fullBtn manualBtn")}
            ${Divider}
            ${Button("portalLoginBtn", "Sign in with Portal", "fullBtn portalBtn")}
          </div>
        </div>
      `)}
    </div>
  `;
}
