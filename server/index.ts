/** Express 后端入口 */
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { IMAGES_ROOT } from './services/images.js';
import { optionalAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { placeRouter } from './routes/places.js';
import { settingsRouter } from './routes/settings.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/images', express.static(IMAGES_ROOT, { maxAge: '7d' }));
app.use(optionalAuth);

app.use(authRouter);
app.use(placeRouter);
app.use(settingsRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Travel API server running at http://localhost:${PORT}`);
});
