/** /api/places 与 /api/photos 路由 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import {
  getPlace, listPlaces, searchPlaces, upsertPlace, deletePlace,
  setPlaceTags,
} from '../db/places.js';
import {
  getPlacePhotos, getPhotoById,
  addPhoto, removePhoto, setCover,
} from '../db/photos.js';
import type { PlaceRow, UserRow } from '../db/types.js';
import {
  IMAGES_ROOT, processUploadedImage,
  removePlaceImages, removeSingleImage,
  buildUserImageDir, buildUserRoutePath,
} from '../services/images.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { toApiPhoto, hydrate, hydrateBatch } from '../transformers.js';

export const placeRouter = Router();
const upload = multer({ dest: path.join(IMAGES_ROOT, '_tmp') });

// ── 输入校验 ──

function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_') || 'user';
}

function isValidLngLat(lng: unknown, lat: unknown): lng is number {
  return typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180
      && typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function normalizeVisibility(v: unknown): 'private' | 'shared' {
  return v === 'shared' ? 'shared' : 'private';
}

function normalizeTone(v: unknown): 'literary' | 'practical' | 'humor' {
  return v === 'practical' || v === 'humor' ? v : 'literary';
}

// ── 路由辅助 ──

function asyncHandler<T extends Request>(fn: (req: T, res: Response) => Promise<void>) {
  return (req: T, res: Response, next: NextFunction) => fn(req, res).catch(next);
}

/** 获取地点并校验修改权限（管理员可操作所有） */
function getOwnedPlace(req: AuthRequest, res: Response): PlaceRow | null {
  const row = getPlace(req.params.id as string);
  if (!row) { res.status(404).json({ error: 'Not found' }); return null; }
  const user = req.user!;
  if (user.role === 'admin') return row;
  if (row.is_preset) { res.status(403).json({ error: '预置地点不可修改' }); return null; }
  if (row.user_id !== user.id) { res.status(403).json({ error: '无权操作' }); return null; }
  return row;
}

function applyCoverByIndex(placeId: string, coverIndex: unknown) {
  if (typeof coverIndex !== 'number') return;
  const photos = getPlacePhotos(placeId);
  const target = photos[coverIndex];
  if (target) setCover(placeId, target.id);
}

// ── 路由 ──

placeRouter.get('/api/places', (req: AuthRequest, res) => {
  const rows = listPlaces({ userId: req.user?.id, role: req.user?.role });
  res.json(hydrateBatch(rows, req.user));
});

placeRouter.get('/api/places/search', (req: AuthRequest, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 50);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
  const { items, total } = searchPlaces({
    userId: req.user?.id,
    role: req.user?.role,
    q: q || undefined,
    limit,
    offset,
  });
  res.json({
    items: hydrateBatch(items, req.user),
    total,
    hasMore: offset + items.length < total,
  });
});

placeRouter.get('/api/places/:id', (req: AuthRequest, res) => {
  const row = getPlace(req.params.id as string);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const isAdmin = req.user?.role === 'admin';
  const isOwner = !!req.user && row.user_id === req.user.id;
  if (row.is_draft && !isOwner && !isAdmin) return res.status(404).json({ error: 'Not found' });
  if (!row.is_preset && row.visibility !== 'shared' && !isOwner && !isAdmin) {
    return res.status(403).json({ error: '无权访问' });
  }
  res.json(hydrate(row, req.user));
});

placeRouter.post('/api/places', requireAuth, (req: AuthRequest, res) => {
  const body = req.body ?? {};
  const user = req.user!;
  if (typeof body.id !== 'string' || !body.id.trim()) return res.status(400).json({ error: '缺少地点 id' });
  if (!isValidLngLat(body.lng, body.lat)) return res.status(400).json({ error: '经纬度无效' });
  const now = Date.now();
  const createdAt = typeof body.createdAt === 'number' ? body.createdAt : now;
  const safeUsername = sanitizeUsername(user.username);
  upsertPlace({
    id: body.id, title: body.title ?? '', lng: body.lng, lat: body.lat,
    altitude: body.altitude ?? null, address: body.address ?? '', category: body.category ?? '',
    description: body.description ?? '', tone: normalizeTone(body.tone),
    visited_at: body.visitedAt ?? now, created_at: createdAt, user_id: user.id,
    is_preset: 0, is_draft: body.isDraft ? 1 : 0, visibility: normalizeVisibility(body.visibility),
    route_path: buildUserRoutePath(safeUsername, body.lat, body.lng, createdAt),
    image_dir: buildUserImageDir(safeUsername, body.lat, body.lng, createdAt),
  });
  if (Array.isArray(body.tags)) setPlaceTags(body.id, body.tags);
  applyCoverByIndex(body.id, body.coverIndex);
  res.json(hydrate(getPlace(body.id)!, req.user));
});

