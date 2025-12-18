const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
require("dotenv").config({ path: "./.env" });

const {
  isAlive,
  useSockets,
  socket_disconnect,
  socket_error,
  ConnectSocket,
} = require("./remote-access");
// ============ TELEGRAF BOT ============
const bot = new Telegraf(process.env.BOT_TOKEN || "null");
let BOT_ID;
const BOT_NAME = process.env.BOT_NAME || "undefined_0";
// ============ TELEGRAM BOT EVENTS ============
bot.use(async (ctx, next) => {
  const message = ctx.message?.text || `[${ctx.updateType}]`;
  console.log(`[${BOT_NAME}] ${ctx.from.username || ctx.from.id}: ${message}`);
  useSockets(ctx, bot, BOT_NAME, message);
  await next();
});
setInterval(async () => {
  await isAlive(bot, BOT_NAME);
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
  socket_error(err, BOT_NAME);
});

// ============ ЗАПУСК ============

bot.launch(() => {
  ConnectSocket(bot.telegram, BOT_NAME, BOT_ID);
});
console.log(`✓ [${BOT_NAME}] Бот запущен!`);

process.once("SIGINT", () => {
  console.log(`\n✗ [${BOT_NAME}] Остановка...`);
  socket_disconnect(BOT_NAME);
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log(`\n✗ [${BOT_NAME}] Остановка...`);
  socket_disconnect(BOT_NAME);
  bot.stop("SIGTERM");
});
