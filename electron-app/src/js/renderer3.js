// const { ipcRenderer } = require("electron");
// const $ = require("jquery");
// const path = require("node:path");
// const fs = require("fs");
// const { io } = require("socket.io-client");

async function getDataFromDB(user_param) {
  const data = await window.ipc.invoke("get-user-data");
  if (!data || data.error || data.length === 0) {
    console.log(data.error);
    return;
  }
  if (user_param) {
    return data[user_param];
  } else {
    return data;
  }
}
async function setNewServerIP(server_ip) {
  window.ipc.send("update-server-ip", server_ip);
  window.ipc.once("update-server-ip-err", (err) => {
    const toast = document.getElementById("toast-notification");
    toast.textContent = `Ошибка: ${err}`;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
    // alert(err);
  });
  window.ipc.once("update-server-ip-success", () => {
    // alert("Успешно!");
    const toast = document.getElementById("toast-notification");
    toast.textContent = `Успешно!`;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
    renderProfile();
  });
}
async function renderProfile() {
  $("#profile-list").empty();
  try {
    const data = await getDataFromDB();
    console.log(data);
    if (!data || data.error || data.length === 0) {
      console.log("data_lost!");
      return;
    }
    // $("#profile-list").append(``);
    $("#profile-list").append(`
        <div class="skeleton-striped w-full min-w-110 min-h-32 h-32 flex items-center flex-row select-none rounded-xl mb-3 pt-3 pb-3">
          <div class="h-18 w-18 rounded-full ml-4">
            <img class="" src="./../assets/images/main-icon.png" alt="..." />
          </div>
          <div class="ml-4">
            <div class="text-primary" id="bot-name">${data.name}</div>
            <div class="text-secondary">Адрес удаленного сервера:<p class="select-text text-info p-0.5">${data.server_ip ? data.server_ip : "Не установлено"}</p></div>
          </div>
        </div>
      `);
  } catch (err) {
    //
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  await renderProfile();
});
document
  .getElementById("save_server_address")
  .addEventListener("click", async () => {
    const new_server_ip = $("#server_address");
    await setNewServerIP(new_server_ip.val());
    new_server_ip.val("");
  });
