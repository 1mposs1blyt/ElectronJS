// const { ipcRenderer } = require("electron");
// const $ = require("jquery");
// const path = require("node:path");
// const fs = require("fs");
// const { io } = require("socket.io-client");

// const { ipcRenderer } = require("electron");

// =================================================================== //
document.getElementById("btn-close").addEventListener("click", () => {
  ipcRenderer.send("close-app");
});
document.getElementById("btn-minimize").addEventListener("click", () => {
  ipcRenderer.send("minimize-app");
});
document.getElementById("btn-maximize").addEventListener("click", () => {
  ipcRenderer.send("maximize-app");
});
// =================================================================== //
//
// =================================================================== //
document.getElementById("home").addEventListener("click", () => {
  ipcRenderer.send("open-home-page");
});
document.getElementById("open-settings").addEventListener("click", () => {
  ipcRenderer.send("open-settings-window");
});
document.getElementById("open-profile").addEventListener("click", () => {
  ipcRenderer.send("open-profile-window");
});
document.getElementById("open-bot-settings").addEventListener("click",()=>{
  ipcRenderer.send("open-bot-settings-window");
});
// =================================================================== //
