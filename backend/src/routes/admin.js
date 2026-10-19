import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAdmin } from '../middleware/auth.js';
import { scheduleSchema, interviewSchema, validate } from '../middleware/validate.js';
import { sendMail } from '../services/mailer.js';
import { interviewEmail } from '../services/emailTemplates.js';

const router = Router();
router.use(requireAdmin);

// Daftar pelamar beserta nilai CBT
router.get('/applicants', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.nama_lengkap, a.nim, a.email, a.program_studi, d.nama AS divisi,
              a.link_portofolio, a.status, a.jadwal_cbt, a.jadwal_wawancara, a.lokasi_wawancara,
              s.total_benar, s.nilai_akhir, s.skor_numerik, s.skor_literasi, s.skor_berpikir,
              s.jumlah_pelanggaran, s.alasan_selesai
         FROM applicants a
         JOIN divisions d ON d.id = a.division_id
         LEFT JOIN cbt_scores s ON s.applicant_id = a.id
        ORDER BY s.nilai_akhir DESC NULLS LAST, a.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// Atur jadwal CBT (mereset flag pengingat)
router.put('/applicants/:id/schedule', validate(scheduleSchema), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE applicants
          SET jadwal_cbt = $1, reminder_h1_day_sent = FALSE, reminder_h1_hour_sent = FALSE
        WHERE id = $2`,
      [req.body.jadwalCbt, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ pesan: 'Pelamar tidak ditemukan.' });
    res.json({ pesan: 'Jadwal CBT berhasil disimpan.' });
  } catch (err) {
    next(err);
  }
});

// Atur jadwal CBT untuk semua pelamar yang belum dijadwalkan
router.put('/schedule-all', validate(scheduleSchema), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE applicants
          SET jadwal_cbt = $1, reminder_h1_day_sent = FALSE, reminder_h1_hour_sent = FALSE
        WHERE jadwal_cbt IS NULL AND status = 'terdaftar'`,
      [req.body.jadwalCbt]
    );
    res.json({ pesan: `Jadwal CBT ditetapkan untuk ${rowCount} pelamar.` });
  } catch (err) {
    next(err);
  }
});

// Tetapkan kelulusan CBT berdasarkan nilai ambang batas
router.post(
  '/evaluate',
  validate(z.object({ nilaiLulus: z.coerce.number().min(0).max(100) })),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `UPDATE applicants a
            SET status = CASE WHEN s.nilai_akhir >= $1 THEN 'lulus_cbt' ELSE 'tidak_lulus' END
           FROM cbt_scores s
          WHERE s.applicant_id = a.id AND a.status IN ('ujian','lulus_cbt','tidak_lulus')
          RETURNING a.status`,
        [req.body.nilaiLulus]
      );
      const lulus = rows.filter((r) => r.status === 'lulus_cbt').length;
      res.json({ pesan: `Evaluasi selesai: ${lulus} lulus, ${rows.length - lulus} tidak lulus.`, lulus, total: rows.length });
    } catch (err) {
      next(err);
    }
  }
);

// Kirim jadwal wawancara (hanya untuk yang lulus CBT)
router.post('/applicants/:id/interview', validate(interviewSchema), async (req, res, next) => {
  try {
    const { jadwalWawancara, lokasi } = req.body;
    const { rows } = await pool.query(
      `UPDATE applicants a
          SET jadwal_wawancara = $1, lokasi_wawancara = $2, status = 'wawancara'
         FROM divisions d
        WHERE a.id = $3 AND d.id = a.division_id AND a.status IN ('lulus_cbt','wawancara')
        RETURNING a.nama_lengkap, a.email, d.nama AS divisi,
                  (SELECT nilai_akhir FROM cbt_scores WHERE applicant_id = a.id) AS nilai`,
      [jadwalWawancara, lokasi, req.params.id]
    );
    if (!rows[0]) {
      return res.status(409).json({ pesan: 'Pelamar tidak ditemukan atau belum dinyatakan lulus CBT.' });
    }
    const ap = rows[0];
    const mail = interviewEmail({
      nama: ap.nama_lengkap,
      divisi: ap.divisi,
      jadwal: jadwalWawancara,
      lokasi,
      nilai: ap.nilai,
    });
    await sendMail({ to: ap.email, ...mail });
    res.json({ pesan: `Jadwal wawancara telah dikirim ke ${ap.email}.` });
  } catch (err) {
    next(err);
  }
});

export default router;
