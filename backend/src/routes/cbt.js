import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireApplicant } from '../middleware/auth.js';
import { answerSchema, submitSchema, validate } from '../middleware/validate.js';
import { finalizeExam, durasiMenit, maksPelanggaran, TOTAL_SOAL } from '../services/scoring.js';

const router = Router();
router.use(requireApplicant);

const SELESAI = (alasan) => ({
  selesai: true,
  alasan,
  pesan:
    alasan === 'pelanggaran'
      ? 'Ujian Anda diakhiri otomatis karena pelanggaran berulang. Jawaban terakhir telah dikirim.'
      : alasan === 'waktu_habis'
      ? 'Waktu ujian telah habis. Jawaban Anda telah dikirim.'
      : 'Ujian telah selesai. Jawaban Anda telah dikirim.',
});

async function ambilPeserta(id) {
  const { rows } = await pool.query(
    `SELECT a.id, a.nama_lengkap, a.nim, a.status, a.jadwal_cbt, a.cbt_started_at, a.cbt_violations,
            s.alasan_selesai
       FROM applicants a
       LEFT JOIN cbt_scores s ON s.applicant_id = a.id
      WHERE a.id = $1`,
    [id]
  );
  return rows[0];
}

function hitungSisaDetik(mulai) {
  const berakhir = new Date(mulai).getTime() + durasiMenit() * 60 * 1000;
  return Math.max(0, Math.floor((berakhir - Date.now()) / 1000));
}

/**
 * Memuat sesi aktif. Jika waktu habis, ujian diselesaikan otomatis oleh server.
 * Mengembalikan { ap } bila sesi masih berjalan, atau { selesai } bila sudah berakhir.
 */
async function muatSesiAktif(applicantId) {
  const ap = await ambilPeserta(applicantId);
  if (!ap) return { galat: { status: 404, pesan: 'Peserta tidak ditemukan.' } };
  if (ap.alasan_selesai) return { selesai: SELESAI(ap.alasan_selesai) };
  if (!ap.cbt_started_at) return { galat: { status: 400, pesan: 'Ujian belum dimulai.' } };
  if (hitungSisaDetik(ap.cbt_started_at) <= 0) {
    await finalizeExam(applicantId, { alasan: 'waktu_habis' });
    return { selesai: SELESAI('waktu_habis') };
  }
  return { ap };
}

async function ambilSoalDanJawaban(applicantId) {
  const [{ rows: soal }, { rows: jawab }] = await Promise.all([
    // jawaban_benar TIDAK PERNAH dikirim ke klien
    pool.query(
      `SELECT id, nomor, kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d
         FROM cbt_questions ORDER BY nomor`
    ),
    pool.query('SELECT question_id, jawaban FROM cbt_responses WHERE applicant_id = $1', [applicantId]),
  ]);
  const jawaban = Object.fromEntries(jawab.filter((j) => j.jawaban).map((j) => [j.question_id, j.jawaban]));
  return {
    soal: soal.map((s) => ({
      id: s.id,
      nomor: s.nomor,
      kategori: s.kategori,
      pertanyaan: s.pertanyaan,
      opsi: { A: s.opsi_a, B: s.opsi_b, C: s.opsi_c, D: s.opsi_d },
    })),
    jawaban,
  };
}

// Status peserta untuk halaman beranda
router.get('/status', async (req, res, next) => {
  try {
    const ap = await ambilPeserta(req.applicantId);
    if (!ap) return res.status(404).json({ pesan: 'Peserta tidak ditemukan.' });
    res.json({
      namaLengkap: ap.nama_lengkap,
      nim: ap.nim,
      status: ap.status,
      jadwalCbt: ap.jadwal_cbt,
      durasiMenit: durasiMenit(),
      jumlahSoal: TOTAL_SOAL,
      maksPelanggaran: maksPelanggaran(),
      sedangBerlangsung: !!ap.cbt_started_at && !ap.alasan_selesai,
      selesai: !!ap.alasan_selesai,
    });
  } catch (err) {
    next(err);
  }
});

