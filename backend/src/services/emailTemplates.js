// Template email HTML berbahasa Indonesia untuk Polinema Mengajar
const BRAND = '#1d4ed8';
const BRAND_DARK = '#1e3a8a';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatWaktu(date) {
  const d = new Date(date);
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
  const jam = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
    .format(d)
    .replace('.', ':');
  return `${tanggal}, pukul ${jam} WIB`;
}

function layout({ judul, isi }) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(judul)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:${BRAND};padding:24px 28px;">
          <div style="color:#bfdbfe;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Open Recruitment</div>
          <div style="color:#ffffff;font-size:22px;font-weight:bold;margin-top:4px;">Polinema Mengajar</div>
        </td></tr>
        <tr><td style="padding:28px;font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND_DARK};">${esc(judul)}</h1>
          ${isi}
        </td></tr>
        <tr><td style="background:#f8fafc;padding:18px 28px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
          Email ini dikirim otomatis oleh sistem rekrutmen Polinema Mengajar. Mohon tidak membalas email ini.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function kotak(baris) {
  const rows = baris
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#64748b;width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;font-weight:bold;vertical-align:top;">${v}</td></tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:16px 0;">${rows}</table>`;
}

function tombol(label, href) {
  return `<p style="margin:20px 0;"><a href="${esc(href)}" style="background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block;">${esc(label)}</a></p>`;
}

function aturanUjian({ durasi, jumlahSoal = 50, maksPelanggaran = 3 }) {
  const items = [
    `Ujian terdiri dari <b>${jumlahSoal} soal</b> (Numerik, Literasi, dan Kemampuan Berpikir) dengan durasi <b>${durasi} menit</b>.`,
    'Gunakan laptop/PC dengan koneksi internet stabil dan peramban (browser) terbaru.',
    'Login menggunakan NIM dan kode akses pada email ini.',
    'Selama ujian, <b>dilarang berpindah tab, meminimalkan browser, atau membuka aplikasi lain</b>.',
    `Pelanggaran ke-1 dan ke-2 akan mendapat peringatan. Pada pelanggaran ke-${maksPelanggaran}, ujian <b>otomatis diakhiri</b> dan jawaban terakhir langsung dikirim tanpa kesempatan kembali.`,
    'Jawaban tersimpan otomatis, tetapi pastikan Anda menekan tombol selesai setelah semua soal dijawab.',
    'Dilarang bekerja sama, memakai alat bantu, atau menyebarkan soal.',
  ];
  return `<ul style="padding-left:20px;margin:8px 0;">${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join('')}</ul>`;
}

export function registrationEmail({ nama, nim, divisi, password, loginUrl }) {
  return {
    subject: 'Pendaftaran Berhasil - Open Recruitment Polinema Mengajar',
    html: layout({
      judul: 'Pendaftaran Anda Berhasil Diterima',
      isi: `
        <p>Halo <b>${esc(nama)}</b>,</p>
        <p>Terima kasih telah mendaftar sebagai calon anggota <b>Polinema Mengajar</b>. Data pendaftaran Anda telah kami terima dengan rincian berikut:</p>
        ${kotak([
          ['NIM', esc(nim)],
          ['Pilihan Divisi', esc(divisi)],
        ])}
        <p>Berikut akun Anda untuk mengikuti tahap <b>Tes Berbasis Komputer (CBT)</b>:</p>
        ${kotak([
          ['NIM (nama pengguna)', esc(nim)],
          ['Kata sandi', `<span style="font-family:monospace;font-size:16px;letter-spacing:1px;">${esc(password)}</span>`],
        ])}
        <p style="color:#b45309;">Simpan kata sandi ini dengan baik. Jadwal dan tautan CBT akan dikirim melalui email pengingat (H-1 hari dan H-1 jam sebelum ujian).</p>
        ${tombol('Masuk ke Portal', loginUrl)}
        <p>Salam hangat,<br/>Panitia Open Recruitment Polinema Mengajar</p>`,
    }),
  };
}

// tipe: 'h1_day' | 'h1_hour'
export function reminderEmail({ tipe, nama, nim, kodeAkses, jadwal, cbtUrl, durasi, maksPelanggaran }) {
  const judul = tipe === 'h1_day' ? 'Pengingat: CBT Dilaksanakan Besok' : 'Pengingat: CBT Dimulai 1 Jam Lagi';
  const pembuka =
    tipe === 'h1_day'
      ? 'Ujian CBT Anda akan dilaksanakan <b>besok</b>. Mohon persiapkan perangkat dan koneksi internet Anda.'
      : 'Ujian CBT Anda akan dimulai sekitar <b>1 jam lagi</b>. Segera siapkan diri dan masuk tepat waktu.';
  return {
    subject: `${judul} - Polinema Mengajar`,
    html: layout({
      judul,
      isi: `
        <p>Halo <b>${esc(nama)}</b>,</p>
        <p>${pembuka}</p>
        ${kotak([
          ['Jadwal CBT', esc(formatWaktu(jadwal))],
          ['Durasi', `${esc(durasi)} menit`],
        ])}
        <p><b>Akses ujian:</b></p>
        ${kotak([
          ['Tautan CBT', `<a href="${esc(cbtUrl)}" style="color:${BRAND};">${esc(cbtUrl)}</a>`],
          ['NIM (nama pengguna)', esc(nim)],
          ['Kode akses', `<span style="font-family:monospace;font-size:16px;letter-spacing:1px;">${esc(kodeAkses)}</span>`],
        ])}
        <p style="font-size:13px;color:#b45309;">Catatan: kode akses pada email ini menggantikan kata sandi/kode akses sebelumnya. Gunakan yang terbaru.</p>
        ${tombol('Buka Halaman CBT', cbtUrl)}
        <p><b>Tata tertib ujian:</b></p>
        ${aturanUjian({ durasi, maksPelanggaran })}
        <p>Semoga sukses!<br/>Panitia Open Recruitment Polinema Mengajar</p>`,
    }),
  };
}

export function interviewEmail({ nama, divisi, jadwal, lokasi, nilai }) {
  return {
    subject: 'Selamat! Jadwal Wawancara - Open Recruitment Polinema Mengajar',
    html: layout({
      judul: 'Selamat, Anda Lolos ke Tahap Wawancara',
      isi: `
        <p>Halo <b>${esc(nama)}</b>,</p>
        <p>Selamat! Anda dinyatakan <b>lolos tahap Tes Berbasis Komputer (CBT)</b>${
          nilai != null ? ` dengan nilai <b>${esc(nilai)}</b>` : ''
        } dan berhak melanjutkan ke tahap <b>wawancara</b>.</p>
        ${kotak([
          ['Divisi Pilihan', esc(divisi)],
          ['Jadwal Wawancara', esc(formatWaktu(jadwal))],
          ['Lokasi / Tautan', esc(lokasi)],
        ])}
        <p><b>Hal yang perlu disiapkan:</b></p>
        <ul style="padding-left:20px;margin:8px 0;">
          <li style="margin-bottom:6px;">Hadir 10 menit sebelum jadwal dimulai.</li>
          <li style="margin-bottom:6px;">Bawa Kartu Tanda Mahasiswa (KTM) dan berpakaian rapi serta sopan.</li>
          <li style="margin-bottom:6px;">Pelajari kembali motivasi dan portofolio yang Anda kirimkan.</li>
        </ul>
        <p>Jika berhalangan hadir, segera hubungi panitia agar jadwal dapat diatur ulang.</p>
        <p>Sampai jumpa,<br/>Panitia Open Recruitment Polinema Mengajar</p>`,
    }),
  };
}
