/**
 * 预设数据种子脚本
 *   将 seed/presets/ 下的预置收藏点及原始图片迁移至 SQLite + 统一图片目录
 *   缩略图由 server/images.ts 在导入时统一生成到 data/images/
 *
 * 用法: npx tsx seed/seed.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { upsertPlace, setPlaceTags } from '../server/db/places.js';
import { addPhoto } from '../server/db/photos.js';
import { getSetting, setSetting } from '../server/db/settings.js';
import { processExistingImage, buildPresetImageDir, buildPresetRoutePath } from '../server/services/images.js';
import { extractExifDate } from '../shared/exif.js';

const SEED_ROOT = path.resolve(import.meta.dirname);
const PRESETS_DIR = path.join(SEED_ROOT, 'presets');
const DATA_JSON = path.join(PRESETS_DIR, 'data.json');

interface PresetItem {
  id: string;
  title: string;
  lng: number;
  lat: number;
  altitude: number;
  address: string;
  category: string;
  tags: string[];
  photos: string[];
  coverIndex: number;
  description: string;
  tone: string;
}

export async function seedPresets() {
  // 防止重复种子
  if (getSetting('presets-seeded') === 'true') {
    console.log('⚠️  预设数据已导入，跳过。如需重新导入请先删除 data/travel.db');
    return;
  }

  const raw = fs.readFileSync(DATA_JSON, 'utf-8');
  const presets: PresetItem[] = JSON.parse(raw);
  const seededAt = Date.now();

  console.log(`📦 发现 ${presets.length} 个预设收藏点，开始导入...`);

  for (const p of presets) {
    const now = seededAt;
    const imageDir = buildPresetImageDir(p.lat, p.lng, seededAt);
    const routePath = buildPresetRoutePath(p.lat, p.lng, seededAt);

    // 1. 处理照片，提取 EXIF 拍摄时间
    let coverTakenAt: number | null = null;
    const photoResults: { result: Awaited<ReturnType<typeof processExistingImage>>; takenAt: number | null; index: number }[] = [];

    for (let i = 0; i < p.photos.length; i++) {
      const photoRelPath = p.photos[i];
      const srcPath = path.resolve(SEED_ROOT, photoRelPath);

      if (!fs.existsSync(srcPath)) {
        console.warn(`  ⚠️  照片不存在: ${srcPath}`);
        continue;
      }

      console.log(`  📸 处理 ${photoRelPath}...`);
      const result = await processExistingImage(srcPath, imageDir);

      const imgBytes = fs.readFileSync(srcPath);
      const takenAt = extractExifDate(new Uint8Array(imgBytes.buffer, imgBytes.byteOffset, imgBytes.byteLength));

      photoResults.push({ result, takenAt, index: i });
      if (i === p.coverIndex) coverTakenAt = takenAt;
    }

    // 2. 写入地点（visitedAt 取封面照片拍摄时间，createdAt 取当前时间）
    const visitedAt = coverTakenAt ?? now;
    upsertPlace({
      id: p.id,
      title: p.title,
      lng: p.lng,
      lat: p.lat,
      altitude: p.altitude,
      address: p.address,
      category: p.category,
      description: p.description,
      tone: p.tone,
      visited_at: visitedAt,
      created_at: now,
      updated_at: now,
      user_id: null,
      is_preset: 1,
      is_draft: 0,
      visibility: 'shared',
      route_path: routePath,
      image_dir: imageDir,
    });

    // 3. 写入标签
    setPlaceTags(p.id, p.tags);

    // 4. 写入照片
    for (const { result, takenAt, index } of photoResults) {
      addPhoto({
        place_id: p.id,
        sort_order: index,
        is_cover: index === p.coverIndex ? 1 : 0,
        ...result,
        taken_at: takenAt,
        created_at: now,
      });
    }

    console.log(`  ✅ ${p.title} (${p.photos.length} 张照片)`);
  }

  setSetting('presets-seeded', 'true');
  console.log(`\n🎉 全部 ${presets.length} 个收藏点导入完成！`);
}


