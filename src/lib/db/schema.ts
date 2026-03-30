import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'polinear.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS politicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bioguide_id TEXT UNIQUE,
      name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      office TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('federal', 'state', 'local')),
      party TEXT,
      state TEXT,
      district TEXT,
      photo_url TEXT,
      birthplace TEXT,
      birthday TEXT,
      website TEXT,
      phone TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      politician_id INTEGER NOT NULL,
      bill_id TEXT,
      title TEXT NOT NULL,
      vote TEXT,
      date TEXT,
      description TEXT,
      FOREIGN KEY (politician_id) REFERENCES politicians(id)
    );

    CREATE TABLE IF NOT EXISTS pacs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      politician_id INTEGER NOT NULL,
      pac_name TEXT NOT NULL,
      amount REAL,
      cycle TEXT,
      FOREIGN KEY (politician_id) REFERENCES politicians(id)
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      politician_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      stance TEXT NOT NULL,
      citation TEXT,
      source_url TEXT,
      FOREIGN KEY (politician_id) REFERENCES politicians(id)
    );

    CREATE INDEX IF NOT EXISTS idx_politicians_state ON politicians(state);
    CREATE INDEX IF NOT EXISTS idx_politicians_district ON politicians(state, district);
    CREATE INDEX IF NOT EXISTS idx_politicians_level ON politicians(level);
    CREATE INDEX IF NOT EXISTS idx_bills_politician ON bills(politician_id);
    CREATE INDEX IF NOT EXISTS idx_pacs_politician ON pacs(politician_id);
    CREATE INDEX IF NOT EXISTS idx_positions_politician ON positions(politician_id);
  `);
}
