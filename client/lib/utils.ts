import type { Photo } from '../types';

/** 生成可读的唯一 ID：YYYYMMDD-HHmmss-标题摘要，便于 URL 具有明确语义 */
export function genId(title?: string): string {
  const n = new Date();
  const date = `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, '0')}${String(n.getDate()).padStart(2, '0')}`;
  const time = `${String(n.getHours()).padStart(2, '0')}${String(n.getMinutes()).padStart(2, '0')}${String(n.getSeconds()).padStart(2, '0')}`;
  const base = `${date}-${time}`;
  if (!title?.trim()) return base;
  const slug = title.trim().slice(0, 20)
    .replace(/[/\\?#%&=+]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug ? `${base}-${slug}` : base;
}

/** 格式化经纬度到指定小数位（默认 4 位） */
export function fmtCoord(value: number, digits = 4): string {
  return value.toFixed(digits);
}

/** 获取地点记录的封面照片对象 */
export function getCoverPhoto(photos: Photo[], coverIndex: number): Photo | undefined {
  return photos[coverIndex] || photos[0];
}

export function mergeUniqueStrings(current: string[], incoming: string[]): string[] {
  return [...new Set([...current, ...incoming])];
}
