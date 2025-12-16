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

document.getElementById("open-settings").addEventListener("click", () => {
  ipcRenderer.send("open-settings-window");
});

document.addEventListener("DOMContentLoaded", () => {
  // alert("DOM в renderer.js готов!");
  const bot_list = document.getElementById("bot-list");
  function renderBots() {
    var bots;
    try {
      const data = fs.readFileSync("./src/jsons/bots.json", "utf8");
      bots = JSON.parse(data);
      // console.log(bots);
    } catch (err) {
      console.error(err);
    }
    for (let i = 0; i < bots.length; i++) {
      $("#bot-list").append(`<div
      class="skeleton-striped w-full min-h-24 h-24 flex items-center flex-row select-none rounded-xl mb-3">
          <div class="">
            <img
              class="h-18 w-18 rounded-full ml-2"
              src="./images/icon2.png"
              alt="${bots[i].avatar}"
            />
          </div>
          <div class="ml-4">
            <div class="text-primary" id="bot-name">${bots[i].bot_name}</div>
            <div id="bot-status" class="text-secondary">
              Статус:
              ${
                bots[i].status == "active"
                  ? '<span class="text-success" id="active">Активен</span>'
                  : '<span class="text-error" id="inactive">Неактивен</span>'
              }
            </div>
            <div class="text-info">${bots[i].username}</div>
          </div>
        </div>
      `);
    }
  }
  renderBots();
});
