/** 数据库 Schema 初始化与增量迁移 */
import type Database from 'better-sqlite3';

/** 建表 + 增量迁移 */
export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      lng         REAL NOT NULL,
      lat         REAL NOT NULL,
      altitude    REAL,
      address     TEXT DEFAULT '',
      category    TEXT DEFAULT '',
      description TEXT DEFAULT '',
      tone        TEXT DEFAULT 'literary'
                    CHECK(tone IN ('literary','practical','humor')),
      visited_at  INTEGER,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL,
      user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
      is_preset   INTEGER DEFAULT 0,
      is_draft    INTEGER DEFAULT 0,
      visibility  TEXT DEFAULT 'private'
                    CHECK(visibility IN ('private','shared')),
      route_path  TEXT NOT NULL DEFAULT '',
      image_dir   TEXT NOT NULL DEFAULT ''
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_places_created    ON places(created_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_places_category   ON places(category)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_places_route_path ON places(route_path)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS place_tags (
      place_id   TEXT    NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (place_id, tag_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id     TEXT    NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      sort_order   INTEGER DEFAULT 0,
      is_cover     INTEGER DEFAULT 0,
      original     TEXT    NOT NULL,
      thumb_sm     TEXT    DEFAULT '',
      thumb_md     TEXT    DEFAULT '',
      thumb_banner TEXT    DEFAULT '',
      width        INTEGER DEFAULT 0,
      height       INTEGER DEFAULT 0,
      size_bytes   INTEGER DEFAULT 0,
      taken_at     INTEGER,
      created_at   INTEGER NOT NULL
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_photos_place ON photos(place_id, sort_order)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name  TEXT DEFAULT '',
      avatar        TEXT DEFAULT '',
      created_at    INTEGER NOT NULL,
      role          TEXT DEFAULT 'user' CHECK(role IN ('user','admin'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key     TEXT NOT NULL,
      value   TEXT DEFAULT '',
      PRIMARY KEY (user_id, key)
    )
  `);

  // ── 增量迁移 ──
  migrate(db);
}

function migrate(db: Database.Database) {
  addColumnIfMissing(db, 'photos',   'thumb_banner', "TEXT DEFAULT ''");
  addColumnIfMissing(db, 'places',   'user_id',      'TEXT REFERENCES users(id) ON DELETE CASCADE');
  addColumnIfMissing(db, 'places',   'is_draft',     'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'places',   'visibility',   "TEXT DEFAULT 'private' CHECK(visibility IN ('private','shared'))");
  addColumnIfMissing(db, 'places',   'route_path',   "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'places',   'image_dir',    "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'users',    'role',          "TEXT DEFAULT 'user' CHECK(role IN ('user','admin'))");
  addColumnIfMissing(db, 'photos',   'taken_at',      'INTEGER');

  if (addColumnIfMissing(db, 'places', 'is_preset', 'INTEGER DEFAULT 0')) {
    db.exec("UPDATE places SET is_preset = 1 WHERE user_id IS NULL");
  }
}

function addColumnIfMissing(db: Database.Database, table: string, column: string, definition: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (cols.some(c => c.name === column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}
