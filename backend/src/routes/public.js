import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';
import { registerSchema, loginSchema, validate } from '../middleware/validate.js';
import { generateKode, hashPassword, verifyPassword } from '../services/credentials.js';
import { signToken } from '../middleware/auth.js';
import { sendMail } from '../services/mailer.js';
import { registrationEmail } from '../services/emailTemplates.js';

const router = Router();

const batasPendaftaran = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { pesan: 'Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.' },
});

router.get('/divisions', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nama FROM divisions ORDER BY nama');
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/register', batasPendaftaran, validate(registerSchema), async (req, res, next) => {
  const d = req.body;
  try {
    const { rows: div } = await pool.query('SELECT nama FROM divisions WHERE id = $1', [d.divisiId]);
    if (!div[0]) return res.status(422).json({ pesan: 'Pilihan divisi tidak valid.' });

    const password = generateKode(8);
    const passwordHash = await hashPassword(password);

    let applicant;
    try {
      const { rows } = await pool.query(
        `INSERT INTO applicants
           (nama_lengkap, nim, email, program_studi, division_id, link_portofolio, motivasi, password_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, nama_lengkap, nim, email`,
        [d.namaLengkap, d.nim, d.email, d.programStudi, d.divisiId, d.linkPortofolio || null, d.motivasi, passwordHash]
      );
      applicant = rows[0];
    } catch (err) {
      if (err.code === '23505') {
        const kolom = err.constraint?.includes('email') ? 'Email' : 'NIM';
        return res.status(409).json({ pesan: `${kolom} sudah terdaftar. Gunakan data yang berbeda.` });
      }
      throw err;
    }

    // Email dikirim di latar belakang; kegagalan SMTP tidak menggagalkan pendaftaran
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    const mail = registrationEmail({
      nama: applicant.nama_lengkap,
      nim: applicant.nim,
      divisi: div[0].nama,
      password,
      loginUrl,
    });
    sendMail({ to: applicant.email, ...mail }).catch((e) =>
      console.error(`[email] Gagal mengirim konfirmasi ke ${applicant.email}:`, e.message)
    );

    res.status(201).json({
      pesan: 'Pendaftaran berhasil! Cek email Anda untuk kata sandi akun CBT.',
      data: { id: applicant.id, nim: applicant.nim },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', batasPendaftaran, validate(loginSchema), async (req, res, next) => {
  try {
    const { nim, password } = req.body;
    const { rows } = await pool.query(
      `SELECT a.id, a.nama_lengkap, a.nim, a.status, a.password_hash, d.nama AS divisi
         FROM applicants a JOIN divisions d ON d.id = a.division_id
        WHERE a.nim = $1`,
      [nim]
    );
    const ap = rows[0];
    const ok = ap && (await verifyPassword(password.trim().toUpperCase(), ap.password_hash));
    if (!ok) return res.status(401).json({ pesan: 'NIM atau kata sandi salah.' });

    res.json({
      token: signToken({ id: ap.id, role: 'applicant' }),
      peserta: { id: ap.id, namaLengkap: ap.nama_lengkap, nim: ap.nim, divisi: ap.divisi, status: ap.status },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
