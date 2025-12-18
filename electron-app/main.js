const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
} = require("electron/main");
const path = require("node:path");
const { db, dbPath } = require("./src/js/databases");
const { io: ioClient } = require("socket.io-client");
const { event } = require("jquery");

// ======================== Запуск socket.io сервера ======================== //
// const { spawn } = require("child_process");
// const scriptPath = path.join(__dirname, "/SocketServer/server.js");
// const child = spawn(process.execPath, [scriptPath], {
//   detached: true, // Allows the child to run independently of the parent
//   stdio: "ignore", // Detaches stdio streams
// });
// child.unref();
// Для запуска бота из приложения можно сделать дополнительное поле в котором будет содержаться путь к боту
// и по аналогии с кодом выше будет запускаться бот
// ======================== Запуск socket.io сервера ======================== //
let tray = null;
let win;
let socket;

// let db;

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;
  const windowWidth = 400; //950;
  const windowHeight = 600;
  const x_pos = screenWidth - windowWidth;
  const y_pos = screenHeight - windowHeight;
  win = new BrowserWindow({
    frame: 0,
    width: windowWidth,
    height: windowHeight,
    x: x_pos,
    y: y_pos,
    alwaysOnTop: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "/src/js/preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
      // sandbox: true, // ← Рекомендуется добавить
    },
  });
  function hideTray() {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  }
  function showTray() {
    if (!tray) {
      const iconPath = path.join(__dirname, "/images/icon2.png");
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Открыть",
          click: () => {
            win.show();
            hideTray();
          },
        },
        {
          label: "Выйти",
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ]);
      tray.setToolTip("Bot manager works");
      tray.setContextMenu(contextMenu);
      tray.on("double-click", () => {
        win.show();
        hideTray();
      });
    }
  }
  ipcMain.on("close-app", (e) => {
    // win.close(); // Закрыть текущее окно
    if (!app.isQuitting) {
      e.preventDefault();
      showTray();
      win.hide();
    }
    return false;
  });
  ipcMain.on("minimize-app", () => {
    // win.minimize(); // Свернуть
    win.hide();
    showTray();
  });
  ipcMain.on("maximize-app", () => {
    if (win.isMaximized()) {
      win.unmaximize(); // Развернуть из полноэкранного
    } else {
      hideTray();
      win.maximize(); // Развернуть на весь экран
    }
  });
  ipcMain.on("open-settings-window", () => {
    win.loadFile(path.join(__dirname, "settings.html"));
    // смена странички
  });
  ipcMain.on("close-settings-window", () => {
    win.loadFile(path.join(__dirname, "index.html"));
    // смена странички
  });
  ipcMain.on("load-all-bots", (event) => {
    db.run(`
      INSERT INTO users (name)
      SELECT 'alexandr'
      WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE name = 'alexandr'
      );
      `);

    db.all("SELECT * FROM bots", [], (err, rows) => {
      if (err) {
        ``;
        console.log(err);
        event.reply("bots-loaded", { error: err.message });
        return;
      }
      event.reply("bots-loaded", rows);
      console.log("Data from table bots:");
      // console.log(rows);
    });
    console.log("bot loading");
  });
  ipcMain.on("add-bot-list", (event, data, err) => {
    console.log(data.bot_token + "\n" + data.bot_folder);
    const token = data.bot_token;
    const folder = data.bot_folder;
    const bot_ssh_host = data.bot_ssh_host;
    const bot_ssh_port = data.bot_ssh_port || 22;
    const bot_ssh_username = data.bot_ssh_username;
    const bot_ssh_password = data.bot_ssh_password;
    const bot_ssh_privateKey = data.bot_ssh_privateKey || null;
    const bot_ssh_bot_dir = data.bot_ssh_bot_dir;
    const bot_ssh_bot_name = data.bot_ssh_bot_name || "bot";
    const bot_ssh_bot_file = data.bot_ssh_bot_file || "bot";
    const apiUrl = `https://api.telegram.org/bot${token}/getMe`;
    let botinfo = [];
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          // A non-ok response status (e.g., 401 Unauthorized for invalid token)
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.ok) {
          db.run(
            `INSERT INTO bots (token,user_id,name,username,id,
            ssh_host,ssh_port,ssh_username,ssh_password,ssh_private_key,bot_dir,bot_name,bot_file_name
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              token,
              1,
              data.result.first_name,
              data.result.username,
              data.result.id,
              bot_ssh_host,
              bot_ssh_port,
              bot_ssh_username,
              bot_ssh_password,
              bot_ssh_privateKey,
              bot_ssh_bot_dir,
              bot_ssh_bot_name,
              bot_ssh_bot_file,
            ],
            (err) => {
              console.log("!!!FINE!!!");
              if (err) {
                event.reply("bot-added", { error: err.message });
              } else {
                event.reply("bot-added", token);
              }
            }
          );
          console.log("Bot Information:", data.result);
        } else {
          console.error("Telegram API Error:", data.description);
        }
      })
      .catch((error) => {
        console.error("Error fetching bot information:", error.message);
      });
  });
  ipcMain.handle("get-server-status", async () => {
    return new Promise((resolve) => {
      socket.emit("get-status");
      socket.once("server-status", (data) => resolve(data));
    });
  });
  ipcMain.on("update-bot-status", (event, data, err) => {
    console.log(data);
    db.run(
      `UPDATE bots SET status = ? WHERE id = ?`,
      [data.status, data.botId],
      (err) => {
        // console.log("!!!FINE!!!");
        if (err) {
          event.reply("bot-status-updated", { error: err.message });
        } else {
          event.reply("bot-status-updated", data);
        }
      }
    );
  });
  ipcMain.on("bot-stop-process", (event, data, err) => {
    db.get("SELECT * FROM bots WHERE username = ?", [data], (err, rows) => {
      event.reply("bot-stopping-process", rows.id);
    });
  });
  ipcMain.on("get-bot-path", (event, data, err) => {
    db.get("SELECT avatar FROM bots WHERE id = ?", [data], (err, rows) => {
      console.log(rows);
      event.reply("send-bot-path", rows);
    });
  });
  ipcMain.on("get-bot-ssh-config", (event, botId) => {
    try {
      // НЕПРАВИЛЬНО (synchronous):
      // const bot = db.prepare("SELECT * FROM bots WHERE id = ?").get(botId);

      // ПРАВИЛЬНО (асинхронный callback):
      db.get("SELECT * FROM bots WHERE id = ?", [botId], (err, bot) => {
        if (err) {
          console.error("Database error:", err);
          event.reply("bot-ssh-config", null);
          return;
        }

        if (!bot) {
          console.log("Bot not found:", botId);
          event.reply("bot-ssh-config", null);
          return;
        }

        // Возвращаешь SSH данные и пути бота
        event.reply("bot-ssh-config", {
          ssh: {
            host: bot.ssh_host,
            port: bot.ssh_port || 22,
            username: bot.ssh_username,
            password: bot.ssh_password,
            privateKey: bot.ssh_private_key,
          },
          botDir: bot.bot_dir,
          botName: bot.bot_name,
        });

        console.log("[SSH Config] Loaded for bot:", botId);
      });
    } catch (e) {
      console.error("Error getting SSH config:", e);
      event.reply("bot-ssh-config", null);
    }
  });
  ipcMain.on("add-bot-list-with-ssh", (event, data) => {
    console.log("Adding bot with SSH config:", data.bot_name);

    const token = data.bot_token;
    const folder = data.bot_folder;
    const apiUrl = `https://api.telegram.org/bot${token}/getMe`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((botData) => {
        if (botData.ok) {
          db.run(
            `INSERT INTO bots (
            token, user_id, name, username, id, avatar,
            ssh_host, ssh_port, ssh_username, ssh_password, ssh_private_key,
            bot_dir, bot_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              token,
              1,
              botData.result.first_name,
              botData.result.username,
              botData.result.id,
              folder,
              // SSH данные
              data.ssh_host || "",
              data.ssh_port || 22,
              data.ssh_username || "",
              data.ssh_password || "",
              data.ssh_private_key || "",
              // Пути
              data.bot_dir || "",
              data.bot_name || botData.result.username,
            ],
            (err) => {
              if (err) {
                console.error("Insert error:", err);
                event.reply("bot-added", { error: err.message });
              } else {
                console.log("✓ Bot added successfully with SSH config");
                event.reply("bot-added", { success: true, token });
              }
            }
          );
        } else {
          console.error("Telegram API Error:", botData.description);
          event.reply("bot-added", { error: botData.description });
        }
      })
      .catch((error) => {
        console.error("Error fetching bot info:", error);
        event.reply("bot-added", { error: error.message });
      });
  });
  win.webContents.openDevTools();
};
app.whenReady().then(() => {
  // socket = ioClient("http://localhost:3000", {
  //   reconnection: true,
  //   reconnectionDelay: 1000,
  //   reconnectionDelayMax: 5000,
  // });
  // socket.on("connect", () => {
  //   console.log("+ Electron connected to sockets");
  //   socket.emit("register", {
  //     type: "electron", // ← Тип клиента
  //     clientId: "electron-app",
  //     name: "Bot Manager (Electron)",
  //   });
  // });
  // socket.on("telegram-update", (data) => {
  //   console.log(`Update from bot: ${data.botName}`);
  //   win.webContents.send("bot-update", data);
  // });
  // socket.on("command-executed", (data) => {
  //   console.log(`Comman executes: ${data.command}`);
  //   win.webContents.send("command-result", data);
  // });
  db.run(`UPDATE bots SET status = ?,socket_id = null`, ["inactive"], (err) => {
    createWindow();
    win.loadFile(path.join(__dirname, "index.html"));
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// Для macOS, если пользователь кликает по иконке в доке, окно должно открыться снова
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win.show();
  }
});
