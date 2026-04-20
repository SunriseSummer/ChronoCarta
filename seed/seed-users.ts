/**
 * 用户预置种子脚本
 *   在数据库中预置用户账号并处理头像图片
 *
 * 用法: npx tsx seed/seed-users.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createUser, getUserByUsername, hashPassword } from '../server/db/users.js';
import { getSetting, setSetting } from '../server/db/settings.js';

const SEED_ROOT = path.resolve(import.meta.dirname);
const USERS_DIR = path.join(SEED_ROOT, 'users');
const IMAGES_ROOT = path.resolve(import.meta.dirname, '../data/images');
const AVATARS_DIR = path.join(IMAGES_ROOT, 'avatars');

interface PresetUser {
  username: string;
  password: string;
  displayName: string;
  avatarFile: string; // 相对于 seed/users/ 目录
  role: 'user' | 'admin';
}

const PRESET_USERS: PresetUser[] = [
  {
    username: 'Summer',
    password: ',20250103.ljj',
    displayName: 'Summer',
    avatarFile: 'header.jpg',
    role: 'admin',
  },
  {
    username: 'Sunrise',
    password: 'summer666',
    displayName: 'Sunrise',
    avatarFile: 'header.jpg',
    role: 'user',
  },
  {
    username: 'China1',
    password: 'China1',
    displayName: 'China1',
    avatarFile: '',
    role: 'user',
  },
  {
    username: 'China2',
    password: 'China2',
    displayName: 'China2',
    avatarFile: '',
    role: 'user',
  },
  {
    username: 'China3',
    password: 'China3',
    displayName: 'China3',
    avatarFile: '',
    role: 'user',
  },
  {
    username: 'China4',
    password: 'China4',
    displayName: 'China4',
    avatarFile: '',
    role: 'user',
  },
  {
    username: 'China5',
    password: 'China5',
    displayName: 'China5',
    avatarFile: '',
    role: 'user',
  },
];

export function seedUsers() {
  if (getSetting('users-seeded') === 'true') {
    console.log('⚠️  用户数据已导入，跳过。如需重新导入请先删除 data/travel.db');
    return;
  }

  // 确保头像目录存在
  fs.mkdirSync(AVATARS_DIR, { recursive: true });

  console.log(`👤 开始导入 ${PRESET_USERS.length} 个预置用户...`);

  for (const pu of PRESET_USERS) {
    // 检查用户是否已存在
    if (getUserByUsername(pu.username)) {
      console.log(`  ⚠️  用户 ${pu.username} 已存在，跳过`);
      continue;
    }

    const userId = crypto.randomBytes(8).toString('hex');

    // 处理头像
    let avatarPath = '';
    if (pu.avatarFile) {
      const avatarSrc = path.join(USERS_DIR, pu.avatarFile);
      if (fs.existsSync(avatarSrc)) {
        const ext = path.extname(pu.avatarFile).toLowerCase();
        const avatarFilename = `${userId}${ext}`;
        fs.copyFileSync(avatarSrc, path.join(AVATARS_DIR, avatarFilename));
        avatarPath = `/images/avatars/${avatarFilename}`;
        console.log(`  🖼️  头像已复制: ${avatarFilename}`);
      } else {
        console.warn(`  ⚠️  头像文件不存在: ${avatarSrc}`);
      }
    }

    // 创建用户
    createUser({
      id: userId,
      username: pu.username,
      password_hash: hashPassword(pu.password),
      display_name: pu.displayName,
      avatar: avatarPath,
      role: pu.role,
    });

    console.log(`  ✅ 用户 ${pu.username} 创建成功 (id: ${userId})`);
  }

  setSetting('users-seeded', 'true');
  console.log(`\n🎉 用户预置完成！`);
}


