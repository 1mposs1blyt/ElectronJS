const { ipcRenderer } = require("electron");
const $ = require("jquery");
const path = require("node:path");
const fs = require("fs");
const { io } = require("socket.io-client");

// ====== DB helpers ======
async function getDataFromDB(user_param) {
  const data = await ipcRenderer.invoke("get-user-data");
  return data[user_param];
}
async function getServerIP() {
  return await getDataFromDB("server_ip");
}
// ====== Глобальный socket (чтобы использовать в функциях ниже) ======
let socket = null;
// ====== Рендер ботов через invoke (без send/once) ======
async function renderBots() {
  try {
    const data = await ipcRenderer.invoke("load-all-bots"); // ЖДЁМ данные

    $("#bot-list").empty();

    if (!data || data.error || data.length === 0) {
      $("#bot-list").append(`
        <div class="items-center text-center justify-center flex flex-col align-center">
          <h1 class="text-primary text-center self-center">Ботов пока нет</h1>
          <p class="text-secondary">Используй кнопку настроек для добавления</p>
        </div>
      `);
      return;
    }

    for (let i = 0; i < data.length; i++) {
      $("#bot-list").append(`
          <div class="skeleton-striped w-125 h-auto min-h-fit flex items-center flex-row select-none rounded-xl mb-3">
          <div class="h-18 w-18 rounded-full ml-4">
            <img class="" src="./../images/icon2.png" alt="img got lost =(" />
            <p hidden id="${[i]}"></p>
          </div>
          <div class="ml-4">
            <div class="text-primary" id="bot-name">${data[i].name}</div>
            <div id="bot-status" class="text-secondary">
              Статус: ${data[i].status === "active" ? '<span class="text-success"id="active">Активен</span>' : '<span class="text-error" id="inactive">Неактивен</span>'}
            </div>
            <div class="text-info">
              @<span class="select-text" id="$username_${data[i].id}"
                >${data[i].username}</span
              >
            </div>
            <div
              id="show-hide-collapse-heading_${String(data[i].username)}"
              class="collapse hidden w-full overflow-hidden transition-[height] duration-300"
              aria-labelledby="show-hide-collapse_${String(data[i].username)}"
            >
              <div class="text-info">
                SSH_HOST: <span class="select-text">${data[i].ssh_host}</span>
              </div>
              <div class="text-info">
                SSH_PORT: <span class="select-text">${data[i].ssh_port}</span>
              </div>
              <div class="text-info">
                SSH_USERNAME:<span class="select-text"
                  >${data[i].ssh_username}</span
                >
              </div>
              <div class="text-info">
                SSH_PASSWORD:
                <span class="select-text">${data[i].ssh_password}</span>
              </div>
              <div class="text-info">
                SSH_PRIVATE-KEY:
                <span class="select-text">${data[i].ssh_private_key || "Не указан"}</span>
              </div>
              <div class="text-info">
                SSH_BOT-DIR: <span class="select-text">${data[i].bot_dir}</span>
              </div>
              <div class="text-info">
                SSH_BOT-NAME:
                <span class="select-text">${data[i].bot_name}</span>
              </div>
              <div class="text-info">
                SSH_BOT-FILE-NAME:
                <span class="select-text">${data[i].bot_file_name}</span>
              </div>
            </div>
              <button
                type="button"
                class="collapse-toggle link link-primary inline-flex items-center"
                id="show-hide-collapse_${String(data[i].username)}"
                aria-expanded="false"
                aria-controls="show-hide-collapse-heading_${String(data[i].username)}"
                data-collapse="#show-hide-collapse-heading_${String(data[i].username)}"
              >
                <span class="collapse-open:hidden">Показать SSH параметры</span>
                <span class="collapse-open:block hidden">Скрыть</span>
                <span
                  class="icon-[tabler--chevron-down] collapse-open:rotate-180 ms-2 size-4"
                ></span>
              </button>
          </div>
          <div class="ml-auto flex flex-col w-auto mr-2 self-start">
            <button
              class="bot-ssh btn btn-soft btn-success pt-1 mt-2"
              data-remote_bot_id="${data[i].id}"
              onclick="remote_bot_start(this, event)"
              style="font-size: 11px"
            >
              SSH: Start
            </button>
            <button
              class="bot-ssh btn btn-soft btn-error pt-1 mt-1"
              data-remote_bot_id="${data[i].id}"
              onclick="remote_bot_stop(this, event)"
              style="font-size: 11px"
            >
              SSH: Stop
            </button>
          </div>
        </div>`);
      if (window.HSCollapse && typeof HSCollapse.autoInit === "function") {
        HSCollapse.autoInit();
      }
    }
  } catch (e) {
    console.error("load-all-bots error:", e);
  }
}
// ====== кнопки окна ======
document.addEventListener("DOMContentLoaded", () => {
  renderBots();
});
// ============ REMOTE BOT FUNCTIONS ============
function remote_bot_start(el) {
  const botId = el.dataset.remote_bot_id;
  console.log("[RENDERER] Starting remote bot:", botId);
  el.disabled = true;
  el.textContent = "Запуск...";

  ipcRenderer.send("get-bot-ssh-config", botId);

  ipcRenderer.once("bot-ssh-config", (event, botData) => {
    if (!botData || !botData.ssh || !botData.botDir || !botData.botName) {
      const toast = document.getElementById("toast-notification");
      toast.textContent = `✗ Ошибка: SSH данные не настроены для этого бота`;
      toast.classList.remove("hidden");

      setTimeout(() => {
        toast.classList.add("hidden");
      }, 2000);
      // alert("✗ Ошибка: SSH данные не настроены для этого бота");
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
          const toast = document.getElementById("toast-notification");
          toast.textContent = `✓ Удалённый бот запущен`;
          toast.classList.remove("hidden");

          setTimeout(() => {
            toast.classList.add("hidden");
          }, 2000);
          // alert("✓ Удалённый бот запущен");
          ipcRenderer.send("update-bot-status", {
            botId: botId,
            status: "active",
          });
          ipcRenderer.once("bot-status-updated", () => {});
          renderBots();
        } else {
          console.error("✗ Ошибка запуска:", response.error);
          const toast = document.getElementById("toast-notification");
          toast.textContent = `✗ Ошибка: ${response.error}`;
          toast.classList.remove("hidden");

          setTimeout(() => {
            toast.classList.add("hidden");
          }, 2000);
          // alert(`✗ Ошибка: ${response.error}`);
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

  ipcRenderer.once("bot-ssh-config", (event, botData) => {
    if (!botData || !botData.ssh || !botData.botDir || !botData.botName) {
      // alert("✗ Ошибка: SSH данные не настроены для этого бота");
      const toast = document.getElementById("toast-notification");
      toast.textContent = `✗ Ошибка: SSH данные не настроены для этого бота`;
      toast.classList.remove("hidden");

      setTimeout(() => {
        toast.classList.add("hidden");
      }, 2000);
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
          // alert("✓ Удалённый бот остановлен");

          const toast = document.getElementById("toast-notification");
          toast.textContent = `✓ Удалённый бот остановлен`;
          toast.classList.remove("hidden");

          setTimeout(() => {
            toast.classList.add("hidden");
          }, 2000);

          ipcRenderer.send("update-bot-status", {
            botId: botId,
            status: "inactive",
          });
          ipcRenderer.once("bot-status-updated", () => {});
          renderBots();
        } else {
          console.error("✗ Ошибка остановки:", response.error);
          // alert(`✗ Ошибка: ${response.error}`);
          const toast = document.getElementById("toast-notification");
          toast.textContent = `✗ Ошибка: ${response.error}`;
          toast.classList.remove("hidden");

          setTimeout(() => {
            toast.classList.add("hidden");
          }, 2000);
        }
      }
    );
  });
}
// ====== Инициализация socket + обработчики ======
(async () => {
  const server_ip = await getServerIP();
  console.log("server_ip:", server_ip);

  socket = io(server_ip); // <-- ГЛОБАЛЬНАЯ переменная

  socket.on("bot-register", (data) => {
    console.log("[RENDERER] bot-register", data);
    ipcRenderer.send("update-bot-status", {
      botId: data.botId,
      status: "active",
      process: data.process,
    });
    ipcRenderer.once("bot-status-updated", () => {});
    renderBots();
  });

  socket.on("bot-disconnected", (data) => {
    console.log("[RENDERER] bot-disconnected", data);
    const botId = data.botId.split("bot_")[1];
    ipcRenderer.send("update-bot-status", {
      botId: botId,
      status: "inactive",
      process: data.process,
    });
    ipcRenderer.once("bot-status-updated", () => {});
    renderBots();
  });

  socket.on("bot-timer-update", (data) => {
    console.log("[RENDERER] bot-timer-update", data);
    ipcRenderer.send("update-bot-status", {
      botId: data.botId,
      status: "active",
      process: data.process,
    });
    ipcRenderer.once("bot-status-updated", () => {});
    renderBots();
  });
})();
