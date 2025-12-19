const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const { app } = require("electron");

const appDataPath = path.join(app.getPath("userData"), "data");
const dbPath = path.join(appDataPath, "databases.db");

const os = require("os");
const os_username = os.userInfo().username;

async function initializeDataDirectory() {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
    console.log("Data directory created:", appDataPath);
  }
}

async function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        server_ip TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT,
        name TEXT,
        username TEXT,
        status TEXT DEFAULT 'inactive',
        avatar TEXT,
        -- SSH данные
        ssh_host TEXT,
        ssh_port INTEGER DEFAULT 22,
        ssh_username TEXT,
        ssh_password TEXT,
        ssh_private_key TEXT,
        bot_file_name TEXT DEFAULT 'bot.js',
        -- Пути на сервере
        bot_dir TEXT,
        bot_name TEXT,
        
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.run(
      `INSERT INTO users (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE name = ?);`,
      [os_username, os_username]
    );
    console.log("Database initialized");
  });
}

app.on("ready", async () => {
  initializeDataDirectory().then(() => {
    initializeDatabase().then(() => {});
  });
});

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to database:", dbPath);
  }
});

module.exports = { db, dbPath };
