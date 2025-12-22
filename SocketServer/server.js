// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { startBot, stopBot } = require("./ssh-bot-control");
require("dotenv").config({ path: "./.env" });
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

// ============ ХРАНИЛИЩЕ БОТОВ ============

const botSessions = new Map();
const connectedClients = new Map();

// Отслеживаем удалённых ботов по имени бота, а не глобально
const remoteBots = new Map(); // Map<botName, { isRunning, config, etc }>

// ============ SOCKET.IO EVENTS ============

io.on("connection", (socket) => {
  console.log("[SERVER] client connected", socket.id);

  socket.on("bot-alive", async (botId) => {
    let botIds = [];
    if (!botIds.includes(botId)) {
      botIds.push(botId); // Добавится
    }
    console.log(botIds);

    io.emit("bot-alive-id", botIds);
  });
  // ========== УПРАВЛЕНИЕ УДАЛЁННЫМ БОТОМ ==========
  socket.on("check-all-bots", async (data, callback) => {
    console.log("[SERVER] check-all-bots");
    socket.broadcast.emit("is-alive");
  });

  socket.on("remote-bot:start", async (data, callback) => {
    console.log("[SERVER] remote-bot:start requested", data);

    // Проверяем, что пришли все необходимые данные
    if (
      !data.botDir ||
      !data.botName ||
      !data.sshConfig ||
      !data.sshConfig.host ||
      !data.sshConfig.username ||
      !data.sshConfig.bot_file_name
    ) {
      callback({
        success: false,
        error: "Недостаточно данных: требуются botDir, botName, sshConfig",
      });
      return;
    }

    // Проверяем, запущен ли уже ЭТОт бот
    const remoteBot = remoteBots.get(data.botName);
    if (remoteBot && remoteBot.isRunning) {
      callback({
        success: false,
        error: `Бот "${data.botName}" уже запущен`,
      });
      return;
    }

    try {
      const res = await startBot(data.botDir, data.botName, data.sshConfig);

      // Сохраняем состояние этого бота
      remoteBots.set(data.botName, {
        isRunning: true,
        config: data.sshConfig,
        botDir: data.botDir,
        lastStatus: {
          action: "start",
          stdout: res.stdout,
          timestamp: new Date(),
        },
        lastError: null,
      });

      io.emit("remote-bot:status-updated", {
        botName: data.botName,
        isRunning: true,
        message: `Бот "${data.botName}" запущен`,
        stdout: res.stdout,
        timestamp: new Date(),
      });

      callback({
        success: true,
        message: `Бот "${data.botName}" успешно запущен`,
        stdout: res.stdout,
      });

      console.log(`[SSH] Бот "${data.botName}" запущен успешно`);
    } catch (e) {
      callback({
        success: false,
        error: e.message,
      });

      io.emit("remote-bot:error", {
        botName: data.botName,
        action: "start",
        error: e.message,
        timestamp: new Date(),
      });

      console.error(`[SSH] Ошибка запуска бота "${data.botName}":`, e.message);
    }
  });

  socket.on("remote-bot:stop", async (data, callback) => {
    console.log("[SERVER] remote-bot:stop requested", data);

    // Проверяем, запущен ли этот бот
    const remoteBot = remoteBots.get(data.botName);
    if (!remoteBot || !remoteBot.isRunning) {
      callback({
        success: false,
        error: `Бот "${data.botName}" не запущен`,
      });
      return;
    }

    // Используем сохранённый конфиг
    const sshConfig = data.sshConfig || remoteBot.config;

    if (!sshConfig) {
      callback({
        success: false,
        error: "SSH конфиг не установлен",
      });
      return;
    }

    try {
      const res = await stopBot(data.botDir, data.botName, sshConfig);

      // Обновляем состояние бота
      remoteBots.set(data.botName, {
        ...remoteBot,
        isRunning: false,
        lastStatus: {
          action: "stop",
          stdout: res.stdout,
          timestamp: new Date(),
        },
        lastError: null,
      });

      io.emit("remote-bot:status-updated", {
        botName: data.botName,
        isRunning: false,
        message: `Бот "${data.botName}" остановлен`,
        stdout: res.stdout,
        timestamp: new Date(),
      });

      callback({
        success: true,
        message: `Бот "${data.botName}" успешно остановлен`,
        stdout: res.stdout,
      });

      console.log(`[SSH] Бот "${data.botName}" остановлен успешно`);
    } catch (e) {
      callback({
        success: false,
        error: e.message,
      });

      io.emit("remote-bot:error", {
        botName: data.botName,
        action: "stop",
        error: e.message,
        timestamp: new Date(),
      });

      console.error(
        `[SSH] Ошибка остановки бота "${data.botName}":`,
        e.message
      );
    }
  });

  socket.on("remote-bot:status", (data, callback) => {
    const remoteBot = remoteBots.get(data.botName);

    callback({
      botName: data.botName,
      isRunning: remoteBot?.isRunning || false,
      lastStatus: remoteBot?.lastStatus,
      lastError: remoteBot?.lastError,
    });
  });

  // ========== УПРАВЛЕНИЕ ЛОКАЛЬНЫМИ БОТАМИ ==========

  socket.on("stop-bot", async (data, callback) => {
    console.log("[SERVER] stop-bot requested for:", data.botId);

    const bot = botSessions.get(data.botId);

    if (!bot) {
      console.error("Bot not found:", data.botId);
      console.log("Available bots:", Array.from(botSessions.keys()));
      callback({ success: false, error: "Bot not found" });
      return;
    }

    io.to(bot.socketId).emit("shutdown-signal", {
      botId: data.botId,
      reason: "Stop requested from UI",
    });

    callback({ success: true, message: "Bot is stopping..." });
  });

  socket.on("start-bot", async (data, callback) => {
    console.log("Start bot:", data.botId);

    if (botSessions.has(data.botId)) {
      callback({ success: false, error: "Bot already running" });
      return;
    }

    socket.emit("start-signal", { botId: data.botId });

    callback({ success: true });
  });

  socket.on("bot-timer-update", (data) => {
    console.log("[SERVER] bot-timer-update", data);
    io.emit("bot-timer-update", data);
  });

  socket.on("bot-register", (data) => {
    console.log("[SERVER] bot-register", data);
    botSessions.set(data.botId, {
      botId: data.botId,
      botName: data.botName,
      username: data.username,
      socketId: socket.id,
      status: "online",
      startTime: new Date(),
    });

    io.emit("bot-connected", {
      botId: data.botId,
      botName: data.botName,
      username: data.username,
      status: "online",
      totalBots: botSessions.size,
    });

    console.log(`[Bot] Бот зарегистрирован: @${data.username}`);
  });

  socket.on("bot-update", (data) => {
    console.log("[SERVER] bot-update", data);
    io.emit("bot-update", data);
  });

  socket.on("bot-disconnected", (data) => {
    console.log("[SERVER] bot-disconnected", data);
    io.emit("bot-disconnected", data);
  });

  socket.on("register", (data) => {
    connectedClients.set(socket.id, {
      clientId: data.clientId,
      name: data.name,
      process: data.process,
    });

    io.emit("client-connected", {
      socketId: socket.id,
      clientId: data.clientId,
      name: data.name,
      totalClients: connectedClients.size,
    });

    console.log(`[Socket] Клиент зарегистрирован: ${data.name}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Клиент отключился: ${socket.id}`);

    let disconnectedBot = null;

    for (const [botId, bot] of botSessions) {
      if (bot.socketId === socket.id) {
        disconnectedBot = bot;
        botSessions.delete(botId);
        break;
      }
    }

    if (disconnectedBot) {
      console.log(`[Bot] Бот отключился: @${disconnectedBot.username}`);

      io.emit("bot-disconnected", {
        botId: disconnectedBot.botId,
        botName: disconnectedBot.botName,
        username: disconnectedBot.username,
        timestamp: new Date(),
      });
    }

    const client = connectedClients.get(socket.id);
    if (client) {
      connectedClients.delete(socket.id);
      console.log(`[Client] Клиент отключился: ${client.name}`);

      io.emit("client-disconnected", {
        clientId: client.clientId,
        name: client.name,
        totalClients: connectedClients.size,
      });
    }
  });

  socket.on("error", (data) => {
    console.error(`[Error] ${data.botName}: ${data.error}`);
    io.emit("bot-error", {
      botName: data.botName,
      error: data.error,
      timestamp: new Date(),
    });
  });
});

