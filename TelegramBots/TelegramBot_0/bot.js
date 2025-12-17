const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const io = require("socket.io-client");
require("dotenv").config();

// ============ SOCKET.IO CLIENT ============

const socket = io(process.env.SERVER_URL || "http://localhost:3000", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// ============ TELEGRAF BOT ============

const bot = new Telegraf(
  process.env.BOT1_TOKEN || "5564104055:AAGFax6uBHyk6eZKD4dUpNlYVnckVZVhZKw"
);
let BOT_ID;
const BOT_NAME = process.env.BOT1_NAME || "Bot1";

// ============ SOCKET.IO EVENTS ============

socket.on("connect", () => {
  bot.telegram.getMe().then((me) => {
    BOT_ID = `bot_${me.id}`; // ← тот же botId всегда!

    socket.emit("bot-register", {
      botId: BOT_ID,
      botName: BOT_NAME,
      username: me.username,
    });
  });
});
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
socket.on("disconnect", () => {
  console.log(`✗ [${BOT_NAME}] Отключился от сервера`);
});

socket.on("error", (error) => {
  console.error(`✗ [${BOT_NAME}] Ошибка Socket.IO:`, error);
});

// ============ TELEGRAM BOT EVENTS ============

bot.use(async (ctx, next) => {
  const message = ctx.message?.text || `[${ctx.updateType}]`;
  console.log(`[${BOT_NAME}] ${ctx.from.username || ctx.from.id}: ${message}`);

  // Отправляем обновление на сервер
  bot.telegram.getMe().then((me) => {
    socket.emit("bot-update", {
      botId: me.id,
      botName: BOT_NAME,
      username: ctx.from.username || `User${ctx.from.id}`,
      message: message,
      userId: ctx.from.id,
    });
  });
  await next();
});

async function isAlive(ctx) {
  bot.telegram.getMe().then((me) => {
    socket.emit("bot-timer-update", {
      botId: me.id,
      botName: BOT_NAME,
      process: process.pid,
    });
  });
}
setInterval(async () => {
  await isAlive();
}, 20000);

bot.command("start", (ctx) => {
  ctx.reply(`Привет! Я ${BOT_NAME} 🤖`);
});

bot.command("help", (ctx) => {
  ctx.reply(`Команды:\n/start - Привет\n/help - Справка`);
});

bot.on(message("text"), (ctx) => {
  ctx.reply("Спасибо за сообщение! 😊");
});

bot.catch((err) => {
  console.error(`✗ [${BOT_NAME}] Ошибка:`, err);
  socket.emit("error", {
    botName: BOT_NAME,
    error: err.message,
  });
});

// ============ ЗАПУСК ============

bot.launch();
console.log(`✓ [${BOT_NAME}] Бот запущен!`);

process.once("SIGINT", () => {
  console.log(`\n✗ [${BOT_NAME}] Остановка...`);
  socket.disconnect();
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log(`\n✗ [${BOT_NAME}] Остановка...`);
  socket.disconnect();
  bot.stop("SIGTERM");
});
