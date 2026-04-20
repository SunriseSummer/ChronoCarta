/** 认证中间件 */
import type { Request, Response, NextFunction } from 'express';
import { getSessionUser } from '../db/users.js';
import type { UserRow } from '../db/types.js';

export interface AuthRequest extends Request {
  user?: UserRow;
}

/** 全局可选认证：解析 Bearer token，有效则挂载 req.user */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const user = getSessionUser(auth.slice(7));
    if (user) req.user = user;
  }
  next();
}

/** 强制登录 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: '请先登录' });
  next();
}

/** 仅管理员可访问 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: '请先登录' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  next();
}