// ============ REST API ============

app.get("/api/status", (req, res) => {
  res.json({
    server: "online",
    remoteBots: Array.from(remoteBots.entries()).map(([name, bot]) => ({
      botName: name,
      isRunning: bot.isRunning,
      lastStatus: bot.lastStatus,
      lastError: bot.lastError,
    })),
    bots: Array.from(botSessions.values()).map((bot) => ({
      botId: bot.botId,
      botName: bot.botName,
      username: bot.username,
      status: bot.status,
      uptime: Math.floor((new Date() - bot.startTime) / 1000),
    })),
    totalBots: botSessions.size,
    connectedClients: connectedClients.size,
  });
});

app.get("/api/bots", (req, res) => {
  res.json(Array.from(botSessions.values()));
});

app.get("/api/clients", (req, res) => {
  res.json(Array.from(connectedClients.values()));
});

app.get("/api/remote-bot/status", (req, res) => {
  const allBots = Array.from(remoteBots.entries()).map(([name, bot]) => ({
    botName: name,
    isRunning: bot.isRunning,
    lastStatus: bot.lastStatus,
    lastError: bot.lastError,
  }));

  res.json(allBots);
});

// ============ ЗАПУСК ============

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✓ Сервер запущен на http://localhost:${PORT}`);
  console.log(`✓ Socket.IO слушает на http://localhost:${PORT}`);
  console.log(`✓ Dashboard: http://localhost:${PORT}`);
});
