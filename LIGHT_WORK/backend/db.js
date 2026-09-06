import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(__dirname, "aiden.db"));

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  disability_type TEXT DEFAULT 'none',      -- deaf | mute | visually_impaired | student | caregiver | teacher | none
  language TEXT DEFAULT 'en',                -- en | ur
  font_size TEXT DEFAULT 'medium',           -- small | medium | large | xlarge
  high_contrast INTEGER DEFAULT 0,
  avatar_color TEXT DEFAULT '#2F6F5E',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  type TEXT NOT NULL,          -- text | voice | image | video | system | detection
  content TEXT,                -- text content or file path
  detection_kind TEXT,         -- sign | currency | text | object (only for type='detection')
  detection_confidence REAL,   -- 0..1 (only for type='detection')
  created_at TEXT DEFAULT (datetime('now')),
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, lesson_id)
);
`);

// Lightweight migration for DBs created before the detection columns
// existed — better-sqlite3/SQLite has no "ADD COLUMN IF NOT EXISTS", so we
// check pragma table_info and add them only if missing. Safe to run every boot.
const messageCols = db.prepare("PRAGMA table_info(messages)").all().map((c) => c.name);
if (!messageCols.includes("detection_kind")) {
  db.exec("ALTER TABLE messages ADD COLUMN detection_kind TEXT");
}
if (!messageCols.includes("detection_confidence")) {
  db.exec("ALTER TABLE messages ADD COLUMN detection_confidence REAL");
}
