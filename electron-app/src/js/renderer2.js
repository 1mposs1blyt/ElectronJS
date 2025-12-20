const { ipcRenderer } = require("electron");
const $ = require("jquery");
const path = require("node:path");
const fs = require("fs");

document.getElementById("add_bot").addEventListener("click", () => {
  const bot_token = $("#bot_token");
  const bot_folder = $("#bot_folder");
  const bot_ssh_host = $("#bot_ssh_host");
  const bot_ssh_port = $("#bot_ssh_port");
  const bot_ssh_username = $("#bot_ssh_username");
  const bot_ssh_password = $("#bot_ssh_password");
  const bot_ssh_privateKey = $("#bot_ssh_privateKey");
  const bot_ssh_bot_dir = $("#bot_ssh_bot_dir");
  const bot_ssh_bot_name = $("#bot_ssh_bot_name");
  const bot_ssh_bot_file = $("#bot_ssh_bot_file");
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
  ipcRenderer.once("bot-added", (event, data, err) => {
    console.log({ data, err });
    bot_token.val("");
    bot_folder.val("");
    bot_ssh_host.val("");
    bot_ssh_port.val("");
    bot_ssh_username.val("");
    bot_ssh_password.val("");
    bot_ssh_privateKey.val("");
    bot_ssh_bot_dir.val("");
    bot_ssh_bot_name.val("");
    bot_ssh_bot_file.val("");

    const toast = document.getElementById("toast-notification");
    toast.textContent = data.result;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
  });
});
