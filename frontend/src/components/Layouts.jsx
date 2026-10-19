import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo, Button } from './ui';
import { useAuth } from '../context/AuthContext';

const tautan = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:text-slate-900'}`;

/* Tata letak halaman publik */
export function PublicLayout() {
  const { token } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={tautan}>Beranda</NavLink>
            <NavLink to="/daftar" className={tautan}>Daftar</NavLink>
            {token ? (
              <Link to="/dashboard" className="ml-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="ml-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                Masuk
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Polinema Mengajar. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}

/* Tata letak dashboard (peserta & admin) */
export function DashboardLayout({ judul, aksi, children }) {
  const { peserta, keluar } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            {peserta && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight">{peserta.namaLengkap}</p>
                <p className="text-xs text-slate-500">{peserta.nim}</p>
              </div>
            )}
            {aksi}
            {peserta && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  keluar();
                  navigate('/login');
                }}
              >
                Keluar
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-extrabold tracking-tight">{judul}</h1>
        {children}
      </main>
    </div>
  );
}
