const { ipcRenderer } = require("electron");
const $ = require("jquery");
const path = require("node:path");
const fs = require("fs");

document.getElementById("btn-close").addEventListener("click", () => {
  ipcRenderer.send("close-app");
});
document.getElementById("btn-minimize").addEventListener("click", () => {
  ipcRenderer.send("minimize-app");
});
document.getElementById("btn-maximize").addEventListener("click", () => {
  ipcRenderer.send("maximize-app");
});
document.getElementById("close-settings").addEventListener("click", () => {
  ipcRenderer.send("close-settings-window");
});
document.getElementById("add_bot").addEventListener("click", () => {
  const bot_token = $("#bot_token").val();
  //"bot_token21312312" //doc.getelementbyid...
  ipcRenderer.send("add-bot-list", bot_token);
  ipcRenderer.on("bot-added", (event, data) => {
    // alert(data);
    console.log(data);
    document.getElementById("bot_token").value = "";
  });
});
document.addEventListener("DOMContentLoaded", async () => {
  // ipcRenderer.send("bot-edit-list");
  // ipcRenderer.on("isAuthorized", (event, data) => {
  // });
});
