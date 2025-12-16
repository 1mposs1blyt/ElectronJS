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
  console.log(`[Socket] Клиент подключился: ${socket.id}`);

  // Регистрация клиента
  socket.on("register", (data) => {
    connectedClients.set(socket.id, {
      clientId: data.clientId,
      name: data.name,
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
