import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getDB } from './server/db/connection.js';
import { deletePlace } from './server/db/places.js';
import { IMAGES_ROOT, removePlaceImages } from './server/services/images.js';

interface DraftPlaceRow {
  id: string;
  title: string;
  image_dir: string;
  photo_count: number;
}

function listDraftPlaces(): DraftPlaceRow[] {
  const db = getDB();
  return db.prepare(`
    SELECT
      p.id,
      p.title,
      p.image_dir,
      COUNT(ph.id) AS photo_count
    FROM places p
    LEFT JOIN photos ph ON ph.place_id = p.id
    WHERE p.is_draft = 1
    GROUP BY p.id, p.title, p.image_dir
    ORDER BY p.updated_at ASC
  `).all() as DraftPlaceRow[];
}

function pruneEmptyImageParents(imageDir: string) {
  if (!imageDir) return;

  let current = path.dirname(path.join(IMAGES_ROOT, imageDir));
  while (current.startsWith(IMAGES_ROOT) && current !== IMAGES_ROOT) {
    try {
      if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) {
        break;
      }
      fs.rmdirSync(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

function cleanupDraftPlace(row: DraftPlaceRow, dryRun: boolean) {
  const imageDir = row.image_dir || '(empty)';

  if (dryRun) {
    console.log(`[dry-run] would remove draft ${row.id} (${row.title || '未命名地点'}) with ${row.photo_count} photo(s), imageDir=${imageDir}`);
    return;
  }

  removePlaceImages(row.image_dir);
  pruneEmptyImageParents(row.image_dir);
  deletePlace(row.id);

  console.log(`removed draft ${row.id} (${row.title || '未命名地点'}) with ${row.photo_count} photo(s), imageDir=${imageDir}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDB();

  try {
    const drafts = listDraftPlaces();
    if (drafts.length === 0) {
      console.log(dryRun ? '[dry-run] no draft places found' : 'no draft places found');
      return;
    }

    console.log(`${dryRun ? '[dry-run] ' : ''}found ${drafts.length} draft place(s) under ${IMAGES_ROOT}`);

    let cleaned = 0;
    let failed = 0;

    for (const row of drafts) {
      try {
        cleanupDraftPlace(row, dryRun);
        cleaned += 1;
      } catch (error) {
        failed += 1;
        console.error(`failed to clean draft ${row.id}:`, error);
      }
    }

    console.log(`${dryRun ? '[dry-run] ' : ''}finished: ${cleaned} succeeded, ${failed} failed`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    db.close();
  }
}

main().catch(error => {
  console.error('clean dirty data failed:', error);
  process.exit(1);
});