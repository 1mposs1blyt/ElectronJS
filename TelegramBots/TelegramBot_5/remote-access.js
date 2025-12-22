const io = require("socket.io-client");
require("dotenv").config({ path: "./.env" });
// ============ SOCKET.IO CLIENT ============
const socket = io(process.env.SERVER_URL || "http://localhost:3000", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
// ============ SOCKET.IO EVENTS ============
socket.on("shutdown-signal", (data) => {
  console.log(`[BOT] Received shutdown signal:`, data);
  bot.stop("Shutdown signal from server");

  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 500);
});
socket.on("start-signal", (data) => {
  console.log("🟢 Start signal received");

  if (!botRunning) {
    bot.launch();
    botRunning = true;
    console.log("✓ Bot started");
  }
});
socket.on("disconnect", (BOT_NAME) => {
  console.log(`✗ [${BOT_NAME}] Отключился от сервера`);
});
socket.on("error", (error) => {
  console.error(`✗ [${BOT_NAME}] Ошибка Socket.IO:`, error);
});
socket.on("is-alive", (err) => {
  console.log("[BOT] is-alive=true");
  const botId = process.env.BOT_TOKEN.split(":")[0];
  console.log(botId);
  socket.emit("bot-alive", botId);
});
// ============ IsAlive function ============
async function isAlive(bot, BOT_NAME) {
  console.log("[isAlive] send!");
  bot.telegram.getMe().then((me) => {
    socket.emit("bot-timer-update", {
      botId: me.id,
      botName: BOT_NAME,
      process: process.pid,
    });
  });
}
// ==================================================
function useSockets(ctx, bot, BOT_NAME, message) {
  bot.telegram.getMe().then((me) => {
    socket.emit("bot-update", {
      botId: me.id,
      botName: BOT_NAME,
      username: ctx.from.username || `User${ctx.from.id}`,
      message: message,
      userId: ctx.from.id,
    });
  });
}
// ==================================================
function socket_disconnect(BOT_NAME) {
  socket.disconnect(BOT_NAME);
}
// ==================================================
function socket_error(err, BOT_NAME) {
  socket.emit("error", {
    botName: BOT_NAME,
    error: err.message,
  });
}
// ==================================================
function ConnectSocket(botTelegram, BOT_NAME, BOT_ID) {
  botTelegram.getMe().then((me) => {
    BOT_ID = `bot_${me.id}`;
    socket.emit("bot-register", {
      botId: BOT_ID,
      botName: BOT_NAME,
      username: me.username,
    });
  });
}
// ==================================================

module.exports = {
  isAlive,
  ConnectSocket,
  useSockets,
  socket_disconnect,
  socket_error,
  socket,
};