// Mulai ujian (idempoten: jika sudah mulai, melanjutkan sesi)
router.post('/start', async (req, res, next) => {
  try {
    const ap = await ambilPeserta(req.applicantId);
    if (!ap) return res.status(404).json({ pesan: 'Peserta tidak ditemukan.' });
    if (ap.alasan_selesai) return res.status(409).json(SELESAI(ap.alasan_selesai));

    if (!ap.cbt_started_at) {
      const bukaSelalu = String(process.env.CBT_OPEN_ALWAYS) === 'true';
      if (!bukaSelalu) {
        if (!ap.jadwal_cbt) {
          return res.status(403).json({ pesan: 'Jadwal CBT Anda belum ditetapkan oleh panitia.' });
        }
        const jadwal = new Date(ap.jadwal_cbt).getTime();
        const batas = jadwal + Number(process.env.CBT_ENTRY_WINDOW_MINUTES || 30) * 60 * 1000;
        if (Date.now() < jadwal) {
          return res.status(403).json({ pesan: 'Ujian belum dibuka. Silakan kembali sesuai jadwal CBT Anda.' });
        }
        if (Date.now() > batas) {
          return res.status(403).json({ pesan: 'Waktu masuk ujian telah ditutup. Hubungi panitia.' });
        }
      }
      await pool.query(
        `UPDATE applicants SET cbt_started_at = NOW(), status = 'ujian'
          WHERE id = $1 AND cbt_started_at IS NULL`,
        [req.applicantId]
      );
    }

    const sesi = await muatSesiAktif(req.applicantId);
    if (sesi.galat) return res.status(sesi.galat.status).json({ pesan: sesi.galat.pesan });
    if (sesi.selesai) return res.status(410).json(sesi.selesai);

    const { soal, jawaban } = await ambilSoalDanJawaban(req.applicantId);
    res.json({
      soal,
      jawaban,
      sisaDetik: hitungSisaDetik(sesi.ap.cbt_started_at),
      pelanggaran: sesi.ap.cbt_violations,
      maksPelanggaran: maksPelanggaran(),
    });
  } catch (err) {
    next(err);
  }
});

// Ambil ulang soal & jawaban tersimpan (mis. setelah refresh)
router.get('/questions', async (req, res, next) => {
  try {
    const sesi = await muatSesiAktif(req.applicantId);
    if (sesi.galat) return res.status(sesi.galat.status).json({ pesan: sesi.galat.pesan });
    if (sesi.selesai) return res.status(410).json(sesi.selesai);

    const { soal, jawaban } = await ambilSoalDanJawaban(req.applicantId);
    res.json({
      soal,
      jawaban,
      sisaDetik: hitungSisaDetik(sesi.ap.cbt_started_at),
      pelanggaran: sesi.ap.cbt_violations,
      maksPelanggaran: maksPelanggaran(),
    });
  } catch (err) {
    next(err);
  }
});

// Autosave jawaban per soal (dipanggil setiap peserta memilih/mengubah jawaban)
router.put('/answers', validate(answerSchema), async (req, res, next) => {
  try {
    const sesi = await muatSesiAktif(req.applicantId);
    if (sesi.galat) return res.status(sesi.galat.status).json({ pesan: sesi.galat.pesan });
    if (sesi.selesai) return res.status(410).json(sesi.selesai);

    const { questionId, jawaban } = req.body;
    const { rowCount } = await pool.query(
      `INSERT INTO cbt_responses (applicant_id, question_id, jawaban)
       SELECT $1, q.id, $3 FROM cbt_questions q WHERE q.id = $2
       ON CONFLICT (applicant_id, question_id)
       DO UPDATE SET jawaban = EXCLUDED.jawaban, updated_at = NOW()`,
      [req.applicantId, questionId, jawaban]
    );
    if (!rowCount) return res.status(404).json({ pesan: 'Soal tidak ditemukan.' });
    res.json({ tersimpan: true, sisaDetik: hitungSisaDetik(sesi.ap.cbt_started_at) });
  } catch (err) {
    next(err);
  }
});

// Catat pelanggaran di server (tahan terhadap refresh); pelanggaran ke-N otomatis mengakhiri ujian
router.post('/violation', async (req, res, next) => {
  try {
    const sesi = await muatSesiAktif(req.applicantId);
    if (sesi.galat) return res.status(sesi.galat.status).json({ pesan: sesi.galat.pesan });
    if (sesi.selesai) return res.status(410).json(sesi.selesai);

    const { rows } = await pool.query(
      'UPDATE applicants SET cbt_violations = cbt_violations + 1 WHERE id = $1 RETURNING cbt_violations',
      [req.applicantId]
    );
    const jumlah = rows[0].cbt_violations;

    if (jumlah >= maksPelanggaran()) {
      await finalizeExam(req.applicantId, { pelanggaran: jumlah, alasan: 'pelanggaran' });
      return res.json({ pelanggaran: jumlah, ...SELESAI('pelanggaran') });
    }
    res.json({ pelanggaran: jumlah, selesai: false, maksPelanggaran: maksPelanggaran() });
  } catch (err) {
    next(err);
  }
});

// Submit akhir / forceSubmit: mengirim jawaban terbaru lalu menghitung nilai
router.post('/submit', validate(submitSchema), async (req, res, next) => {
  try {
    const ap = await ambilPeserta(req.applicantId);
    if (!ap) return res.status(404).json({ pesan: 'Peserta tidak ditemukan.' });
    if (ap.alasan_selesai) return res.json(SELESAI(ap.alasan_selesai));
    if (!ap.cbt_started_at) return res.status(400).json({ pesan: 'Ujian belum dimulai.' });

    const { jawaban, pelanggaran, alasan } = req.body;
    await finalizeExam(req.applicantId, { jawaban: jawaban || [], pelanggaran, alasan });
    res.json(SELESAI(alasan));
  } catch (err) {
    next(err);
  }
});

export default router;
