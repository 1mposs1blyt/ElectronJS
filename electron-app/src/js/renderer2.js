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
  const bot_folder = $("#bot_folder").val();
  const bot_ssh_host = $("#bot_ssh_host").val();
  const bot_ssh_username = $("#bot_ssh_username").val();
  const bot_ssh_password = $("#bot_ssh_password").val();
  const bot_ssh_privateKey = $("#bot_ssh_botDir").val();
  const bot_ssh_bot_dir = $("#bot_ssh_bot_dir").val();
  const bot_ssh_bot_name = $("#bot_ssh_bot_name").val();
  ipcRenderer.send("add-bot-list", {
    bot_token: bot_token,
    bot_folder: bot_folder,
    bot_ssh_host: bot_ssh_host,
    bot_ssh_username: bot_ssh_username,
    bot_ssh_password: bot_ssh_password,
    bot_ssh_privateKey: bot_ssh_privateKey,
    bot_ssh_bot_dir: bot_ssh_bot_dir,
    bot_ssh_bot_name: bot_ssh_bot_name,
  });
  ipcRenderer.on("bot-added", (event, data, err) => {
    // alert(data);
    console.log(data);
    document.getElementById("bot_token").value = "";
    // document.getElementById("bot_folder").value = "";
  });
  document.getElementById("bot_token").value = "";
  // document.getElementById("bot_folder").value = "";
});
document.addEventListener("DOMContentLoaded", async () => {
  // ipcRenderer.send("bot-edit-list");
  // ipcRenderer.on("isAuthorized", (event, data) => {
  // });
});
