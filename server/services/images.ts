/**
 * 图片处理模块
 *   - 接收上传的原图，存入统一目录
 *   - 自动生成 3 级缩略图 (sm / md / banner)
 *   - 提供静态路径工具函数
 *
 * 目录结构:
 *   data/images/<imageDir>/
 *     ├── <uuid>.jpg              ← 原图
 *     ├── <uuid>_sm.webp          ← 128×128     地图气泡（正方形裁切）
 *     ├── <uuid>_md.webp          ← 640×640     瀑布流/照片条（正方形裁切）
 *     └── <uuid>_banner.webp      ← ≤1600×1200  详情/浏览页头部（保留原始比例）
 *
 *   用户地点的 imageDir 形如 <username>/<lat>N-<lng>E-<YYYYMMDDHHmmss>
 *   用户路由 routePath 形如 <userHash>-<lat>N-<lng>E-<YYYYMMDDHHmmss>
 *   预置地点的 imageDir 形如 _preset/<lat>N-<lng>E-<YYYYMMDDHHmmss>
 *   预置路由 routePath 形如 <lat>N-<lng>E-<YYYYMMDDHHmmss>
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

export const IMAGES_ROOT = path.resolve(import.meta.dirname, '../../data/images');

/** 正方形缩略图尺寸配置（fit: cover，中心裁切） */
const THUMB_SIZES = {
  sm: { width: 128, height: 128 },    // 地图标记气泡
  md: { width: 640, height: 640 },    // 瀑布流卡片 / 照片条
} as const;

type ThumbLevel = keyof typeof THUMB_SIZES;

/** Banner 缩略图配置：保留原始宽高比，仅限制最大尺寸 */
export const BANNER_SIZE = { width: 1600, height: 1200 } as const;

/** 生成短 uuid 文件名 */
function genImageId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/** 格式化时间戳为 YYYYMMDDHHmmss（本地时区） */
function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function buildCoordSegment(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}-${lngStr}`;
}

function hashUsername(username: string): string {
  return crypto.createHash('sha1').update(username).digest('hex').slice(0, 8);
}

/** 构造用户地点的图片目录：<username>/<lat>N-<lng>E-<ts> */
export function buildUserImageDir(username: string, lat: number, lng: number, timestamp: number): string {
  return `${username}/${buildCoordSegment(lat, lng)}-${formatTimestamp(timestamp)}`;
}

export function buildUserRoutePath(username: string, lat: number, lng: number, timestamp: number): string {
  return `${hashUsername(username)}-${buildCoordSegment(lat, lng)}-${formatTimestamp(timestamp)}`;
}

/** 构造预置地点的图片目录：_preset/<coord>-<ts> */
export function buildPresetImageDir(lat: number, lng: number, timestamp: number): string {
  return `_preset/${buildCoordSegment(lat, lng)}-${formatTimestamp(timestamp)}`;
}

export function buildPresetRoutePath(lat: number, lng: number, timestamp: number): string {
  return `${buildCoordSegment(lat, lng)}-${formatTimestamp(timestamp)}`;
}

/**
 * 获取某图片目录的绝对路径（自动创建）
 */
export function getImageDir(imageDir: string): string {
  const dir = path.join(IMAGES_ROOT, imageDir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * 核心处理：将源图复制到目标目录并生成全部缩略图
 *   - 仅读取一次源文件到 Buffer，避免 sharp 重复 IO
 *   - 并行生成 sm / md / banner 三个缩略图
 *   - 失败时清理已写入的目标文件，避免残留
 */
async function processImage(
  srcPath: string,
  imageDir: string,
  ext: string,
  { deleteSource = false } = {},
): Promise<{
  original: string;
  thumb_sm: string;
  thumb_md: string;
  thumb_banner: string;
  width: number;
  height: number;
  size_bytes: number;
}> {
  const dir = getImageDir(imageDir);
  const imageId = genImageId();
  const originalFilename = `${imageId}${ext}`;
  const originalPath = path.join(dir, originalFilename);
  const smName = `${imageId}_sm.webp`;
  const mdName = `${imageId}_md.webp`;
  const bannerName = `${imageId}_banner.webp`;
  const written: string[] = [];

  try {
    // 一次性读入源图，后续 sharp 操作复用该 Buffer
    const buf = fs.readFileSync(srcPath);
    fs.writeFileSync(originalPath, buf);
    written.push(originalPath);

    // 元数据读取与三档缩略图生成全部并行，最大化吞吐
    const [meta] = await Promise.all([
      sharp(buf).metadata(),
      sharp(buf)
        .resize(THUMB_SIZES.sm.width, THUMB_SIZES.sm.height, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toFile(path.join(dir, smName))
        .then(() => written.push(path.join(dir, smName))),
      sharp(buf)
        .resize(THUMB_SIZES.md.width, THUMB_SIZES.md.height, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toFile(path.join(dir, mdName))
        .then(() => written.push(path.join(dir, mdName))),
      sharp(buf)
        .resize(BANNER_SIZE.width, BANNER_SIZE.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(path.join(dir, bannerName))
        .then(() => written.push(path.join(dir, bannerName))),
    ]);

    if (deleteSource) {
      try { fs.unlinkSync(srcPath); } catch { /* noop */ }
    }

    return {
      original: originalFilename,
      thumb_sm: smName,
      thumb_md: mdName,
      thumb_banner: bannerName,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      size_bytes: buf.length,
    };
  } catch (err) {
    // 失败清理：删除本次已写入的文件 + 临时源文件
    for (const f of written) { try { fs.unlinkSync(f); } catch { /* noop */ } }
    if (deleteSource) { try { fs.unlinkSync(srcPath); } catch { /* noop */ } }
    throw err;
  }
}

/**
 * 处理上传的图片文件（multer 临时文件 → 目标目录，处理后删除临时文件）
 */
export async function processUploadedImage(
  srcPath: string,
  imageDir: string,
  originalName?: string,
) {
  const ext = path.extname(originalName || srcPath).toLowerCase() || '.jpg';
  return processImage(srcPath, imageDir, ext, { deleteSource: true });
}

/**
 * 处理已有的文件（预设数据迁移），不删除源文件
 */
export async function processExistingImage(srcPath: string, imageDir: string) {
  const ext = path.extname(srcPath).toLowerCase() || '.jpg';
  return processImage(srcPath, imageDir, ext);
}

/**
 * 删除地点的全部图片目录
 */
export function removePlaceImages(imageDir: string) {
  if (!imageDir) return;
  const dir = path.join(IMAGES_ROOT, imageDir);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * 删除单张照片的所有文件（原图 + 缩略图）
 */
export function removeSingleImage(imageDir: string, original: string) {
  if (!imageDir) return;
  const dir = path.join(IMAGES_ROOT, imageDir);
  if (!fs.existsSync(dir)) return;
  const base = path.parse(original).name;
  const files = [
    original,
    `${base}_sm.webp`,
    `${base}_md.webp`,
    `${base}_banner.webp`,
  ];
  for (const f of files) {
    const fp = path.join(dir, f);
    try { fs.unlinkSync(fp); } catch { /* noop */ }
  }
}
