/** 照片数据访问 */
import { getDB } from './connection.js';
import type { PhotoRow } from './types.js';

export function getPhotoById(id: number): PhotoRow | undefined {
  return getDB().prepare('SELECT * FROM photos WHERE id = ?').get(id) as PhotoRow | undefined;
}

export function getPlacePhotos(placeId: string): PhotoRow[] {
  return getDB().prepare(
    'SELECT * FROM photos WHERE place_id = ? ORDER BY sort_order',
  ).all(placeId) as PhotoRow[];
}

/** 批量加载多条地点的照片，避免 N+1 */
export function getPlacePhotosMap(placeIds: string[]): Map<string, PhotoRow[]> {
  const map = new Map<string, PhotoRow[]>();
  if (placeIds.length === 0) return map;
  const ph = placeIds.map(() => '?').join(',');
  const rows = getDB().prepare(
    `SELECT * FROM photos WHERE place_id IN (${ph}) ORDER BY place_id, sort_order`,
  ).all(...placeIds) as PhotoRow[];
  for (const r of rows) {
    const list = map.get(r.place_id);
    if (list) list.push(r); else map.set(r.place_id, [r]);
  }
  return map;
}

export function addPhoto(photo: Omit<PhotoRow, 'id'>): number {
  const result = getDB().prepare(`
    INSERT INTO photos
      (place_id, sort_order, is_cover, original, thumb_sm, thumb_md, thumb_banner,
       width, height, size_bytes, taken_at, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    photo.place_id, photo.sort_order, photo.is_cover, photo.original,
    photo.thumb_sm, photo.thumb_md, photo.thumb_banner,
    photo.width, photo.height, photo.size_bytes, photo.taken_at ?? null, photo.created_at,
  );
  return Number(result.lastInsertRowid);
}

export function removePhoto(id: number) {
  getDB().prepare('DELETE FROM photos WHERE id = ?').run(id);
}

export function setCover(placeId: string, photoId: number) {
  const db = getDB();
  db.prepare('UPDATE photos SET is_cover = 0 WHERE place_id = ?').run(placeId);
  db.prepare('UPDATE photos SET is_cover = 1 WHERE id = ? AND place_id = ?').run(photoId, placeId);
}
