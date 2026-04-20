/** 数据库连接单例 */
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { initSchema } from './schema.js';

const DATA_DIR = path.resolve(import.meta.dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'travel.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}
