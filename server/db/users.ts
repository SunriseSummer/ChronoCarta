/** 用户、密码、会话的数据访问 */
import crypto from 'node:crypto';
import { getDB } from './connection.js';
import type { UserRow } from './types.js';

// ── 密码散列 ──

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  if (verify.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
}

// ── Users CRUD ──

export function createUser(user: Omit<UserRow, 'created_at'> & { created_at?: number }) {
  const now = user.created_at ?? Date.now();
  getDB().prepare(`
    INSERT INTO users (id, username, password_hash, display_name, avatar, created_at, role)
    VALUES (?,?,?,?,?,?,?)
  `).run(user.id, user.username, user.password_hash, user.display_name, user.avatar, now, user.role ?? 'user');
}

export function getUserByUsername(username: string): UserRow | undefined {
  return getDB().prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return getDB().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

// ── Sessions ──

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  getDB().prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)').run(token, userId, Date.now());
  return token;
}

export function deleteSession(token: string) {
  getDB().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getSessionUser(token: string): UserRow | undefined {
  return getDB().prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?',
  ).get(token) as UserRow | undefined;
}
