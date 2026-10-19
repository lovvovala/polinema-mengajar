import cron from 'node-cron';
import { pool } from '../config/db.js';
import { sendMail } from './mailer.js';
import { reminderEmail } from './emailTemplates.js';
import { generateKode, hashPassword } from './credentials.js';
import { durasiMenit, maksPelanggaran } from './scoring.js';

const TIPE = {
  h1_day: {
    kolom: 'reminder_h1_day_sent',
    // 1 jam < sisa waktu <= 24 jam
    kondisi: `jadwal_cbt <= NOW() + INTERVAL '24 hours' AND jadwal_cbt > NOW() + INTERVAL '1 hour'`,
  },
  h1_hour: {
    kolom: 'reminder_h1_hour_sent',
    // 0 < sisa waktu <= 1 jam
    kondisi: `jadwal_cbt <= NOW() + INTERVAL '1 hour' AND jadwal_cbt > NOW() - INTERVAL '5 minutes'`,
  },
};

async function kirimPengingat(tipe) {
  const { kolom, kondisi } = TIPE[tipe];

  // "Klaim" atomik: flag di-set sebelum kirim agar tidak terkirim ganda
  // meskipun ada lebih dari satu instance server.
  const { rows } = await pool.query(
    `UPDATE applicants
        SET ${kolom} = TRUE
      WHERE ${kolom} = FALSE
        AND jadwal_cbt IS NOT NULL
        AND cbt_started_at IS NULL
        AND ${kondisi}
      RETURNING id, nama_lengkap, nim, email, jadwal_cbt`
  );

  for (const ap of rows) {
    try {
      // Terbitkan kode akses baru agar kredensial di email selalu valid
      const kodeAkses = generateKode(8);
      await pool.query('UPDATE applicants SET password_hash = $1 WHERE id = $2', [
        await hashPassword(kodeAkses),
        ap.id,
      ]);

      const mail = reminderEmail({
        tipe,
        nama: ap.nama_lengkap,
        nim: ap.nim,
        kodeAkses,
        jadwal: ap.jadwal_cbt,
        cbtUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
        durasi: durasiMenit(),
        maksPelanggaran: maksPelanggaran(),
      });
      await sendMail({ to: ap.email, ...mail });
      console.log(`[scheduler] Pengingat ${tipe} terkirim ke ${ap.email}`);
    } catch (err) {
      console.error(`[scheduler] Gagal kirim ${tipe} ke ${ap.email}: ${err.message}`);
      // Kembalikan flag agar dicoba lagi pada siklus berikutnya
      await pool.query(`UPDATE applicants SET ${kolom} = FALSE WHERE id = $1`, [ap.id]);
    }
  }
}

export function startScheduler() {
  // Setiap menit
  cron.schedule('* * * * *', async () => {
    try {
      await kirimPengingat('h1_day');
      await kirimPengingat('h1_hour');
    } catch (err) {
      console.error('[scheduler] Kesalahan siklus pengingat:', err.message);
    }
  });
  console.log('[scheduler] Pengingat email H-1 hari & H-1 jam aktif.');
}
