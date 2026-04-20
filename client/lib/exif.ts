/**
 * 浏览器端 EXIF 拍摄时间提取（封装 shared/exif.ts）
 */
import { extractExifDate } from '../../shared/exif';

/** 从 File 对象解析拍摄时间，失败返回 null */
export async function extractPhotoDate(file: File): Promise<number | null> {
  try {
    const maxBytes = 256 * 1024;
    const buf = await file.slice(0, Math.min(file.size, maxBytes)).arrayBuffer();
    return extractExifDate(new Uint8Array(buf));
  } catch { return null; }
}
