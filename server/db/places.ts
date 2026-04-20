/** 地点与标签的数据访问 */
import { getDB } from './connection.js';
import type { PlaceRow } from './types.js';

// ── Places ──

export function getPlace(id: string): PlaceRow | undefined {
  return getDB().prepare('SELECT * FROM places WHERE id = ?').get(id) as PlaceRow | undefined;
}

export interface ListPlacesFilter {
  userId?: string;
  role?: string;
}

export function listPlaces({ userId, role }: ListPlacesFilter): PlaceRow[] {
  const db = getDB();
  if (role === 'admin') {
    return db.prepare(
      'SELECT * FROM places WHERE is_draft = 0 ORDER BY created_at DESC',
    ).all() as PlaceRow[];
  }
  if (userId) {
    return db.prepare(
      `SELECT * FROM places
       WHERE is_draft = 0
         AND (is_preset = 1 OR user_id = ? OR (visibility = 'shared' AND user_id != ?))
       ORDER BY created_at DESC`,
    ).all(userId, userId) as PlaceRow[];
  }
  return db.prepare(
    `SELECT * FROM places
     WHERE is_draft = 0 AND (is_preset = 1 OR visibility = 'shared')
     ORDER BY created_at DESC`,
  ).all() as PlaceRow[];
}

// ── 分页搜索 ──

export interface SearchPlacesFilter {
  userId?: string;
  role?: string;
  q?: string;
  limit: number;
  offset: number;
}

export interface SearchPlacesResult {
  items: PlaceRow[];
  total: number;
}

/** 日期列转为 zh-CN 格式 "YYYY/M/D"（去前导零） */
const DATE_EXPR = (col: string) =>
  `(CAST(strftime('%Y', ${col}/1000, 'unixepoch', 'localtime') AS TEXT) || '/' || CAST(CAST(strftime('%m', ${col}/1000, 'unixepoch', 'localtime') AS INTEGER) AS TEXT) || '/' || CAST(CAST(strftime('%d', ${col}/1000, 'unixepoch', 'localtime') AS INTEGER) AS TEXT))`;

export function searchPlaces({ userId, role, q, limit, offset }: SearchPlacesFilter): SearchPlacesResult {
  const db = getDB();
  const conditions: string[] = ['is_draft = 0'];
  const params: unknown[] = [];

  if (role === 'admin') {
    // admin 看所有非草稿
  } else if (userId) {
    conditions.push(`(is_preset = 1 OR user_id = ? OR (visibility = 'shared' AND user_id != ?))`);
    params.push(userId, userId);
  } else {
    conditions.push(`(is_preset = 1 OR visibility = 'shared')`);
  }

  if (q) {
    conditions.push(
      `(title LIKE ? COLLATE NOCASE OR address LIKE ? COLLATE NOCASE` +
      ` OR (visited_at IS NOT NULL AND ${DATE_EXPR('visited_at')} LIKE ?))`,
    );
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const where = conditions.join(' AND ');
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM places WHERE ${where}`).get(...params) as { cnt: number }).cnt;
  const items = db.prepare(
    `SELECT * FROM places WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset) as PlaceRow[];

  return { items, total };
}

export function upsertPlace(c: Omit<PlaceRow, 'updated_at'> & { updated_at?: number }) {
  const now = c.updated_at ?? Date.now();
  getDB().prepare(`
    INSERT INTO places
      (id, title, lng, lat, altitude, address, category, description, tone,
       visited_at, created_at, updated_at, user_id, is_preset, is_draft, visibility, route_path, image_dir)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, lng=excluded.lng, lat=excluded.lat, altitude=excluded.altitude,
      address=excluded.address, category=excluded.category, description=excluded.description,
      tone=excluded.tone, visited_at=excluded.visited_at, updated_at=excluded.updated_at,
      visibility=excluded.visibility, is_draft=excluded.is_draft
  `).run(
    c.id, c.title, c.lng, c.lat, c.altitude ?? null, c.address, c.category,
    c.description, c.tone, c.visited_at ?? null, c.created_at, now,
    c.user_id ?? null, c.is_preset ?? 0, c.is_draft ?? 0,
    c.visibility ?? 'private', c.route_path ?? '', c.image_dir ?? '',
  );
}

export function deletePlace(id: string) {
  const db = getDB();
  db.prepare('DELETE FROM place_tags WHERE place_id = ?').run(id);
  db.prepare('DELETE FROM photos WHERE place_id = ?').run(id);
  db.prepare('DELETE FROM places WHERE id = ?').run(id);
}

// ── Tags ──

function ensureTag(name: string): number {
  const db = getDB();
  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name);
  return (db.prepare('SELECT id FROM tags WHERE name = ?').get(name) as { id: number }).id;
}

export function setPlaceTags(placeId: string, tags: string[]) {
  const db = getDB();
  db.prepare('DELETE FROM place_tags WHERE place_id = ?').run(placeId);
  const insert = db.prepare('INSERT INTO place_tags (place_id, tag_id, sort_order) VALUES (?,?,?)');
  tags.forEach((tag, i) => insert.run(placeId, ensureTag(tag), i));
}

export function getPlaceTags(placeId: string): string[] {
  const rows = getDB().prepare(`
    SELECT t.name FROM place_tags ct
    JOIN tags t ON t.id = ct.tag_id
    WHERE ct.place_id = ? ORDER BY ct.sort_order
  `).all(placeId) as { name: string }[];
  return rows.map(r => r.name);
}

export function getPlaceTagsMap(placeIds: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (placeIds.length === 0) return map;
  const ph = placeIds.map(() => '?').join(',');
  const rows = getDB().prepare(`
    SELECT ct.place_id AS cid, t.name FROM place_tags ct
    JOIN tags t ON t.id = ct.tag_id
    WHERE ct.place_id IN (${ph}) ORDER BY ct.place_id, ct.sort_order
  `).all(...placeIds) as { cid: string; name: string }[];
  for (const r of rows) {
    const list = map.get(r.cid);
    if (list) list.push(r.name); else map.set(r.cid, [r.name]);
  }
  return map;
}
