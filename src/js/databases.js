const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

const appDataPath = path.join(app.getPath("userData"), "data");
const dbPath = path.join(appDataPath, "databases.db");

function initializeDataDirectory() {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
    console.log("Data directory created:", appDataPath);
  }
}

app.on("ready", () => {
  initializeDataDirectory();
  initializeDatabase();
});

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to database:", dbPath);
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )`);
    db.run(`
        CREATE TABLE IF NOT EXISTS bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT,
        name TEXT,
        username TEXT,
        status TEXT DEFAULT inactive,
        avatar TEXT,
        socket_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
    console.log("Database initialized");
  });
}

module.exports = { db, dbPath };
