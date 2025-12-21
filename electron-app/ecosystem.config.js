module.exports = {
  apps: [
    {
      name: "bot-server",
      script: "./SocketServer/server.js",
      cwd: "./",
    },
    {
      name: "bot-0",
      script: "./TelegramBots/TelegramBot_0/bot.js",
      cwd: "./",
    },
    {
      name: "bot-1",
      script: "./TelegramBots/TelegramBot_1/bot.js",
      cwd: "./",
    },
    {
      name: "bot-2",
      script: "./TelegramBots/TelegramBot_2/bot.js",
      cwd: "./",
    },
    {
      name: "bot-3",
      script: "./TelegramBots/TelegramBot_3/bot.js",
      cwd: "./",
    },
    {
      name: "bot-4",
      script: "./TelegramBots/TelegramBot_4/bot.js",
      cwd: "./",
    },
    {
      name: "bot-5",
      script: "./TelegramBots/TelegramBot_5/bot.js",
      cwd: "./",
    },
  ],
};
// npm install -g pm2
// pm2 start ecosystem.config.js
// pm2 monit  # смотреть логи