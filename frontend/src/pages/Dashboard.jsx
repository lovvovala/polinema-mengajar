import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/Layouts';
import { Alert, Badge, Button, Card, LayarMemuat } from '../components/ui';

const STATUS = {
  terdaftar: { label: 'Terdaftar', tone: 'biru' },
  ujian: { label: 'Mengikuti CBT', tone: 'kuning' },
  lulus_cbt: { label: 'Lulus CBT', tone: 'hijau' },
  tidak_lulus: { label: 'Tidak Lulus CBT', tone: 'merah' },
  wawancara: { label: 'Tahap Wawancara', tone: 'hijau' },
};

function formatJadwal(iso) {
  if (!iso) return null;
  return (
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    })
      .format(new Date(iso))
      .replace('.', ':') + ' WIB'
  );
}

export default function Dashboard() {
  const { token, keluar } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    api('/cbt/status', { token })
      .then(setInfo)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          keluar();
          navigate('/login', { replace: true });
        } else setGalat(err.message);
      });
  }, [token, keluar, navigate]);

  async function mulai() {
    const hasil = await Swal.fire({
      icon: 'warning',
      title: 'Mulai Ujian CBT?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6">
          <p>Baca tata tertib berikut dengan saksama:</p>
          <ul style="padding-left:18px;margin-top:8px">
            <li>${info.jumlahSoal} soal, durasi <b>${info.durasiMenit} menit</b>. Timer tidak dapat dihentikan.</li>
            <li><b>Dilarang berpindah tab, meminimalkan browser, atau membuka aplikasi lain.</b></li>
            <li>Pelanggaran ke-1 dan ke-2 mendapat peringatan. Pelanggaran ke-${info.maksPelanggaran} <b>mengakhiri ujian otomatis</b> tanpa bisa kembali.</li>
            <li>Jawaban tersimpan otomatis. Jangan menutup halaman selama ujian.</li>
          </ul>
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'Saya Siap, Mulai',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#1d4ed8',
    });
    if (hasil.isConfirmed) navigate('/ujian');
  }

  if (galat) {
    return (
      <DashboardLayout judul="Dashboard Peserta">
        <Alert tone="galat">{galat}</Alert>
      </DashboardLayout>
    );
  }
  if (!info) {
    return (
      <DashboardLayout judul="Dashboard Peserta">
        <LayarMemuat />
      </DashboardLayout>
    );
  }

  const st = STATUS[info.status] || STATUS.terdaftar;
  const jadwal = formatJadwal(info.jadwalCbt);

  return (
    <DashboardLayout judul={`Halo, ${info.namaLengkap.split(' ')[0]}!`}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Tes Berbasis Komputer (CBT)</h2>
              <p className="mt-1 text-sm text-slate-600">
                {info.jumlahSoal} soal: Numerik, Literasi, dan Kemampuan Berpikir · {info.durasiMenit} menit
              </p>
            </div>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jadwal CBT</p>
            <p className="mt-1 font-semibold">{jadwal || 'Belum dijadwalkan. Tunggu informasi dari panitia melalui email.'}</p>
          </div>

          <div className="mt-5">
            {info.selesai ? (
              <Alert tone="sukses">
                Anda telah menyelesaikan ujian CBT. Hasil seleksi akan diinformasikan oleh panitia melalui email.
              </Alert>
            ) : info.sedangBerlangsung ? (
              <>
                <Alert tone="peringatan" className="mb-4">
                  Sesi ujian Anda sedang berlangsung. Lanjutkan sebelum waktu habis.
                </Alert>
                <Button size="lg" onClick={() => navigate('/ujian')}>Lanjutkan Ujian</Button>
              </>
            ) : (
              <Button size="lg" onClick={mulai} disabled={!info.jadwalCbt}>
                Mulai Ujian
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Tata Tertib Singkat</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            <li>• Gunakan laptop/PC dengan internet stabil.</li>
            <li>• Jangan berpindah tab atau membuka aplikasi lain.</li>
            <li>• {info.maksPelanggaran} kali pelanggaran = ujian berakhir otomatis.</li>
            <li>• Jawaban tersimpan otomatis ke server.</li>
            <li>• Dilarang bekerja sama atau menyebarkan soal.</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
