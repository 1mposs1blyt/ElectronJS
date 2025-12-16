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

document.addEventListener("DOMContentLoaded", async () => {
  ipcRenderer.send("load-all-bots");
  ipcRenderer.on("bots-loaded", (event, data) => {
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
});
// Указываем адрес нашего сервера, который мы запустили на порту 3000
const socket = io("http://localhost:3000");
// const socket = io();
const logs = [];
const bots = new Map();

function addLog(message, type = "update") {
  logs.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (logs.length > 100) logs.pop();

  const logsDiv = document.getElementById("logs");
  // logsDiv.innerHTML = logs
    // .map((log) => `<div class="log-entry ${type}">${log}</div>`)
    // .join("");
}

function updateBotsList() {
  // const botsDiv = document.getElementById("bots");
  if (bots.size === 0) {
    // botsDiv.innerHTML = "<p>Нет активных ботов</p>";
    return;
  }

  botsDiv.innerHTML = Array.from(bots.values())
    .map(
      (bot) =>
        `<div class="bot-item ${bot.status === "offline" ? "offline" : ""}">
          <span class="online-indicator ${
            bot.status === "offline" ? "offline" : ""
          }"></span>
          <strong>@${bot.username}</strong> (${bot.botName})
          <span class="bot-status ${
            bot.status
          }">${bot.status.toUpperCase()}</span>
          <p style="font-size: 12px; margin-top: 5px; color: #888;">Uptime: ${
            bot.uptime
          }s</p>
        </div>`
    )
    .join("");
}

socket.on("connect", () => {
  addLog("✓ Подключено к серверу", "bot");
});

socket.on("bot-connected", (data) => {
  bots.set(data.botId, {
    botId: data.botId,
    botName: data.botName,
    username: data.username,
    status: "online",
    uptime: 0,
    startTime: Date.now(),
  });
  document.getElementById("bot-count").textContent = bots.size;
  addLog(`✓ Бот подключился: @${data.username}`, "bot");
  updateBotsList();
});

socket.on("bot-disconnected", (data) => {
  bots.delete(data.botId);
  document.getElementById("bot-count").textContent = bots.size;
  addLog(`✗ Бот отключился: ${data.botName}`, "error");
  updateBotsList();
});

socket.on("telegram-update", (data) => {
  addLog(`[${data.botName}] ${data.username}: ${data.message}`, "update");
});

socket.on("client-connected", (data) => {
  document.getElementById("client-count").textContent = data.totalClients;
  addLog(`✓ Клиент подключился: ${data.name}`, "bot");
});

socket.on("client-disconnected", (data) => {
  document.getElementById("client-count").textContent = data.totalClients;
  addLog(`✗ Клиент отключился: ${data.name}`, "error");
});

socket.on("bot-error", (data) => {
  addLog(`✗ Ошибка в ${data.botName}: ${data.error}`, "error");
});

// Обновляем uptime каждую секунду
setInterval(() => {
  bots.forEach((bot) => {
    bot.uptime = Math.floor((Date.now() - bot.startTime) / 1000);
  });
  updateBotsList();
}, 1000);

addLog("Dashboard загружен", "bot");