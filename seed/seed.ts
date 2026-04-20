/**
 * 统一种子脚本 — 同时导入预置用户和预置地点
 *
 * 用法: npx tsx seed/seed.ts
 */
import { seedUsers } from './seed-users.js';
import { seedPresets } from './seed-presets.js';

async function main() {
  seedUsers();
  await seedPresets();
}

main().catch(err => {
  console.error('❌ 种子脚本失败:', err);
  process.exit(1);
});
