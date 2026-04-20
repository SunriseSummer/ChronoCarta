/** /api/auth 路由 */
import { Router } from 'express';
import { getUserByUsername, verifyPassword, createSession, deleteSession } from '../db/users.js';
import type { AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });
  const user = getUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = createSession(user.id);
  res.json({
    token,
    user: { id: user.id, username: user.username, displayName: user.display_name, avatar: user.avatar, role: user.role },
  });
});

authRouter.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) deleteSession(auth.slice(7));
  res.json({ ok: true });
});

authRouter.get('/api/auth/me', (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: '未登录' });
  const u = req.user;
  res.json({ id: u.id, username: u.username, displayName: u.display_name, avatar: u.avatar, role: u.role });
});
