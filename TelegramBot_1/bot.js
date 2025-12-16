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
  process.env.BOT1_TOKEN || "8304019929:AAHTEPw-ruyI-VPoBHD1X_EivcwQ3pbCVwA"
);
const BOT_ID = `bot_${Date.now()}_1`;
const BOT_NAME = process.env.BOT1_NAME || "Bot1";

// ============ SOCKET.IO EVENTS ============

socket.on("connect", () => {
  console.log(`✓ [${BOT_NAME}] Подключился к серверу`);

  // Регистрируемся на сервере
  bot.telegram.getMe().then((me) => {
    socket.emit("bot-register", {
      botId: BOT_ID,
      botName: BOT_NAME,
      username: me.username,
      token: me.id,
    });
  });
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
