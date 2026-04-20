/** 全局设置与用户设置的 KV 存储 */
import { getDB } from './connection.js';

export function getSetting(key: string): string | null {
  const row = getDB().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDB().prepare(
    'INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  ).run(key, value);
}

export function getUserSetting(userId: string, key: string): string | null {
  const row = getDB().prepare(
    'SELECT value FROM user_settings WHERE user_id = ? AND key = ?',
  ).get(userId, key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setUserSetting(userId: string, key: string, value: string) {
  getDB().prepare(
    'INSERT INTO user_settings (user_id, key, value) VALUES (?,?,?) ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value',
  ).run(userId, key, value);
}
