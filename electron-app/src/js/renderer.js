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

document.addEventListener("DOMContentLoaded", async () => {
  renderBots();
});

// ============ REMOTE BOT FUNCTIONS ============

function remote_bot_start(el) {
  const botId = el.dataset.remote_bot_id;
  console.log("[RENDERER] Starting remote bot:", botId);
  el.disabled = true;
  el.textContent = "Запуск...";

  ipcRenderer.send("get-bot-ssh-config", botId);

  // Используй once() вместо on()
  ipcRenderer.once("bot-ssh-config", (event, botData) => {
    if (!botData || !botData.ssh || !botData.botDir || !botData.botName) {
      alert("✗ Ошибка: SSH данные не настроены для этого бота");
      el.disabled = false;
      el.textContent = "SSH: запуск";
      return;
    }

    socket.emit(
      "remote-bot:start",
      {
        botDir: botData.botDir,
        botName: botData.botName,
        sshConfig: botData.ssh,
      },
      (response) => {
        el.disabled = false;
        el.textContent = "SSH: запуск";

        if (response.success) {
          console.log("✓ Удалённый бот запущен");
          alert("✓ Удалённый бот запущен");
          ipcRenderer.send("update-bot-status", {
            botId: botId,
            status: "active",
          });
          ipcRenderer.once("bot-status-updated", (event, data) => {});
          renderBots();
        } else {
          console.error("✗ Ошибка запуска:", response.error);
          alert(`✗ Ошибка: ${response.error}`);
        }
      }
    );
  });
}

function remote_bot_stop(el) {
  const botId = el.dataset.remote_bot_id;
  console.log("[RENDERER] Stopping remote bot:", botId);
  el.disabled = true;
  el.textContent = "Стоп...";

  ipcRenderer.send("get-bot-ssh-config", botId);

  // Используй once() вместо on()
  ipcRenderer.once("bot-ssh-config", (event, botData) => {
    if (!botData || !botData.ssh || !botData.botDir || !botData.botName) {
      alert("✗ Ошибка: SSH данные не настроены для этого бота");
      el.disabled = false;
      el.textContent = "SSH: стоп";
      return;
    }

    socket.emit(
      "remote-bot:stop",
      {
        botDir: botData.botDir,
        botName: botData.botName,
        sshConfig: botData.ssh,
      },
      (response) => {
        el.disabled = false;
        el.textContent = "SSH: стоп";

        if (response.success) {
          console.log("✓ Удалённый бот остановлен");
          alert("✓ Удалённый бот остановлен");
          ipcRenderer.send("update-bot-status", {
            botId: botId,
            status: "inactive",
          });
          ipcRenderer.once("bot-status-updated", (event, data) => {});
          renderBots();
        } else {
          console.error("✗ Ошибка остановки:", response.error);
          alert(`✗ Ошибка: ${response.error}`);
        }
      }
    );
  });
}
function bot_start(el, e) {
  const botId = el.dataset.bot_id;
  ipcRenderer.send("get-bot-path", botId.split("bot_")[1]);
  ipcRenderer.once("send-bot-path", (event, data) => {
    console.log(data.avatar);
  });
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
  ipcRenderer.once("bots-loaded", (event, data) => {
    $("#bot-list").empty();
    if (data.error || data.length == 0) {
      $("#bot-list").append(
        `<div class="items-center text-center justify-center flex flex-col align-center">
        <h1 class="text-primary text-center self-center text-center">Ботов пока нет</h1>
        <p class="text-secondary">Используй кнопку настроек для добавления</p>
        </div>`
      );
    } else {
      for (let i = 0; i < data.length; i++) {
        const hasSSH = data[i].ssh_host && data[i].bot_dir && data[i].bot_name;

        $("#bot-list").append(`
          <div class="skeleton-striped w-full min-h-24 h-24 flex items-center flex-row select-none rounded-xl mb-3">
            <div class="h-18 w-18 rounded-full ml-4">
              <img class="" src="./images/icon2.png" alt="${data[i].avatar}" />
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
            <div class="ml-auto flex flex-col w-auto mr-2">
              ${
                hasSSH
                  ? `
                <button
                  class="bot-ssh btn btn-soft btn-success pt-1 mt-2"
                  data-remote_bot_id="${data[i].id}"
                  onclick="remote_bot_start(this,event)"
                  style="font-size: 11px;"
                >
                  SSH: Start
                </button>
                <button
                  class="bot-ssh btn btn-soft btn-error pt-1 mt-1"
                  data-remote_bot_id="${data[i].id}"
                  onclick="remote_bot_stop(this,event)"
                  style="font-size: 11px;"
                >
                  SSH: Stop
                </button>
              `
                  : `
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
              </button>`
              }
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
  ipcRenderer.send("update-bot-status", {
    botId: data.botId,
    status: "active",
    process: data.process,
  });
  ipcRenderer.once("bot-status-updated", (event, data) => {});
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
  ipcRenderer.once("bot-status-updated", (event, data) => {});
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
  ipcRenderer.once("bot-status-updated", (event, data) => {});
  renderBots();
});
