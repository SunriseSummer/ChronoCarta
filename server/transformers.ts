/** 响应组装：将数据库行转换为 API 返回格式 */
import type { PlaceRow, PhotoRow, UserRow } from './db/types.js';
import { getPlaceTags, getPlaceTagsMap } from './db/places.js';
import { getPlacePhotos, getPlacePhotosMap } from './db/photos.js';

export function toApiPhoto(
  imageDir: string,
  p: Pick<PhotoRow, 'id' | 'original' | 'thumb_sm' | 'thumb_md' | 'thumb_banner' | 'width' | 'height' | 'sort_order' | 'taken_at'>,
) {
  const base = `/images/${imageDir}`;
  return {
    id: p.id, original: `${base}/${p.original}`,
    thumb_sm: `${base}/${p.thumb_sm}`, thumb_md: `${base}/${p.thumb_md}`,
    thumb_banner: `${base}/${p.thumb_banner}`,
    width: p.width, height: p.height, sort_order: p.sort_order,
    takenAt: p.taken_at ?? null,
  };
}

export function toApiPlace(row: PlaceRow, tags: string[], photos: PhotoRow[], viewer?: UserRow) {
  const coverIdx = photos.findIndex(p => p.is_cover === 1);
  return {
    id: row.id, routePath: row.route_path || row.id, title: row.title,
    lng: row.lng, lat: row.lat, altitude: row.altitude, address: row.address,
    description: row.description, tone: row.tone,
    tags, photos: photos.map(p => toApiPhoto(row.image_dir, p)),
    coverIndex: coverIdx >= 0 ? coverIdx : 0,
    visitedAt: row.visited_at, createdAt: row.created_at,
    isPreset: !!row.is_preset, isDraft: !!row.is_draft,
    isOwner: !!viewer && row.user_id === viewer.id,
    visibility: row.visibility || 'private',
  };
}

export function hydrate(row: PlaceRow, viewer?: UserRow) {
  return toApiPlace(row, getPlaceTags(row.id), getPlacePhotos(row.id), viewer);
}

export function hydrateBatch(rows: PlaceRow[], viewer?: UserRow) {
  const ids = rows.map(r => r.id);
  const tagsMap = getPlaceTagsMap(ids);
  const photosMap = getPlacePhotosMap(ids);
  return rows.map(r => toApiPlace(r, tagsMap.get(r.id) ?? [], photosMap.get(r.id) ?? [], viewer));
}
