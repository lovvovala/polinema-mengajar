import { pool } from '../config/db.js';

export const TOTAL_SOAL = 50;

export function durasiMenit() {
  return Number(process.env.CBT_DURATION_MINUTES || 90);
}

export function maksPelanggaran() {
  return Number(process.env.MAX_VIOLATIONS || 3);
}

/**
 * Menyelesaikan ujian: menghitung nilai dari jawaban yang TERSIMPAN di database
 * (ditambah jawaban terakhir yang dikirim klien), lalu menyimpan ke cbt_scores.
 * Idempoten: jika skor sudah ada, kembalikan skor yang ada.
 */
export async function finalizeExam(applicantId, { jawaban = [], pelanggaran = 0, alasan = 'normal' } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kunci baris peserta agar submit ganda tidak menghasilkan skor ganda
    const { rows: apRows } = await client.query(
      'SELECT id, cbt_started_at, cbt_violations FROM applicants WHERE id = $1 FOR UPDATE',
      [applicantId]
    );
    const ap = apRows[0];
    if (!ap) throw Object.assign(new Error('Peserta tidak ditemukan.'), { status: 404 });

    const { rows: existing } = await client.query('SELECT * FROM cbt_scores WHERE applicant_id = $1', [applicantId]);
    if (existing[0]) {
      await client.query('COMMIT');
      return existing[0];
    }
    if (!ap.cbt_started_at) throw Object.assign(new Error('Ujian belum dimulai.'), { status: 400 });

    // Simpan jawaban terakhir dari klien (jika ada) sebelum menghitung
    for (const j of jawaban) {
      await client.query(
        `INSERT INTO cbt_responses (applicant_id, question_id, jawaban)
         SELECT $1, q.id, $3 FROM cbt_questions q WHERE q.id = $2
         ON CONFLICT (applicant_id, question_id)
         DO UPDATE SET jawaban = EXCLUDED.jawaban, updated_at = NOW()`,
        [applicantId, j.questionId, j.jawaban]
      );
    }

    const { rows: hitung } = await client.query(
      `SELECT q.kategori,
              COUNT(*) FILTER (WHERE r.jawaban = q.jawaban_benar)::int AS benar
         FROM cbt_questions q
         LEFT JOIN cbt_responses r ON r.question_id = q.id AND r.applicant_id = $1
        GROUP BY q.kategori`,
      [applicantId]
    );
    const per = Object.fromEntries(hitung.map((h) => [h.kategori, h.benar]));
    const skorNumerik = per['Numerik'] || 0;
    const skorLiterasi = per['Literasi'] || 0;
    const skorBerpikir = per['Kemampuan Berpikir'] || 0;
    const totalBenar = skorNumerik + skorLiterasi + skorBerpikir;
    const nilaiAkhir = Math.round((totalBenar / TOTAL_SOAL) * 10000) / 100;
    const pelanggaranFinal = Math.max(Number(pelanggaran) || 0, ap.cbt_violations);

    const { rows: saved } = await client.query(
      `INSERT INTO cbt_scores
         (applicant_id, skor_numerik, skor_literasi, skor_berpikir, total_benar, nilai_akhir,
          jumlah_pelanggaran, alasan_selesai, waktu_mulai)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [applicantId, skorNumerik, skorLiterasi, skorBerpikir, totalBenar, nilaiAkhir, pelanggaranFinal, alasan, ap.cbt_started_at]
    );

    await client.query('COMMIT');
    return saved[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
