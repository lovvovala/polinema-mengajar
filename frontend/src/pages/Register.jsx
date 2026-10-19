import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { Alert, Button, Card, Field, SelectInput, Stepper, TextArea, TextInput } from '../components/ui';

const LANGKAH = ['Data Diri', 'Divisi & Portofolio', 'Motivasi', 'Tinjau & Kirim'];
const MIN_MOTIVASI = 50;

const AWAL = {
  step: 0,
  form: {
    namaLengkap: '',
    nim: '',
    email: '',
    programStudi: '',
    divisiId: '',
    linkPortofolio: '',
    motivasi: '',
  },
};

// Validasi per langkah (mencerminkan validasi server)
function validasi(step, f) {
  const e = {};
  if (step === 0) {
    if (f.namaLengkap.trim().length < 3) e.namaLengkap = 'Nama lengkap minimal 3 karakter.';
    if (!/^\d{8,15}$/.test(f.nim.trim())) e.nim = 'NIM harus berupa angka (8-15 digit).';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Format email tidak valid.';
    if (f.programStudi.trim().length < 3) e.programStudi = 'Program studi wajib diisi.';
  }
  if (step === 1) {
    if (!f.divisiId) e.divisiId = 'Silakan pilih divisi.';
    if (f.linkPortofolio.trim()) {
      try {
        const u = new URL(f.linkPortofolio.trim());
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
      } catch {
        e.linkPortofolio = 'Link harus diawali http:// atau https://';
      }
    }
  }
  if (step === 2) {
    if (f.motivasi.trim().length < MIN_MOTIVASI) e.motivasi = `Motivasi minimal ${MIN_MOTIVASI} karakter.`;
  }
  return e;
}

