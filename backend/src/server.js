import 'dotenv/config';
import { createApp } from './app.js';
import { startScheduler } from './services/scheduler.js';

for (const key of ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_TOKEN']) {
  if (!process.env[key]) {
    console.error(`Variabel lingkungan ${key} belum diatur. Salin .env.example menjadi .env.`);
    process.exit(1);
  }
}

const port = Number(process.env.PORT || 4000);
createApp().listen(port, () => {
  console.log(`API Polinema Mengajar berjalan di http://localhost:${port}`);
  startScheduler();
});
