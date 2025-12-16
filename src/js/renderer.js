const { ipcRenderer } = require("electron");
const $ = require("jquery");
const path = require("node:path");
const fs = require("fs");

const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");
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
function renderBots() {
  ipcRenderer.send("load-all-bots");
  ipcRenderer.on("bots-loaded", (event, data) => {
    $("#bot-list").empty();
    if (data.error) {
      $("#bot-list").append(`Ошибка: ${data.error}`);
    } else {
      for (let i = 0; i < data.length; i++) {
        $("#bot-list").append(`<div
          class="skeleton-striped w-full min-h-24 h-24 flex items-center flex-row select-none rounded-xl mb-3">
              <div class="">
                <img
                  class="h-18 w-18 rounded-full ml-2"
                  src="./images/icon2.png"
                  alt="${data[i].avatar}"
                />
              </div>
              <div class="ml-4">
                <div class="text-primary" id="bot-name">${data[i].name}</div>
                <div id="bot-status" class="text-secondary">
                  Статус:
                  ${
                    data[i].status == "active"
                      ? '<span class="text-success" id="active">Активен</span>'
                      : '<span class="text-error" id="inactive">Неактивен</span>'
                  }
                </div>
                <div class="text-info">@${data[i].username}</div>
              </div>
            </div>
          `);
      }
    }
  });
}
document.addEventListener("DOMContentLoaded", async () => {
  renderBots();
});
// socket.onAny((event, payload, data) => {
//   console.log("[onAny]", event, payload);
//   console.log(data);
//   ipcRenderer.send("update-bot-status", data.botId);
//   ipcRenderer.on("bot-status-updated", (event, data) => {});
//   renderBots();
// });
// socket.on("bot-register", (data) => {
//   console.log("[RENDERER] bot-register", data);
//   ipcRenderer.send("update-bot-status", data.token);
//   ipcRenderer.on("bot-status-updated", (event, data) => {
//     alert(data);
//   });
//   // const bot = ensureBot(data);
//   // markBotActive(bot);
//   // renderBots();
// });

// // обычный update (сообщение)
socket.on("bot-update", (data) => {
  console.log("[RENDERER] bot-update", data);
  console.log(data.botId);
  ipcRenderer.send("update-bot-status", data.botId);
  ipcRenderer.on("bot-status-updated", (event, data) => {});
  renderBots();
});

// // heartbeat от бота
// socket.on("bot-heartbeat", (data) => {
//   console.log("[RENDERER] bot-heartbeat", data);
//   // const bot = ensureBot(data);
//   // markBotActive(bot);
//   // renderBots();
// });

// // явное отключение (если сервер шлёт)
// socket.on("bot-disconnected", (data) => {
//   console.log("[RENDERER] bot-disconnected", data);
//   // const bot = bots.get(data.botId);
//   // if (!bot) return;
//   // if (bot.inactiveTimer) clearTimeout(bot.inactiveTimer);
//   // bot.status = "offline";
//   // bots.set(bot.botId, bot);
//   // renderBots();
// });
