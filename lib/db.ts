import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "eurovision.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initDb(db);
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contestants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT NOT NULL,
      artist TEXT NOT NULL,
      song TEXT NOT NULL,
      flag TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contestant_id INTEGER NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
      points INTEGER NOT NULL,
      UNIQUE(user_id, contestant_id),
      UNIQUE(user_id, points)
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed admin user
  const adminExists = db.prepare("SELECT id FROM users WHERE is_admin = 1").get();
  if (!adminExists) {
    db.prepare("INSERT INTO users (name, is_admin) VALUES (?, 1)").run("Admin");
  }

  // Seed app state
  const phaseExists = db.prepare("SELECT key FROM app_state WHERE key = 'phase'").get();
  if (!phaseExists) {
    db.prepare("INSERT INTO app_state (key, value) VALUES ('phase', 'waiting')").run();
  }

  // Seed contestants
  const count = db.prepare("SELECT COUNT(*) as c FROM contestants").get() as { c: number };
  if (count.c === 0) {
    const entries = [
      { country: "Albania", artist: "TBA", song: "TBA", flag: "🇦🇱" },
      { country: "Armenia", artist: "TBA", song: "TBA", flag: "🇦🇲" },
      { country: "Australia", artist: "TBA", song: "TBA", flag: "🇦🇺" },
      { country: "Austria", artist: "TBA", song: "TBA", flag: "🇦🇹" },
      { country: "Azerbaijan", artist: "TBA", song: "TBA", flag: "🇦🇿" },
      { country: "Belgium", artist: "TBA", song: "TBA", flag: "🇧🇪" },
      { country: "Croatia", artist: "TBA", song: "TBA", flag: "🇭🇷" },
      { country: "Cyprus", artist: "TBA", song: "TBA", flag: "🇨🇾" },
      { country: "Czech Republic", artist: "TBA", song: "TBA", flag: "🇨🇿" },
      { country: "Denmark", artist: "TBA", song: "TBA", flag: "🇩🇰" },
      { country: "Estonia", artist: "TBA", song: "TBA", flag: "🇪🇪" },
      { country: "Finland", artist: "TBA", song: "TBA", flag: "🇫🇮" },
      { country: "France", artist: "TBA", song: "TBA", flag: "🇫🇷" },
      { country: "Georgia", artist: "TBA", song: "TBA", flag: "🇬🇪" },
      { country: "Germany", artist: "TBA", song: "TBA", flag: "🇩🇪" },
      { country: "Greece", artist: "TBA", song: "TBA", flag: "🇬🇷" },
      { country: "Iceland", artist: "TBA", song: "TBA", flag: "🇮🇸" },
      { country: "Ireland", artist: "TBA", song: "TBA", flag: "🇮🇪" },
      { country: "Israel", artist: "TBA", song: "TBA", flag: "🇮🇱" },
      { country: "Italy", artist: "TBA", song: "TBA", flag: "🇮🇹" },
      { country: "Latvia", artist: "TBA", song: "TBA", flag: "🇱🇻" },
      { country: "Lithuania", artist: "TBA", song: "TBA", flag: "🇱🇹" },
      { country: "Luxembourg", artist: "TBA", song: "TBA", flag: "🇱🇺" },
      { country: "Malta", artist: "TBA", song: "TBA", flag: "🇲🇹" },
      { country: "Moldova", artist: "TBA", song: "TBA", flag: "🇲🇩" },
      { country: "Netherlands", artist: "TBA", song: "TBA", flag: "🇳🇱" },
      { country: "Norway", artist: "TBA", song: "TBA", flag: "🇳🇴" },
      { country: "Poland", artist: "TBA", song: "TBA", flag: "🇵🇱" },
      { country: "Portugal", artist: "TBA", song: "TBA", flag: "🇵🇹" },
      { country: "San Marino", artist: "TBA", song: "TBA", flag: "🇸🇲" },
      { country: "Serbia", artist: "TBA", song: "TBA", flag: "🇷🇸" },
      { country: "Slovenia", artist: "TBA", song: "TBA", flag: "🇸🇮" },
      { country: "Spain", artist: "TBA", song: "TBA", flag: "🇪🇸" },
      { country: "Sweden", artist: "TBA", song: "TBA", flag: "🇸🇪" },
      { country: "Switzerland", artist: "TBA", song: "TBA", flag: "🇨🇭" },
      { country: "Ukraine", artist: "TBA", song: "TBA", flag: "🇺🇦" },
      { country: "United Kingdom", artist: "TBA", song: "TBA", flag: "🇬🇧" },
    ];
    const insert = db.prepare(
      `INSERT INTO contestants (country, artist, song, flag, "order") VALUES (?, ?, ?, ?, ?)`
    );
    entries.forEach((e, i) => insert.run(e.country, e.artist, e.song, e.flag, i + 1));
  }
}

export default getDb;
