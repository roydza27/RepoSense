import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../reposense.db');

let db = null;

/**
 * Initialize and return SQLite database connection
 * @returns {Database} Database instance
 */
export function initializeDatabase() {
  if (db) return db;

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create all required tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_path TEXT,
      timestamp TEXT,
      action TEXT,
      files_changed INTEGER,
      lines_added INTEGER,
      lines_removed INTEGER,
      success INTEGER,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS commits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_path TEXT,
      commit_hash TEXT,
      commit_message TEXT,
      timestamp TEXT,
      files_count INTEGER,
      push_success INTEGER
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS auto_push_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_path TEXT,
      scheduled_at TEXT,
      execute_at TEXT,
      status TEXT,
      job_id TEXT UNIQUE,
      completed_at TEXT,
      error TEXT
    );
  `);

  return db;
}

/**
 * Get database instance (assumes already initialized)
 * @returns {Database} Database instance
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export default { initializeDatabase, getDatabase, closeDatabase };
