import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, Field, TextInput } from '../components/ui';

export default function Login() {
  const { masuk } = useAuth();
  const navigate = useNavigate();
  const lokasi = useLocation();
  const [form, setForm] = useState({ nim: '', password: '' });
  const [galat, setGalat] = useState('');
  const [memuat, setMemuat] = useState(false);

  const ubah = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function kirim(e) {
    e.preventDefault();
    setGalat('');
    setMemuat(true);
    try {
      const res = await api('/login', { method: 'POST', body: form });
      masuk(res.token, res.peserta);
      navigate(lokasi.state?.dari || '/dashboard', { replace: true });
    } catch (err) {
      setGalat(err.message);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <Card>
        <h1 className="text-2xl font-extrabold tracking-tight">Masuk ke Portal</h1>
        <p className="mt-1 text-sm text-slate-600">Gunakan NIM dan kata sandi yang dikirim ke email Anda.</p>
        <form onSubmit={kirim} className="mt-6 space-y-4">
          {galat && <Alert tone="galat">{galat}</Alert>}
          <Field label="NIM" htmlFor="nim" required>
            <TextInput id="nim" name="nim" inputMode="numeric" autoComplete="username" value={form.nim} onChange={ubah} placeholder="Contoh: 2441720001" required />
          </Field>
          <Field label="Kata Sandi / Kode Akses" htmlFor="password" required>
            <TextInput id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={ubah} placeholder="8 karakter dari email" required />
          </Field>
          <Button type="submit" loading={memuat} className="w-full">
            Masuk
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          Belum mendaftar?{' '}
          <Link to="/daftar" className="font-semibold text-brand-700 hover:underline">
            Daftar di sini
          </Link>
        </p>
      </Card>
    </div>
  );
}