export default function Register() {
  // Auto-save: setiap ketikan langsung tersinkron ke localStorage
  const [data, setData, { dipulihkan, tersimpanPada, hapus }] = useAutoSave('pm_form_pendaftaran', AWAL);
  const { step, form } = data;

  const [divisi, setDivisi] = useState([]);
  const [galat, setGalat] = useState({});
  const [galatServer, setGalatServer] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  useEffect(() => {
    api('/divisions')
      .then((r) => setDivisi(r.data))
      .catch(() => setGalatServer('Gagal memuat daftar divisi. Muat ulang halaman.'));
  }, []);

  useEffect(() => {
    if (dipulihkan && (data.form.namaLengkap || data.form.nim || data.step > 0)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Progres pendaftaran sebelumnya dipulihkan',
        showConfirmButton: false,
        timer: 3500,
      });
    }
    // hanya saat pertama kali dimuat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ubah = (e) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, form: { ...d.form, [name]: value } }));
    if (galat[name]) setGalat((g) => ({ ...g, [name]: undefined }));
  };

  const keStep = (n) => setData((d) => ({ ...d, step: n }));

  function lanjut() {
    const e = validasi(step, form);
    setGalat(e);
    if (Object.keys(e).length === 0) keStep(step + 1);
  }

  async function kirim() {
    // validasi ulang semua langkah
    for (let i = 0; i < 3; i++) {
      const e = validasi(i, form);
      if (Object.keys(e).length) {
        setGalat(e);
        keStep(i);
        return;
      }
    }
    const konfirmasi = await Swal.fire({
      icon: 'question',
      title: 'Kirim pendaftaran?',
      text: 'Pastikan seluruh data sudah benar. Data tidak dapat diubah setelah dikirim.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim',
      cancelButtonText: 'Periksa Lagi',
      confirmButtonColor: '#1d4ed8',
    });
    if (!konfirmasi.isConfirmed) return;

    setMengirim(true);
    setGalatServer('');
    try {
      await api('/register', {
        method: 'POST',
        body: {
          ...form,
          divisiId: Number(form.divisiId),
          linkPortofolio: form.linkPortofolio.trim(),
        },
      });
      hapus(); // progres tidak lagi diperlukan
      setBerhasil(true);
    } catch (err) {
      setGalatServer(err.message);
      Swal.fire({ icon: 'error', title: 'Pendaftaran gagal', text: err.message, confirmButtonColor: '#1d4ed8' });
    } finally {
      setMengirim(false);
    }
  }

  if (berhasil) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14">
        <Card className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <h1 className="mt-4 text-2xl font-extrabold">Pendaftaran Berhasil!</h1>
          <p className="mt-2 text-slate-600">
            Kami telah mengirim email konfirmasi berisi kata sandi akun CBT Anda. Periksa kotak masuk (dan folder spam).
          </p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            Ke Halaman Masuk
          </Link>
        </Card>
      </div>
    );
  }

  const namaDivisi = divisi.find((d) => String(d.id) === String(form.divisiId))?.nama;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Form Pendaftaran</h1>
      <p className="mt-1 text-sm text-slate-600">Open Recruitment Polinema Mengajar</p>

      <Card className="mt-6">
        <Stepper langkah={LANGKAH} aktif={step} />

        <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>Langkah {step + 1} dari {LANGKAH.length}</span>
          <span aria-live="polite">
            {tersimpanPada ? '✓ Tersimpan otomatis di perangkat ini' : 'Isian Anda tersimpan otomatis'}
          </span>
        </div>

        {galatServer && <Alert tone="galat" className="mt-4">{galatServer}</Alert>}

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            step < LANGKAH.length - 1 ? lanjut() : kirim();
          }}
          noValidate
        >
          {step === 0 && (
            <>
              <Field label="Nama Lengkap" htmlFor="namaLengkap" error={galat.namaLengkap} required>
                <TextInput id="namaLengkap" name="namaLengkap" autoComplete="name" value={form.namaLengkap} onChange={ubah} error={galat.namaLengkap} placeholder="Sesuai KTM" />
              </Field>
              <Field label="NIM" htmlFor="nim" error={galat.nim} required>
                <TextInput id="nim" name="nim" inputMode="numeric" value={form.nim} onChange={ubah} error={galat.nim} placeholder="Contoh: 2441720001" />
              </Field>
              <Field label="Email Aktif" htmlFor="email" error={galat.email} hint="Kata sandi CBT dan semua pemberitahuan dikirim ke email ini." required>
                <TextInput id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={ubah} error={galat.email} placeholder="nama@email.com" />
              </Field>
              <Field label="Program Studi" htmlFor="programStudi" error={galat.programStudi} required>
                <TextInput id="programStudi" name="programStudi" value={form.programStudi} onChange={ubah} error={galat.programStudi} placeholder="Contoh: D4 Teknik Informatika" />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Pilihan Divisi" htmlFor="divisiId" error={galat.divisiId} required>
                <SelectInput id="divisiId" name="divisiId" value={form.divisiId} onChange={ubah} error={galat.divisiId}>
                  <option value="">-- Pilih divisi --</option>
                  {divisi.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Link Portofolio" htmlFor="linkPortofolio" error={galat.linkPortofolio} hint="Opsional. Tautan Google Drive, GitHub, Behance, dan sejenisnya (pastikan dapat diakses publik).">
                <TextInput id="linkPortofolio" name="linkPortofolio" type="url" value={form.linkPortofolio} onChange={ubah} error={galat.linkPortofolio} placeholder="https://..." />
              </Field>
            </>
          )}

          {step === 2 && (
            <Field
              label="Motivasi"
              htmlFor="motivasi"
              error={galat.motivasi}
              hint={`${form.motivasi.trim().length}/${MIN_MOTIVASI} karakter minimum`}
              required
            >
              <TextArea id="motivasi" name="motivasi" rows={8} value={form.motivasi} onChange={ubah} error={galat.motivasi} placeholder="Ceritakan alasan Anda ingin bergabung dengan Polinema Mengajar dan kontribusi yang ingin diberikan." />
            </Field>
          )}

          {step === 3 && (
            <dl className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
              {[
                ['Nama Lengkap', form.namaLengkap],
                ['NIM', form.nim],
                ['Email', form.email],
                ['Program Studi', form.programStudi],
                ['Pilihan Divisi', namaDivisi || '-'],
                ['Link Portofolio', form.linkPortofolio || '-'],
                ['Motivasi', form.motivasi],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="text-sm font-semibold text-slate-500">{k}</dt>
                  <dd className="whitespace-pre-line break-words text-sm sm:col-span-2">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="secondary" onClick={() => keStep(step - 1)} disabled={step === 0}>
              Kembali
            </Button>
            {step < LANGKAH.length - 1 ? (
              <Button type="submit">Lanjut</Button>
            ) : (
              <Button type="submit" loading={mengirim}>Kirim Pendaftaran</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
