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
let tray = null;
let win;
let socket;
const os = require("os");
const os_username = os.userInfo().username;

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;
  const windowWidth = 550; // 478; //950;
  const windowHeight = 650;
  const x_pos = screenWidth - windowWidth;
  const y_pos = screenHeight - windowHeight;
  win = new BrowserWindow({
    frame: 0,
    width: windowWidth,
    height: windowHeight,
    minWidth: windowWidth,
    minHeight: windowHeight,
    resizable: false,
    x: x_pos,
    y: y_pos,
    alwaysOnTop: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "/src/js/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox: true, // ← Рекомендуется добавить
    },
  });
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src * data: blob:; " +
            "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
            "connect-src * data: blob:; " +
            "img-src * data: blob:; " +
            "style-src * 'unsafe-inline' data: blob:; " +
            "font-src * data: blob:;",
        ],
      },
    });
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
  // ========================================================= //
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
      win.resizable = true;
      win.unmaximize(); // Развернуть из полноэкранного
      win.resizable = false;
    } else {
      hideTray();
      win.resizable = true;
      win.maximize(); // Развернуть на весь экран
      win.resizable = false;
    }
  });
  // ========================================================= //
  ipcMain.on("open-home-page", () => {
    win.loadFile(path.join(__dirname, "/pages/index.html"));
  });
  // ========================================================= //
  ipcMain.on("open-settings-window", () => {
    win.loadFile(path.join(__dirname, "/pages/settings.html"));
  });
  // ========================================================= //
  ipcMain.on("open-profile-window", () => {
    win.loadFile(path.join(__dirname, "/pages/profile.html"));
  });
  ipcMain.on("open-bot-settings-window", (event, data) => {
    win.loadFile(path.join(__dirname, "/pages/bot-settings.html"));
  });
  // ========================================================= //
  ipcMain.on("load-all-bots", (event) => {
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
          event.reply("bot-added", {
            result: `Ошибка добавления: ${response.status}, перепроверьте токен!`,
          });
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
                event.reply("bot-added", {
                  result: "Ошибка добавлния бота в базу данных",
                });
              } else {
                event.reply("bot-added", { result: "Бот добавлен успешно!" });
              }
            }
          );
          console.log("Bot Information:", data.result);
        } else {
          event.reply("bot-added", {
            result: "Ошибка Telegram API",
          });
          console.error("Telegram API Error:", data.description);
        }
      })
      .catch((error) => {
        console.error("Error fetching bot information:", error.message);
      });
  });
  ipcMain.on("update-bot", (event, data) => {
    const bot_username = data.bot_username;
    let new_ssh_host, new_ssh_port, new_ssh_username, new_ssh_password,new_ssh_private_key,new_ssh_bot_dir,new_ssh_bot_name,new_ssh_bot_file_name; // prettier-ignore
    db.get(
      "SELECT * FROM bots WHERE username = ?",
      [bot_username],
      (err, rows) => {
        if (err) {
          console.log(err);
          event.reply("bots-loaded", { error: err.message });
          return;
        }
        {!data.new_ssh_host.length == 0 || !data.new_ssh_host == undefined ? new_ssh_host = data.new_ssh_host : new_ssh_host=rows.ssh_host} // prettier-ignore
        {!data.new_ssh_port.length == 0 || !data.new_ssh_port == undefined ? new_ssh_port = data.new_ssh_port : new_ssh_port=rows.ssh_port} // prettier-ignore
        {!data.new_ssh_username.length == 0 || !data.new_ssh_username == undefined ? new_ssh_username = data.new_ssh_username : new_ssh_username=rows.ssh_username} // prettier-ignore
        {!data.new_ssh_password.length == 0 || !data.new_ssh_password == undefined ? new_ssh_password = data.new_ssh_password : new_ssh_password=rows.ssh_password} // prettier-ignore
        {!data.new_ssh_private_key.length == 0 || !data.new_ssh_private_key == undefined ? new_ssh_private_key = data.new_ssh_private_key : new_ssh_private_key=rows.ssh_private_key} // prettier-ignore
        {!data.new_ssh_bot_dir.length == 0 || !data.new_ssh_bot_dir == undefined ? new_ssh_bot_dir = data.new_ssh_bot_dir : new_ssh_bot_dir=rows.bot_dir} // prettier-ignore
        {!data.new_ssh_bot_name.length == 0 || !data.new_ssh_bot_name == undefined ? new_ssh_bot_name = data.new_ssh_bot_name : new_ssh_bot_name=rows.bot_name} // prettier-ignore
        {!data.new_ssh_bot_file_name.length == 0 || !data.new_ssh_bot_file_name == undefined ? new_ssh_bot_file_name = data.new_ssh_bot_file_name : new_ssh_bot_file_name=rows.bot_file_name} // prettier-ignore
        const new_data = { new_ssh_host, new_ssh_port, new_ssh_username, new_ssh_password, new_ssh_private_key, new_ssh_bot_dir, new_ssh_bot_name, new_ssh_bot_file_name}; // prettier-ignore
        console.log(new_data);

        db.run(
          `UPDATE bots SET ssh_host = ?, ssh_port = ?, ssh_username = ?, ssh_password = ?, ssh_private_key = ?, bot_dir = ?, bot_name = ?, bot_file_name = ? WHERE username = ?`, // prettier-ignore
          [new_ssh_host, new_ssh_port, new_ssh_username, new_ssh_password,new_ssh_private_key,new_ssh_bot_dir,new_ssh_bot_name,new_ssh_bot_file_name,bot_username], // prettier-ignore
          (err) => {
            if (err) {
              console.log(err);
              event.reply("bot-updated", {
                result: "Ошибка обновления!",
              });
            } else {
              event.reply("bot-updated", {
                result: "Бот обновлен успешно!",
              });
            }
          }
        );

        // console.log("Data from table bots&rendere4.js:");
        // console.log(new_data);
      }
    );
  });
  ipcMain.on("delete-bot", (event, data) => {
    const bot_username = data.bot_username;
    db.get(
      "SELECT * FROM bots WHERE username = ?",
      [bot_username],
      (err, rows) => {
        if (!rows || !rows.username || rows == undefined) {
          event.reply("bot-deleted", {
            result: `Ошибка удаления бота: ${bot_username}!`,
          });
        } else {
          db.run(`DELETE FROM bots WHERE username = ?`, [bot_username], () => {
            event.reply("bot-deleted", {
              result: `Бот ${bot_username} удален успешно!`,
            });
          });
        }
      }
    );
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
  ipcMain.on("get-bot-ssh-config", (event, botId) => {
    try {
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
            bot_file_name: bot.bot_file_name,
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
  ipcMain.on("update-server-ip", (event, server_ip) => {
    db.run(`UPDATE users SET server_ip = ?`, [server_ip], (err) => {
      if (err) {
        event.reply("update-server-ip-err", err);
      } else {
        event.reply("update-server-ip-success");
      }
    });
  });
  ipcMain.handle("get-user-data", (event) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE name = ?",
        [os_username],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  });
  ipcMain.handle("load-all-bots", (event) => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM bots", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
  ipcMain.on("sync-bot-status", (event, { bots }) => {
    db.serialize(() => {
      // Обновляем статус каждого бота в БД
      bots.forEach((bot) => {
        db.run(
          "UPDATE bots SET status = ? WHERE id = ?",
          [bot.isRunning ? "active" : "inactive", bot.botId],
          (err) => {
            if (err) console.error("DB update error:", err);
          }
        );
      });
    });
  });
  // win.webContents.openDevTools();
};

app.whenReady().then(() => {
  // socket = ioClient("http://89.251.97.82:31219", {
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
  db.run(`UPDATE bots SET status = ?`, ["inactive"], (err) => {
    createWindow();
    win.loadFile(path.join(__dirname, "/pages/index.html"));
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
