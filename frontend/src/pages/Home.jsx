import { LinkButton } from '../components/ui';

const ALUR = [
  { no: '01', judul: 'Pendaftaran', isi: 'Isi formulir online. Progres Anda tersimpan otomatis, jadi aman jika halaman tertutup.' },
  { no: '02', judul: 'Tes Berbasis Komputer', isi: '50 soal Numerik, Literasi, dan Kemampuan Berpikir dengan sistem pengawasan otomatis.' },
  { no: '03', judul: 'Wawancara', isi: 'Peserta yang lolos CBT menerima jadwal wawancara langsung melalui email.' },
  { no: '04', judul: 'Pengumuman', isi: 'Hasil akhir seleksi diumumkan oleh panitia melalui kanal resmi.' },
];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-100">
            Open Recruitment
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Bergabung bersama Polinema Mengajar dan bagikan ilmu untuk negeri.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-100">
            Daftarkan dirimu, ikuti tes berbasis komputer, dan jadilah bagian dari mahasiswa yang berkontribusi
            langsung bagi dunia pendidikan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/daftar" size="lg" className="!bg-white !text-brand-800 hover:!bg-brand-50">
              Daftar Sekarang
            </LinkButton>
            <LinkButton to="/login" size="lg" variant="ghost" className="!text-white hover:!bg-white/10">
              Sudah mendaftar? Masuk
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight">Alur Seleksi</h2>
        <p className="mt-1 text-slate-600">Empat tahap sederhana menuju keluarga besar Polinema Mengajar.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ALUR.map((a) => (
            <div key={a.no} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
              <span className="text-3xl font-extrabold text-brand-200">{a.no}</span>
              <h3 className="mt-2 font-bold">{a.judul}</h3>
              <p className="mt-1 text-sm text-slate-600">{a.isi}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
