const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

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

// ============ SOCKET.IO EVENTS ============
io.on("connection", (socket) => {
  console.log("[SERVER] client connected", socket.id);

  socket.on("stop-bot", (data, callback) => {
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
  socket.on("start-bot", (data, callback) => {
    console.log("Start bot:", data.botId);

    // Если уже работает
    if (botSessions.has(data.botId)) {
      callback({ success: false, error: "Bot already running" });
      return;
    }

    // Отправляем сигнал боту на запуск
    socket.emit("start-signal", { botId: data.botId });

    callback({ success: true });
  });
  socket.on("bot-timer-update", (data) => {
    console.log("[SERVER] bot-timer-update", data);
    io.emit("bot-timer-update", data);
  });

  socket.on("bot-register", (data) => {
    console.log("[SERVER] bot-register", data);
    io.emit("bot-register", data);
  });

  socket.on("bot-update", (data) => {
    console.log("[SERVER] bot-update", data);
    io.emit("bot-update", data);
  });

  socket.on("bot-disconnected", (data) => {
    console.log("[SERVER] bot-disconnected", data);
    io.emit("bot-disconnected", data);
  });
  socket.on("disconnect", () => {
    console.log(`[Socket] Клиент отключился: ${socket.id}`);

    // Ищем, какой бот отключился
    let disconnectedBot = null;

    for (const [botId, bot] of botSessions) {
      if (bot.socketId === socket.id) {
        disconnectedBot = bot;
        botSessions.delete(botId);
        break;
      }
    }

    // Если это был бот — уведомляем всех клиентов
    if (disconnectedBot) {
      console.log(`[Bot] Бот отключился: @${disconnectedBot.username}`);

      io.emit("bot-disconnected", {
        botId: disconnectedBot.botId,
        botName: disconnectedBot.botName,
        username: disconnectedBot.username,
        timestamp: new Date(),
      });
    }

    // Если это был обычный клиент (веб/electron)
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
});
io.on("connection", (socket) => {
  console.log(`[Socket] Клиент подключился: ${socket.id}`);
  // Регистрация клиента
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

  // Бот отправляет обновления
  socket.on("bot-update", (data) => {
    console.log(`[Bot Update] ${data.botName}: ${data.message}`);

    io.emit("telegram-update", {
      botId: data.botId,
      botName: data.botName,
      username: data.username,
      message: data.message,
      timestamp: new Date(),
    });
  });

  // Бот регистрируется
  socket.on("bot-register", (data) => {
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

  // Отключение
  socket.on("disconnect", () => {
    const client = connectedClients.get(socket.id);
    const bot = Array.from(botSessions.values()).find(
      (b) => b.socketId === socket.id
    );

    if (bot) {
      botSessions.delete(bot.botId);
      io.emit("bot-disconnected", {
        botId: bot.botId,
        botName: bot.botName,
        totalBots: botSessions.size,
      });
      console.log(`[Bot] Бот отключился: @${bot.username}`);
    }

    if (client) {
      connectedClients.delete(socket.id);
      io.emit("client-disconnected", {
        clientId: client.clientId,
        name: client.name,
        totalClients: connectedClients.size,
      });
      console.log(`[Socket] Клиент отключился: ${client.name}`);
    }
  });

  // Ошибка
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

// ============ ЗАПУСК ============

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✓ Сервер запущен на http://localhost:${PORT}`);
  console.log(`✓ Socket.IO слушает на http://localhost:${PORT}`);
  console.log(`✓ Dashboard: http://localhost:${PORT}`);
});
