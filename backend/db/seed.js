import 'dotenv/config';
import { pool } from '../src/config/db.js';
import { questions } from './questions.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const q of questions) {
      await client.query(
        `INSERT INTO cbt_questions
           (nomor, kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (nomor) DO UPDATE SET
           kategori = EXCLUDED.kategori,
           pertanyaan = EXCLUDED.pertanyaan,
           opsi_a = EXCLUDED.opsi_a, opsi_b = EXCLUDED.opsi_b,
           opsi_c = EXCLUDED.opsi_c, opsi_d = EXCLUDED.opsi_d,
           jawaban_benar = EXCLUDED.jawaban_benar`,
        [q.nomor, q.kategori, q.pertanyaan, q.opsi_a, q.opsi_b, q.opsi_c, q.opsi_d, q.jawaban_benar]
      );
    }
    await client.query('COMMIT');
    console.log(`Berhasil menyimpan ${questions.length} soal CBT.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed gagal:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
