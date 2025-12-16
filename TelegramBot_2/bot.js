const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const io = require("socket.io-client");
require("dotenv").config();

const socket = io(process.env.SERVER_URL || "http://localhost:3000");
const bot = new Telegraf(
  process.env.BOT2_TOKEN || "7732838496:AAGzUFsz12nrTMCS_kA5SdtW1N1oarF194g"
);
const BOT_ID = `bot_${Date.now()}_2`;
const BOT_NAME = process.env.BOT2_NAME || "Bot2";

socket.on("connect", () => {
  console.log(`✓ [${BOT_NAME}] Подключился к серверу`);

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

bot.use(async (ctx, next) => {
  const message = ctx.message?.text || `[${ctx.updateType}]`;
  console.log(`[${BOT_NAME}] ${ctx.from.username || ctx.from.id}: ${message}`);

  socket.emit("bot-update", {
    botId: BOT_ID,
    botName: BOT_NAME,
    username: ctx.from.username || `User${ctx.from.id}`,
    message: message,
    userId: ctx.from.id,
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
