// const { ipcRenderer } = require("electron");
// const $ = require("jquery");
// const path = require("node:path");
// const fs = require("fs");
// const { io } = require("socket.io-client");
// const { ipcRenderer } = require("electron");

// =================================================================== //
document.getElementById("btn-close").addEventListener("click", () => {
  window.ipc.send("close-app");
});
document.getElementById("btn-minimize").addEventListener("click", () => {
  window.ipc.send("minimize-app");
});
document.getElementById("btn-maximize").addEventListener("click", () => {
  window.ipc.send("maximize-app");
});
// =================================================================== //
//
// =================================================================== //
document.getElementById("home").addEventListener("click", () => {
  window.ipc.send("open-home-page");
});
document.getElementById("open-settings").addEventListener("click", () => {
  window.ipc.send("open-settings-window");
});
document.getElementById("open-profile").addEventListener("click", () => {
  window.ipc.send("open-profile-window");
});
document.getElementById("open-bot-settings").addEventListener("click",()=>{
  window.ipc.send("open-bot-settings-window");
});
// =================================================================== //
