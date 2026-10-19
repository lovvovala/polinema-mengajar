import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import publicRoutes from './routes/public.js';
import cbtRoutes from './routes/cbt.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', publicRoutes);
  app.use('/api/cbt', cbtRoutes);
  app.use('/api/admin', adminRoutes);

  app.use((_req, res) => res.status(404).json({ pesan: 'Endpoint tidak ditemukan.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      pesan: status >= 500 ? 'Terjadi kesalahan pada server. Silakan coba lagi.' : err.message,
    });
  });

  return app;
}
