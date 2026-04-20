import { extractPhotoDate } from './exif';
import { uploadPhotos } from '../store/db';
import type { Photo } from '../types';

/** 提取照片 EXIF 日期后上传（PlacePage 与 DetailPage 共用） */
export async function uploadWithExif(placeId: string, files: File[]): Promise<Photo[]> {
  const takenAtList = await Promise.all(files.map(f => extractPhotoDate(f)));
  return uploadPhotos(placeId, files, takenAtList);
}
