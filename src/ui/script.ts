export const script = `

const vscode = acquireVsCodeApi()

const mainView = document.getElementById("mainView")
const loginView = document.getElementById("loginView")
const appView = document.getElementById("appView")

document.getElementById("goLogin").addEventListener("click",()=>{

mainView.classList.add("hidden")
loginView.classList.remove("hidden")

})

document.getElementById("manualLoginBtn").addEventListener("click",()=>{

vscode.postMessage({
type:"manualLogin",
username:document.getElementById("username").value,
password:document.getElementById("password").value
})

})

document.getElementById("portalLoginBtn").addEventListener("click",()=>{

vscode.postMessage({
type:"portalLogin"
})

})

document.getElementById("logoutBtn").addEventListener("click",()=>{

vscode.postMessage({
type:"logout"
})

})

window.addEventListener("message",(event)=>{

const msg = event.data

if(msg.type==="loginResult" && msg.ok){

mainView.classList.add("hidden")
loginView.classList.add("hidden")
appView.classList.remove("hidden")

document.getElementById("userDisplay").innerText =
"["+msg.username+"]"

}

if(msg.type==="loggedOut"){

appView.classList.add("hidden")
mainView.classList.remove("hidden")

document.getElementById("username").value=""
document.getElementById("password").value=""

}

})

`;