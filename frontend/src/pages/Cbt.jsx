import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { Alert, Badge, Button, LayarMemuat } from '../components/ui';

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

function formatWaktu(detik) {
  const j = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const s = detik % 60;
  const p = (n) => String(n).padStart(2, '0');
  return j > 0 ? `${p(j)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

const PESAN_SELESAI = {
  pelanggaran: {
    judul: 'Ujian Anda Telah Diakhiri',
    isi: 'Anda terdeteksi meninggalkan halaman ujian sebanyak batas maksimum pelanggaran. Ujian diakhiri secara otomatis dan jawaban terakhir Anda telah dikirim.',
  },
  waktu_habis: {
    judul: 'Waktu Ujian Telah Habis',
    isi: 'Waktu pengerjaan telah berakhir. Jawaban Anda telah dikirim secara otomatis.',
  },
  normal: {
    judul: 'Ujian Telah Selesai',
    isi: 'Terima kasih telah menyelesaikan ujian. Jawaban Anda telah dikirim.',
  },
};

export default function Cbt() {
  const { token, peserta, keluar } = useAuth();
  const navigate = useNavigate();

  const [fase, setFase] = useState('memuat'); // memuat | ujian | selesai | galat
  const [galat, setGalat] = useState('');
  const [soal, setSoal] = useState([]);
  const [jawaban, setJawaban] = useState({}); // { [questionId]: 'A'..'D' }
  const [ragu, setRagu] = useState({});
  const [indeks, setIndeks] = useState(0);
  const [sisa, setSisa] = useState(0);
  const [pelanggaran, setPelanggaran] = useState(0);
  const [maksPelanggaran, setMaksPelanggaran] = useState(3);
  const [simpan, setSimpan] = useState('tersimpan'); // tersimpan | menyimpan | gagal
  const [alasanSelesai, setAlasanSelesai] = useState('normal');
  const [kirim, setKirim] = useState('mengirim'); // mengirim | terkirim | gagal

  // Ref agar callback selalu membaca nilai terbaru tanpa stale closure
  const jawabanRef = useRef({});
  const pelanggaranRef = useRef(0);
  const maksRef = useRef(3);
  const selesaiRef = useRef(false);
  const berakhirPadaRef = useRef(0);
  const tertundaRef = useRef(new Map()); // jawaban yang belum berhasil tersimpan ke server

  /* ---------------- Memuat sesi ---------------- */
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await api('/cbt/start', { method: 'POST', token });
        if (batal) return;
        setSoal(res.soal);
        setJawaban(res.jawaban);
        jawabanRef.current = res.jawaban;
        setPelanggaran(res.pelanggaran);
        pelanggaranRef.current = res.pelanggaran;
        setMaksPelanggaran(res.maksPelanggaran);
        maksRef.current = res.maksPelanggaran;
        berakhirPadaRef.current = Date.now() + res.sisaDetik * 1000;
        setSisa(res.sisaDetik);
        setFase('ujian');
      } catch (err) {
        if (batal) return;
        if (err instanceof ApiError && err.status === 401) {
          keluar();
          navigate('/login', { replace: true });
        } else if (err instanceof ApiError && (err.status === 410 || err.status === 409) && err.data?.selesai) {
          selesaiRef.current = true;
          setAlasanSelesai(err.data.alasan || 'normal');
          setKirim('terkirim');
          setFase('selesai');
        } else {
          setGalat(err.message);
          setFase('galat');
        }
      }
    })();
    return () => {
      batal = true;
    };
  }, [token, keluar, navigate]);

  /* ---------------- Pengiriman akhir (forceSubmit) ---------------- */
  const kirimAkhir = useCallback(
    async (alasan) => {
      if (selesaiRef.current) return; // cegah pemanggilan ganda
      selesaiRef.current = true;
      Swal.close();
      setAlasanSelesai(alasan);
      setKirim('mengirim');
      setFase('selesai'); // layar akhir: tidak ada jalan kembali ke ujian

      const payload = {
        jawaban: Object.entries(jawabanRef.current).map(([questionId, j]) => ({
          questionId: Number(questionId),
          jawaban: j,
        })),
        pelanggaran: pelanggaranRef.current,
        alasan,
      };

      for (let i = 0; i < 6; i++) {
        try {
          await api('/cbt/submit', { method: 'POST', body: payload, token });
          setKirim('terkirim');
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429) {
            // 4xx selain rate-limit: sesi sudah selesai di server atau token tidak valid
            setKirim('terkirim');
            return;
          }
          await tunggu(1500 * (i + 1));
        }
      }
      setKirim('gagal');
    },
    [token]
  );

  const forceSubmit = useCallback(() => kirimAkhir('pelanggaran'), [kirimAkhir]);

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (fase !== 'ujian') return undefined;
    const id = setInterval(() => {
      const detik = Math.max(0, Math.ceil((berakhirPadaRef.current - Date.now()) / 1000));
      setSisa(detik);
      if (detik <= 0) kirimAkhir('waktu_habis');
    }, 1000);
    return () => clearInterval(id);
  }, [fase, kirimAkhir]);

  /* ---------------- Anti-curang ---------------- */
  const tanganiPelanggaran = useCallback(async () => {
    if (selesaiRef.current) return;
    const ke = pelanggaranRef.current + 1;
    pelanggaranRef.current = ke;
    setPelanggaran(ke);

    // Pelanggaran ke-N (batas maksimum): hentikan ujian seketika dan kirim jawaban terakhir
    if (ke >= maksRef.current) {
      forceSubmit();
      return;
    }

    api('/cbt/violation', { method: 'POST', token }).catch(() => {}); // catat di server (tahan refresh)

    await Swal.fire({
      icon: 'warning',
      title: `PELANGGARAN ${ke} DARI ${maksRef.current}`,
      html: `
        <p style="font-size:15px;line-height:1.6">
          Anda terdeteksi <b>meninggalkan halaman ujian</b> (berpindah tab, meminimalkan browser, atau membuka aplikasi lain).
        </p>
        <p style="margin-top:10px;font-size:15px;color:#b91c1c">
          <b>Jika terjadi ${maksRef.current - ke} pelanggaran lagi, ujian akan diakhiri otomatis</b> dan Anda tidak dapat kembali.
        </p>`,
      confirmButtonText: 'Saya Mengerti, Kembali ke Ujian',
      confirmButtonColor: '#dc2626',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: 'rgba(15,23,42,0.92)',
    });
  }, [forceSubmit, token]);

  useAntiCheat({ enabled: fase === 'ujian', onViolation: tanganiPelanggaran });

  // Peringatan saat mencoba menutup/refresh tab ketika ujian berlangsung
  useEffect(() => {
    if (fase !== 'ujian') return undefined;
    const cegah = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', cegah);
    return () => window.removeEventListener('beforeunload', cegah);
  }, [fase]);

  /* ---------------- Autosave jawaban ke database ---------------- */
  const kirimJawaban = useCallback(
    async (questionId, nilai) => {
      try {
        await api('/cbt/answers', { method: 'PUT', body: { questionId, jawaban: nilai }, token });
        if (tertundaRef.current.get(questionId) === nilai) tertundaRef.current.delete(questionId);
        if (tertundaRef.current.size === 0) setSimpan('tersimpan');
      } catch (err) {
        if (err instanceof ApiError && err.status === 410) {
          // Server sudah menutup ujian (mis. waktu habis)
          selesaiRef.current = true;
          setAlasanSelesai(err.data?.alasan || 'waktu_habis');
          setKirim('terkirim');
          setFase('selesai');
          return;
        }
        setSimpan('gagal');
      }
    },
    [token]
  );

  const pilih = (q, huruf) => {
    const baru = jawabanRef.current[q.id] === huruf ? null : huruf; // klik ulang = batalkan pilihan
    const next = { ...jawabanRef.current };
    if (baru) next[q.id] = baru;
    else delete next[q.id];
    jawabanRef.current = next;
    setJawaban(next);
    tertundaRef.current.set(q.id, baru);
    setSimpan('menyimpan');
    kirimJawaban(q.id, baru);
  };

  // Coba ulang jawaban yang gagal tersimpan
  useEffect(() => {
    if (fase !== 'ujian') return undefined;
    const id = setInterval(() => {
      for (const [qid, nilai] of tertundaRef.current) kirimJawaban(qid, nilai);
    }, 10000);
    return () => clearInterval(id);
  }, [fase, kirimJawaban]);

  /* ---------------- Selesai manual ---------------- */
  async function selesaikan() {
    const belum = soal.length - Object.keys(jawaban).length;
    const hasil = await Swal.fire({
      icon: 'question',
      title: 'Selesaikan ujian?',
      html: belum
        ? `Masih ada <b>${belum} soal</b> yang belum dijawab. Setelah diselesaikan, Anda tidak dapat kembali.`
        : 'Semua soal telah dijawab. Setelah diselesaikan, Anda tidak dapat kembali.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesaikan',
      cancelButtonText: 'Periksa Lagi',
      confirmButtonColor: '#1d4ed8',
    });
    if (hasil.isConfirmed) kirimAkhir('normal');
  }

  /* ---------------- Turunan tampilan ---------------- */
  const kelompok = useMemo(() => {
    const peta = new Map();
    soal.forEach((s, i) => {
      if (!peta.has(s.kategori)) peta.set(s.kategori, []);
      peta.get(s.kategori).push({ ...s, i });
    });
    return [...peta.entries()];
  }, [soal]);

  /* ---------------- Render ---------------- */
  if (fase === 'memuat') return <LayarMemuat pesan="Menyiapkan ruang ujian..." />;

  if (fase === 'galat') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <Alert tone="galat">{galat}</Alert>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  if (fase === 'selesai') {
    const pesan = PESAN_SELESAI[alasanSelesai] || PESAN_SELESAI.normal;
    const bahaya = alasanSelesai === 'pelanggaran';
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-slate-200">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${bahaya ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {bahaya ? '!' : '✓'}
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">{pesan.judul}</h1>
          <p className="mt-2 text-slate-600">{pesan.isi}</p>
          <p className="mt-4 text-sm" aria-live="polite">
            {kirim === 'mengirim' && <span className="text-slate-500">Mengirim jawaban Anda ke server...</span>}
            {kirim === 'terkirim' && <span className="font-semibold text-emerald-700">✓ Jawaban berhasil tersimpan.</span>}
            {kirim === 'gagal' && (
              <span className="text-amber-700">
                Koneksi bermasalah. Jawaban Anda sudah tersimpan otomatis selama ujian; hubungi panitia bila perlu.
              </span>
            )}
          </p>
          <p className="mt-4 text-sm text-slate-500">Hasil seleksi akan diinformasikan panitia melalui email.</p>
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => {
              keluar();
              window.location.replace('/login'); // ganti riwayat agar tidak bisa kembali ke ujian
            }}
          >
            Keluar
          </Button>
        </div>
      </div>
    );
  }

  const q = soal[indeks];
  const terjawab = Object.keys(jawaban).length;
  const waktuKritis = sisa <= 300;

  return (
    <div
      className="no-select min-h-screen bg-slate-100"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* Header lengket: timer + status */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">Polinema Mengajar · CBT</p>
            <p className="truncate text-xs text-slate-500">{peserta?.namaLengkap}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline">
              <Badge tone={pelanggaran > 0 ? 'merah' : 'netral'}>Pelanggaran {pelanggaran}/{maksPelanggaran}</Badge>
            </span>
            <span className="hidden text-xs sm:inline" aria-live="polite">
              {simpan === 'menyimpan' && <span className="text-slate-500">Menyimpan...</span>}
              {simpan === 'tersimpan' && <span className="text-emerald-600">✓ Tersimpan</span>}
              {simpan === 'gagal' && <span className="text-amber-600">Gagal menyimpan, mencoba lagi...</span>}
            </span>
            <div
              role="timer"
              aria-label="Sisa waktu"
              className={`rounded-xl px-4 py-2 font-mono text-lg font-bold tabular-nums ${
                waktuKritis ? 'animate-pulse bg-red-600 text-white' : 'bg-brand-900 text-white'
              }`}
            >
              {formatWaktu(sisa)}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-12">
        {/* Area soal */}
        <section className="lg:col-span-8">
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="biru">{q.kategori}</Badge>
                <span className="text-sm font-semibold text-slate-500">
                  Soal {indeks + 1} dari {soal.length}
                </span>
              </div>
              {ragu[q.id] && <Badge tone="kuning">Ragu-ragu</Badge>}
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-900">{q.pertanyaan}</p>

            <div className="mt-6 space-y-3" role="radiogroup" aria-label="Pilihan jawaban">
              {['A', 'B', 'C', 'D'].map((h) => {
                const aktif = jawaban[q.id] === h;
                return (
                  <button
                    key={h}
                    type="button"
                    role="radio"
                    aria-checked={aktif}
                    onClick={() => pilih(q, h)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                      aktif ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        aktif ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {h}
                    </span>
                    <span className="pt-0.5 text-sm sm:text-base">{q.opsi[h]}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Button variant="secondary" onClick={() => setIndeks((i) => Math.max(0, i - 1))} disabled={indeks === 0}>
                ← Sebelumnya
              </Button>
              <Button
                variant="ghost"
                onClick={() => setRagu((r) => ({ ...r, [q.id]: !r[q.id] }))}
              >
                {ragu[q.id] ? 'Batalkan Ragu-ragu' : 'Tandai Ragu-ragu'}
              </Button>
              {indeks < soal.length - 1 ? (
                <Button onClick={() => setIndeks((i) => i + 1)}>Berikutnya →</Button>
              ) : (
                <Button onClick={selesaikan}>Selesaikan Ujian</Button>
              )}
            </div>
          </div>
        </section>

        {/* Palet navigasi soal */}
        <aside className="lg:col-span-4">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold">Navigasi Soal</h2>
              <span className="text-sm text-slate-500">{terjawab}/{soal.length} terjawab</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-brand-700" /> Dijawab</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-amber-400" /> Ragu-ragu</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-white ring-1 ring-slate-300" /> Belum</span>
            </div>

            <div className="mt-4 space-y-4">
              {kelompok.map(([kategori, daftar]) => (
                <div key={kategori}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{kategori}</p>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6 xl:grid-cols-7">
                    {daftar.map((s) => {
                      const dijawab = !!jawaban[s.id];
                      const meragukan = !!ragu[s.id];
                      const kini = s.i === indeks;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setIndeks(s.i)}
                          aria-label={`Soal ${s.nomor}${dijawab ? ', sudah dijawab' : ''}${meragukan ? ', ragu-ragu' : ''}`}
                          aria-current={kini ? 'step' : undefined}
                          className={`h-9 rounded-lg text-sm font-bold transition ${
                            meragukan
                              ? 'bg-amber-400 text-slate-900'
                              : dijawab
                              ? 'bg-brand-700 text-white'
                              : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'
                          } ${kini ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`}
                        >
                          {s.nomor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button className="mt-5 w-full" onClick={selesaikan}>Selesaikan Ujian</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
