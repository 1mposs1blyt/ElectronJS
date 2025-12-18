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
  const bot_token = $("#bot_token")
  const bot_folder = $("#bot_folder")
  const bot_ssh_host = $("#bot_ssh_host")
  const bot_ssh_port = $("#bot_ssh_port");
  const bot_ssh_username = $("#bot_ssh_username")
  const bot_ssh_password = $("#bot_ssh_password")
  const bot_ssh_privateKey = $("#bot_ssh_privateKey");
  const bot_ssh_bot_dir = $("#bot_ssh_bot_dir")
  const bot_ssh_bot_name = $("#bot_ssh_bot_name")
  const bot_ssh_bot_file = $("#bot_ssh_bot_file")
  ipcRenderer.send("add-bot-list", {
    bot_token: bot_token.val(),
    bot_folder: bot_folder.val(),
    bot_ssh_host: bot_ssh_host.val(),
    bot_ssh_port: bot_ssh_port.val(),
    bot_ssh_username: bot_ssh_username.val(),
    bot_ssh_password: bot_ssh_password.val(),
    bot_ssh_privateKey: bot_ssh_privateKey.val(),
    bot_ssh_bot_dir: bot_ssh_bot_dir.val(),
    bot_ssh_bot_name: bot_ssh_bot_name.val(),
    bot_ssh_bot_file: bot_ssh_bot_file.val(),
  });
  ipcRenderer.on("bot-added", (event, data, err) => {
    // alert(data);
    console.log(data);
    // document.getElementById("bot_token").value = "";
    // document.getElementById("bot_folder").value = "";
    bot_token.val('')
    bot_folder.val('')
    bot_ssh_host.val('')
    bot_ssh_port.val("");
    bot_ssh_username.val('')
    bot_ssh_password.val('')
    bot_ssh_privateKey.val('')
    bot_ssh_bot_dir.val('')
    bot_ssh_bot_name.val('')
    bot_ssh_bot_file.val('')
  });
  // document.getElementById("bot_token").value = "";
  // document.getElementById("bot_folder").value = "";
});
document.addEventListener("DOMContentLoaded", async () => {
  // ipcRenderer.send("bot-edit-list");
  // ipcRenderer.on("isAuthorized", (event, data) => {
  // });
});
