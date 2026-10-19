-- Polinema Mengajar - Skema PostgreSQL (ternormalisasi)
-- Jalankan: psql -U postgres -d polinema_mengajar -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS cbt_scores CASCADE;
DROP TABLE IF EXISTS cbt_responses CASCADE;
DROP TABLE IF EXISTS cbt_questions CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS divisions CASCADE;

-- Master divisi (menghindari duplikasi teks divisi di tabel applicants)
CREATE TABLE divisions (
  id    SERIAL PRIMARY KEY,
  nama  VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO divisions (nama) VALUES
  ('Pengajaran & Kurikulum'),
  ('Hubungan Masyarakat'),
  ('Media Kreatif'),
  ('Kemitraan & Sekolah Binaan'),
  ('Sumber Daya Manusia'),
  ('Keuangan & Administrasi');

CREATE TABLE applicants (
  id              SERIAL PRIMARY KEY,
  nama_lengkap    VARCHAR(150) NOT NULL,
  nim             VARCHAR(20)  NOT NULL UNIQUE,
  email           VARCHAR(150) NOT NULL UNIQUE,
  program_studi   VARCHAR(150) NOT NULL,
  division_id     INTEGER NOT NULL REFERENCES divisions(id),
  link_portofolio TEXT,
  motivasi        TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'terdaftar'
                  CHECK (status IN ('terdaftar','ujian','lulus_cbt','tidak_lulus','wawancara')),
  jadwal_cbt      TIMESTAMPTZ,
  jadwal_wawancara TIMESTAMPTZ,
  lokasi_wawancara TEXT,
  cbt_started_at   TIMESTAMPTZ,              -- waktu peserta memulai ujian (sumber kebenaran timer)
  cbt_violations   INTEGER NOT NULL DEFAULT 0, -- jumlah pelanggaran tercatat di server
  reminder_h1_day_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_h1_hour_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cbt_questions (
  id            SERIAL PRIMARY KEY,
  nomor         INTEGER NOT NULL UNIQUE CHECK (nomor BETWEEN 1 AND 50),
  kategori      VARCHAR(30) NOT NULL
                CHECK (kategori IN ('Numerik','Literasi','Kemampuan Berpikir')),
  pertanyaan    TEXT NOT NULL,
  opsi_a        TEXT NOT NULL,
  opsi_b        TEXT NOT NULL,
  opsi_c        TEXT NOT NULL,
  opsi_d        TEXT NOT NULL,
  jawaban_benar CHAR(1) NOT NULL CHECK (jawaban_benar IN ('A','B','C','D'))
);

-- Satu peserta, satu jawaban per soal; upsert untuk autosave
CREATE TABLE cbt_responses (
  id            SERIAL PRIMARY KEY,
  applicant_id  INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL REFERENCES cbt_questions(id) ON DELETE CASCADE,
  jawaban       CHAR(1) CHECK (jawaban IN ('A','B','C','D')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (applicant_id, question_id)
);

CREATE TABLE cbt_scores (
  id               SERIAL PRIMARY KEY,
  applicant_id     INTEGER NOT NULL UNIQUE REFERENCES applicants(id) ON DELETE CASCADE,
  skor_numerik     INTEGER NOT NULL DEFAULT 0,
  skor_literasi    INTEGER NOT NULL DEFAULT 0,
  skor_berpikir    INTEGER NOT NULL DEFAULT 0,
  total_benar      INTEGER NOT NULL DEFAULT 0,
  nilai_akhir      NUMERIC(5,2) NOT NULL DEFAULT 0,
  jumlah_pelanggaran INTEGER NOT NULL DEFAULT 0,
  alasan_selesai   VARCHAR(20) NOT NULL DEFAULT 'normal'
                   CHECK (alasan_selesai IN ('normal','waktu_habis','pelanggaran')),
  waktu_mulai      TIMESTAMPTZ NOT NULL,
  waktu_selesai    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_responses_applicant ON cbt_responses(applicant_id);
CREATE INDEX idx_applicants_jadwal   ON applicants(jadwal_cbt);
CREATE INDEX idx_applicants_status   ON applicants(status);
