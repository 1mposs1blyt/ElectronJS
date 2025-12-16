const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
} = require("electron/main");
const { event } = require("jquery");
const path = require("node:path");
const { db, dbPath } = require("./src/js/databases");
let tray = null;
let win;
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
    db.all("SELECT * FROM bots", [], (err, rows) => {
      if (err) {
        console.log(err);
        event.reply("bots-loaded", { error: err.message });
        return;
      }
      event.reply("bots-loaded", rows);
      console.log("Data from table bots:");
      console.log(rows);
    });
    console.log("bot loading");
  });
  ipcMain.on("add-bot-list", (event, data, err) => {
    console.log(data);
    // Сделать добавление бота в БД с привязкой к пользователю
    console.log("!!!FINE!!!");
    if (err) {
      event.reply("bot-added", { error: err.message });
    } else {
      event.reply("bot-added", "success");
    }
  });
  // win.webContents.openDevTools();
};
app.whenReady().then(() => {
  // db = require("./src/js/databases");
  createWindow();
  win.loadFile(path.join(__dirname, "index.html"));
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
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
