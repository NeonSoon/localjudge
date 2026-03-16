export const loginPage = `

    <div id="loginView" class="card hidden">

        <div class="logo">
            <img src= "${iconUri}" width="60">
        </div>

        <input id="username" placeholder="username">

        <input id="password" type="password" placeholder="password">

        <button id="manualLoginBtn" class="fullBtn manualBtn">
        Sign in
        </button>

        <div class="divider">
        <span>or</span>
        </div>

        <button id="portalLoginBtn" class="fullBtn portalBtn">
        Sign in with Portal
        </button>

    </div>

`;