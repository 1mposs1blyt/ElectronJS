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
document.getElementById("open-settings").addEventListener("click", () => {
  ipcRenderer.send("open-settings-window");
});
document.addEventListener("DOMContentLoaded", async () => {
  renderBots();
});
function bot_start(el, e) {
  // const parent = e.target.parentNode.parentNode;
  // const button = parent.querySelector("button").textContent.trim();
  // const botusername = parent
  //   .querySelector(".text-info")
  //   .textContent.split("@")[1];
  // console.log("Bot-user-name:", botusername);
  // ipcRenderer.send("get-bot-path", botusername);
  // ipcRenderer.on("send-bot-path", (event, data) => {
  //   console.log(data.avatar);
  //   const bot_path = data.avatar;
  //   const { spawn } = require("child_process");
  //   const scriptPath = path.join(bot_path);
  //   const child = spawn(process.execPath, [scriptPath], {
  //     detached: true, // Allows the child to run independently of the parent
  //     stdio: "ignore", // Detaches stdio streams
  //   });
  //   child.unref();
  // });

  let botId = el.dataset.bot_id;
  console.log("[RENDERER] Starting bot:", botId);
  socket.emit("start-bot", { botId }, (response) => {
    if (response.success) {
      console.log("✓ Бот запущен");
    } else {
      console.log("✗ Ошибка:", response.error);
    }
  });
  alert("В разработке!");
}
function bot_stop(el, e) {
  let botId = el.dataset.bot_id;
  console.log("[RENDERER] Stopping bot:", botId);
  socket.emit("stop-bot", { botId }, (response) => {
    if (response.success) {
      console.log(`✓ Bot stopped`);
      alert("✓ " + response.message);
    } else {
      console.error("Error:", response.error);
      alert("✗ Error: " + response.error);
    }
  });
  botId = botId.split("bot_")[1];
  ipcRenderer.send("update-bot-status", {
    botId: botId,
    status: "inactive",
  });
  renderBots();
}
function renderBots() {
  ipcRenderer.send("load-all-bots");
  ipcRenderer.on("bots-loaded", (event, data) => {
    $("#bot-list").empty();
    if (data.error) {
      $("#bot-list").append(`Ошибка: ${data.error}`);
    } else {
      for (let i = 0; i < data.length; i++) {
        $("#bot-list").append(`
          <div
          class="skeleton-striped w-full min-h-24 h-24 flex items-center flex-row select-none rounded-xl mb-3">
              <div class="h-18 w-18 rounded-full ml-4">
                <img
                  class=""
                  src="./images/icon2.png"
                  alt="${data[i].avatar}"
                />
                <p hidden id="${[i]}"></p>
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
              <div  class="ml-auto flex flex-col w-auto mr-2">
                <button
                  class="bot-stop btn btn-soft btn-success pt-1 mb-2"
                  data-bot_id="bot_${data[i].id}"
                  onclick="bot_start(this,event)"
                  id="${data[i].socket_id}"
                >
                  start
                </button>
                <button
                  class="bot-stop btn btn-soft btn-error pt-1"
                  onclick="bot_stop(this,event)"
                  data-bot_id="bot_${data[i].id}"
                  id="${data[i].socket_id}"
                >
                  stop
                </button>
              </div>
            </div>
          `);
      }
    }
  });
}
socket.on("bot-register", (data) => {
  console.log("[RENDERER] bot-register", data);
  console.log(data.botId);
  let botId = data.botId.split("bot_")[1];
  ipcRenderer.send("update-bot-status", {
    botId: botId,
    status: "active",
    process: data.process,
  });
  ipcRenderer.on("bot-status-updated", (event, data) => {});
  renderBots();
});
socket.on("bot-disconnected", (data) => {
  console.log("[RENDERER] bot-disconnected", data);
  let botId = data.botId.split("bot_")[1];
  ipcRenderer.send("update-bot-status", {
    botId: botId,
    status: "inactive",
    process: data.process,
  });
  ipcRenderer.on("bot-status-updated", (event, data) => {});
  renderBots();
});
socket.on("bot-timer-update", (data) => {
  console.log("[RENDERER] bot-timer-update", data);
  console.log(data.botId);
  ipcRenderer.send("update-bot-status", {
    botId: data.botId,
    status: "active",
    process: data.process,
  });
  ipcRenderer.on("bot-status-updated", (event, data) => {});
  renderBots();
});