placeRouter.put('/api/places/:id', requireAuth, (req: AuthRequest, res) => {
  const existing = getOwnedPlace(req, res);
  if (!existing) return;
  const body = req.body ?? {};
  if (body.lng !== undefined || body.lat !== undefined) {
    if (!isValidLngLat(body.lng ?? existing.lng, body.lat ?? existing.lat))
      return res.status(400).json({ error: '经纬度无效' });
  }
  upsertPlace({
    ...existing,
    title: body.title ?? existing.title, lng: body.lng ?? existing.lng, lat: body.lat ?? existing.lat,
    altitude: body.altitude ?? existing.altitude, address: body.address ?? existing.address,
    category: body.category ?? existing.category, description: body.description ?? existing.description,
    tone: body.tone !== undefined ? normalizeTone(body.tone) : existing.tone,
    visited_at: body.visitedAt ?? existing.visited_at,
    is_draft: typeof body.isDraft === 'boolean' ? (body.isDraft ? 1 : 0) : existing.is_draft,
    visibility: body.visibility !== undefined ? normalizeVisibility(body.visibility) : existing.visibility,
  });
  if (Array.isArray(body.tags)) setPlaceTags(existing.id, body.tags);
  applyCoverByIndex(existing.id, body.coverIndex);
  res.json(hydrate(getPlace(existing.id)!, req.user));
});

placeRouter.delete('/api/places/:id', requireAuth, (req: AuthRequest, res) => {
  const existing = getOwnedPlace(req, res);
  if (!existing) return;
  deletePlace(existing.id);
  removePlaceImages(existing.image_dir);
  res.json({ ok: true });
});

placeRouter.post(
  '/api/places/:id/photos', requireAuth, upload.array('photos', 20),
  asyncHandler<AuthRequest>(async (req, res) => {
    const row = getOwnedPlace(req, res);
    if (!row) return;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) { res.status(400).json({ error: 'No files uploaded' }); return; }
    const existing = getPlacePhotos(row.id);
    const hasCover = existing.some(p => p.is_cover === 1);
    let sortOrder = existing.reduce((m, p) => Math.max(m, p.sort_order), -1);
    const takenAtList: (number | null)[] = [];
    const raw = req.body?.takenAt;
    const arr = Array.isArray(raw) ? raw : (raw != null ? [raw] : []);
    arr.forEach((v: unknown) => takenAtList.push(typeof v === 'string' && v ? Number(v) || null : null));
    const now = Date.now();
    const added = [];
    for (let fi = 0; fi < files.length; fi++) {
      sortOrder++;
      const result = await processUploadedImage(files[fi].path, row.image_dir, files[fi].originalname);
      const takenAt = takenAtList[fi] ?? now;
      const id = addPhoto({
        place_id: row.id, sort_order: sortOrder,
        is_cover: !hasCover && sortOrder === 0 ? 1 : 0,
        ...result, taken_at: takenAt, created_at: now,
      });
      added.push(toApiPhoto(row.image_dir, { id, sort_order: sortOrder, taken_at: takenAt, ...result }));
    }
    res.json(added);
  }),
);

placeRouter.delete('/api/photos/:photoId', requireAuth, (req: AuthRequest, res) => {
  const photoId = Number(req.params.photoId);
  if (!Number.isFinite(photoId)) return res.status(400).json({ error: 'Invalid photo id' });
  const photo = getPhotoById(photoId);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  const place = getPlace(photo.place_id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  const user = req.user as UserRow;
  if (user.role !== 'admin' && place.user_id !== user.id) {
    return res.status(403).json({ error: '无权操作' });
  }
  removeSingleImage(place.image_dir, photo.original);
  removePhoto(photo.id);
  res.json({ ok: true });
});
