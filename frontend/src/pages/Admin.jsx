import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../lib/api';
import { Alert, Badge, Button, Card, Field, LayarMemuat, Logo, TextInput } from '../components/ui';

const STATUS = {
  terdaftar: { label: 'Terdaftar', tone: 'biru' },
  ujian: { label: 'Mengikuti CBT', tone: 'kuning' },
  lulus_cbt: { label: 'Lulus CBT', tone: 'hijau' },
  tidak_lulus: { label: 'Tidak Lulus', tone: 'merah' },
  wawancara: { label: 'Wawancara', tone: 'hijau' },
};

const fmt = (iso) =>
  iso
    ? new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      }).format(new Date(iso))
    : '-';

// Input datetime-local dianggap waktu WIB (UTC+7)
const keIso = (v) => `${v}:00+07:00`;

export default function Admin() {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('pm_admin') || '');
  const [masukan, setMasukan] = useState('');
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('semua');

  const muat = useCallback(
    async (tokenPakai = adminToken) => {
      setMemuat(true);
      setGalat('');
      try {
        const res = await api('/admin/applicants', { adminToken: tokenPakai });
        setData(res.data);
        sessionStorage.setItem('pm_admin', tokenPakai);
        setAdminToken(tokenPakai);
      } catch (err) {
        setData(null);
        sessionStorage.removeItem('pm_admin');
        setAdminToken('');
        setGalat(err.message);
      } finally {
        setMemuat(false);
      }
    },
    [adminToken]
  );

  useEffect(() => {
    if (adminToken) muat(adminToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aksi(fn, pesanSukses) {
    try {
      const res = await fn();
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: res?.pesan || pesanSukses, confirmButtonColor: '#1d4ed8' });
      muat();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, confirmButtonColor: '#1d4ed8' });
    }
  }

  async function aturJadwal(ap) {
    const { value, isConfirmed } = await Swal.fire({
      title: `Jadwal CBT${ap ? `: ${ap.nama_lengkap}` : ' (semua yang belum dijadwalkan)'}`,
      html: '<input id="swal-jadwal" type="datetime-local" class="swal2-input" />',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#1d4ed8',
      preConfirm: () => {
        const v = document.getElementById('swal-jadwal').value;
        if (!v) Swal.showValidationMessage('Tanggal dan jam wajib diisi (WIB).');
        return v;
      },
    });
    if (!isConfirmed) return;
    aksi(
      () =>
        ap
          ? api(`/admin/applicants/${ap.id}/schedule`, { method: 'PUT', body: { jadwalCbt: keIso(value) }, adminToken })
          : api('/admin/schedule-all', { method: 'PUT', body: { jadwalCbt: keIso(value) }, adminToken }),
      'Jadwal CBT disimpan.'
    );
  }

  async function evaluasi() {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Tetapkan Kelulusan CBT',
      text: 'Masukkan nilai minimum kelulusan (0-100).',
      input: 'number',
      inputValue: 60,
      inputAttributes: { min: 0, max: 100, step: 1 },
      showCancelButton: true,
      confirmButtonText: 'Proses',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#1d4ed8',
    });
    if (!isConfirmed) return;
    aksi(() => api('/admin/evaluate', { method: 'POST', body: { nilaiLulus: Number(value) }, adminToken }), 'Evaluasi selesai.');
  }

  async function jadwalWawancara(ap) {
    const { value, isConfirmed } = await Swal.fire({
      title: `Wawancara: ${ap.nama_lengkap}`,
      html: `
        <input id="swal-w-jadwal" type="datetime-local" class="swal2-input" />
        <input id="swal-w-lokasi" class="swal2-input" placeholder="Lokasi atau tautan (mis. Ruang A, Gd. Sipil)" />`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Kirim Email',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#1d4ed8',
      preConfirm: () => {
        const j = document.getElementById('swal-w-jadwal').value;
        const l = document.getElementById('swal-w-lokasi').value.trim();
        if (!j || l.length < 3) {
          Swal.showValidationMessage('Jadwal dan lokasi/tautan wajib diisi.');
          return false;
        }
        return { j, l };
      },
    });
    if (!isConfirmed) return;
    aksi(
      () =>
        api(`/admin/applicants/${ap.id}/interview`, {
          method: 'POST',
          body: { jadwalWawancara: keIso(value.j), lokasi: value.l },
          adminToken,
        }),
      'Email jadwal wawancara terkirim.'
    );
  }

  const tampil = useMemo(() => {
    if (!data) return [];
    const kata = cari.trim().toLowerCase();
    return data.filter(
      (a) =>
        (filter === 'semua' || a.status === filter) &&
        (!kata || a.nama_lengkap.toLowerCase().includes(kata) || a.nim.includes(kata))
    );
  }, [data, cari, filter]);

  const ringkas = useMemo(() => {
    const hitung = (s) => (data || []).filter((a) => a.status === s).length;
    return [
      ['Total Pelamar', data?.length ?? 0],
      ['Sudah CBT', (data || []).filter((a) => a.nilai_akhir != null).length],
      ['Lulus CBT', hitung('lulus_cbt') + hitung('wawancara')],
      ['Wawancara', hitung('wawancara')],
    ];
  }, [data]);

  /* ---------- Belum masuk ---------- */
  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <Logo />
          <h1 className="mt-5 text-xl font-extrabold">Masuk Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Masukkan token admin untuk mengelola rekrutmen.</p>
          {galat && <Alert tone="galat" className="mt-4">{galat}</Alert>}
          {memuat && !galat ? (
            <LayarMemuat />
          ) : (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                muat(masukan);
              }}
            >
              <Field label="Token Admin" htmlFor="tokenAdmin" required>
                <TextInput id="tokenAdmin" type="password" value={masukan} onChange={(e) => setMasukan(e.target.value)} required />
              </Field>
              <Button type="submit" loading={memuat} className="w-full">Masuk</Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  /* ---------- Dashboard admin ---------- */
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Badge tone="biru">Admin</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem('pm_admin');
                setAdminToken('');
                setData(null);
              }}
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Rekrutmen</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => muat()} loading={memuat}>Muat Ulang</Button>
            <Button variant="secondary" onClick={() => aturJadwal(null)}>Jadwalkan CBT Massal</Button>
            <Button onClick={evaluasi}>Tetapkan Kelulusan</Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ringkas.map(([k, v]) => (
            <Card key={k} className="!p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="mt-1 text-3xl font-extrabold text-brand-800">{v}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 !p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="w-full sm:w-72">
              <TextInput value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama atau NIM..." aria-label="Cari pelamar" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter status"
              className="rounded-xl border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-slate-300"
            >
              <option value="semua">Semua status</option>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">{tampil.length} pelamar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {['Pelamar', 'Divisi', 'Jadwal CBT', 'Nilai', 'Pelanggaran', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tampil.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Belum ada data.</td></tr>
                )}
                {tampil.map((a) => {
                  const st = STATUS[a.status] || STATUS.terdaftar;
                  return (
                    <tr key={a.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{a.nama_lengkap}</p>
                        <p className="text-xs text-slate-500">{a.nim} · {a.program_studi}</p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </td>
                      <td className="px-4 py-3">{a.divisi}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(a.jadwal_cbt)}</td>
                      <td className="px-4 py-3">
                        {a.nilai_akhir != null ? (
                          <>
                            <p className="font-bold">{Number(a.nilai_akhir).toFixed(2)}</p>
                            <p className="text-xs text-slate-500">N{a.skor_numerik} · L{a.skor_literasi} · B{a.skor_berpikir}</p>
                          </>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {a.alasan_selesai ? (
                          <Badge tone={a.jumlah_pelanggaran > 0 ? 'merah' : 'netral'}>
                            {a.jumlah_pelanggaran}x{a.alasan_selesai === 'pelanggaran' ? ' (diakhiri)' : ''}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {!a.alasan_selesai && (
                            <Button size="sm" variant="secondary" onClick={() => aturJadwal(a)}>Jadwal CBT</Button>
                          )}
                          {(a.status === 'lulus_cbt' || a.status === 'wawancara') && (
                            <Button size="sm" onClick={() => jadwalWawancara(a)}>
                              {a.status === 'wawancara' ? 'Ubah Wawancara' : 'Jadwal Wawancara'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
