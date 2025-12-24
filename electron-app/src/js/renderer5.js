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
        ${data[i].bot_name}
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
async function getDataFromDB(user_param) {
  const data = await window.ipc.invoke("get-user-data");
  return data[user_param];
}
async function getServerIP() {
  return await getDataFromDB("server_ip");
}
async function appendLog(data) {
  let date;

  {
    data.timestamp ? (date = new Date(data.timestamp)) : null;
  }
  $("#bots-log-list")
    .append(
      `<li class="flex items-center gap-2 px-4 py-2.5">
<div class="flex grow items-center justify-between gap-y-1 border-b-2 border-b-primary">
  <div>
    <h6 class="text-base">${data.botName}</h6>
    <small class="text-base-content/80 text-xs message">
    <noscript>
        ${data.message ? "Сообщение: " + data.message : "Ошибка: " + data.error}
    </noscript>
    </small>
  </div>
  <div class="flex flex-col items-center gap-x-2 gap-y-0.5">
    <span class="text-base-content/50 text-xs">
      ${date ? "Время ошибки: " + date.getHours() + ":" + date.getMinutes() : ""}
      ${data.username ? "Пользователь: " + data.username : ""}
    </span>
  </div>
</div>
</li>`
    )
    .scrollTop($("#bots-log-list")[0].scrollHeight)
    .find(".message")
    .text(
      `${data.message ? "Сообщение: " + data.message : "Ошибка: " + data.error}`
    );
}
// document.addEventListener("DOMContentLoaded", async () => {
//   await loadLogs();
// });
(async () => {
  const server_ip = await getServerIP();
  socket = io(server_ip);
  socket.on("bot-update", async (data) => {
    console.log(`[RENDERER bot-update]`, data);
    await appendLog(data);
  });
  socket.on("bot-register", async (data) => {
    console.log("[RENDERER] bot-register", data);
    await appendLog(data);
  });
  socket.on("bot-error", async (data) => {
    console.log(`[RENDERER bot-error]`, data);
    await appendLog(data);
  });
  socket.on("bot-disconnected", async (data) => {
    console.log("[RENDERER] bot-disconnected", data);
    await appendLog(data);
  });
})();
