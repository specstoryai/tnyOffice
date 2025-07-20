import Database from 'better-sqlite3';
import { log } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export async function initDB(): Promise<Database.Database> {
  const dbPath = path.join(__dirname, '../../database.db');
  db = new Database(dbPath);
  
  log.info('Initializing SQLite database');

  // Create files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      content TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
    CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);
  `);

  log.info('Database initialized successfully');
  return db;
}

export function getDB(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}