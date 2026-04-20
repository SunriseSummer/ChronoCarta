/** /api/settings 与 /api/user/settings 路由 */
import { Router } from 'express';
import { getSetting, setSetting, getUserSetting, setUserSetting } from '../db/settings.js';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.js';

export const settingsRouter = Router();

// ── 全局设置（读取公开；写入仅管理员） ──

settingsRouter.get('/api/settings/:key', (req, res) => {
  res.json({ key: req.params.key, value: getSetting(req.params.key) });
});

settingsRouter.put('/api/settings/:key', requireAdmin, (req, res) => {
  setSetting(req.params.key as string, String(req.body?.value ?? ''));
  res.json({ ok: true });
});

// ── 用户设置（需登录） ──

settingsRouter.get('/api/user/settings/:key', requireAuth, (req: AuthRequest, res) => {
  res.json({ key: req.params.key, value: getUserSetting(req.user!.id, req.params.key as string) });
});

settingsRouter.put('/api/user/settings/:key', requireAuth, (req: AuthRequest, res) => {
  setUserSetting(req.user!.id, req.params.key as string, String(req.body?.value ?? ''));
  res.json({ ok: true });
});
