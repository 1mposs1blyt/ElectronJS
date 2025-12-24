// const $ = require("jquery");
// const { ipcRenderer } = require("electron");
// const path = require("node:path");
// const fs = require("fs");
// const { io } = require("socket.io-client");

function BotEditSave() {
  const bot_username = $("#current-bot-edit");
  const new_ssh_host = $("#bot-new-host");
  const new_ssh_port = $("#bot-new-port");
  const new_ssh_username = $("#bot-new-username");
  const new_ssh_password = $("#bot-new-password");
  const new_ssh_privatekey = $("#bot-new-privatekey");
  const new_ssh_bot_dir = $("#bot-new-bot-dir");
  const new_ssh_bot_name = $("#bot-new-bot-name");
  const new_ssh_bot_file_name = $("#bot-new-bot-file-name");
  const data = {
    bot_username: bot_username.text().split("@")[1],
    new_ssh_host: new_ssh_host.val(),
    new_ssh_port: new_ssh_port.val(),
    new_ssh_username: new_ssh_username.val(),
    new_ssh_password: new_ssh_password.val(),
    new_ssh_private_key: new_ssh_privatekey.val(),
    new_ssh_bot_dir: new_ssh_bot_dir.val(),
    new_ssh_bot_name: new_ssh_bot_name.val(),
    new_ssh_bot_file_name: new_ssh_bot_file_name.val(),
  };
  new_ssh_host.val("");
  new_ssh_port.val("");
  new_ssh_username.val("");
  new_ssh_password.val("");
  new_ssh_privatekey.val("");
  new_ssh_bot_dir.val("");
  new_ssh_bot_name.val("");
  new_ssh_bot_file_name.val("");
  console.log(data);
  window.ipc.send("update-bot", data);
  window.ipc.once("bot-updated", (event, data) => {
    const toast = document.getElementById("toast-notification");
    toast.textContent = `${data.result}`;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
    renderBotNames();
  });
}
async function renderBotEditingList(botname) {
  try {
    const data = await window.ipc.invoke("load-all-bots"); // ЖДЁМ данные
    if (!data || data.error || data.length === 0) {
      const toast = document.getElementById("toast-notification");
      toast.textContent = `✗ Ошибка: Кажется такого бота нет`;
      toast.classList.remove("hidden");

      setTimeout(() => {
        toast.classList.add("hidden");
      }, 2000);
      return;
    }
    if (!botname || botname.length == 0) {
      const toast = document.getElementById("toast-notification");
      toast.textContent = `✗ Ошибка: Проверь ввёл ли ты значение в поле!`;
      toast.classList.remove("hidden");

      setTimeout(() => {
        toast.classList.add("hidden");
      }, 2000);
      return;
    }
    for (let i = 0; i < data.length; i++) {
      if (data[i].username == botname) {
        $("#bot-name-list").attr("hidden", true);
        $("#bot-settings-edit").attr("hidden", true);
        $("#bot-current-edit").removeAttr("hidden").empty();
        $("#bot-current-edit").append(`<div class="ml-4">
          <div class="justify-center  mb-4 min-w-96">
            <span class="text-primary">Сейчас редактируется: <span class="text-secondary select-text" id="current-bot-edit">@${data[i].username}</span></span>
            <br/>
            <span class="text-info">*Чтобы не менять поле - оставьте пустым!</span>
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-HOST: <br/>(Сейчас: ${data[i].ssh_host || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новый SSH-адрес сервера"
              class="input max-w-sm"
              id="bot-new-host"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-PORT: <br/>(Сейчас: ${data[i].ssh_port || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новый SSH-порт"
              class="input max-w-sm"
              id="bot-new-port"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-USERNAME: <br/>(Сейчас: ${data[i].ssh_username || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новое SSH-Имя пользователя windows/linux"
              class="input max-w-sm"
              id="bot-new-username"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-PASSWORD: <br/>(Сейчас: ${data[i].ssh_password || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новый SSH-Пароль удаленного пользователя"
              class="input max-w-sm"
              id="bot-new-password"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-PRIVATE-KEY: <br/>(Сейчас: ${data[i].ssh_private_key || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новый SSH-Private Key"
              class="input max-w-sm"
              id="bot-new-privatekey"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-BOT-DIR: <br/>(Сейчас: ${data[i].bot_dir || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новый SSH-Путь к боту на сервере"
              class="input max-w-sm"
              id="bot-new-bot-dir"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-BOT-NAME: <br/>(Сейчас: ${data[i].bot_name || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новое SSH-Имя бота для ProcessManager2|PM2"
              class="input max-w-sm"
              id="bot-new-bot-name"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <span class="text-primary">Новый SSH-BOT-FILE-NAME: <br/>(Сейчас: ${data[i].bot_file_name || "Не указан"})</span>
            <input
              type="text"
              placeholder="Новое SSH-Имя файла бота на сервере"
              class="input max-w-sm"
              id="bot-new-bot-file-name"
              autocomplete="off"
            />
          </div>
          <div class="justify-center mb-4 min-w-96">
            <button
              type="button"
              id="bot-edit-save"
              onclick="BotEditSave()"
              class="btn btn-soft btn-primary w-full max-w-sm"
            >
              Сохранить
            </button>
          </div>
        </div>`);
        const toast = document.getElementById("toast-notification");
        toast.textContent = `Успешно!`;
        toast.classList.remove("hidden");

        setTimeout(() => {
          toast.classList.add("hidden");
        }, 2000);
        break;
      } else {
        const toast = document.getElementById("toast-notification");
        toast.textContent = `✗ Ошибка: Проверь ввёл ли ты значение в поле!`;
        toast.classList.remove("hidden");

        setTimeout(() => {
          toast.classList.add("hidden");
        }, 2000);
      }
    }
  } catch (e) {
    const toast = document.getElementById("toast-notification");
    toast.textContent = `✗ Ошибка: Проверь ввёл ли ты значение в поле!`;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
    console.error("load-all-bots error:", e);
  }
}
async function renderBotNames() {
  $("#bot-current-edit").attr("hidden", true).empty();
  $("#bot-name-list").removeAttr("hidden");
  $("#bot-settings-edit").removeAttr("hidden");
  $("#bot-name-list").empty();
  try {
    const data = await window.ipc.invoke("load-all-bots"); // ЖДЁМ данные

    if (!data || data.error || data.length === 0) {
      $("#bot-name-list").append(`
        <div class="items-center text-center justify-center flex flex-col align-center m-3">
          <h1 class="text-primary text-center self-center">Ботов пока нет</h1>
          <p class="text-secondary">Используй кнопку настроек для добавления</p>
        </div>
      `);
      return;
    }
    $("#bot-name-list").append(
      `<h1 class="text-info mb-4 mr-2 ml-2">Введите имя бота из списка в поле ввода ниже</h1>`
    );
    $("#bot-name-list").append(
      `<ul id="bot-names" class="border-base-content/25 divide-base-content/25 w-96 divide-y rounded-md border *:p-3 *:first:rounded-t-md *:last:rounded-b-md select-text"></ul>`
    );
    for (let i = 0; i < data.length; i++) {
      $("#bot-names").append(`
      <li class="flex items-center ">
        <span class="icon-[tabler--user] text-base-content me-3 size-5"></span>
         ${data[i].username}
      </li>
       `);
      if (window.HSCollapse && typeof HSCollapse.autoInit === "function") {
        HSCollapse.autoInit();
      }
    }
  } catch (e) {
    console.error("load-all-bots error:", e);
  }
}
async function deleteBotByUsername(username) {
  if (!username || username.length == 0 || username == undefined) {
    const toast = document.getElementById("toast-notification");
    toast.textContent = `✗ Ошибка удаления бота!`;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
    return;
  }
  const data = {
    bot_username: username,
  };
  window.ipc.send("delete-bot", data);
  window.ipc.once("bot-deleted", (event, data) => {
    const toast = document.getElementById("toast-notification");
    toast.textContent = `${data.result}`;
    toast.classList.remove("hidden");
    renderBotNames();
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
  });
}
document.addEventListener("DOMContentLoaded", async () => {
  await renderBotNames();
});
document
  .getElementById("bot-edit-username-send")
  .addEventListener("click", async (e) => {
    const input = $("#bot-edit-username");
    const username = input.val();
    await renderBotEditingList(username);
    input.val("");
  });
document
  .getElementById("bot-delete-by-username-send")
  .addEventListener("click", async (e) => {
    const input = $("#bot-edit-username");
    const username = input.val();
    await deleteBotByUsername(username);
    input.val("");
  });
