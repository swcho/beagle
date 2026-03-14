import { join } from 'path'

import Database from 'better-sqlite3'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

export function initializeDatabase(): Database.Database {
  const dbPath = join(app.getPath('userData'), 'assetvault.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS attributions (
      id         TEXT PRIMARY KEY,
      url        TEXT,
      author     TEXT NOT NULL,
      license    TEXT,
      note       TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS assets (
      id             TEXT PRIMARY KEY,
      path           TEXT NOT NULL UNIQUE,
      name           TEXT NOT NULL,
      ext            TEXT NOT NULL,
      size           INTEGER,
      width          INTEGER,
      height         INTEGER,
      duration       REAL,
      thumbnail      TEXT,
      colors         TEXT DEFAULT '[]',
      attribution_id TEXT REFERENCES attributions(id) ON DELETE SET NULL,
      created_at     INTEGER,
      imported_at    INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tags (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6B7280'
    );

    CREATE TABLE IF NOT EXISTS asset_tags (
      asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
      tag_id   TEXT REFERENCES tags(id)   ON DELETE CASCADE,
      PRIMARY KEY (asset_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS folders (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      parent_id  TEXT REFERENCES folders(id),
      icon       TEXT DEFAULT '📁',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS folder_assets (
      folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
      asset_id  TEXT REFERENCES assets(id)  ON DELETE CASCADE,
      PRIMARY KEY (folder_id, asset_id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts
      USING fts5(name, content='assets', content_rowid='rowid');

    CREATE INDEX IF NOT EXISTS idx_assets_ext      ON assets(ext);
    CREATE INDEX IF NOT EXISTS idx_assets_imported ON assets(imported_at DESC);
  `)

  // Migration: add attribution_id column if it doesn't exist (existing databases)
  try {
    db.exec(
      `ALTER TABLE assets ADD COLUMN attribution_id TEXT REFERENCES attributions(id) ON DELETE SET NULL`
    )
  } catch {
    // Column already exists — safe to ignore
  }

  return db
}
