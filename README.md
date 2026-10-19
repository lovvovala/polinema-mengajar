# Polinema Mengajar: Open Recruitment & CBT

Aplikasi rekrutmen dan Tes Berbasis Komputer (CBT) untuk organisasi **Polinema Mengajar**.
Seluruh teks antarmuka dan email berbahasa Indonesia.

- **Frontend:** React 18 + Vite + Tailwind CSS + SweetAlert2
- **Backend:** Node.js + Express + PostgreSQL + Nodemailer + node-cron

## Menjalankan

### 1. Database
```bash
createdb polinema_mengajar
cd backend
cp .env.example .env        # isi DATABASE_URL, JWT_SECRET, ADMIN_TOKEN, SMTP_*
npm install
npm run db:init             # membuat tabel
npm run db:seed             # memasukkan 50 soal CBT
```

### 2. Backend
```bash
npm run dev                 # http://localhost:4000
```

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api -> :4000)
```

Untuk uji coba lokal tanpa menunggu jadwal, set `CBT_OPEN_ALWAYS=true` di `backend/.env`.
**Jangan aktifkan di produksi.**

## Alur penggunaan

1. Pelamar mengisi `/daftar` (4 langkah, progres tersimpan otomatis di `localStorage`).
2. Sistem mengirim email konfirmasi berisi kata sandi akun.
3. Admin masuk di `/admin` (token dari `ADMIN_TOKEN`), lalu menetapkan jadwal CBT.
4. Scheduler (tiap menit) mengirim pengingat **H-1 hari** dan **H-1 jam** berisi tautan CBT, NIM, kode akses baru, dan tata tertib.
5. Peserta login, membuka `/dashboard`, lalu memulai ujian di `/ujian`.
6. Admin menetapkan nilai kelulusan, lalu mengirim jadwal wawancara ke yang lulus (email otomatis).

## Skema database

| Tabel | Isi |
|---|---|
| `divisions` | Master divisi (dropdown pendaftaran) |
| `applicants` | Data pelamar, status, jadwal, waktu mulai ujian, jumlah pelanggaran |
| `cbt_questions` | 50 soal, 4 opsi, kunci jawaban (tidak pernah dikirim ke klien) |
| `cbt_responses` | Jawaban per peserta per soal (`UNIQUE (applicant_id, question_id)`, upsert untuk autosave) |
| `cbt_scores` | Nilai akhir per kategori, jumlah pelanggaran, alasan selesai; FK ke `applicants` |

## Endpoint utama

| Metode | Path | Fungsi |
|---|---|---|
| GET | `/api/divisions` | Daftar divisi |
| POST | `/api/register` | Pendaftaran + email konfirmasi |
| POST | `/api/login` | Login peserta (NIM + kata sandi) |
| GET | `/api/cbt/status` | Status & jadwal peserta |
| POST | `/api/cbt/start` | Mulai/lanjutkan ujian, mengembalikan soal + jawaban tersimpan |
| GET | `/api/cbt/questions` | Muat ulang soal setelah refresh |
| PUT | `/api/cbt/answers` | Autosave satu jawaban |
| POST | `/api/cbt/violation` | Catat pelanggaran di server |
| POST | `/api/cbt/submit` | Submit akhir / `forceSubmit`, menghitung nilai |
| GET | `/api/admin/applicants` | Daftar pelamar + nilai (header `x-admin-token`) |
| PUT | `/api/admin/applicants/:id/schedule` | Jadwal CBT per pelamar |
| PUT | `/api/admin/schedule-all` | Jadwal CBT untuk semua yang belum dijadwalkan |
| POST | `/api/admin/evaluate` | Tetapkan lulus/tidak lulus berdasarkan nilai minimum |
| POST | `/api/admin/applicants/:id/interview` | Kirim jadwal wawancara (lulus CBT) |

## Anti-curang

`useAntiCheat` mendengarkan `document visibilitychange` dan `window blur`.
Keduanya sering menyala bersamaan, jadi dihitung sebagai satu pelanggaran sampai peserta kembali.

- Pelanggaran 1 dan 2: modal SweetAlert yang memblokir (tidak bisa ditutup dengan Esc/klik luar).
- Pelanggaran 3: `forceSubmit()` langsung mengirim jawaban terakhir ke server dan menampilkan layar "Ujian Berakhir" tanpa jalan kembali.
- Penghitung juga dicatat di server (`cbt_violations`), sehingga refresh halaman tidak mereset pelanggaran.
- Timer dihitung server dari `cbt_started_at`; saat waktu habis server menutup ujian sendiri.

## Catatan keamanan dan batasan

- Anti-curang berbasis browser **tidak dapat sepenuhnya** mencegah kecurangan (misalnya perangkat kedua). Fitur ini adalah pencegah, bukan jaminan.
- Kata sandi disimpan sebagai hash bcrypt. Setiap email pengingat menerbitkan **kode akses baru** (kode lama tidak berlaku), karena kata sandi asli tidak dapat dikirim ulang.
- Token admin bersifat statis (`ADMIN_TOKEN`); untuk produksi, ganti dengan akun admin berbasis peran.
- Aktifkan HTTPS dan atur `CLIENT_URL` ke domain produksi.
- Form pendaftaran menambahkan kolom **Email** (di luar daftar awal) karena dibutuhkan untuk seluruh pengiriman email.
